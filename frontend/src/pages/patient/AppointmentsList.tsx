import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Appointment } from '../../types';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  FileText,
  Trash2,
  CalendarDays,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type FilterTab = 'all' | 'upcoming' | 'completed' | 'cancelled';

export const PatientAppointments: React.FC = () => {
  const { patientProfile } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00');

  const fetchAppointments = async () => {
    if (!patientProfile) return;
    try {
      const data = await api.appointments.list({ patientId: patientProfile.id });
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [patientProfile]);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment slot?')) return;
    try {
      await api.appointments.cancel(id);
      alert('Appointment cancelled successfully.');
      await fetchAppointments();
    } catch (err) {
      alert('Failed to cancel appointment');
    }
  };

  // Filters
  const filtered = appointments.filter(apt => {
    if (activeTab === 'upcoming') {
      return apt.status === 'CONFIRMED' || apt.status === 'HELD';
    }
    if (activeTab === 'completed') {
      return apt.status === 'COMPLETED';
    }
    if (activeTab === 'cancelled') {
      return apt.status === 'CANCELLED' || apt.status === 'CANCELLED_BY_DOCTOR_LEAVE';
    }
    return true; // all
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wide">
            Confirmed
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
            Completed
          </span>
        );
      case 'HELD':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide animate-pulse">
            Held (Temp)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wide">
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">My Schedulers Directory</h2>
          <p className="text-xs text-slate-455 mt-1">Manage booked appointments, active sessions, and clinical history files.</p>
        </div>
        <button
          onClick={() => navigate('/patient/book')}
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center shrink-0 self-start sm:self-auto"
        >
          Book Appointment
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-slate-200 gap-1.5 text-xs">
        {(['all', 'upcoming', 'completed', 'cancelled'] as FilterTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 border-b-2 font-bold capitalize transition-all ${
              activeTab === tab 
                ? 'border-brand-500 text-brand-600' 
                : 'border-transparent text-slate-450 hover:text-slate-700'
            }`}
          >
            {tab === 'all' ? 'All Bookings' : tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <CalendarIcon className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm max-w-lg mx-auto">
          <CalendarIcon className="h-12 w-12 text-slate-350 mx-auto mb-4" />
          <p className="text-xs text-slate-450 font-semibold">No appointments found matching this filter tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(apt => {
            const isUpcoming = apt.status === 'CONFIRMED' || apt.status === 'HELD';
            
            return (
              <div 
                key={apt.id} 
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-60 group transition-all"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-sm">
                        {apt.doctor?.name.charAt(4) || apt.doctor?.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-905 text-sm">{apt.doctor?.name}</h4>
                        <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider mt-0.5">{apt.doctor?.specialization}</span>
                      </div>
                    </div>
                    {getStatusBadge(apt.status)}
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center font-mono">
                      <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                      <span>{apt.date}</span>
                    </div>
                    <div className="flex items-center font-mono">
                      <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                      <span>{apt.startTime} - {apt.endTime}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-550 font-bold px-2 py-0.5 rounded-lg">
                    Telehealth
                  </span>
                  
                  {isUpcoming && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setReschedulingApt(apt);
                          setNewDate(apt.date);
                          setNewTime(apt.startTime);
                        }}
                        className="px-3 py-1.5 bg-brand-55 text-brand-650 hover:bg-brand-100 font-bold border border-brand-200 rounded-xl text-[10px] transition-colors flex items-center"
                      >
                        <CalendarIcon className="h-3.5 w-3.5 mr-1 text-brand-500" /> Reschedule
                      </button>
                      <button
                        onClick={() => handleCancel(apt.id)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold border border-rose-200 rounded-xl text-[10px] transition-colors flex items-center"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Cancel Slot
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reschedulingApt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl max-w-sm w-full space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Reschedule Session</h3>
              <p className="text-[10px] text-slate-450 mt-1">Select a new date and start time for your appointment with {reschedulingApt.doctor?.name}.</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-450 block uppercase tracking-wide mb-1">New Date</label>
                <input 
                  type="date" 
                  value={newDate} 
                  onChange={(e) => setNewDate(e.target.value)} 
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-450 block uppercase tracking-wide mb-1">New Time</label>
                <input 
                  type="time" 
                  value={newTime} 
                  onChange={(e) => setNewTime(e.target.value)} 
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-brand-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setReschedulingApt(null)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-550 font-extrabold text-[10px] rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  if (!newDate || !newTime) return;
                  const duration = reschedulingApt.doctor?.slotDuration || 30;
                  const [h, m] = newTime.split(':').map(Number);
                  const total = h * 60 + m + duration;
                  const endH = Math.floor(total / 60);
                  const endM = total % 60;
                  const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

                  try {
                    await api.appointments.reschedule(reschedulingApt.id, newDate, newTime, endTimeStr);
                    alert('Appointment rescheduled successfully.');
                    setReschedulingApt(null);
                    fetchAppointments();
                  } catch (err: any) {
                    alert(err.response?.data?.error || 'Failed to reschedule slot.');
                  }
                }}
                className="flex-1 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-[10px] rounded-xl shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
