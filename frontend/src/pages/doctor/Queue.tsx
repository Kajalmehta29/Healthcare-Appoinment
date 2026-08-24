import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Appointment } from '../../types';
import {
  Calendar,
  Clipboard,
  User as UserIcon,
  Clock,
  CheckCircle,
  Stethoscope,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Activity,
  Award,
  RefreshCw,
  Plus
} from 'lucide-react';

export const DoctorQueue: React.FC = () => {
  const { doctorProfile, refreshProfile } = useAuth();

  const handleResumeDutyEarly = async () => {
    if (!doctorProfile) return;
    try {
      const todayDateStr = new Date().toISOString().split('T')[0];
      await api.doctors.cancelLeaveEarly(doctorProfile.id, todayDateStr);
      await refreshProfile();
      await fetchQueue();
      alert('Welcome back! Today and any upcoming leave dates in this range have been cleared. You are now marked as available.');
    } catch (err) {
      alert('Failed to resume duty early.');
    }
  };

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allApts, setAllApts] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active examination state
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [meds, setMeds] = useState<{ name: string; dosage: string; frequency: string; duration: string }[]>([]);
  const [followUp, setFollowUp] = useState('');

  // Medication Row Inputs
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [medDur, setMedDur] = useState('');

  const fetchQueue = async () => {
    if (!doctorProfile) return;
    try {
      const data = await api.appointments.list({ doctorId: doctorProfile.id });
      setAllApts(data);
      // Filter active for today's queue
      const active = data.filter(a => a.status === 'CONFIRMED' || a.status === 'HELD');
      setAppointments(active);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [doctorProfile]);

  const handleOpenExamine = (apt: Appointment) => {
    setSelectedApt(apt);
    setClinicalNotes('');
    setMeds([]);
    setFollowUp('');
  };

  const handleAddMedication = () => {
    if (!medName || !medDosage || !medFreq || !medDur) return;
    setMeds([...meds, { name: medName, dosage: medDosage, frequency: medFreq, duration: medDur }]);
    setMedName('');
    setMedDosage('');
    setMedFreq('');
    setMedDur('');
  };

  const handleRemoveMedication = (idx: number) => {
    setMeds(meds.filter((_, i) => i !== idx));
  };

  const handleCompleteConsultation = async () => {
    if (!selectedApt || !clinicalNotes) return;
    setIsSubmitting(true);
    try {
      let finalMeds = [...meds];
      if (medName && medDosage && medFreq && medDur) {
        finalMeds.push({ name: medName, dosage: medDosage, frequency: medFreq, duration: medDur });
      }

      await api.appointments.submitConsultation(selectedApt.id, { notes: clinicalNotes, medications: finalMeds, followUp });
      setSelectedApt(null);
      await fetchQueue();
    } catch (err) {
      alert('Failed to log consultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to determine AI pre-visit urgency tags
  const getUrgencyBadge = (symptomsStr: string) => {
    const s = symptomsStr.toLowerCase();
    if (s.includes('chest pain') || s.includes('breath') || s.includes('bleeding') || s.includes('severe')) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-150 text-rose-700 animate-pulse"><AlertTriangle className="h-3 w-3 mr-1" /> Emergency Urgency</span>;
    }
    if (s.includes('pain') || s.includes('fever') || s.includes('vomit') || s.includes('cough')) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-150 text-amber-700"><Clock className="h-3 w-3 mr-1" /> Medium Urgency</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-150 text-emerald-700"><CheckCircle className="h-3 w-3 mr-1" /> Low Urgency</span>;
  };

  const completedCount = allApts.filter(a => a.status === 'COMPLETED').length;
  const pendingCount = appointments.length;
  const totalCount = completedCount + pendingCount;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Leave warning banner */}
      {(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const isOnLeave = doctorProfile?.leaveDays.includes(todayStr);
        if (!isOnLeave) return null;
        return (
          <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-955 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm shadow-amber-500/5 z-20">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-sm block">Currently Marked On Leave Today</span>
                <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                  You are registered as off-duty today ({todayStr}). Your public slots are locked.
                </p>
              </div>
            </div>
            <button
              onClick={handleResumeDutyEarly}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm shrink-0 self-start sm:self-auto"
            >
              Resume Duty Early
            </button>
          </div>
        );
      })()}

      {/* Greeting Banner */}
      <div className="relative bg-gradient-to-r from-brand-600 via-blue-500 to-indigo-500 text-white rounded-3xl p-8 overflow-hidden shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 -mr-10 -mt-10 blur-2xl"></div>
        <div className="space-y-2 z-10 max-w-xl">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome back, Dr. {doctorProfile?.name}!</h2>
          <p className="text-blue-50 text-sm leading-relaxed">
            Here are your scheduled appointments and clinical parameters for today. Review urgency levels and translate prescriptions easily.
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs rounded-xl backdrop-blur transition-all flex items-center z-10 self-start md:self-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh Queue
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Clipboard className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Pastel Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Total Patient Registry */}
            <div className="card-pastel-blue flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-[#0369a1] font-extrabold uppercase tracking-wide block opacity-80">Total Patients treated</span>
                <p className="text-2xl font-black text-[#0369a1]">{totalCount}</p>
                <span className="text-[10px] block opacity-80">Visits registered in clinic</span>
              </div>
              <div className="p-3 bg-white/50 rounded-xl">
                <UserIcon className="h-6 w-6 text-[#0369a1]" />
              </div>
            </div>

            {/* Card 2: Active queue */}
            <div className="card-pastel-orange flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-[#c2410c] font-extrabold uppercase tracking-wide block opacity-80">Remaining In Queue</span>
                <p className="text-2xl font-black text-[#c2410c]">{pendingCount} Active</p>
                <span className="text-[10px] block opacity-80">Waiting in lobby</span>
              </div>
              <div className="p-3 bg-white/50 rounded-xl">
                <Clock className="h-6 w-6 text-[#c2410c]" />
              </div>
            </div>

            {/* Card 3: Completed */}
            <div className="card-pastel-green flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-[#15803d] font-extrabold uppercase tracking-wide block opacity-80">Completed Today</span>
                <p className="text-2xl font-black text-[#15803d]">{completedCount} Done</p>
                <span className="text-[10px] block opacity-80">Consultations finished</span>
              </div>
              <div className="p-3 bg-white/50 rounded-xl">
                <CheckCircle className="h-6 w-6 text-[#15803d]" />
              </div>
            </div>
          </div>

          {/* Core Layout split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left 2 Columns: Patients list cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center">
                    <Clipboard className="h-5 w-5 text-brand-500 mr-2" /> Daily Patient Queue
                  </h3>
                  <Link to="/doctor/queues" className="text-xs text-brand-600 hover:text-brand-700 hover:underline font-bold bg-brand-50/60 border border-brand-100/50 px-2.5 py-1 rounded-xl transition-all">
                    View All
                  </Link>
                </div>
                <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-bold">
                  {appointments.length} active remaining
                </span>
              </div>

              {appointments.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                  <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h4 className="font-bold text-slate-800 text-base">Your Queue is Empty</h4>
                  <p className="text-xs text-slate-500 mt-1">All patient appointments for today have been completed or cancelled.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments.slice(0, 2).map((apt) => (
                    <div key={apt.id} className="bg-white border border-slate-200 hover:border-brand-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-sm">
                            {apt.patient?.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{apt.patient?.name}</h4>
                            <p className="text-xs text-slate-450 font-mono">Patient ID: {apt.patientId} • time: {apt.startTime}</p>
                          </div>
                        </div>

                        {apt.symptoms && (
                          <div className="text-xs p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 italic">
                            Symptoms: {apt.symptoms.symptoms}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {getUrgencyBadge(apt.symptoms?.symptoms || '')}
                          <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">In-Person</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenExamine(apt)}
                        className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center self-start md:self-auto"
                      >
                        Examine Patient <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Graphs */}
            <div className="space-y-8">

              {/* Queue completion donut gauge */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex items-center justify-between">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Queue Progress</h4>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{completedCount} / {totalCount}</p>
                    <p className="text-[10px] text-slate-450 uppercase font-semibold mt-0.5">Completed Consults</p>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="30" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                    <circle cx="40" cy="40" r="30" stroke="#2563eb" strokeWidth="6" fill="transparent"
                      strokeDasharray={188.5}
                      strokeDashoffset={188.5 - (188.5 * pct) / 100}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold text-slate-805">{pct}%</span>
                </div>
              </div>

              {/* Consultation load bar chart */}
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
                <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Weekly Daily Load</h4>
                <div className="h-28 w-full flex items-end justify-between px-2 pb-1 relative border-b border-slate-100">
                  {/* Grid lines */}
                  <div className="absolute inset-x-0 bottom-0 h-full flex flex-col justify-between pointer-events-none opacity-40">
                    <div className="border-t border-slate-100 w-full h-px"></div>
                    <div className="border-t border-slate-100 w-full h-px"></div>
                  </div>

                  {/* Draw load bars */}
                  {(() => {
                    const loadCounts: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    allApts.forEach(a => {
                      const d = new Date(a.date).getDay();
                      const name = dayNames[d];
                      if (loadCounts[name] !== undefined) loadCounts[name]++;
                    });
                    const maxVal = Math.max(...Object.values(loadCounts), 1);

                    return Object.entries(loadCounts).map(([day, val]) => {
                      const heightPercent = (val / maxVal) * 75 + 5;
                      return (
                        <div key={day} className="flex flex-col items-center w-8 group relative z-10">
                          <div className="absolute bottom-full mb-1.5 bg-slate-900 text-white text-[9px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow">
                            {val} patients
                          </div>
                          <div
                            style={{ height: `${heightPercent}px` }}
                            className="w-full bg-[#3b82f6] hover:bg-brand-600 transition-all duration-300 rounded-t shadow-inner cursor-pointer"
                          ></div>
                          <span className="text-[9px] text-slate-400 font-semibold mt-1.5">{day}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

            </div>

          </div>
        </>
      )}

      {/* Examination Split Screen Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center">
                  <Stethoscope className="h-5 w-5 text-brand-500 mr-2" /> Clinical Examination Terminal
                </h3>
                <p className="text-xs text-slate-500">Patient: {selectedApt.patient?.name} • Appt Time: {selectedApt.startTime}</p>
              </div>
              <button
                onClick={() => setSelectedApt(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-655 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            {/* Split panels */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Panel: Symptoms & AI Pre-visit Summary */}
              <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">AI Patient Pre-Screening Summary</h4>
                  <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold">Urgency Index Assessment:</span>
                      {getUrgencyBadge(selectedApt.symptoms?.symptoms || '')}
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 font-bold block mb-1">Chief Complaint:</span>
                      <p className="text-xs text-slate-700 bg-white border border-slate-100 p-3 rounded-xl italic">
                        "{selectedApt.symptoms?.symptoms || 'No symptoms registered.'}"
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2">Recommended Clinical Prompts</h4>
                  <div className="space-y-2">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                      1. Check onset duration, trigger thresholds, and history of cardiovascular issues.
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                      2. Inquire about lifestyle stressors, dietary routines, or physical symptoms during triggers.
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                      3. Detail immediate resting recommendations and explain prescription schedules carefully.
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Notes Logging Form */}
              <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto space-y-6 bg-slate-50/50">
                {/* Diagnostics Notes */}
                <div>
                  <label className="label-text">Clinical Consultation Notes</label>
                  <textarea
                    required
                    rows={4}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Enter clinical notes, diagnosis, and medical advice..."
                    className="input-field text-xs font-sans h-32"
                  />
                </div>

                {/* Prescription Manager */}
                <div className="space-y-3">
                  <span className="label-text">Draft Prescription Medications</span>

                  {/* Medications list */}
                  <div className="border border-slate-200 rounded-2xl bg-white divide-y divide-slate-100 overflow-hidden text-xs">
                    {meds.length === 0 ? (
                      <p className="p-4 text-slate-450 text-center italic">No prescription lines added yet.</p>
                    ) : (
                      meds.map((m, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center bg-slate-50/30">
                          <div>
                            <p className="font-bold text-slate-800">{m.name} <span className="font-normal text-slate-500">({m.dosage})</span></p>
                            <p className="text-[10px] text-slate-450">{m.frequency} • {m.duration}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(idx)}
                            className="p-1 hover:bg-rose-50 text-rose-500 rounded"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Row inputs */}
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <input
                      type="text"
                      placeholder="Med Name"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      className="input-field px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      value={medDosage}
                      onChange={(e) => setMedDosage(e.target.value)}
                      className="input-field px-2.5 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Freq (e.g. Twice Daily)"
                      value={medFreq}
                      onChange={(e) => setMedFreq(e.target.value)}
                      className="input-field px-2.5 py-1.5"
                    />
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Duration (e.g. 5 Days)"
                        value={medDur}
                        onChange={(e) => setMedDur(e.target.value)}
                        className="input-field px-2.5 py-1.5"
                      />
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        className="btn-accent px-2.5 shrink-0 rounded-xl"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Follow up instructions */}
                <div>
                  <label className="label-text">Follow-up Directives & Remarks</label>
                  <input
                    type="text"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    placeholder="e.g., Return in 2 weeks for chest checkup"
                    className="input-field text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setSelectedApt(null)}
                className="btn-secondary px-5 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteConsultation}
                disabled={isSubmitting || !clinicalNotes}
                className="btn-primary px-8 text-xs font-semibold"
              >
                {isSubmitting ? 'Finalizing...' : 'Submit Consultation Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
