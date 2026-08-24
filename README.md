# Medsync - Full-Stack Healthcare Appointment & Follow-Up Manager

Medsync is a premium, responsive full-stack web application designed to streamline doctor appointments, patient symptoms analysis, clinical notes, prescriptions, Google Calendar syncing, and medication reminders. It includes custom, role-based dashboards for Patients, Doctors, and Administrators.

---

## 📸 Application Dashboards & Workflows

Below are snapshots of the Medsync interface showing the user flow and design aesthetic.

### 🔑 Authentication & Portal Entry
*   **Login Portal**: Includes sandbox login credentials to quickly toggle between patient, doctor, and administrator view modes.
    ![Login Portal](./docs/screenshots/login_page.png)

### 👤 Patient Portal Workflows
*   **Patient Dashboard**: Allows patients to track active appointments, search for doctors, and view active prescriptions.
    ![Patient Dashboard](./docs/screenshots/patient_dashboard.png)
*   **Booking Slot Grid & Specialization Filters**: Enables patients to select and hold doctor slots for 5 minutes during symptom input.
    ![Booking Grid](./docs/screenshots/patient_booking_grid.png)
*   **Personal Calendar View**: Displays clinical schedules and follow-up consultation timelines on an interactive calendar.
    ![Calendar View](./docs/screenshots/patient_calendar_view.png)

### 🩺 Doctor Portal Workflows
*   **Doctor Console (Queue Manager)**: Provides doctors with clinical queue timelines and pre-visit AI diagnostics (urgency analysis, chief complaints).
    ![Doctor Console](./docs/screenshots/doctor_dashboard.png)
*   **Clinical Consultation & Prescription Form**: Allows doctors to record notes, define medication schedules, and prescribe drugs.
    ![Consultation Form](./docs/screenshots/doctor_consultation_form.png)

### 🛠️ Admin Portal Workflows
*   **Admin Dashboard**: Empowers administrators to manage profiles, adjust working shifts, and change slot durations.
    ![Admin Dashboard](./docs/screenshots/admin_dashboard.png)
*   **Leave Conflict Resolver & Vacations Scheduler**: Registers doctor leaves, scans active slots, and performs cascading cancellations/notifications.
    ![Admin Leaves Page](./docs/screenshots/admin_leaves_view.png)

---

## ⚡ Concurrency & Resiliency (Core Features)

*   **Atomic Booking (Double-Booking Prevention)**: Employs database-level isolation transactions (`prisma.$transaction`) to handle simultaneous slot requests safely. Try running the stress test script to see this in action.
*   **Slot Hold Lock**: Locks selected slots for 5 minutes during symptom input to prevent race conditions.
*   **LLM Fail-Safe (Gemini)**: Symptom analysis and post-visit summaries operate asynchronously, reverting to local rule-based evaluations if the Gemini API fails or is unconfigured.
*   **Asynchronous Notification Retries (Nodemailer)**: Queues email tasks using background workers (with in-memory fallbacks) to retry delivery up to 5 times.
*   **Google Calendar Sync**: Integrates with the Google Calendar API using OAuth 2.0. If the connection fails or is not linked, booking workflows continue smoothly.

---

## 🛠️ Technology Stack

*   **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router, Axios, Lucide Icons
*   **Backend**: Node.js, Express.js, TypeScript, REST APIs, Zod, BullMQ, ioredis
*   **Database**: PostgreSQL (Prisma ORM) / SQLite for local fallback
*   **AI**: Google Gemini API (via `@google/generative-ai` SDK)
*   **Mails**: SMTP transporter with auto Ethereal fallback
*   **Calendar**: Google Calendar API (OAuth 2.0)

---

## 📦 System Architecture

```text
                  Vite + React Frontend (Port 5173)
                                 │
                                 │ REST API (CORS enabled)
                                 ▼
                   Express + TS Backend (Port 5050)
                                 │
            ┌─────────────────────┼─────────────────────┐
            ▼                     ▼                     ▼
       PostgreSQL               BullMQ               External APIs
      (Prisma ORM)          (Redis / Local)               │
                                                 ┌────────┼────────┐
                                                 ▼        ▼        ▼
                                              Gemini    Google   SMTP
                                               LLM     Calendar (Email)
```

---

## ⚙️ Detailed Setup Guide

### 1. Prerequisites
Ensure you have the following installed on your local machine:
*   [Node.js](https://nodejs.org/) (v18.x or later)
*   [PostgreSQL](https://www.postgresql.org/) (Or use the fallback local SQLite config)
*   [Redis](https://redis.io/) (Optional, used for BullMQ queue manager. Falls back to an in-memory scheduler if not running)

---

### 2. Google Cloud Console Setup (Google Calendar API)
To enable Google Calendar syncing, you must register a project in the Google Cloud Console:

1.  **Create a New Project**:
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Click the project dropdown in the top navigation bar and select **New Project**.
    *   Name your project (e.g., `Medsync Scheduler`) and click **Create**.
2.  **Enable APIs**:
    *   Navigate to **APIs & Services > Library**.
    *   Search for **Google Calendar API** and select it.
    *   Click **Enable**.
3.  **Configure OAuth Consent Screen**:
    *   Go to **APIs & Services > OAuth consent screen**.
    *   Select **External** and click **Create**.
    *   Fill out the app name (`Medsync`), user support email, and developer contact information. Click **Save and Continue**.
    *   **Scopes**: Under Scopes, click **Add or Remove Scopes**. Add the following scope strings:
        *   `.../auth/calendar.events` (Manage your Google Calendar events)
        *   `.../auth/calendar.readonly` (View your Google Calendars)
        *   `openid`, `email`, `profile`
    *   **Test Users**: Add the Google Accounts you intend to use for testing during development.
4.  **Create OAuth Credentials**:
    *   Go to **APIs & Services > Credentials**.
    *   Click **Create Credentials** and select **OAuth client ID**.
    *   Select **Web application** as the application type.
    *   Set the **Name** (e.g., `Medsync Client`).
    *   Add **Authorized JavaScript origins**: `http://localhost:5050`
    *   Add **Authorized redirect URIs**: `http://localhost:5050/api/auth/google/callback`
    *   Click **Create** and copy your **Client ID** and **Client Secret**.

---

### 3. Setup Backend & Database
1.  **Clone & Navigate**:
    ```bash
    git clone <repository-url>
    cd Healthcare-Appointment
    ```
2.  **Create Environment File**:
    ```bash
    cp backend/.env.example backend/.env
    ```
    Open `backend/.env` and update the values (see the [.env.example Configuration](#-environment-configurations-evexample) section below).
3.  **Install Dependencies**:
    ```bash
    cd backend
    npm install
    ```
4.  **Database Migration**:
    Configure your database inside `.env` then push the schema:
    ```bash
    npx prisma db push
    ```
5.  **Seed Database**:
    Seed default accounts (Patient, Doctor, Admin):
    ```bash
    npx prisma db seed
    ```
6.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    *The backend server will run on `http://localhost:5050`.*

---

### 4. Setup Frontend
1.  Open a new terminal window at the workspace root directory:
    ```bash
    cd frontend
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Create Environment File**:
    ```bash
    cp .env.example .env
    ```
4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    *The frontend Vite server will start on `http://localhost:5173/`.*

---

## 🔒 Environment Configurations (.env.example)

### Backend environment variables (`backend/.env.example`)

| Variable Name | Description | Default Value | Required / Fallback |
| :--- | :--- | :--- | :--- |
| `PORT` | The port number on which the backend server runs. | `5050` | Required |
| `DATABASE_URL` | Prisma PostgreSQL database connection string. | `file:./dev.db` | Required (defaults to local SQLite if using `file:`) |
| `JWT_SECRET` | Secret key used for signing JSON Web Tokens. | *[empty]* | **Required** for secure authorization |
| `GEMINI_API_KEY` | Google Gemini API Key for symptom analysis & AI summaries. | *[empty]* | Optional (Falls back to internal rule-based analysis if empty) |
| `SMTP_HOST` | Host address of your SMTP server (e.g., `smtp.sendgrid.net`). | *[empty]* | Optional (Falls back to Ethereal Mail logging if empty) |
| `SMTP_PORT` | Port number of the SMTP server. | `587` | Optional |
| `SMTP_USER` | Username credential for the SMTP service. | *[empty]* | Optional |
| `SMTP_PASS` | Password credential for the SMTP service. | *[empty]* | Optional |
| `SMTP_FROM` | Sender email address display name. | `"Medsync Healthcare" <no-reply@medsync.com>` | Optional |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from Google Cloud Console. | *[empty]* | Required to use Google Calendar sync features |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret from Google Cloud Console. | *[empty]* | Required to use Google Calendar sync features |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback redirect URL. | `http://localhost:5050/api/auth/google/callback` | Required to use Google Calendar sync features |

### Frontend environment variables (`frontend/.env.example`)

| Variable Name | Description | Default Value | Required / Fallback |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Base endpoint URL directing to your running backend API. | *[empty]* | Optional (defaults to `http://localhost:5050/api`) |

---

## 🔌 API Documentation

### 🔑 Authentication & Profiles
*   `POST /api/auth/register`
    *   **Description**: Registers a new patient account.
    *   **Body**: `{"email": "...", "password": "...", "name": "...", "phone": "..."}`
*   `POST /api/auth/login`
    *   **Description**: Authenticates user credentials and returns a JWT token.
    *   **Body**: `{"email": "...", "password": "..."}`
*   `GET /api/auth/me`
    *   **Description**: Fetches current user metadata and roles (Authorization Header Required).
*   `PUT /api/auth/profile`
    *   **Description**: Updates user profile information.
    *   **Body**: `{"name": "...", "phone": "..."}`

### 📅 Google OAuth & Integration
*   `GET /api/auth/google/url`
    *   **Description**: Returns the Google consent screen URL for OAuth linking.
*   `GET /api/auth/google/callback`
    *   **Description**: Receives authorization code from Google, exchanges it for OAuth tokens, and redirects back to the dashboard settings page.

### 🩺 Doctor Management
*   `GET /api/doctors`
    *   **Description**: Returns a list of all registered doctors.
*   `GET /api/doctors/:id/availability?date=YYYY-MM-DD`
    *   **Description**: Returns all availability slots for a doctor on a specific date, factoring in operational hours, existing appointments, and locks.
*   `POST /api/doctors/:id/leave-range`
    *   **Description**: (Admin Only) Registers a range of leave days for a doctor, triggers automated cancellations, and sends email notifications.
    *   **Body**: `{"startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD"}`
*   `POST /api/doctors/:id/cancel-leave`
    *   **Description**: (Admin Only) Cancels a doctor's registered leave range early.
    *   **Body**: `{"leaveId": "..."}`
*   `GET /api/doctors/:id/leaves`
    *   **Description**: Retrieves leave records for a specific doctor profile.

### 📅 Appointments
*   `POST /api/appointments/hold`
    *   **Description**: Requests a temporary 5-minute locking lock on a specific timeslot.
    *   **Body**: `{"doctorId": "...", "date": "YYYY-MM-DD", "startTime": "HH:MM"}`
*   `POST /api/appointments/:id/confirm`
    *   **Description**: Submits patient symptoms, triggers AI analysis, and finalizes the reservation.
    *   **Body**: `{"symptoms": "..."}`
*   `POST /api/appointments/:id/reschedule`
    *   **Description**: Atomically cancels the current slot and creates a new appointment slot.
    *   **Body**: `{"date": "YYYY-MM-DD", "startTime": "HH:MM"}`
*   `POST /api/appointments/:id/cancel`
    *   **Description**: Cancels a confirmed booking, deleting any associated Google Calendar events and freeing up the slot.

### 🩺 Consultations & Summaries
*   `POST /api/appointments/:id/consultation`
    *   **Description**: (Doctor Only) Saves clinical details, creates a prescription record, and dispatches background jobs for Gemini to generate patient summaries.
    *   **Body**: `{"clinicalNotes": "...", "followUpInstructions": "...", "medications": [{"name": "...", "dosage": "...", "frequency": "...", "duration": "..."}]}`

---

## 🗄️ Database Schema (Prisma Models)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String          @id @default(uuid())
  email          String          @unique
  password       String
  name           String
  phone          String?
  role           String          // "PATIENT" | "DOCTOR" | "ADMIN"
  createdAt      DateTime        @default(now())
  doctorProfile  DoctorProfile?
  patientProfile PatientProfile?
  googleOauth    GoogleOauth?
}

model DoctorProfile {
  id             String          @id @default(uuid())
  userId         String          @unique
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  email          String
  phone          String?
  specialization String
  slotDuration   Int             @default(30)
  leaveDays      String          // Serialized JSON array of "YYYY-MM-DD"
  createdAt      DateTime        @default(now())
  workingHours   WorkingHour[]
  appointments   Appointment[]
  leaveRecords   LeaveRecord[]
}

model WorkingHour {
  id             String          @id @default(uuid())
  doctorId       String
  doctor         DoctorProfile   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  dayOfWeek      Int             // 0 = Sunday, 1 = Monday, etc.
  startTime      String          // "HH:MM"
  endTime        String          // "HH:MM"
}

model PatientProfile {
  id             String          @id @default(uuid())
  userId         String          @unique
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  email          String
  phone          String?
  createdAt      DateTime        @default(now())
  appointments   Appointment[]
}

model Appointment {
  id             String          @id @default(uuid())
  patientId      String?
  patient        PatientProfile? @relation(fields: [patientId], references: [id], onDelete: SetNull)
  doctorId       String
  doctor         DoctorProfile   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  date           String          // "YYYY-MM-DD"
  startTime      String          // "HH:MM"
  endTime        String          // "HH:MM"
  status         String          // "AVAILABLE" | "HELD" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "CANCELLED_BY_DOCTOR_LEAVE"
  heldUntil      DateTime?
  createdAt      DateTime        @default(now())
  symptoms       SymptomSubmission?
  consultation   Consultation?
  prescription   Prescription?
  aiSummary      AISummary?
  calendarEvent  CalendarEvent?
}

model SymptomSubmission {
  id                 String          @id @default(uuid())
  appointmentId      String          @unique
  appointment        Appointment     @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  symptoms           String
  urgency            String          // "Low" | "Medium" | "High" | "PENDING" | "FAILED"
  chiefComplaint     String
  suggestedQuestions String          // Serialized JSON array of strings
  aiStatus           String          @default("SUCCESS") // "PENDING" | "SUCCESS" | "FAILED"
  createdAt          DateTime        @default(now())
}

model Consultation {
  id             String          @id @default(uuid())
  appointmentId  String          @unique
  appointment    Appointment     @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  clinicalNotes  String
  createdAt      DateTime        @default(now())
}

model Prescription {
  id                   String          @id @default(uuid())
  appointmentId        String          @unique
  appointment          Appointment     @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  followUpInstructions String?
  createdAt            DateTime        @default(now())
  medications          Medication[]
}

model Medication {
  id             String          @id @default(uuid())
  prescriptionId String
  prescription   Prescription    @relation(fields: [prescriptionId], references: [id], onDelete: Cascade)
  name           String
  dosage         String
  frequency      String
  duration       String
}

model AISummary {
  id                 String          @id @default(uuid())
  appointmentId      String          @unique
  appointment        Appointment     @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  summaryText        String
  medicationSchedule String
  followUpSteps      String
  status             String          // "PENDING" | "SUCCESS" | "FAILED"
  createdAt          DateTime        @default(now())
}

model LeaveRecord {
  id             String          @id @default(uuid())
  doctorId       String
  doctor         DoctorProfile   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  startDate      String          // "YYYY-MM-DD"
  endDate        String          // "YYYY-MM-DD"
  status         String          // "ACTIVE" | "RESUMED_EARLY" | "COMPLETED"
  createdAt      DateTime        @default(now())
}

model Notification {
  id             String          @id @default(uuid())
  recipientEmail String
  type           String
  message        String
  read           Boolean         @default(false)
  emailStatus    String          @default("SENT") // "PENDING" | "SENT" | "FAILED"
  createdAt      DateTime        @default(now())
}

model CalendarEvent {
  id             String          @id @default(uuid())
  appointmentId  String          @unique
  appointment    Appointment     @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  googleEventId  String
  htmlLink       String?
  createdAt      DateTime        @default(now())
}

model GoogleOauth {
  id           String   @id @default(uuid())
  userId       String   @unique
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken  String
  refreshToken String?
  expiryDate   String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

---

## 🤖 LLM Prompts (Google Gemini Integration)

Medsync relies on `gemini-1.5-flash` model engines to compile clinical summaries and analyze triage severity states.

### 1. Symptom Triage Analysis Prompt
*   **System Action Context**: Triggers automatically during slot confirmation after a patient enters their initial symptoms.
*   **Execution Target File**: [`gemini.ts`](file:///Users/kajalmehta/Projects/Healthcare-Appointment/backend/src/integrations/ai/gemini.ts#L48-L53)
*   **Instruction Prompt**:
    ```text
    Analyse these symptoms and return a JSON object (strictly raw JSON, do not include markdown blocks or code formatting) containing:
    - urgency: "Low" or "Medium" or "High"
    - chiefComplaint: a brief summary of the primary complaint (string, max 50 chars)
    - suggestedQuestions: array of three useful questions the doctor should ask the patient

    Symptoms: "${symptoms}"
    ```

---

### 2. Clinical Consultation Post-Visit Summary Prompt
*   **System Action Context**: Runs inside a background worker to summarize prescriptions and clinical notes into patient-friendly copy.
*   **Execution Target File**: [`gemini.ts`](file:///Users/kajalmehta/Projects/Healthcare-Appointment/backend/src/integrations/ai/gemini.ts#L83-L91)
*   **Instruction Prompt**:
    ```text
    Convert these clinical notes into a patient-friendly format and return a JSON object (strictly raw JSON, do not include markdown blocks or code formatting) containing:
    - summaryText: a simplified description of the diagnosis and doctor notes
    - medicationSchedule: a clear bulleted list of how to take their medications
    - followUpSteps: key next actions or appointments

    Clinical notes: "${notes}"
    Medications prescribed:
    "${medicationsList}"
    Follow-up: "${followUp}"
    ```
