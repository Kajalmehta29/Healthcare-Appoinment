import { Appointment, DoctorProfile, PatientProfile, User, WorkingHour, Medication, LeaveRecord } from '../types';
import { MockDb } from './mockDb';

// Toggle this to false when connecting to the real backend later.
const USE_MOCK = true;

// Helper to simulate network latency for realistic demo loads/states
const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  auth: {
    login: async (email: string, password?: string): Promise<{ token: string; user: User }> => {
      await delay();
      if (USE_MOCK) {
        const users = MockDb.getUsers();
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!found) {
          throw new Error('User not found. Use admin@medsync.com, doctor@medsync.com, or patient@medsync.com to log in, or register a new patient account.');
        }
        // Verify password if set and provided
        if (found.password && password && found.password !== password) {
          throw new Error('Incorrect password. Please verify your credentials.');
        }
        localStorage.setItem('medsync_token', `mock-jwt-token-for-${found.id}`);
        localStorage.setItem('medsync_current_user', JSON.stringify(found));
        return { token: `mock-jwt-token-for-${found.id}`, user: found };
      }
      // HTTP call placeholders here if not USE_MOCK
      throw new Error('Not implemented');
    },

    register: async (email: string, name: string, password?: string): Promise<{ token: string; user: User }> => {
      await delay();
      if (USE_MOCK) {
        const user = MockDb.registerPatient(email, name, password);
        localStorage.setItem('medsync_token', `mock-jwt-token-for-${user.id}`);
        localStorage.setItem('medsync_current_user', JSON.stringify(user));
        return { token: `mock-jwt-token-for-${user.id}`, user };
      }
      throw new Error('Not implemented');
    },

    logout: async (): Promise<void> => {
      await delay(100);
      localStorage.removeItem('medsync_token');
      localStorage.removeItem('medsync_current_user');
    },

    me: async (): Promise<User | null> => {
      await delay(100);
      if (USE_MOCK) {
        const userStr = localStorage.getItem('medsync_current_user');
        return userStr ? JSON.parse(userStr) : null;
      }
      return null;
    },

    updateProfile: async (userId: string, data: { name: string; email: string; phone?: string; password?: string }): Promise<User> => {
      await delay();
      if (USE_MOCK) {
        const user = MockDb.updateUserProfile(userId, data);
        localStorage.setItem('medsync_current_user', JSON.stringify(user));
        return user;
      }
      throw new Error('Not implemented');
    }
  },

  doctors: {
    list: async (): Promise<DoctorProfile[]> => {
      await delay();
      if (USE_MOCK) {
        return MockDb.getDoctors();
      }
      throw new Error('Not implemented');
    },

    get: async (id: string): Promise<DoctorProfile> => {
      await delay();
      if (USE_MOCK) {
        const doc = MockDb.getDoctors().find(d => d.id === id);
        if (!doc) throw new Error('Doctor not found');
        return doc;
      }
      throw new Error('Not implemented');
    },

    create: async (data: { email: string; name: string; specialization: string; slotDuration: number }): Promise<DoctorProfile> => {
      await delay();
      if (USE_MOCK) {
        return MockDb.registerDoctor(data.email, data.name, data.specialization, data.slotDuration);
      }
      throw new Error('Not implemented');
    },

    update: async (id: string, data: { name: string; specialization: string; slotDuration: number; workingHours: WorkingHour[]; email?: string }): Promise<void> => {
      await delay();
      if (USE_MOCK) {
        MockDb.updateDoctorProfile(id, data.name, data.specialization, data.slotDuration, data.workingHours, data.email);
        return;
      }
      throw new Error('Not implemented');
    },

    setLeave: async (doctorId: string, date: string): Promise<{ affectedAppointmentsCount: number }> => {
      await delay();
      if (USE_MOCK) {
        const count = MockDb.markDoctorLeave(doctorId, date);
        return { affectedAppointmentsCount: count };
      }
      throw new Error('Not implemented');
    },

    setLeaveRange: async (doctorId: string, startDate: string, endDate: string): Promise<{ affectedAppointmentsCount: number }> => {
      await delay();
      if (USE_MOCK) {
        const count = MockDb.markDoctorLeaveRange(doctorId, startDate, endDate);
        return { affectedAppointmentsCount: count };
      }
      throw new Error('Not implemented');
    },

    cancelLeaveEarly: async (doctorId: string, dateFromStr: string): Promise<void> => {
      await delay();
      if (USE_MOCK) {
        MockDb.cancelLeaveEarly(doctorId, dateFromStr);
        return;
      }
      throw new Error('Not implemented');
    },

    getLeaveHistory: async (doctorId: string): Promise<LeaveRecord[]> => {
      await delay();
      if (USE_MOCK) {
        return MockDb.getLeaveHistory().filter(h => h.doctorId === doctorId);
      }
      throw new Error('Not implemented');
    },

    getAvailability: async (doctorId: string, dateStr: string): Promise<string[]> => {
      await delay();
      if (USE_MOCK) {
        const doctors = MockDb.getDoctors();
        const doc = doctors.find(d => d.id === doctorId);
        if (!doc) throw new Error('Doctor not found');

        // If doctor on leave, no slots
        if (doc.leaveDays.includes(dateStr)) {
          return [];
        }

        // Get working hours for the day of week
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        const schedule = doc.workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
        if (!schedule) return []; // Not working this day

        // Generate slots
        const slots: string[] = [];
        let [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);

        const endMinutes = endH * 60 + endM;
        let currentMinutes = startH * 60 + startM;

        while (currentMinutes + doc.slotDuration <= endMinutes) {
          const h = Math.floor(currentMinutes / 60);
          const m = currentMinutes % 60;
          const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          slots.push(timeStr);
          currentMinutes += doc.slotDuration;
        }

        // Filter out confirmed or held slots
        const appointments = MockDb.getAppointments();
        const bookedTimes = appointments
          .filter(apt => apt.doctorId === doctorId && apt.date === dateStr && (apt.status === 'CONFIRMED' || (apt.status === 'HELD' && new Date(apt.heldUntil || '').getTime() > Date.now())))
          .map(apt => apt.startTime);

        return slots.filter(slot => !bookedTimes.includes(slot));
      }
      throw new Error('Not implemented');
    }
  },

  appointments: {
    list: async (filters?: { patientId?: string; doctorId?: string }): Promise<Appointment[]> => {
      await delay();
      if (USE_MOCK) {
        let list = MockDb.getAppointments();
        const doctors = MockDb.getDoctors();
        const patients = MockDb.getPatients();

        // Populate relationships
        list = list.map(apt => ({
          ...apt,
          doctor: doctors.find(d => d.id === apt.doctorId),
          patient: patients.find(p => p.id === apt.patientId),
          symptoms: MockDb.getSymptoms().find(s => s.appointmentId === apt.id),
          consultation: MockDb.getConsultations().find(c => c.appointmentId === apt.id),
          prescription: MockDb.getPrescriptions().find(p => p.appointmentId === apt.id),
          aiSummary: MockDb.getAiSummaries().find(ai => ai.appointmentId === apt.id),
        }));

        if (filters?.patientId) {
          list = list.filter(a => a.patientId === filters.patientId);
        }
        if (filters?.doctorId) {
          list = list.filter(a => a.doctorId === filters.doctorId);
        }

        return list;
      }
      throw new Error('Not implemented');
    },

    get: async (id: string): Promise<Appointment> => {
      await delay();
      if (USE_MOCK) {
        const appointments = MockDb.getAppointments();
        const apt = appointments.find(a => a.id === id);
        if (!apt) throw new Error('Appointment not found');

        const doctors = MockDb.getDoctors();
        const patients = MockDb.getPatients();

        return {
          ...apt,
          doctor: doctors.find(d => d.id === apt.doctorId),
          patient: patients.find(p => p.id === apt.patientId),
          symptoms: MockDb.getSymptoms().find(s => s.appointmentId === apt.id),
          consultation: MockDb.getConsultations().find(c => c.appointmentId === apt.id),
          prescription: MockDb.getPrescriptions().find(p => p.appointmentId === apt.id),
          aiSummary: MockDb.getAiSummaries().find(ai => ai.appointmentId === apt.id),
        };
      }
      throw new Error('Not implemented');
    },

    hold: async (doctorId: string, date: string, startTime: string, endTime: string, patientId: string): Promise<Appointment> => {
      await delay();
      if (USE_MOCK) {
        return MockDb.holdSlot(doctorId, date, startTime, endTime, patientId);
      }
      throw new Error('Not implemented');
    },

    confirm: async (appointmentId: string, symptoms: string): Promise<Appointment> => {
      await delay();
      if (USE_MOCK) {
        return MockDb.confirmAppointment(appointmentId, symptoms);
      }
      throw new Error('Not implemented');
    },

    cancel: async (id: string): Promise<void> => {
      await delay();
      if (USE_MOCK) {
        MockDb.cancelAppointment(id);
        return;
      }
      throw new Error('Not implemented');
    },

    submitConsultation: async (appointmentId: string, data: { notes: string; medications: Omit<Medication, 'id' | 'prescriptionId'>[]; followUp: string }): Promise<void> => {
      await delay();
      if (USE_MOCK) {
        MockDb.submitConsultation(appointmentId, data.notes, data.medications, data.followUp);
        return;
      }
      throw new Error('Not implemented');
    }
  },

  patients: {
    getProfileByUserId: async (userId: string): Promise<PatientProfile | null> => {
      await delay(100);
      if (USE_MOCK) {
        const patients = MockDb.getPatients();
        return patients.find(p => p.userId === userId) || null;
      }
      throw new Error('Not implemented');
    }
  },

  notifications: {
    list: async (): Promise<any[]> => {
      await delay(100);
      if (USE_MOCK) {
        return MockDb.getNotifications();
      }
      throw new Error('Not implemented');
    },

    markAsRead: async (id: string): Promise<void> => {
      await delay(50);
      if (USE_MOCK) {
        MockDb.markNotificationRead(id);
        return;
      }
      throw new Error('Not implemented');
    },

    markAllAsRead: async (recipientEmail: string): Promise<void> => {
      await delay(50);
      if (USE_MOCK) {
        MockDb.markAllNotificationsRead(recipientEmail);
        return;
      }
      throw new Error('Not implemented');
    }
  }
};
