import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Appointment } from '../../types';
import { 
  FileText, 
  Calendar, 
  Activity, 
  Clock, 
  ChevronRight, 
  Clipboard, 
  Search,
  Filter,
  Sparkles,
  ClipboardList
} from 'lucide-react';

export const PatientHistory: React.FC = () => {
  const { patientProfile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (!patientProfile) return;
      try {
        const data = await api.appointments.list({ patientId: patientProfile.id });
        const completed = data.filter(a => a.status === 'COMPLETED');
        const sorted = completed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Latest first
        setAppointments(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [patientProfile]);

  const filteredApts = appointments.filter(apt => {
    const doctorName = apt.doctor?.name.toLowerCase() || '';
    const notes = apt.consultation?.clinicalNotes.toLowerCase() || '';
    const date = apt.date.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return doctorName.includes(query) || notes.includes(query) || date.includes(query);
  });

  const totalVisits = appointments.length;
  const followUpCount = totalVisits > 1 ? totalVisits - 1 : 0;

  const getVisitTypeBadge = (index: number) => {
    if (index === totalVisits - 1) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-100 uppercase tracking-wide">
          Initial Consultation
        </span>
      );
    }
    const followUpNum = totalVisits - 1 - index;
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
        Follow-up Session #{followUpNum}
      </span>
    );
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Header Panel */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Personal Health Dossier</h2>
        <p className="text-xs text-slate-450 mt-1">Review diagnostic history, prescriptions, and AI translations chronologically.</p>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Clock className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm max-w-lg mx-auto">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-800 text-base">No Medical History Found</h3>
          <p className="text-xs text-slate-500 mt-1">Your clinical medical visits folder is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Column: Filter and Summary */}
          <div className="space-y-6 lg:col-span-1">
            {/* Search filter card */}
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-slate-800 font-extrabold text-xs uppercase tracking-wider">
                <Filter className="h-4 w-4 text-brand-500" />
                <span>Search Dossier</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-450" />
                <input
                  type="text"
                  placeholder="Search doctor, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9 text-xs h-10"
                />
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="card-pastel-blue flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#0369a1] font-bold uppercase tracking-wider block opacity-90">Total Clinic Visits</span>
                  <span className="text-2xl font-black text-[#0369a1]">{totalVisits}</span>
                </div>
                <div className="p-2.5 bg-white/50 border border-white/80 rounded-xl">
                  <Activity className="h-5 w-5 text-[#0369a1]" />
                </div>
              </div>

              <div className="card-pastel-green flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#15803d] font-bold uppercase tracking-wider block opacity-90">Follow-Up Sessions</span>
                  <span className="text-2xl font-black text-[#15803d]">{followUpCount}</span>
                </div>
                <div className="p-2.5 bg-white/50 border border-white/80 rounded-xl">
                  <Calendar className="h-5 w-5 text-[#15803d]" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Chronological Timelines list */}
          <div className="lg:col-span-3 space-y-6 relative border-l border-slate-200 pl-6 ml-4">
            {filteredApts.length === 0 ? (
              <div className="bg-white border border-slate-200 p-8 rounded-3xl text-center text-slate-400">
                No history entries matched your search query.
              </div>
            ) : (
              filteredApts.map((apt, index) => {
                const chronoIndex = appointments.length - 1 - index;
                return (
                  <div key={apt.id} className="relative bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    {/* Node dot */}
                    <div className="absolute left-[-31px] top-[28px] h-3 w-3 rounded-full bg-brand-500 ring-4 ring-slate-50 border border-white"></div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-sm">
                          {apt.doctor?.name.charAt(4) || apt.doctor?.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{apt.doctor?.name}</h4>
                          <p className="text-[10px] text-slate-450 uppercase font-bold tracking-wide">
                            {apt.doctor?.specialization}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400 font-mono flex items-center mr-1">
                          <Clock className="h-3.5 w-3.5 mr-1 text-slate-350" /> {apt.date} • {apt.startTime}
                        </span>
                        {getVisitTypeBadge(chronoIndex)}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Diagnosis */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Clinical Diagnostics</span>
                        <p className="text-xs text-slate-700 leading-relaxed font-sans bg-slate-50 border border-slate-100 p-3.5 rounded-2xl">
                          {apt.consultation?.clinicalNotes || 'No notes logged.'}
                        </p>
                      </div>

                      {/* Medications list */}
                      {apt.prescription && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-2">Prescribed Medication Lines</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {apt.prescription.medications.map(med => (
                              <div key={med.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                                <div>
                                  <span className="font-bold text-slate-800 text-xs">{med.name}</span>
                                  <span className="text-[10px] text-slate-450 block mt-0.5">{med.dosage} • {med.frequency}</span>
                                </div>
                                <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">{med.duration}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI post-visit translated summary trigger */}
                      {apt.aiSummary && (
                        <div className="pt-2">
                          <button 
                            onClick={() => setSelectedApt(apt)}
                            className="px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-xl border border-brand-200 transition-colors flex items-center"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-brand-500 mr-1.5" /> View AI Patient Translation <ChevronRight className="h-3 w-3 ml-1" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Details modal */}
      {selectedApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">AI Patient Translation File</h3>
                <p className="text-xs text-slate-500">Doctor: {selectedApt.doctor?.name} • Date: {selectedApt.date}</p>
              </div>
              <button onClick={() => setSelectedApt(null)} className="text-slate-400 hover:text-slate-655 font-bold">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-700">
              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Translation Summary</h4>
                <p className="p-3 bg-brand-50/20 border border-brand-100/10 rounded-xl leading-relaxed">{selectedApt.aiSummary?.summaryText}</p>
              </div>
              
              {selectedApt.aiSummary?.medicationSchedule && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Intake Routine</h4>
                  <pre className="p-3 bg-slate-50 border border-slate-100 rounded-xl font-sans whitespace-pre-wrap leading-relaxed">{selectedApt.aiSummary.medicationSchedule}</pre>
                </div>
              )}

              {selectedApt.aiSummary?.followUpSteps && (
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Next Health Milestones</h4>
                  <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl leading-relaxed">{selectedApt.aiSummary.followUpSteps}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button onClick={() => setSelectedApt(null)} className="btn-primary px-6">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
