# Medsync System Design Document

This document explains the core architectural and concurrency choices implemented in the Medsync Healthcare Appointment and Follow-up Manager.

---

## 1. Concurrency & Double-Booking Prevention

Preventing simultaneous scheduling of the same time slot by different patients is achieved through atomic database-level validation wrapped in strict Prisma transactions (`prisma.$transaction`).

### Concurrency Flow
When a booking request is received:
1.  **Transactional Isolation**: The request opens an interactive database transaction.
2.  **Sequential Safety Checks**:
    *   Queries the doctor's profile to verify they are active and not on leave for the requested date.
    *   Verifies that the requested slot falls within the doctor's day-specific working hours (comparing boundaries).
    *   Searches for any existing appointment for the same doctor, date, and start time where the status is either `CONFIRMED` or `HELD` with an unexpired hold timestamp (`heldUntil >= NOW()`).
3.  **Atomic Lock**: If any safety check fails, the transaction immediately rolls back and throws a specific error, mapping to a `409 Conflict` HTTP response on the API. If all checks pass, it inserts a new appointment record with status `HELD` and returns the slot to the caller.

By combining the validation and record creation into a single database transaction block, read-write race conditions are blocked. If multiple clients attempt to lock the same slot at the exact same millisecond, the database serializes the operations. The first transaction to commit locks the slot, forcing all subsequent simultaneous requests to fail the conflict check and return a clean conflict error.

---

## 2. Slot Hold Mechanism

To optimize user experience and block slot-hoarding, Medsync implements a temporary hold lock of **5 minutes**:

```text
  [AVAILABLE] 
       │ (Patient selects slot)
       ▼
     [HELD]  ◄─── (heldUntil = Date.now() + 5 mins)
       │
       ├───── (Patient completes symptoms & confirms) ───► [CONFIRMED]
       │
       └───── (Hold expires or is abandoned) ─────────────► [AVAILABLE]
```

1.  **Hold State**: When a patient selects a slot, the system creates the record with `status: 'HELD'` and `heldUntil` set to `+5 minutes`.
2.  **Expiry Validation**: During any subsequent availability query or confirmation request, the system checks if `heldUntil < Date.now()`. If it is expired, the slot is treated as available and can be overwritten by other booking attempts.
3.  **Promotion to Confirmed**: Once symptoms are submitted, the hold status changes to `CONFIRMED` and `heldUntil` is cleared.

---

## 3. Doctor Leave & Appointment Conflict Cascades

When an administrator marks a doctor as on leave for a single date or date range:
1.  **Leave Record**: Inserts a new row in the `LeaveRecord` table and appends the dates to the doctor's profile `leaveDays` JSON array.
2.  **Conflict Scan**: Queries all `HELD` or `CONFIRMED` appointments matching the doctor and leave dates.
3.  **Cascading Actions**:
    *   Updates the status of all affected appointments to `CANCELLED_BY_DOCTOR_LEAVE`.
    *   Retrieves calendar mapping IDs and deletes the respective sync events on both patient and doctor Google Calendars via the Google Calendar API.
    *   Creates a notification row with `emailStatus: 'PENDING'` and dispatches a background job to send urgent cancel emails to patients, advising them to select another slot.

This guarantees no ghost appointments remain on the doctor's calendar, and patients are alerted immediately.

---

## 4. Resilient Email Alerts & Background Jobs

Email notification delivery and background reminders are designed to operate asynchronously, ensuring network or third-party API issues (such as Nodemailer or Google Calendar rate limits) never cause booking transactions to fail.

1.  **Transactional Decoupling**: When an appointment is booked or cancelled, the core transaction commits first. After commitment, the application inserts a notification row into the database (`emailStatus: 'PENDING'`) and dispatches a background job via BullMQ.
2.  **In-Memory Fallback**: If Redis is not configured locally, a custom in-memory scheduler processes the tasks via delayed timeouts on a background thread.
3.  **Failure and Retries**: If the email transporter fails (e.g. timeout or auth failure), the status is marked as `FAILED`. BullMQ automatically retries the job using exponential backoff (up to 5 attempts).

---

## 5. Resilient LLM/AI Processing

Medsync integrates the Google Gemini SDK for pre-visit and post-visit clinical summaries. To prevent LLM delays or API failures from disrupting workflows:
*   **Pre-visit**: The booking is confirmed instantly. The Gemini prompt is dispatched asynchronously. If the API succeeds, the symptom record is updated with status `SUCCESS`. If it fails, the record saves a local fallback assessment (urgency inferred from key terms like "chest pain") and sets status to `FAILED`, allowing future summary retries.
*   **Post-visit**: When the doctor submits consultation notes, they are saved instantly. If the Gemini summary generation fails, a placeholder is written and the status is set to `FAILED`, ensuring the consultation completes successfully.
