import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Appointment, PatientProfile } from '../../types';
import { 
  Users, 
  Search, 
  Calendar, 
  FileText, 
  ChevronRight, 
  User as UserIcon, 
  Clock, 
  ChevronLeft,
  Activity,
  ClipboardCheck,
  ClipboardList,
  Edit3,
  Plus
} from 'lucide-react';

interface PatientRecord {
  patient: PatientProfile;
  appointments: Appointment[];
}

export const DoctorHistory: React.FC = () => {
  const { doctorProfile } = useAuth();
  
  const [patientRecords, setPatientRecords] = useState<PatientRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<PatientRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit modal states
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [meds, setMeds] = useState<{ name: string; dosage: string; frequency: string; duration: string }[]>([]);
  const [followUp, setFollowUp] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Medication row inputs
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [medDur, setMedDur] = useState('');

  const fetchRecords = async () => {
    if (!doctorProfile) return;
    try {
      const data = await api.appointments.list({ doctorId: doctorProfile.id });
      const completed = data.filter(a => a.status === 'COMPLETED');
      
      const groups: Record<string, Appointment[]> = {};
      completed.forEach(apt => {
        if (!apt.patientId) return;
        if (!groups[apt.patientId]) {
          groups[apt.patientId] = [];
        }
        groups[apt.patientId].push(apt);
      });

      const records: PatientRecord[] = [];
      Object.entries(groups).forEach(([patId, apts]) => {
        const sortedApts = apts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const patient = sortedApts[0].patient;
        if (patient) {
          records.push({
            patient,
            appointments: sortedApts
          });
        }
      });

      setPatientRecords(records);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [doctorProfile]);

  const filteredRecords = patientRecords.filter(rec => 
    rec.patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rec.patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getVisitTypeBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-100 uppercase tracking-wide">
          Initial Consultation
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
        Follow-up Session #{index}
      </span>
    );
  };

  const handleOpenEdit = (apt: Appointment) => {
    setEditingApt(apt);
    setClinicalNotes(apt.consultation?.clinicalNotes || '');
    setMeds((apt.prescription?.medications || []).map(m => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
    })));
    setFollowUp(apt.prescription?.followUpInstructions || '');
    // Reset med inputs
    setMedName('');
    setMedDosage('');
    setMedFreq('');
    setMedDur('');
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

  const handleSaveEdit = async () => {
    if (!editingApt || !clinicalNotes) return;
    setIsSavingEdit(true);
    try {
      let finalMeds = [...meds];
      if (medName && medDosage && medFreq && medDur) {
        finalMeds.push({ name: medName, dosage: medDosage, frequency: medFreq, duration: medDur });
      }

      await api.appointments.submitConsultation(editingApt.id, {
        notes: clinicalNotes,
        medications: finalMeds,
        followUp
      });
      setEditingApt(null);
      await fetchRecords();
      
      // If we are currently viewing a folder, update the selectedRecord too!
      if (selectedRecord) {
        const updatedData = await api.appointments.list({ doctorId: doctorProfile!.id });
        const completed = updatedData.filter(a => a.status === 'COMPLETED');
        const patientApts = completed
          .filter(a => a.patientId === selectedRecord.patient.id)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setSelectedRecord({
          patient: selectedRecord.patient,
          appointments: patientApts
        });
      }
    } catch (err) {
      alert('Failed to save changes to consultation log.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (selectedRecord) {
    const totalConsultations = selectedRecord.appointments.length;
    const followUps = totalConsultations > 1 ? totalConsultations - 1 : 0;

    return (
      <div className="space-y-6">
        {/* Back navigation header */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setSelectedRecord(null)}
            className="btn-secondary text-xs flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Directory
          </button>
          
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
            <span>Patient Folders</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-800">{selectedRecord.patient.name}</span>
          </div>
        </div>

        {/* Patient card details */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 border border-brand-500/20 font-extrabold text-lg">
              {selectedRecord.patient.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-none">{selectedRecord.patient.name}</h3>
              <p className="text-xs text-slate-455 font-mono mt-1">{selectedRecord.patient.email}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="text-center px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl min-w-24">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Visits</span>
              <span className="text-lg font-black text-slate-800">{totalConsultations}</span>
            </div>
            <div className="text-center px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl min-w-24">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wide">Follow-ups</span>
              <span className="text-lg font-black text-slate-800">{followUps}</span>
            </div>
          </div>
        </div>

        {/* Timeline lists */}
        <div className="space-y-6 relative border-l border-slate-200 pl-6 ml-4">
          {selectedRecord.appointments.slice().reverse().map((apt, index) => {
            const chronoIndex = totalConsultations - 1 - index;
            return (
              <div key={apt.id} className="relative bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <div className="absolute left-[-31px] top-[24px] h-3 w-3 rounded-full bg-brand-500 ring-4 ring-slate-50 border border-white"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 mb-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">Consultation Date: {apt.date}</h4>
                    <p className="text-xs text-slate-450 flex items-center"><Clock className="h-3.5 w-3.5 mr-1" /> Slot: {apt.startTime} - {apt.endTime}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getVisitTypeBadge(chronoIndex)}
                    <button
                      onClick={() => handleOpenEdit(apt)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] rounded-xl flex items-center shadow-sm transition-colors"
                      title="Edit consultation notes and prescription"
                    >
                      <Edit3 className="h-3 w-3 mr-1 text-brand-400" /> Edit Log
                    </button>
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  {apt.symptoms && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Stated Symptoms</span>
                      <p className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-655 italic">
                        "{apt.symptoms.symptoms}"
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Clinical Diagnostics Notes</span>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 leading-relaxed font-sans">
                      {apt.consultation?.clinicalNotes || 'No notes submitted.'}
                    </div>
                  </div>

                  {apt.prescription && apt.prescription.medications.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Prescribed Medication Lines</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {apt.prescription.medications.map(med => (
                          <div key={med.id} className="p-3 bg-white border border-slate-250 rounded-2xl flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-800">{med.name}</span>
                              <span className="text-[10px] text-slate-450 block mt-0.5">{med.dosage} • {med.frequency}</span>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{med.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {apt.prescription?.followUpInstructions && (
                    <div className="pt-2 border-t border-slate-100 flex items-start text-xs text-slate-500">
                      <ClipboardList className="h-4.5 w-4.5 mr-2 text-brand-500 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-750 block mb-0.5">Follow-up Directives:</span>
                        {apt.prescription.followUpInstructions}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Consultation Modal */}
        {editingApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 flex-shrink-0">
                <div>
                  <h3 className="font-bold text-slate-950">Edit Consultation Log & Prescription</h3>
                  <p className="text-xs text-slate-500">Patient: {editingApt.patient?.name} • Date: {editingApt.date}</p>
                </div>
                <button 
                  onClick={() => setEditingApt(null)}
                  className="p-1.5 rounded-lg text-slate-450 hover:bg-slate-100 hover:text-slate-600 transition-all font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-6 overflow-y-auto text-sm leading-relaxed flex-1">
                <div>
                  <label className="label-text block font-bold text-slate-700 mb-1">Clinical Consultation Notes</label>
                  <textarea
                    required
                    rows={4}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Enter clinical notes, diagnosis, and medical advice..."
                    className="input-field text-xs font-sans h-32 w-full p-3 border border-slate-200 rounded-xl"
                  />
                </div>

                {/* Prescription Manager */}
                <div className="space-y-3">
                  <span className="label-text block font-bold text-slate-700">Draft Prescription Medications</span>
                  
                  {/* Medications List */}
                  <div className="border border-slate-200 rounded-2xl bg-white divide-y divide-slate-100 overflow-hidden text-xs">
                    {meds.length === 0 ? (
                      <p className="p-4 text-slate-400 text-center italic">No prescription lines added yet.</p>
                    ) : (
                      meds.map((m, idx) => (
                        <div key={idx} className="p-3 flex justify-between items-center bg-slate-50/30">
                          <div>
                            <p className="font-bold text-slate-800">{m.name} <span className="font-normal text-slate-550">({m.dosage})</span></p>
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
                      className="input-field px-2.5 py-1.5 border border-slate-200 rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 500mg)"
                      value={medDosage}
                      onChange={(e) => setMedDosage(e.target.value)}
                      className="input-field px-2.5 py-1.5 border border-slate-200 rounded-xl"
                    />
                    <input
                      type="text"
                      placeholder="Freq (e.g. Twice Daily)"
                      value={medFreq}
                      onChange={(e) => setMedFreq(e.target.value)}
                      className="input-field px-2.5 py-1.5 border border-slate-200 rounded-xl"
                    />
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Duration (e.g. 5 Days)"
                        value={medDur}
                        onChange={(e) => setMedDur(e.target.value)}
                        className="input-field px-2.5 py-1.5 border border-slate-200 rounded-xl flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        className="btn-accent px-3 shrink-0 rounded-xl bg-slate-900 text-white font-bold text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Follow up instructions */}
                <div>
                  <label className="label-text block font-bold text-slate-700 mb-1">Follow-up Directives & Remarks</label>
                  <input
                    type="text"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    placeholder="e.g., Return in 2 weeks for checkup"
                    className="input-field text-xs w-full p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => setEditingApt(null)}
                  className="btn-secondary px-5 py-2 text-xs font-semibold border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit || !clinicalNotes}
                  className="btn-primary px-8 py-2 text-xs font-semibold bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving Changes...' : 'Save Consultation Details'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Clinic Patient Registry</h2>
        <p className="text-xs text-slate-450 mt-1">Access consolidated patient consultation folders, diagnostics logs, and prescription timelines.</p>
      </div>
      <div className="flex gap-4 justify-between items-center">
        <div className="w-full max-w-md relative">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search medical folders by patient name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 h-11"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Users className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm max-w-lg mx-auto">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-800 text-base">No Folders Registered</h3>
          <p className="text-xs text-slate-555 mt-1">No completed patient histories found matching that query.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center">
              <ClipboardCheck className="h-5 w-5 text-brand-500 mr-2" /> Clinic Patient Registry
            </h3>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredRecords.map((rec) => (
              <div key={rec.patient.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <p className="font-extrabold text-slate-905 flex items-center">
                    <UserIcon className="h-4.5 w-4.5 text-slate-400 mr-2" /> {rec.patient.name}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">Email: {rec.patient.email} • Completed sessions logged: {rec.appointments.length}</p>
                </div>
                
                <button
                  onClick={() => setSelectedRecord(rec)}
                  className="px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-bold rounded-xl transition-colors flex items-center self-start sm:self-auto"
                >
                  View Folder <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
