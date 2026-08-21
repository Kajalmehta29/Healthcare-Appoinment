import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Appointment } from '../../types';
import { 
  Calendar, 
  FileText, 
  Pill, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Eye,
  Activity,
  Heart,
  Thermometer,
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { patientProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Horizontal Date Slider State (7 days around today)
  const [dateList, setDateList] = useState<{ dayName: string; dayNum: number; dateStr: string; isToday: boolean }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchAppointments = async () => {
    if (!patientProfile) return;
    try {
      const data = await api.appointments.list({ patientId: patientProfile.id });
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    
    // Generate dates list
    const dates = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        dateStr: d.toISOString().split('T')[0],
        isToday: i === 0
      });
    }
    setDateList(dates);
  }, [patientProfile]);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    try {
      await api.appointments.cancel(id);
      await fetchAppointments();
    } catch (err) {
      alert('Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-150"><CheckCircle2 className="h-3 w-3 mr-1" /> Confirmed</span>;
      case 'HELD':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-150"><Clock className="h-3 w-3 mr-1 animate-pulse" /> Held</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-150"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</span>;
      case 'CANCELLED_BY_DOCTOR_LEAVE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-150"><AlertCircle className="h-3 w-3 mr-1" /> Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-700 border border-slate-150"><XCircle className="h-3 w-3 mr-1" /> Cancelled</span>;
    }
  };

  // Compile active medications
  const activeMedications = appointments
    .filter(apt => apt.status === 'COMPLETED' && apt.prescription)
    .flatMap(apt => apt.prescription?.medications || []);

  const upcomingApts = appointments.filter(apt => apt.status === 'CONFIRMED' || apt.status === 'HELD');
  const pastApts = appointments.filter(apt => apt.status === 'COMPLETED' || apt.status.startsWith('CANCEL'));
  const completedConsultations = appointments.filter(apt => apt.status === 'COMPLETED');

  // Calculate dynamic adherence index based on appointment completion
  const getAdherenceIndex = () => {
    const completed = appointments.filter(a => a.status === 'COMPLETED').length;
    const cancelled = appointments.filter(a => a.status === 'CANCELLED' || a.status === 'CANCELLED_BY_DOCTOR_LEAVE').length;
    const total = completed + cancelled;
    
    if (total === 0) return { score: 100, label: 'Optimal Compliance', color: '#10b981', textClass: 'text-emerald-500' };
    
    const score = Math.round((completed / total) * 100);
    if (score >= 85) {
      return { score, label: 'Optimal Compliance', color: '#10b981', textClass: 'text-emerald-500' };
    } else if (score >= 60) {
      return { score, label: 'Satisfactory Adherence', color: '#f59e0b', textClass: 'text-amber-500' };
    } else {
      return { score, label: 'Action Required', color: '#f43f5e', textClass: 'text-rose-500' };
    }
  };

  const adherence = getAdherenceIndex();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8">
      {/* Greeting Banner */}
      <div className="relative bg-gradient-to-r from-brand-600 via-blue-500 to-cyan-400 text-white rounded-3xl p-8 overflow-hidden shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 -mr-10 -mt-10 blur-2xl"></div>
        <div className="absolute left-1/3 bottom-0 h-32 w-32 rounded-full bg-white/5 -mb-10 blur-xl"></div>
        
        <div className="space-y-2 z-10 max-w-xl">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{getGreeting()}, {patientProfile?.name}!</h2>
          <p className="text-blue-50 text-sm leading-relaxed">
            Find the best doctors, coordinate follow-up medications, and check real-time AI consult records. Your health starts with the right specialists.
          </p>
        </div>
        
        <div className="flex gap-3 z-10 shrink-0">
          <button 
            onClick={fetchAppointments}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl backdrop-blur transition-all flex items-center shadow-inner"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Sync Data
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Clock className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Clinical Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Next Consult */}
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Next Consultation</span>
                <span className="text-lg font-bold text-slate-900 truncate max-w-[150px] block">
                  {upcomingApts.length > 0 ? upcomingApts[0].date : 'None Scheduled'}
                </span>
                <span className="text-[9px] text-brand-600 font-bold block">
                  {upcomingApts.length > 0 ? upcomingApts[0].doctor?.name : 'Book appointment'}
                </span>
              </div>
              <div className="p-2.5 bg-brand-50 border border-brand-100 text-brand-600 rounded-xl">
                <Calendar className="h-5 w-5" />
              </div>
            </div>

            {/* Card 2: Active Medications */}
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Medications</span>
                <span className="text-xl font-bold text-slate-900">{activeMedications.length} Prescribed</span>
                <span className="text-[9px] text-emerald-500 font-bold block">Ongoing treatments</span>
              </div>
              <div className="p-2.5 bg-[#dcfce7] border border-[#bbf7d0] text-[#15803d] rounded-xl">
                <Pill className="h-5 w-5" />
              </div>
            </div>

            {/* Card 3: Completed Visits */}
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed Visits</span>
                <span className="text-xl font-bold text-slate-900">
                  {pastApts.filter(a => a.status === 'COMPLETED').length} Finished
                </span>
                <span className="text-[9px] text-slate-400 font-bold block">Clinical history logs</span>
              </div>
              <div className="p-2.5 bg-[#f3e8ff] border border-[#e9d5ff] text-[#6b21a8] rounded-xl">
                <FileText className="h-5 w-5" />
              </div>
            </div>

            {/* Card 4: Donut Compliance */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Adherence Index</span>
                <span className="text-lg font-bold text-slate-900">{adherence.score}%</span>
                <span className={`text-[9px] font-bold block ${adherence.textClass}`}>{adherence.label}</span>
              </div>
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-14 h-14 transform -rotate-90">
                  <circle cx="28" cy="28" r="22" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
                  <circle cx="28" cy="28" r="22" stroke={adherence.color} strokeWidth="4" fill="transparent" 
                    strokeDasharray={138.2} 
                    strokeDashoffset={138.2 - (138.2 * adherence.score) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute text-[10px] font-extrabold text-slate-800">{adherence.score}%</span>
              </div>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Scheduled Appointments & History */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Upcoming Appointments (Dribbble Cards layout) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center">
                    <Calendar className="h-5 w-5 text-brand-500 mr-2" /> My Upcoming Appointments
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                      {upcomingApts.length} Active
                    </span>
                    {upcomingApts.length > 2 && (
                      <Link 
                        to="/patient/appointments"
                        className="text-xs text-brand-600 hover:underline font-bold"
                      >
                        View All
                      </Link>
                    )}
                  </div>
                </div>

                {upcomingApts.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 shadow-sm">
                    <p className="text-sm">No active upcoming appointments. Use the book scheduler to find a practitioner.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {upcomingApts.slice(0, 2).map((apt) => (
                      <div key={apt.id} className="bg-white border border-slate-200 hover:border-brand-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 space-y-4 relative overflow-hidden group">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-sm">
                            {apt.doctor?.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{apt.doctor?.name}</h4>
                            <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wide block">
                              {apt.doctor?.specialization}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
                          <p className="flex items-center"><Clock className="h-3.5 w-3.5 mr-2 text-slate-400" /> {apt.date} • {apt.startTime}</p>
                          <p className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-2 text-slate-400" /> General Hospital Consultation Room</p>
                          <div className="flex items-center justify-between pt-1">
                            {getStatusBadge(apt.status)}
                            <span className="text-[9px] text-slate-400 font-mono">Duration: {apt.doctor?.slotDuration}m</span>
                          </div>
                        </div>

                        {apt.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCancel(apt.id)}
                            disabled={cancellingId === apt.id}
                            className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl border border-rose-100 transition-colors"
                          >
                            {cancellingId === apt.id ? 'Processing...' : 'Cancel Booking'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Historical Logs & Summaries */}
              <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center">
                    <FileText className="h-5 w-5 text-brand-500 mr-2" /> Consultation Archive
                  </h3>
                  {completedConsultations.length > 2 ? (
                    <Link 
                      to="/patient/history"
                      className="text-xs text-brand-600 hover:underline font-bold"
                    >
                      View All
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">Past medical summaries</span>
                  )}
                </div>
                
                <div className="divide-y divide-slate-100">
                  {completedConsultations.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <p className="text-xs">No historical records saved.</p>
                    </div>
                  ) : (
                    completedConsultations.slice(0, 2).map((apt) => (
                      <div key={apt.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-sm">{apt.doctor?.name}</p>
                          <p className="text-xs text-slate-500">{apt.date} at {apt.startTime} • {apt.doctor?.specialization}</p>
                          <div className="pt-1">{getStatusBadge(apt.status)}</div>
                        </div>

                        {apt.status === 'COMPLETED' && (
                          <button
                            onClick={() => setSelectedApt(apt)}
                            className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-lg border border-brand-200 transition-colors"
                          >
                            View Record
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Column Sidebar: Mini Calendar and Medications */}
            <div className="space-y-8">
              
              {/* Mini Horizontal Calendar Slider */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Schedule Tracker</h4>
                  <Link 
                    to="/patient/calendar"
                    className="text-xs text-brand-600 hover:underline font-bold"
                  >
                    View All
                  </Link>
                </div>
                
                <div className="flex justify-between items-center gap-1.5 pt-1">
                  {dateList.map((d, idx) => {
                    const isSelected = d.dateStr === selectedDate;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedDate(d.dateStr)}
                        className={`flex flex-col items-center p-2 rounded-xl text-center flex-1 cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-105' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <span className="text-[9px] font-bold block">{d.dayName}</span>
                        <span className="text-xs font-extrabold block mt-0.5">{d.dayNum}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tasks Due on Selected Date */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-950 flex items-center text-xs uppercase tracking-wider">
                  <Activity className="h-4 w-4 text-brand-500 mr-2" /> 
                  Tasks Due: {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </h3>

                {/* Due Appointments */}
                {(() => {
                  const dayApts = appointments.filter(apt => 
                    apt.date === selectedDate && 
                    (apt.status === 'CONFIRMED' || apt.status === 'HELD' || apt.status === 'COMPLETED')
                  );

                  const targetDate = new Date(selectedDate);
                  targetDate.setHours(0,0,0,0);
                  const dayMeds: any[] = [];
                  appointments.forEach(apt => {
                    if (apt.status === 'COMPLETED' && apt.prescription && apt.prescription.medications) {
                      const startDate = new Date(apt.date);
                      startDate.setHours(0,0,0,0);
                      
                      apt.prescription.medications.forEach(med => {
                        const durationDays = parseInt(med.duration) || 5;
                        const endDate = new Date(startDate);
                        endDate.setDate(endDate.getDate() + durationDays);

                        if (targetDate >= startDate && targetDate <= endDate) {
                          dayMeds.push(med);
                        }
                      });
                    }
                  });

                  if (dayApts.length === 0 && dayMeds.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 leading-relaxed py-6 text-center">
                        No appointments or prescribed medication reminders due on this date.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Render Appointments */}
                      {dayApts.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Scheduled Consultations</span>
                          {dayApts.map(apt => (
                            <div key={apt.id} className="p-3 bg-brand-50/50 border border-brand-100 rounded-2xl flex items-center justify-between">
                              <div>
                                <p className="text-xs font-extrabold text-slate-900">{apt.doctor?.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{apt.startTime} - {apt.endTime} • {apt.doctor?.specialization}</p>
                              </div>
                              {getStatusBadge(apt.status)}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Render Medications */}
                      {dayMeds.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Active Medications</span>
                          {dayMeds.map(med => (
                            <div key={med.id} className="p-3 bg-[#e8f5e9]/40 border border-[#c8e6c9]/60 rounded-2xl flex items-center justify-between">
                              <div>
                                <p className="text-xs font-extrabold text-slate-800">{med.name}</p>
                                <p className="text-[10px] text-slate-500 flex items-center mt-0.5">
                                  <Clock className="h-3 w-3 mr-1 text-slate-400" /> {med.dosage} • {med.frequency}
                                </p>
                              </div>
                              <span className="text-[9px] bg-white border border-[#c8e6c9] text-[#2e7d32] font-extrabold px-1.5 py-0.5 rounded-lg">
                                Active
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        </>
      )}

      {/* Summary View Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900">Post-Visit Clinical Log</h3>
                <p className="text-xs text-slate-500">Doctor: {selectedApt.doctor?.name} • Date: {selectedApt.date}</p>
              </div>
              <button 
                onClick={() => setSelectedApt(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto text-sm leading-relaxed">
              {/* Doctor Clinical Notes */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Doctor Clinical Notes</h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 font-sans">
                  {selectedApt.consultation?.clinicalNotes || 'No notes logged.'}
                </div>
              </div>

              {/* AI Summary */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">AI-Generated Patient-Friendly Summary</h4>
                <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-100/50 text-slate-800">
                  <p className="font-medium text-slate-900 mb-1">Summary:</p>
                  <p className="text-slate-700">{selectedApt.aiSummary?.summaryText || 'Generating AI summary...'}</p>
                  
                  {selectedApt.aiSummary?.medicationSchedule && (
                    <div className="mt-3 pt-3 border-t border-brand-100">
                      <p className="font-medium text-slate-900 mb-1">Medication Schedule:</p>
                      <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap">{selectedApt.aiSummary.medicationSchedule}</pre>
                    </div>
                  )}

                  {selectedApt.aiSummary?.followUpSteps && (
                    <div className="mt-3 pt-3 border-t border-brand-100">
                      <p className="font-medium text-slate-900 mb-1">Next Follow-Up Steps:</p>
                      <p className="text-slate-700">{selectedApt.aiSummary.followUpSteps}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Official Prescription Details */}
              {selectedApt.prescription && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Official Prescription Details</h4>
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                    {selectedApt.prescription.medications.map((med) => (
                      <div key={med.id} className="p-3.5 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-805">{med.name}</p>
                          <p className="text-xs text-slate-500">{med.dosage} • {med.frequency}</p>
                        </div>
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">Duration: {med.duration}</span>
                      </div>
                    ))}
                    {selectedApt.prescription.followUpInstructions && (
                      <div className="p-3.5 bg-slate-50/50 text-xs text-slate-600">
                        <span className="font-semibold block text-slate-700 mb-0.5">Instructions:</span>
                        {selectedApt.prescription.followUpInstructions}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
              <button 
                onClick={() => setSelectedApt(null)}
                className="btn-primary px-6"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
