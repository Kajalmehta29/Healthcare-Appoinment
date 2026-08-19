import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { DoctorProfile, WorkingHour } from '../../types';
import { Users, Plus, X, Settings2, Search, Filter } from 'lucide-react';

const DAYS_OF_WEEK = [
  { val: 0, label: 'Sunday' },
  { val: 1, label: 'Monday' },
  { val: 2, label: 'Tuesday' },
  { val: 3, label: 'Wednesday' },
  { val: 4, label: 'Thursday' },
  { val: 5, label: 'Friday' },
  { val: 6, label: 'Saturday' },
];

export const AdminDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [specFilter, setSpecFilter] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Create Form State
  const [newDoc, setNewDoc] = useState({ name: '', email: '', specialization: 'Cardiology', slotDuration: 30 });
  
  // Edit Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSpec, setEditSpec] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const [editWorkingHours, setEditWorkingHours] = useState<WorkingHour[]>([]);

  // Shift Row Input
  const [shiftDay, setShiftDay] = useState(1);
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('17:00');

  const loadDoctors = async () => {
    try {
      const data = await api.doctors.list();
      setDoctors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.name || !newDoc.email) return;
    try {
      await api.doctors.create({
        name: newDoc.name,
        email: newDoc.email,
        specialization: newDoc.specialization,
        slotDuration: newDoc.slotDuration
      });
      alert('Doctor registered successfully! Credentials: ' + newDoc.email);
      setIsAddModalOpen(false);
      setNewDoc({ name: '', email: '', specialization: 'Cardiology', slotDuration: 30 });
      await loadDoctors();
    } catch (err: any) {
      alert(err.message || 'Failed to create doctor');
    }
  };

  const handleOpenEdit = (doc: DoctorProfile) => {
    setEditingId(doc.id);
    setEditName(doc.name);
    setEditEmail(doc.email);
    setEditSpec(doc.specialization);
    setEditDuration(doc.slotDuration);
    setEditWorkingHours([...doc.workingHours]);
    setIsEditModalOpen(true);
  };

  const handleAddShift = () => {
    if (editWorkingHours.some(wh => wh.dayOfWeek === shiftDay)) {
      alert('Shift for this day already exists. Remove the existing one first.');
      return;
    }
    setEditWorkingHours([...editWorkingHours, { dayOfWeek: shiftDay, startTime: shiftStart, endTime: shiftEnd }]);
  };

  const handleRemoveShift = (day: number) => {
    setEditWorkingHours(editWorkingHours.filter(wh => wh.dayOfWeek !== day));
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      await api.doctors.update(editingId, {
        name: editName,
        specialization: editSpec,
        slotDuration: editDuration,
        workingHours: editWorkingHours,
        email: editEmail
      });
      alert('Doctor profile updated successfully.');
      setIsEditModalOpen(false);
      await loadDoctors();
    } catch (err) {
      alert('Failed to update doctor profile');
    }
  };

  const filteredDocs = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = specFilter === '' || doc.specialization === specFilter;
    return matchesSearch && matchesSpec;
  });

  const uniqueSpecs = Array.from(new Set(doctors.map(d => d.specialization)));

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">Clinical Staff Directory</h2>
          <p className="text-xs text-slate-450 mt-1">Register clinic practitioners, manage slot durations, and configure working timetables.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4.5 w-4.5 mr-1.5" /> Register Specialist
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="w-full sm:max-w-md relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search practitioners by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 text-xs h-10"
          />
        </div>

        <select
          value={specFilter}
          onChange={(e) => setSpecFilter(e.target.value)}
          className="input-field sm:max-w-xs text-xs h-10"
        >
          <option value="">All Specializations</option>
          {uniqueSpecs.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Users className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center rounded-3xl shadow-sm">
          <p className="text-sm text-slate-400">No practitioners matched your filters.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-450 font-semibold border-b border-slate-100">
                  <th className="p-4 pl-6 text-xs uppercase tracking-wider">Practitioner</th>
                  <th className="p-4 text-xs uppercase tracking-wider">Specialization</th>
                  <th className="p-4 text-xs uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs uppercase tracking-wider">Email Address</th>
                  <th className="p-4 text-xs uppercase tracking-wider">Slot Size</th>
                  <th className="p-4 text-xs uppercase tracking-wider">Weekly Shifts</th>
                  <th className="p-4 text-xs uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-semibold text-slate-800">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-brand-500/10 text-brand-600 border border-brand-500/20 font-black text-xs flex items-center justify-center">
                          {doc.name.charAt(4) || doc.name.charAt(0)}
                        </div>
                        <span>{doc.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-slate-100 text-slate-650 px-2.5 py-0.5 rounded-full font-medium">
                        {doc.specialization}
                      </span>
                    </td>
                    <td className="p-4">
                      {(() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isOnLeave = doc.leaveDays?.includes(todayStr);
                        return isOnLeave ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 uppercase tracking-wide">
                            On Leave
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wide">
                            On Duty
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4 font-mono text-xs">{doc.email}</td>
                    <td className="p-4 text-xs">{doc.slotDuration} mins</td>
                    <td className="p-4 text-xs">
                      {doc.workingHours.length} days active
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleOpenEdit(doc)}
                        className="px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold border border-brand-200 text-xs rounded-xl transition-colors flex items-center"
                      >
                        <Settings2 className="h-3.5 w-3.5 mr-1" /> Configure
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Register New Clinical Practitioner</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="p-6 space-y-4">
              <div>
                <label className="label-text">Doctor Full Name</label>
                <input
                  type="text"
                  required
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                  placeholder="e.g. Dr. Sarah Jenkins"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-text">Official Email Address</label>
                <input
                  type="email"
                  required
                  value={newDoc.email}
                  onChange={(e) => setNewDoc({ ...newDoc, email: e.target.value })}
                  placeholder="e.g. sarah.jenkins@medsync.com"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Specialization</label>
                  <select
                    value={newDoc.specialization}
                    onChange={(e) => setNewDoc({ ...newDoc, specialization: e.target.value })}
                    className="input-field"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="General Medicine">General Medicine</option>
                  </select>
                </div>
                <div>
                  <label className="label-text">Slot Duration (Min)</label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    required
                    value={newDoc.slotDuration}
                    onChange={(e) => setNewDoc({ ...newDoc, slotDuration: parseInt(e.target.value) || 30 })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary px-6">Register</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-slate-900">Configure Doctor Shift parameters</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label-text">Specialization</label>
                  <input
                    type="text"
                    required
                    value={editSpec}
                    onChange={(e) => setEditSpec(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Official Email Address</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="input-field text-xs h-11"
                />
              </div>

              <div>
                <label className="label-text">Slot size duration (minutes)</label>
                <input
                  type="number"
                  min={10}
                  value={editDuration}
                  onChange={(e) => setEditDuration(parseInt(e.target.value) || 30)}
                  className="input-field"
                />
              </div>

              <div className="space-y-3 border-t border-slate-155 pt-5">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Weekly Shift Schedule</h4>
                
                <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden bg-slate-50">
                  {editWorkingHours.length === 0 ? (
                    <p className="p-4 text-xs text-slate-450 text-center">No active shifts scheduled.</p>
                  ) : (
                    editWorkingHours.map((wh) => (
                      <div key={wh.dayOfWeek} className="p-3.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-850">
                          {DAYS_OF_WEEK.find(d => d.val === wh.dayOfWeek)?.label}
                        </span>
                        <div className="flex items-center space-x-3">
                          <span className="font-mono bg-white px-2.5 py-1 border border-slate-200 rounded-xl text-slate-600">
                            {wh.startTime} - {wh.endTime}
                          </span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveShift(wh.dayOfWeek)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition-colors"
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
                    className="input-field font-semibold text-xs"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d.val} value={d.val}>{d.label}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="input-field font-mono text-xs"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="time"
                      value={shiftEnd}
                      onChange={(e) => setShiftEnd(e.target.value)}
                      className="input-field font-mono text-xs"
                    />
                    <button 
                      type="button"
                      onClick={handleAddShift}
                      className="btn-accent px-3 shrink-0 rounded-xl font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
              <button onClick={() => setIsEditModalOpen(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveEdit} className="btn-primary px-6">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
