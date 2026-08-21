import axios from 'axios';
import { Appointment, DoctorProfile, PatientProfile, User, WorkingHour, Medication, LeaveRecord } from '../types';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5050/api',
});

// Add a request interceptor to attach the JWT token to headers if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medsync_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: async (email: string, password?: string): Promise<{ token: string; user: User }> => {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('medsync_token', token);
      localStorage.setItem('medsync_current_user', JSON.stringify(user));
      return { token, user };
    },

    register: async (email: string, name: string, password?: string): Promise<{ token: string; user: User }> => {
      const response = await axiosInstance.post('/auth/register', { email, name, password });
      const { token, user } = response.data;
      localStorage.setItem('medsync_token', token);
      localStorage.setItem('medsync_current_user', JSON.stringify(user));
      return { token, user };
    },

    logout: async (): Promise<void> => {
      localStorage.removeItem('medsync_token');
      localStorage.removeItem('medsync_current_user');
    },

    me: async (): Promise<User | null> => {
      try {
        const response = await axiosInstance.get('/auth/me');
        return response.data;
      } catch (err) {
        return null;
      }
    },

    updateProfile: async (userId: string, data: { name: string; email: string; phone?: string; password?: string }): Promise<User> => {
      const response = await axiosInstance.put('/auth/profile', data);
      const updatedUser = response.data;
      localStorage.setItem('medsync_current_user', JSON.stringify(updatedUser));
      return updatedUser;
    }
  },

  doctors: {
    list: async (): Promise<DoctorProfile[]> => {
      const response = await axiosInstance.get('/doctors');
      return response.data;
    },

    get: async (id: string): Promise<DoctorProfile> => {
      const response = await axiosInstance.get(`/doctors/${id}`);
      return response.data;
    },

    create: async (data: { email: string; name: string; specialization: string; slotDuration: number }): Promise<DoctorProfile> => {
      const response = await axiosInstance.post('/doctors', data);
      return response.data;
    },

    update: async (id: string, data: { name: string; specialization: string; slotDuration: number; workingHours: WorkingHour[]; email?: string }): Promise<void> => {
      await axiosInstance.put(`/doctors/${id}`, data);
    },

    setLeave: async (doctorId: string, date: string): Promise<{ affectedAppointmentsCount: number }> => {
      const response = await axiosInstance.post(`/doctors/${doctorId}/leave`, { date });
      return response.data;
    },

    setLeaveRange: async (doctorId: string, startDate: string, endDate: string): Promise<{ affectedAppointmentsCount: number }> => {
      const response = await axiosInstance.post(`/doctors/${doctorId}/leave-range`, { startDate, endDate });
      return response.data;
    },

    cancelLeaveEarly: async (doctorId: string, dateFromStr: string): Promise<void> => {
      await axiosInstance.post(`/doctors/${doctorId}/cancel-leave`, { date: dateFromStr });
    },

    getLeaveHistory: async (doctorId: string): Promise<LeaveRecord[]> => {
      const response = await axiosInstance.get(`/doctors/${doctorId}/leaves`);
      return response.data;
    },

    getAvailability: async (doctorId: string, dateStr: string): Promise<string[]> => {
      const response = await axiosInstance.get(`/doctors/${doctorId}/availability`, {
        params: { date: dateStr }
      });
      return response.data;
    }
  },

  appointments: {
    list: async (filters?: { patientId?: string; doctorId?: string }): Promise<Appointment[]> => {
      const response = await axiosInstance.get('/appointments', {
        params: filters
      });
      return response.data;
    },

    get: async (id: string): Promise<Appointment> => {
      const response = await axiosInstance.get(`/appointments/${id}`);
      return response.data;
    },

    hold: async (doctorId: string, date: string, startTime: string, endTime: string, patientId: string): Promise<Appointment> => {
      const response = await axiosInstance.post('/appointments/hold', {
        doctorId,
        date,
        startTime,
        endTime,
        patientId
      });
      return response.data;
    },

    confirm: async (appointmentId: string, symptoms: string): Promise<Appointment> => {
      const response = await axiosInstance.post(`/appointments/${appointmentId}/confirm`, {
        symptoms
      });
      return response.data;
    },

    cancel: async (id: string): Promise<void> => {
      await axiosInstance.post(`/appointments/${id}/cancel`);
    },

    reschedule: async (id: string, newDate: string, newStartTime: string, newEndTime: string): Promise<Appointment> => {
      const response = await axiosInstance.post(`/appointments/${id}/reschedule`, { newDate, newStartTime, newEndTime });
      return response.data;
    },

    submitConsultation: async (appointmentId: string, data: { notes: string; medications: Omit<Medication, 'id' | 'prescriptionId'>[]; followUp: string }): Promise<void> => {
      await axiosInstance.post(`/appointments/${appointmentId}/consultation`, data);
    }
  },

  patients: {
    getProfileByUserId: async (userId: string): Promise<PatientProfile | null> => {
      const response = await axiosInstance.get(`/patients/profile/${userId}`);
      return response.data;
    }
  },

  notifications: {
    list: async (): Promise<any[]> => {
      const response = await axiosInstance.get('/notifications');
      return response.data;
    },

    markAsRead: async (id: string): Promise<void> => {
      await axiosInstance.post(`/notifications/${id}/read`);
    },

    markAllAsRead: async (recipientEmail: string): Promise<void> => {
      await axiosInstance.post('/notifications/read-all', { recipientEmail });
    }
  }
};
