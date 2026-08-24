import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Appointment } from '../../types';
import {
  Calendar,
  Clipboard,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Stethoscope,
  Plus,
  RefreshCw,
  Eye,
  User as UserIcon,
  ChevronLeft
} from 'lucide-react';

export const DoctorQueuesList: React.FC = () => {
  const { doctorProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Active examination state
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [meds, setMeds] = useState<{ name: string; dosage: string; frequency: string; duration: string }[]>([]);
  const [followUp, setFollowUp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Medication Row Inputs
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [medDur, setMedDur] = useState('');

  const fetchQueues = async () => {
    if (!doctorProfile) return;
    try {
      const data = await api.appointments.list({ doctorId: doctorProfile.id });
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments queue list', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
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
      await fetchQueues();
    } catch (err) {
      alert('Failed to log consultation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-150"><CheckCircle2 className="h-3 w-3 mr-1" /> Confirmed</span>;
      case 'HELD':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-155"><Clock className="h-3 w-3 mr-1 animate-pulse" /> Held</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-150"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</span>;
      case 'CANCELLED_BY_DOCTOR_LEAVE':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-150"><AlertTriangle className="h-3 w-3 mr-1" /> Doctor Leave Cancel</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-150"><XCircle className="h-3 w-3 mr-1" /> Cancelled</span>;
    }
  };

  const getUrgencyBadge = (symptomsStr: string) => {
    const s = symptomsStr.toLowerCase();
    if (s.includes('chest pain') || s.includes('breath') || s.includes('bleeding') || s.includes('severe')) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-150 text-rose-700 animate-pulse"><AlertTriangle className="h-3 w-3 mr-1" /> Emergency Urgency</span>;
    }
    if (s.includes('pain') || s.includes('fever') || s.includes('vomit') || s.includes('cough')) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-150 text-amber-700"><Clock className="h-3 w-3 mr-1" /> Medium Urgency</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-150 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" /> Low Urgency</span>;
  };

  // Filter Logic
  const filteredApts = appointments.filter(apt => {
    const patientName = apt.patient?.name || '';
    const patientId = apt.patientId || '';
    const matchesSearch = 
      patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patientId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = !dateFilter || apt.date === dateFilter;

    let matchesStatus = true;
    if (statusFilter === 'PENDING') {
      matchesStatus = apt.status === 'CONFIRMED' || apt.status === 'HELD';
    } else if (statusFilter === 'COMPLETED') {
      matchesStatus = apt.status === 'COMPLETED';
    } else if (statusFilter === 'CANCELLED') {
      matchesStatus = apt.status === 'CANCELLED' || apt.status === 'CANCELLED_BY_DOCTOR_LEAVE';
    }

    return matchesSearch && matchesDate && matchesStatus;
  });

  return (
    <div className="space-y-8">
      {/* Top Navigation Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link to="/doctor" className="text-xs text-brand-600 hover:text-brand-700 font-bold flex items-center mb-1">
            <ChevronLeft className="h-4 w-4 mr-0.5" /> Back to Dashboard
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Full Patient Queues List</h2>
          <p className="text-xs text-slate-500 mt-0.5">Browse past, upcoming, and cancelled appointment schedules.</p>
        </div>
        <button
          onClick={fetchQueues}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center transition-colors self-start sm:self-auto shrink-0 shadow-sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Sync Records
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search patient by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Date Filter */}
        <div className="relative">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field"
          />
        </div>

        {/* Status Tab buttons */}
        <div className="flex p-1 bg-slate-50 rounded-2xl border border-slate-100">
          {(['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`flex-1 text-center py-1.5 rounded-xl font-bold text-xs transition-all ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-850'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Queues List Grid */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Clock className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : filteredApts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm max-w-xl mx-auto">
          <Clipboard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h4 className="font-extrabold text-slate-800 text-base">No Queue Records Found</h4>
          <p className="text-xs text-slate-500 mt-1.5">No appointment slots matched your selected search query or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApts.map((apt) => (
            <div key={apt.id} className="bg-white border border-slate-200 hover:border-brand-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-sm">
                    {apt.patient?.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{apt.patient?.name}</h4>
                    <p className="text-xs text-slate-450 font-mono">Date: {apt.date} • Time: {apt.startTime} - {apt.endTime}</p>
                  </div>
                </div>

                {apt.symptoms && (
                  <div className="text-xs p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 italic">
                    Symptoms: {apt.symptoms.symptoms}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {getUrgencyBadge(apt.symptoms?.symptoms || '')}
                  {getStatusBadge(apt.status)}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto">
                {(apt.status === 'CONFIRMED' || apt.status === 'HELD') ? (
                  <button
                    onClick={() => handleOpenExamine(apt)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs rounded-xl shadow transition-colors flex items-center"
                  >
                    <Stethoscope className="h-4 w-4 mr-1.5" /> Start Examination
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedApt(apt)}
                    className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-1.5" /> View Consult Log
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Examination & Records Modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center">
                  <Stethoscope className="h-5 w-5 text-brand-500 mr-2" /> 
                  {selectedApt.status === 'COMPLETED' ? 'Clinical Consultation Summary' : 'Clinical Examination Terminal'}
                </h3>
                <p className="text-xs text-slate-500">Patient: {selectedApt.patient?.name} • Appt: {selectedApt.date} at {selectedApt.startTime}</p>
              </div>
              <button 
                onClick={() => setSelectedApt(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content split screen */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Panel: Symptoms & AI Pre-visit Summary */}
              <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200 space-y-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-550 uppercase tracking-wider mb-2">Patient Pre-Screening summary</h4>
                  <div className="p-4 bg-brand-50/50 rounded-2xl border border-brand-100/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-550 font-semibold">Urgency Index Assessment:</span>
                      {getUrgencyBadge(selectedApt.symptoms?.symptoms || '')}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">Chief Complaint:</span>
                      <p className="text-xs text-slate-700 bg-white border border-slate-100 p-3 rounded-xl italic">
                        "{selectedApt.symptoms?.symptoms || 'No symptoms registered.'}"
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-550 uppercase tracking-wider mb-2">Recommended Clinical Prompts</h4>
                  <div className="space-y-2">
                    {(() => {
                      const questions = selectedApt.symptoms?.suggestedQuestions;
                      const defaultQuestions = [
                        'Check onset duration, trigger thresholds, and history of cardiovascular issues.',
                        'Inquire about lifestyle stressors, dietary routines, or physical symptoms during triggers.',
                        'Detail immediate resting recommendations and explain prescription schedules carefully.'
                      ];
                      
                      const displayQuestions = Array.isArray(questions) && questions.length > 0
                        ? questions
                        : defaultQuestions;

                      return displayQuestions.map((q, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                          {idx + 1}. {q}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Right Panel: Notes Log Form OR Completed Log View */}
              <div className="w-full md:w-1/2 p-6 md:p-8 overflow-y-auto space-y-6 bg-slate-50/50">
                {selectedApt.status === 'COMPLETED' ? (
                  <div className="space-y-6 text-sm">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Consultation Notes</h4>
                      <div className="p-4 bg-white border border-slate-200 rounded-xl font-sans text-slate-700">
                        {selectedApt.consultation?.clinicalNotes || 'No notes logged.'}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">AI Summary Output</h4>
                      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                        <p className="text-xs text-slate-700"><span className="font-semibold block text-slate-900 mb-0.5">Patient Friendly Translation:</span> {selectedApt.aiSummary?.summaryText || 'N/A'}</p>
                        {selectedApt.aiSummary?.medicationSchedule && (
                          <div>
                            <span className="font-semibold block text-[10px] text-slate-900 uppercase tracking-wider mt-2 mb-1">Medication Schedule:</span>
                            <pre className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg whitespace-pre-wrap font-sans">{selectedApt.aiSummary.medicationSchedule}</pre>
                          </div>
                        )}
                        {selectedApt.aiSummary?.followUpSteps && (
                          <p className="text-xs text-slate-700"><span className="font-semibold block text-slate-900 mt-2 mb-0.5">Next Action Steps:</span> {selectedApt.aiSummary.followUpSteps}</p>
                        )}
                      </div>
                    </div>

                    {selectedApt.prescription && (
                      <div>
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Prescribed Medications</h4>
                        <div className="border border-slate-200 rounded-xl bg-white divide-y divide-slate-100 overflow-hidden">
                          {selectedApt.prescription.medications.map(med => (
                            <div key={med.id} className="p-3 flex justify-between items-center text-xs">
                              <div>
                                <p className="font-semibold text-slate-800">{med.name} ({med.dosage})</p>
                                <p className="text-[10px] text-slate-450">{med.frequency} • Duration: {med.duration}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Active Form */}
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

                      {/* Add inputs */}
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

                    {/* Follow up directives */}
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
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setSelectedApt(null)}
                className="btn-secondary px-5 text-xs font-semibold"
              >
                Close
              </button>
              {selectedApt.status !== 'COMPLETED' && (
                <button
                  onClick={handleCompleteConsultation}
                  disabled={isSubmitting || !clinicalNotes}
                  className="btn-primary px-8 text-xs font-semibold"
                >
                  {isSubmitting ? 'Finalizing...' : 'Submit Consultation Log'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
