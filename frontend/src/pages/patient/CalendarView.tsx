import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Appointment } from '../../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  FileText,
  Sparkles,
  ClipboardList
} from 'lucide-react';

export const PatientCalendar: React.FC = () => {
  const { patientProfile } = useAuth();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateApts, setSelectedDateApts] = useState<Appointment[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();

  const prevLastDay = new Date(year, month, 0).getDate();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getAppointmentsForDay = (day: number) => {
    const dStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return appointments.filter(apt => apt.date === dStr);
  };

  const handleDayClick = (day: number) => {
    const dStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const apts = getAppointmentsForDay(day);
    setSelectedDateApts(apts);
    setSelectedDateStr(dStr);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'CANCELLED':
      case 'CANCELLED_BY_DOCTOR_LEAVE':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'HELD':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  // Render calendar days cells
  const renderCells = () => {
    const cells = [];
    
    // Fill prev month trailing days
    for (let i = firstDayIndex; i > 0; i--) {
      const prevDay = prevLastDay - i + 1;
      cells.push(
        <div key={`prev-${prevDay}`} className="min-h-[100px] p-2 bg-slate-50/50 border border-slate-100 text-slate-350 select-none">
          <span className="text-xs font-semibold">{prevDay}</span>
        </div>
      );
    }

    // Fill active month days
    for (let day = 1; day <= lastDay; day++) {
      const apts = getAppointmentsForDay(day);
      const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
      const isSelected = selectedDateStr === `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      cells.push(
        <div 
          key={`day-${day}`} 
          onClick={() => handleDayClick(day)}
          className={`min-h-[100px] p-2 border border-slate-150 transition-all hover:bg-slate-50 cursor-pointer flex flex-col justify-between ${
            isToday ? 'bg-brand-50/20' : 'bg-white'
          } ${
            isSelected ? 'ring-2 ring-brand-500' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
              isToday ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-800'
            }`}>
              {day}
            </span>
            {apts.length > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
            )}
          </div>

          {/* Slots events inside cells */}
          <div className="space-y-1.5 mt-2 overflow-hidden max-h-16">
            {apts.slice(0, 2).map(apt => (
              <div 
                key={apt.id} 
                className="px-1.5 py-0.5 rounded text-[8px] font-bold border truncate uppercase tracking-tight"
                style={{
                  backgroundColor: apt.status === 'CONFIRMED' ? '#eff6ff' : apt.status === 'COMPLETED' ? '#ecfdf5' : apt.status === 'HELD' ? '#fffbeb' : '#fef2f2',
                  color: apt.status === 'CONFIRMED' ? '#1d4ed8' : apt.status === 'COMPLETED' ? '#047857' : apt.status === 'HELD' ? '#b45309' : '#b91c1c',
                  borderColor: apt.status === 'CONFIRMED' ? '#bfdbfe' : apt.status === 'COMPLETED' ? '#a7f3d0' : apt.status === 'HELD' ? '#fde68a' : '#fecaca',
                }}
              >
                {apt.startTime} {apt.doctor?.name.split(' ').pop()}
              </div>
            ))}
            {apts.length > 2 && (
              <div className="text-[7px] text-slate-400 font-bold pl-1">
                + {apts.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Appointments Calendar</h2>
        <p className="text-xs text-slate-450 mt-1">Visualize confirmed slots, past consultations, and leave cancellations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left 3 Columns: Monthly Calendar Grid */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-850 text-base">
              {months[month]} {year}
            </h3>
            <div className="flex items-center space-x-1.5">
              <button 
                onClick={handlePrevMonth}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-20 flex justify-center">
              <ChevronLeft className="h-8 w-8 text-brand-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Day names row */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400 py-1 bg-slate-50 rounded-xl">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Monthly grid */}
              <div className="grid grid-cols-7 border-l border-t border-slate-100 rounded-xl overflow-hidden shadow-inner bg-slate-50/20">
                {renderCells()}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected day detailed panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Selected Date Logs</h3>
              <span className="text-[10px] font-mono text-slate-450 block mt-0.5">
                {selectedDateStr || 'Select a day to inspect'}
              </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {!selectedDateStr ? (
                <p className="text-xs text-slate-450 italic text-center py-6">Click any calendar cell to view appointments scheduled on that day.</p>
              ) : selectedDateApts.length === 0 ? (
                <p className="text-xs text-slate-450 italic text-center py-6">No appointments logged on this date.</p>
              ) : (
                selectedDateApts.map((apt) => (
                  <div key={apt.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                      <span className="font-bold text-slate-800">{apt.doctor?.name}</span>
                      <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-full uppercase ${getStatusBadgeClass(apt.status)}`}>
                        {apt.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Division:</span>
                        <span className="font-semibold text-slate-700">{apt.doctor?.specialization}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Interval:</span>
                        <span className="font-mono text-slate-705 font-bold flex items-center">
                          <Clock className="h-3.5 w-3.5 text-slate-400 mr-1" /> {apt.startTime} - {apt.endTime}
                        </span>
                      </div>
                    </div>

                    {apt.symptoms && (
                      <div className="pt-2 border-t border-slate-200/50">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Symptoms Stated</span>
                        <p className="italic text-slate-550 leading-relaxed text-[10px]">"{apt.symptoms.symptoms}"</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
