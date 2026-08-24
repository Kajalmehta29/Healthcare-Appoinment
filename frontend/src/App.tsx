import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { ToastContainer } from './components/ToastContainer';
import { PatientDashboard } from './pages/patient/Dashboard';
import { PatientHistory } from './pages/patient/History';
import { BookAppointment } from './pages/patient/BookAppointment';
import { DoctorQueue } from './pages/doctor/Queue';
import { DoctorQueuesList } from './pages/doctor/QueuesList';
import { DoctorHistory } from './pages/doctor/History';
import { DoctorSettings } from './pages/doctor/Settings';
import { PatientSettings } from './pages/patient/Settings';
import { AdminSettings } from './pages/admin/Settings';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminDoctors } from './pages/admin/Doctors';
import { AdminLeaves } from './pages/admin/Leaves';
import { PatientCalendar } from './pages/patient/CalendarView';
import { PatientAppointments } from './pages/patient/AppointmentsList';
import { Activity } from 'lucide-react';

const RootRedirect: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Activity className="h-8 w-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'PATIENT':
      return <Navigate to="/patient" replace />;
    case 'DOCTOR':
      return <Navigate to="/doctor" replace />;
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Protected Patient Routes */}
          <Route 
            path="/patient" 
            element={
              <DashboardLayout allowedRoles={['PATIENT']}>
                <PatientDashboard />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/patient/book" 
            element={
              <DashboardLayout allowedRoles={['PATIENT']}>
                <BookAppointment />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/patient/history" 
            element={
              <DashboardLayout allowedRoles={['PATIENT']}>
                <PatientHistory />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/patient/settings" 
            element={
              <DashboardLayout allowedRoles={['PATIENT']}>
                <PatientSettings />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/patient/calendar" 
            element={
              <DashboardLayout allowedRoles={['PATIENT']}>
                <PatientCalendar />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/patient/appointments" 
            element={
              <DashboardLayout allowedRoles={['PATIENT']}>
                <PatientAppointments />
              </DashboardLayout>
            } 
          />

          {/* Protected Doctor Routes */}
          <Route 
            path="/doctor" 
            element={
              <DashboardLayout allowedRoles={['DOCTOR']}>
                <DoctorQueue />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/doctor/queues" 
            element={
              <DashboardLayout allowedRoles={['DOCTOR']}>
                <DoctorQueuesList />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/doctor/settings" 
            element={
              <DashboardLayout allowedRoles={['DOCTOR']}>
                <DoctorSettings />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/doctor/history" 
            element={
              <DashboardLayout allowedRoles={['DOCTOR']}>
                <DoctorHistory />
              </DashboardLayout>
            } 
          />

          {/* Protected Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <DashboardLayout allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/admin/doctors" 
            element={
              <DashboardLayout allowedRoles={['ADMIN']}>
                <AdminDoctors />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/admin/leaves" 
            element={
              <DashboardLayout allowedRoles={['ADMIN']}>
                <AdminLeaves />
              </DashboardLayout>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <DashboardLayout allowedRoles={['ADMIN']}>
                <AdminSettings />
              </DashboardLayout>
            } 
          />

          {/* Fallback routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
