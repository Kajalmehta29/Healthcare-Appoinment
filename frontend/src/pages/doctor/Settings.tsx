import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { WorkingHour, Appointment, LeaveRecord } from '../../types';
import { 
  User as UserIcon, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Settings2, 
  Lock, 
  Phone,
  CalendarDays,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { val: 0, label: 'Sunday' },
  { val: 1, label: 'Monday' },
  { val: 2, label: 'Tuesday' },
  { val: 3, label: 'Wednesday' },
  { val: 4, label: 'Thursday' },
  { val: 5, label: 'Friday' },
  { val: 6, label: 'Saturday' },
];

type TabType = 'profile' | 'shifts' | 'leave';

export const DoctorSettings: React.FC = () => {
  const { user, doctorProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tab 1: Profile Settings State
  const [profName, setProfName] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profPassword, setProfPassword] = useState('');

  // Tab 2: Shifts & Slots Settings State
  const [specialization, setSpecialization] = useState('');
  const [slotDuration, setSlotDuration] = useState(30);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [shiftDay, setShiftDay] = useState(1);
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');

  // Tab 3: Leave Settings State
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveConflicts, setLeaveConflicts] = useState<Appointment[]>([]);
  const [isCheckingLeave, setIsCheckingLeave] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRecord[]>([]);

  // Populate profiles
  useEffect(() => {
    if (user) {
      setProfName(user.name);
      setProfEmail(user.email);
      setProfPhone(user.phone || '');
    }
    if (doctorProfile) {
      setSpecialization(doctorProfile.specialization);
      setSlotDuration(doctorProfile.slotDuration);
      setWorkingHours([...doctorProfile.workingHours]);
    }
  }, [user, doctorProfile]);

  // Leave Conflicts Check Effect
  useEffect(() => {
    const checkConflicts = async () => {
      if (!doctorProfile || !leaveStart || !leaveEnd) {
        setLeaveConflicts([]);
        return;
      }
      setIsCheckingLeave(true);
      try {
        const list = await api.appointments.list({ doctorId: doctorProfile.id });
        const start = new Date(leaveStart);
        const end = new Date(leaveEnd);
        const matches = list.filter(apt => {
          const d = new Date(apt.date);
          return d >= start && d <= end && (apt.status === 'CONFIRMED' || apt.status === 'HELD');
        });
        setLeaveConflicts(matches);
      } catch (err) {
        console.error(err);
      } finally {
        setIsCheckingLeave(false);
      }
    };
    checkConflicts();
  }, [doctorProfile, leaveStart, leaveEnd]);

  const loadLeaveHistory = async () => {
    if (!doctorProfile) return;
    try {
      const data = await api.doctors.getLeaveHistory(doctorProfile.id);
      setLeaveHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'leave') {
      loadLeaveHistory();
    }
  }, [activeTab, doctorProfile]);

  const handleCancelLeaveEarly = async () => {
    if (!doctorProfile) return;
    try {
      setIsLoading(true);
      const todayDateStr = new Date().toISOString().split('T')[0];
      await api.doctors.cancelLeaveEarly(doctorProfile.id, todayDateStr);
      await refreshProfile();
      await loadLeaveHistory();
      setSuccessMsg('Welcome back! Today and any upcoming leave dates in this range have been cancelled, and patients have been notified.');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel leave early');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab 1 Submit: Save Profile Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    setSuccessMsg(null);
    try {
      await api.auth.updateProfile(user.id, {
        name: profName,
        email: profEmail,
        phone: profPhone,
        ...(profPassword ? { password: profPassword } : {})
      });
      await refreshProfile();
      setSuccessMsg('Your login and profile metadata have been updated successfully.');
      setProfPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile info');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab 2 Submit: Save Shifts & Timings
  const handleSaveShifts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorProfile) return;
    setIsLoading(true);
    setSuccessMsg(null);
    try {
      await api.doctors.update(doctorProfile.id, {
        name: profName,
        specialization,
        slotDuration,
        workingHours
      });
      await refreshProfile();
      setSuccessMsg('Consultation shift timings and slot parameters saved successfully.');
    } catch (err) {
      alert('Failed to save shifts configuration');
    } finally {
      setIsLoading(false);
    }
  };

  // Shift Row Helpers
  const handleAddShift = () => {
    if (workingHours.some(wh => wh.dayOfWeek === shiftDay)) {
      alert('A shift for this day already exists. Please remove it first to reschedule.');
      return;
    }
    setWorkingHours([...workingHours, { dayOfWeek: shiftDay, startTime: shiftStart, endTime: shiftEnd }]);
  };

  const handleRemoveShift = (day: number) => {
    setWorkingHours(workingHours.filter(wh => wh.dayOfWeek !== day));
  };

  // Tab 3 Submit: Mark Leave Range
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorProfile || !leaveStart || !leaveEnd) return;
    setIsLoading(true);
    setSuccessMsg(null);
    try {
      const res = await api.doctors.setLeaveRange(doctorProfile.id, leaveStart, leaveEnd);
      setSuccessMsg(
        `Leave registered from ${leaveStart} to ${leaveEnd}. ` +
        `${res.affectedAppointmentsCount} appointments cancelled and patients notified via simulated email.`
      );
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveConflicts([]);
      await refreshProfile();
      await loadLeaveHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to register leave');
    } finally {
      setIsLoading(false);
    }
  };

  const getTomorrowStr = () => {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    return tom.toISOString().split('T')[0];
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Specialist Settings Panel</h2>
        <p className="text-xs text-slate-450 mt-1">Configure your clinical shift calendars, vacation leave range planners, and credentials.</p>
      </div>
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-250 text-sm text-emerald-700 flex items-start">
          <CheckCircle className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0 mt-0.5" />
          <p>{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Column Tabs */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm space-y-1.5 md:col-span-1">
          <button
            onClick={() => { setActiveTab('profile'); setSuccessMsg(null); }}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center transition-all ${
              activeTab === 'profile' 
                ? 'bg-[#3b82f6] text-white shadow-md shadow-brand-500/25' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserIcon className="h-4.5 w-4.5 mr-2.5" /> Profile Settings
          </button>
          
          <button
            onClick={() => { setActiveTab('shifts'); setSuccessMsg(null); }}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center transition-all ${
              activeTab === 'shifts' 
                ? 'bg-[#3b82f6] text-white shadow-md shadow-brand-500/25' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="h-4.5 w-4.5 mr-2.5" /> Working Shifts
          </button>

          <button
            onClick={() => { setActiveTab('leave'); setSuccessMsg(null); }}
            className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold flex items-center transition-all ${
              activeTab === 'leave' 
                ? 'bg-[#3b82f6] text-white shadow-md shadow-brand-500/25' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className="h-4.5 w-4.5 mr-2.5" /> Leave Planner
          </button>
        </div>

        {/* Right Column Content */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm md:col-span-3">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Profile Configuration</h3>
                <p className="text-xs text-slate-500">Edit login credentials, name, and contact details.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={profName}
                        onChange={(e) => setProfName(e.target.value)}
                        className="input-field pl-10 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label-text">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profEmail}
                      onChange={(e) => setProfEmail(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-text">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      value={profPhone}
                      onChange={(e) => setProfPhone(e.target.value)}
                      placeholder="e.g. +1 555-019-2834"
                      className="input-field pl-10 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="label-text">Change Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={profPassword}
                      onChange={(e) => setProfPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      className="input-field pl-10 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 mt-2 text-xs font-bold"
                >
                  {isLoading ? 'Saving account settings...' : 'Update Account Settings'}
                </button>
              </form>

              <div className="pt-6 border-t border-slate-150 space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Google Calendar Integration</h4>
                  <p className="text-xs text-slate-500">Sync patient appointments directly with your Google Calendar.</p>
                </div>
                
                {user?.isGoogleLinked ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500 text-white rounded-full">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-800">Google Calendar Connected</p>
                        <p className="text-[10px] text-emerald-600">Appointments will automatically sync to Google Calendar.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={refreshProfile}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs transition-colors flex items-center space-x-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Refresh Status</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-amber-800">Google Calendar Disconnected</p>
                      <p className="text-[10px] text-amber-600">To enable automatic Google Calendar event synchronization, link your Google account.</p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const url = await api.auth.getGoogleAuthUrl();
                            window.open(url, '_blank', 'width=600,height=600');
                          } catch (err: any) {
                            alert(err.message || 'Failed to get authorization URL. Please make sure Google client credentials are set in the backend .env.');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                      >
                        Link Google Calendar
                      </button>
                      <button
                        type="button"
                        onClick={refreshProfile}
                        className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-colors"
                        title="Check Link Status"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'shifts' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Shift & Session Timings</h3>
                <p className="text-xs text-slate-500">Configure your weekly clinic shift hours and slot size.</p>
              </div>

              <form onSubmit={handleSaveShifts} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label-text">Clinical Specialization</label>
                    <input
                      type="text"
                      required
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="label-text">Consultation Slot Size (minutes)</label>
                    <input
                      type="number"
                      min={10}
                      max={120}
                      required
                      value={slotDuration}
                      onChange={(e) => setSlotDuration(parseInt(e.target.value) || 30)}
                      className="input-field text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-150">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center uppercase tracking-wider text-slate-550">
                    <Clock className="h-4 w-4 text-brand-500 mr-2" /> Weekly Shift Calendar
                  </h4>

                  <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-slate-50 text-xs">
                    {workingHours.length === 0 ? (
                      <p className="p-4 text-slate-450 text-center">No shifts added yet.</p>
                    ) : (
                      workingHours.map((wh) => (
                        <div key={wh.dayOfWeek} className="p-3.5 flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            {DAYS_OF_WEEK.find(d => d.val === wh.dayOfWeek)?.label}
                          </span>
                          <div className="flex items-center space-x-3">
                            <span className="font-mono bg-white px-2.5 py-1 border border-slate-200 rounded-xl text-slate-600">
                              {wh.startTime} - {wh.endTime}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveShift(wh.dayOfWeek)}
                              className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-1.5">
                    <select
                      value={shiftDay}
                      onChange={(e) => setShiftDay(parseInt(e.target.value))}
                      className="input-field"
                    >
                      {DAYS_OF_WEEK.map(d => (
                        <option key={d.val} value={d.val}>{d.label}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={shiftStart}
                      onChange={(e) => setShiftStart(e.target.value)}
                      className="input-field font-mono"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="time"
                        value={shiftEnd}
                        onChange={(e) => setShiftEnd(e.target.value)}
                        className="input-field font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddShift}
                        className="btn-accent px-3 shrink-0 rounded-xl text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3 mt-3 text-xs font-bold"
                >
                  {isLoading ? 'Saving shift adjustments...' : 'Save Timing Settings'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* Left Column: Plan Leave */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Leave Range Planner</h3>
                  <p className="text-xs text-slate-500">Configure range parameters to safely block slot schedulers.</p>
                </div>

                <form onSubmit={handleApplyLeave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label-text">Start Date</label>
                      <input
                        type="date"
                        required
                        min={getTomorrowStr()}
                        value={leaveStart}
                        onChange={(e) => setLeaveStart(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                    <div>
                      <label className="label-text">End Date</label>
                      <input
                        type="date"
                        required
                        min={leaveStart || getTomorrowStr()}
                        value={leaveEnd}
                        onChange={(e) => setLeaveEnd(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                  </div>

                  {isCheckingLeave ? (
                    <div className="flex items-center text-xs text-slate-400 space-x-1.5 py-1">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Checking appointment bookings for conflicts...</span>
                    </div>
                  ) : leaveConflicts.length > 0 ? (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
                      <div className="flex items-start text-rose-700 text-xs font-bold">
                        <AlertTriangle className="h-4.5 w-4.5 text-rose-600 mr-2 flex-shrink-0" />
                        <span>Leave Conflict Alert ({leaveConflicts.length} matches)</span>
                      </div>
                      <p className="text-[11px] text-rose-650 leading-relaxed">
                        Scheduling leave for this range will automatically cancel the following appointments:
                      </p>
                      <div className="bg-white border border-rose-100 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs max-h-36 overflow-y-auto">
                        {leaveConflicts.map(apt => (
                          <div key={apt.id} className="p-2.5 flex justify-between text-[11px] text-slate-700">
                            <span className="font-semibold text-slate-850">{apt.patient?.name}</span>
                            <span className="font-mono text-slate-450">{apt.date} • {apt.startTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : leaveStart && leaveEnd ? (
                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50 text-xs text-emerald-700 font-medium">
                      No booking conflicts in this range. Selected dates will be safely blocked.
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isLoading || !leaveStart || !leaveEnd || isCheckingLeave}
                    className="btn-primary w-full py-3 mt-2 text-xs font-bold"
                  >
                    {isLoading ? 'Booking leave...' : 'Confirm Leave Schedule'}
                  </button>
                </form>
              </div>

              {/* Right Column: Leaves History */}
              <div className="space-y-6 border-t xl:border-t-0 xl:border-l border-slate-150 pt-6 xl:pt-0 xl:pl-8">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center">
                    <ClipboardList className="h-5 w-5 text-brand-500 mr-2" /> My Leaves History
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Registry history of requested leaves and returns.</p>
                </div>

                <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-slate-50 text-xs">
                  {leaveHistory.length === 0 ? (
                    <p className="p-8 text-center text-slate-450 italic">No leaves registered yet.</p>
                  ) : (
                    leaveHistory.slice().reverse().map((record) => {
                      const isCurrentlyActive = record.status === 'ACTIVE';
                      
                      return (
                        <div key={record.id} className="p-4 bg-white flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-850">
                              {record.startDate} to {record.endDate}
                            </span>
                            <div className="flex items-center space-x-2">
                              {record.status === 'ACTIVE' && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-50 text-brand-700 border border-brand-100">
                                  ACTIVE
                                </span>
                              )}
                              {record.status === 'RESUMED_EARLY' && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                  RESUMED EARLY
                                </span>
                              )}
                              {record.status === 'COMPLETED' && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500">
                                  COMPLETED
                                </span>
                              )}
                              <span className="text-[9px] text-slate-450 font-mono">Logged {new Date(record.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {isCurrentlyActive && (
                            <button
                              type="button"
                              onClick={handleCancelLeaveEarly}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold border border-amber-200 rounded-lg text-[10px] transition-colors"
                            >
                              Resume Early
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
