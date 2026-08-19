import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DoctorProfile, Appointment } from '../../types';
import { Calendar as CalendarIcon, AlertTriangle, CheckCircle, RefreshCw, ClipboardList, ShieldAlert } from 'lucide-react';

export const AdminLeaves: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [conflicts, setConflicts] = useState<Appointment[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Load doctor list
  const loadDocs = async () => {
    try {
      const data = await api.doctors.list();
      setDoctors(data);
      if (data.length > 0 && !selectedDocId) setSelectedDocId(data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  // Check conflicts when doctor or date range changes
  useEffect(() => {
    const checkConflicts = async () => {
      if (!selectedDocId || !startDate || !endDate) {
        setConflicts([]);
        return;
      }
      setIsChecking(true);
      try {
        const list = await api.appointments.list({ doctorId: selectedDocId });
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        const matches = list.filter(apt => {
          const d = new Date(apt.date);
          return d >= start && d <= end && (apt.status === 'CONFIRMED' || apt.status === 'HELD');
        });
        setConflicts(matches);
      } catch (err) {
        console.error(err);
      } finally {
        setIsChecking(false);
      }
    };
    checkConflicts();
  }, [selectedDocId, startDate, endDate]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !startDate || !endDate) return;
    
    setIsLoading(true);
    setSuccessInfo(null);
    try {
      const res = await api.doctors.setLeaveRange(selectedDocId, startDate, endDate);
      const docName = doctors.find(d => d.id === selectedDocId)?.name || 'Doctor';
      
      setSuccessInfo(
        `Leave marked successfully for ${docName} from ${startDate} to ${endDate}. ` + 
        `${res.affectedAppointmentsCount} appointments were cancelled and patients notified.`
      );
      setStartDate('');
      setEndDate('');
      setConflicts([]);
      await loadDocs(); // reload doctor leaves list
    } catch (err: any) {
      alert(err.message || 'Failed to register leave');
    } finally {
      setIsLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Vacation & Leave Registry</h2>
        <p className="text-xs text-slate-450 mt-1">Schedule range leaves, register off-duty blocks, and resolve appointment conflicts.</p>
      </div>

      {successInfo && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-250 text-sm text-emerald-700 flex items-start">
          <CheckCircle className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0 mt-0.5" />
          <p>{successInfo}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Form Builder */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8 space-y-6 lg:col-span-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-xl">
              <CalendarIcon className="h-6 w-6 text-brand-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-905 text-base">Schedule Leave Range</h3>
              <p className="text-xs text-slate-450 mt-0.5">Specify dates to cancel upcoming appointments.</p>
            </div>
          </div>

          <form onSubmit={handleApplyLeave} className="space-y-4">
            <div>
              <label className="label-text">Select Practitioner</label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="input-field h-11 text-xs"
              >
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-text">Start Date</label>
                <input
                  type="date"
                  required
                  min={getMinDate()}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field text-xs h-11"
                />
              </div>
              <div>
                <label className="label-text">End Date</label>
                <input
                  type="date"
                  required
                  min={startDate || getMinDate()}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field text-xs h-11"
                />
              </div>
            </div>

            {isChecking ? (
              <div className="flex items-center text-xs text-slate-400 space-x-1.5 py-1">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Scanning calendar for conflicts...</span>
              </div>
            ) : conflicts.length > 0 ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center text-rose-700 text-xs font-bold">
                  <ShieldAlert className="h-4.5 w-4.5 text-rose-600 mr-2 flex-shrink-0" />
                  <span>Conflict Warning ({conflicts.length} matches)</span>
                </div>
                <p className="text-[11px] text-rose-650 leading-relaxed">
                  Submitting will cancel these bookings and trigger patient notifications:
                </p>
                <div className="bg-white border border-rose-100 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs text-slate-700 max-h-40 overflow-y-auto">
                  {conflicts.map(apt => (
                    <div key={apt.id} className="p-2 flex justify-between text-[10px]">
                      <span className="font-semibold text-slate-800">{apt.patient?.name}</span>
                      <span className="font-mono text-slate-450">{apt.date} • {apt.startTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : startDate && endDate ? (
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50 text-xs text-emerald-700 font-medium">
                No scheduling conflicts. Selected dates will be safely blocked.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading || !selectedDocId || !startDate || !endDate || isChecking}
              className="btn-primary w-full py-3 mt-2 text-xs font-bold"
            >
              {isLoading ? 'Processing Leave...' : 'Confirm Leave Schedule'}
            </button>
          </form>
        </div>

        {/* Right Column: Registry table log */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-5">
          <div className="flex items-center space-x-2 text-slate-850 font-extrabold text-sm uppercase tracking-wide">
            <ClipboardList className="h-4.5 w-4.5 text-brand-500" />
            <span>Active Off-Duty Registry Logs</span>
          </div>

          <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-slate-50 text-xs">
            {doctors.every(d => d.leaveDays.length === 0) ? (
              <p className="p-8 text-center text-slate-450 italic">No specialist leave ranges registered yet.</p>
            ) : (
              doctors.filter(d => d.leaveDays.length > 0).map((doc) => (
                <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <span className="font-extrabold text-slate-900 text-sm">{doc.name}</span>
                    <span className="text-[10px] text-slate-450 block font-bold uppercase tracking-wider">{doc.specialization}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-w-sm sm:justify-end">
                    {doc.leaveDays.sort().map((dateStr) => (
                      <span key={dateStr} className="px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-mono text-[10px] font-bold">
                        {dateStr}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
