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
  ClipboardList
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
              <p className="text-xs text-slate-450 font-mono mt-1">{selectedRecord.patient.email}</p>
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
                  <div>
                    {getVisitTypeBadge(chronoIndex)}
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
          <p className="text-xs text-slate-550 mt-1">No completed patient histories found matching that query.</p>
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
