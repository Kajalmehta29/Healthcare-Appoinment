import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PatientProfile, DoctorProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  patientProfile: PatientProfile | null;
  doctorProfile: DoctorProfile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (email: string, name: string, password?: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (currentUser: User) => {
    try {
      if (currentUser.role === 'PATIENT') {
        const profile = await api.patients.getProfileByUserId(currentUser.id);
        setPatientProfile(profile);
        setDoctorProfile(null);
      } else if (currentUser.role === 'DOCTOR') {
        const docs = await api.doctors.list();
        const profile = docs.find(d => d.userId === currentUser.id) || null;
        setDoctorProfile(profile);
        setPatientProfile(null);
      } else {
        setPatientProfile(null);
        setDoctorProfile(null);
      }
    } catch (err) {
      console.error('Error fetching profile detail:', err);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const currentUser = await api.auth.me();
        if (currentUser) {
          setUser(currentUser);
          await fetchProfile(currentUser);
        }
      } catch (err) {
        console.error('Auth bootstrap failed:', err);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      setUser(res.user);
      await fetchProfile(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, name: string, password?: string) => {
    setLoading(true);
    try {
      const res = await api.auth.register(email, name, password);
      setUser(res.user);
      await fetchProfile(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.auth.logout();
      setUser(null);
      setPatientProfile(null);
      setDoctorProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const currentUser = await api.auth.me();
      if (currentUser) {
        setUser(currentUser);
        await fetchProfile(currentUser);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        patientProfile,
        doctorProfile,
        loading,
        login,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
