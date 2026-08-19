import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DoctorProfile, Appointment } from '../../types';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Clock, 
  Stethoscope, 
  ArrowRight, 
  ChevronRight, 
  AlertCircle, 
  Timer,
  ArrowLeft,
  CalendarDays,
  Filter,
  Check,
  Activity,
  Heart,
  Brain,
  Sparkles
} from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

export const BookAppointment: React.FC = () => {
  const { patientProfile } = useAuth();
  const navigate = useNavigate();

  // State
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  
  const [selectedDoc, setSelectedDoc] = useState<DoctorProfile | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  const [heldAppointment, setHeldAppointment] = useState<Appointment | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [holdTimer, setHoldTimer] = useState<number>(300); // 5 minutes in seconds

  const [step, setStep] = useState(1); // 1: Choose Doctor, 2: Choose Slot, 3: Symptoms & Confirm
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const timerRef = useRef<any>(null);

  // Fetch doctors on mount
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const data = await api.doctors.list();
        setDoctors(data);
        const specs = Array.from(new Set(data.map(d => d.specialization)));
        setSpecializations(specs);
      } catch (err) {
        console.error(err);
      }
    };
    loadDoctors();
  }, []);

  // Fetch slots when doctor or date changes
  useEffect(() => {
    const loadSlots = async () => {
      if (!selectedDoc || !bookingDate) return;
      setIsLoading(true);
      setError(null);
      try {
        const slots = await api.doctors.getAvailability(selectedDoc.id, bookingDate);
        setAvailableSlots(slots);
        setSelectedSlot(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load availability');
      } finally {
        setIsLoading(false);
      }
    };
    loadSlots();
  }, [selectedDoc, bookingDate]);

  // Hold Timer logic
  useEffect(() => {
    if (heldAppointment && step === 3) {
      setHoldTimer(300);
      timerRef.current = setInterval(() => {
        setHoldTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleHoldExpiration();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [heldAppointment, step]);

  const handleHoldExpiration = () => {
    alert('Your 5-minute appointment hold has expired. The slot has been released back to other patients.');
    setHeldAppointment(null);
    setSelectedSlot(null);
    setStep(2);
  };

  // Step 1 -> Step 2
  const selectDoctor = (doc: DoctorProfile) => {
    setSelectedDoc(doc);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split('T')[0]);
    setStep(2);
  };

  // Step 2 -> Request Hold -> Step 3
  const handleRequestHold = async () => {
    if (!selectedDoc || !bookingDate || !selectedSlot || !patientProfile) return;
    setIsLoading(true);
    setError(null);

    // Calculate end time
    const [h, m] = selectedSlot.split(':').map(Number);
    let totalMin = h * 60 + m + selectedDoc.slotDuration;
    const endH = Math.floor(totalMin / 60);
    const endM = totalMin % 60;
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    try {
      const apt = await api.appointments.hold(
        selectedDoc.id,
        bookingDate,
        selectedSlot,
        endTime,
        patientProfile.id
      );
      setHeldAppointment(apt);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'This slot is no longer available. Please select another slot.');
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm Appointment
  const handleConfirmBooking = async () => {
    if (!heldAppointment || !symptoms) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.appointments.confirm(heldAppointment.id, symptoms);
      if (timerRef.current) clearInterval(timerRef.current);
      alert('Success! Appointment confirmed. A booking email notification has been dispatched.');
      navigate('/patient');
    } catch (err: any) {
      setError(err.message || 'Failed to confirm appointment');
    } finally {
      setIsLoading(false);
    }
  };

  // Filters
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization = selectedSpecialization === '' || doc.specialization === selectedSpecialization;
    return matchesSearch && matchesSpecialization;
  });

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getMinDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Only allow tomorrow onwards
    return today.toISOString().split('T')[0];
  };

  // Helper to categorize slots in the weekly calendar grid
  const getSlotColumnAndHour = (slot: string) => {
    const hourPrefix = slot.split(':')[0] + ':00';
    return hourPrefix;
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Header and Step tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900">Schedule Consultation</h2>
          <p className="text-xs text-slate-450 mt-1">Book diagnostic appointments and consult specialized practitioners.</p>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span className={`px-3 py-1.5 rounded-xl border ${step === 1 ? 'bg-[#3b82f6] text-white shadow-sm shadow-brand-500/20 border-[#3b82f6]' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            1. Select Specialist
          </span>
          <ChevronRight className="h-4.5 w-4.5 text-slate-300" />
          <span className={`px-3 py-1.5 rounded-xl border ${step === 2 ? 'bg-[#3b82f6] text-white shadow-sm shadow-brand-500/20 border-[#3b82f6]' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            2. Choose Time
          </span>
          <ChevronRight className="h-4.5 w-4.5 text-slate-300" />
          <span className={`px-3 py-1.5 rounded-xl border ${step === 3 ? 'bg-[#3b82f6] text-white shadow-sm shadow-brand-500/20 border-[#3b82f6]' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            3. Symptom Intake
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-250 text-xs font-semibold text-rose-700 flex items-start">
          <AlertCircle className="h-5 w-5 text-rose-600 mr-2.5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* STEP 1: CHOOSE DOCTOR */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Column: Filters */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-5 lg:col-span-1">
            <div className="flex items-center space-x-2 text-slate-800 font-extrabold text-xs uppercase tracking-wider">
              <Filter className="h-4 w-4 text-brand-500" />
              <span>Search Filters</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-text">Keywords</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search doctor or clinic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-9 text-xs h-10"
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Clinic Department</label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="input-field text-xs h-10"
                >
                  <option value="">All Divisions</option>
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-400">
              Showing {filteredDoctors.length} available consultants
            </div>
          </div>

          {/* Right Column: Doctors Cards list */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDoctors.map((doc) => (
              <div 
                key={doc.id}
                className="bg-white border border-slate-200 hover:border-brand-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between h-64 group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-brand-500/10 flex items-center justify-center font-black text-brand-700 text-base">
                      {doc.name.charAt(4) || doc.name.charAt(0)}
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">
                      {doc.slotDuration} min consults
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-base">{doc.name}</h4>
                    <p className="text-[10px] text-slate-450 uppercase font-black tracking-wider">{doc.specialization}</p>
                  </div>

                  <div className="flex items-center text-xs text-slate-500 font-mono">
                    <Clock className="h-3.5 w-3.5 text-slate-400 mr-1.5" />
                    <span>Mon - Fri, 9:00 AM - 5:00 PM</span>
                  </div>
                </div>

                <button
                  onClick={() => selectDoctor(doc)}
                  className="w-full mt-4 py-3 bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center group-hover:shadow-md"
                >
                  Configure Slots & Book <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: CHOOSE SLOT (Weekly Scheduler Grid) */}
      {step === 2 && selectedDoc && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Column: Doctor Profile Overview */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6 lg:col-span-1">
            <button 
              onClick={() => setStep(1)}
              className="btn-secondary w-full text-xs font-bold py-2.5 flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Specialists
            </button>

            <div className="space-y-4 text-center">
              <div className="h-16 w-16 rounded-3xl bg-brand-500/15 text-brand-600 border border-brand-500/20 font-black text-2xl mx-auto flex items-center justify-center">
                {selectedDoc.name.charAt(4)}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{selectedDoc.name}</h3>
                <p className="text-xs text-slate-450 mt-1 uppercase font-bold tracking-wider">{selectedDoc.specialization}</p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Consult Slot Size</span>
                <span className="font-semibold text-slate-700">{selectedDoc.slotDuration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contact Email</span>
                <span className="font-mono text-slate-700">{selectedDoc.email}</span>
              </div>
            </div>

            {/* Datepicker inside left bar */}
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="label-text flex items-center">
                <CalendarDays className="h-4 w-4 mr-2 text-slate-400" /> Booking Date
              </label>
              <input
                type="date"
                min={getMinDate()}
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className="input-field font-semibold text-xs h-10"
              />
            </div>
          </div>

          {/* Right Column: Weekly Scheduler calendar events list */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden p-6 space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-905 text-base flex items-center">
                <CalendarIcon className="h-5 w-5 text-brand-500 mr-2" /> Weekly Timetable Calendar
              </h3>
              <p className="text-xs text-slate-450 mt-1">Select from the available time intervals matching doctor shifts.</p>
            </div>

            {isLoading ? (
              <div className="py-20 flex justify-center items-center flex-col space-y-3">
                <Clock className="h-8 w-8 text-brand-500 animate-spin" />
                <span className="text-xs text-slate-450 font-medium">Fetching doctor schedule...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="p-12 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                <p className="text-xs text-slate-450">Practitioner has no availability registered on this date range. Try pick another day.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Full-width interactive grid: Hour Blocks vs Available Slots */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50 text-xs">
                  {/* Grid header */}
                  <div className="grid grid-cols-4 bg-slate-100 p-3 text-slate-450 font-bold uppercase tracking-wider">
                    <span className="col-span-1 pl-2">Time block</span>
                    <span className="col-span-3">Available slots</span>
                  </div>

                  {HOURS.map((hour) => {
                    const hourPrefix = hour.split(':')[0];
                    const matchedSlots = availableSlots.filter(s => s.startsWith(hourPrefix));
                    
                    return (
                      <div key={hour} className="grid grid-cols-4 items-center p-3">
                        <span className="col-span-1 font-mono font-bold text-slate-700 pl-2">{hour}</span>
                        <div className="col-span-3 flex flex-wrap gap-2">
                          {matchedSlots.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">No slots scheduled</span>
                          ) : (
                            matchedSlots.map((slot) => {
                              const isSelected = selectedSlot === slot;
                              return (
                                <button
                                  key={slot}
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`px-3 py-1.5 border rounded-xl font-mono text-xs transition-all ${
                                    isSelected 
                                      ? 'bg-brand-500 text-white border-brand-500 font-bold shadow-md shadow-brand-500/20'
                                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {slot}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedSlot && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleRequestHold}
                  disabled={isLoading}
                  className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center"
                >
                  Hold Slot & Proceed <ArrowRight className="h-4 w-4 ml-1.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: SYMPTOMS & CONFIRMATION */}
      {step === 3 && heldAppointment && selectedDoc && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Summary and Countdown */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-6 lg:col-span-1">
            <div className="space-y-4">
              <h3 className="font-extrabold text-slate-905 text-base">Booking Summary</h3>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5 text-xs text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wide">Physician</span>
                  <span className="font-bold text-slate-800">{selectedDoc.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wide">Clinical Division</span>
                  <span className="font-semibold text-slate-700">{selectedDoc.specialization}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wide">Appointment Date</span>
                  <span className="font-semibold text-slate-700">{bookingDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wide">Time Slot Interval</span>
                  <span className="font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                    {selectedSlot} - {heldAppointment.endTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Countdown Hold timer */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-center text-xs">
              <div className="flex items-center justify-center space-x-1.5 text-amber-700 font-extrabold">
                <Timer className="h-4.5 w-4.5 animate-pulse" />
                <span>Appointment Hold Count</span>
              </div>
              <p className="text-[10px] text-amber-600 leading-relaxed">
                We are holding this slot for you for 5 minutes. Please complete intake details before expiry.
              </p>
              <div className="text-2xl font-black text-amber-800 font-mono pt-1">
                {formatTime(holdTimer)}
              </div>
            </div>
          </div>

          {/* Right Column: Symptoms details and AI screening */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center">
                <Sparkles className="h-5 w-5 text-brand-500 mr-2" /> Symptom Intake Form
              </h3>
              <p className="text-xs text-slate-500 mt-1">Briefly outline your clinical symptoms. MedSync AI will pre-screen and suggest review questions.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label-text">Stated Symptoms</label>
                <textarea
                  rows={4}
                  required
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="e.g. Mild shortness of breath and tightness in chest when climbing stairs or walking fast since 3 days."
                  className="input-field resize-none h-28 text-xs placeholder:text-slate-400"
                />
              </div>

              {/* AI Real-time processing warning mockup */}
              <div className="p-4 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] flex items-start text-xs leading-relaxed text-[#1d4ed8]">
                <Brain className="h-5 w-5 text-[#2563eb] mr-2.5 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-extrabold block mb-0.5">MedSync AI Urgency Screen enabled</span>
                  Your symptoms description will undergo diagnostic triage to assist the specialist with recommended consultation questions.
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button 
                  onClick={() => {
                    if(timerRef.current) clearInterval(timerRef.current);
                    setStep(2);
                  }}
                  className="btn-secondary text-xs font-bold py-2.5 px-4"
                >
                  Change Slot
                </button>
                
                <button
                  onClick={handleConfirmBooking}
                  disabled={isLoading || !symptoms}
                  className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  {isLoading ? 'Confirming appointment...' : 'Confirm and Log Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
