import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Appointment } from '../../types';
import { 
  ShieldAlert, 
  Users, 
  Calendar, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const apts = await api.appointments.list();
      setAppointments(apts);
      
      const docs = await api.doctors.list();
      setDoctorsCount(docs.length);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const totalBooked = appointments.filter(a => a.status === 'CONFIRMED').length;
  const totalCompleted = appointments.filter(a => a.status === 'COMPLETED').length;
  const totalCancelled = appointments.filter(a => a.status.startsWith('CANCEL')).length;

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'CONFIRMED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-150">Confirmed</span>;
      case 'HELD':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-150">Held</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-150">Completed</span>;
      case 'CANCELLED_BY_DOCTOR_LEAVE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-150">Cancelled (Leave)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-700 border border-slate-150">Cancelled</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white rounded-3xl p-8 overflow-hidden shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/5 -mr-10 -mt-10 blur-xl"></div>
        <div className="space-y-2 z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Control Center</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Monitor clinical staffing levels, slot availability calendars, and follow-up consultation audits globally.
          </p>
        </div>
        <button 
          onClick={loadDashboard}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur transition-all flex items-center z-10 self-start md:self-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Sync Audits
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center">
          <Clock className="h-8 w-8 text-brand-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Metrics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-pastel-blue flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-95">Clinical Staff</span>
                <p className="text-2xl font-black">{doctorsCount} Doctors</p>
                <span className="text-[10px] block opacity-80">Active practitioners</span>
              </div>
              <div className="p-3 bg-white/50 border border-white/80 rounded-xl">
                <Users className="h-6 w-6 text-[#0369a1]" />
              </div>
            </div>

            <div className="card-pastel-purple flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-95">Active Bookings</span>
                <p className="text-2xl font-black">{totalBooked} Visits</p>
                <span className="text-[10px] block opacity-80">Pending completion</span>
              </div>
              <div className="p-3 bg-white/50 border border-white/80 rounded-xl">
                <Calendar className="h-6 w-6 text-[#6b21a8]" />
              </div>
            </div>

            <div className="card-pastel-green flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-95">Completed Visits</span>
                <p className="text-2xl font-black">{totalCompleted} Done</p>
                <span className="text-[10px] block opacity-80">Consultations finished</span>
              </div>
              <div className="p-3 bg-white/50 border border-white/80 rounded-xl">
                <CheckCircle className="h-6 w-6 text-[#15803d]" />
              </div>
            </div>

            <div className="card-pastel-orange flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-95">Cancelled Registry</span>
                <p className="text-2xl font-black">{totalCancelled} Items</p>
                <span className="text-[10px] block opacity-80">Leaves & slot drops</span>
              </div>
              <div className="p-3 bg-white/50 border border-white/80 rounded-xl">
                <AlertCircle className="h-6 w-6 text-[#c2410c]" />
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Specialization split bar chart */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Appointments by Specialization</h3>
              <div className="h-60 w-full flex items-end justify-between px-4 pb-2 pt-6 relative border-b border-slate-100">
                {/* Visual grid lines */}
                <div className="absolute inset-x-0 bottom-0 h-full flex flex-col justify-between pointer-events-none opacity-50">
                  <div className="border-t border-slate-100 w-full h-px"></div>
                  <div className="border-t border-slate-100 w-full h-px"></div>
                  <div className="border-t border-slate-100 w-full h-px"></div>
                  <div className="border-t border-slate-100 w-full h-px"></div>
                </div>

                {/* Bars */}
                {(() => {
                  const specCounts: Record<string, number> = { Cardiology: 0, Pediatrics: 0, Dermatology: 0, Neurology: 0, 'General Medicine': 0 };
                  appointments.forEach(a => {
                    const spec = a.doctor?.specialization;
                    if (spec && specCounts[spec] !== undefined) specCounts[spec]++;
                  });
                  const maxCount = Math.max(...Object.values(specCounts), 1);

                  return Object.entries(specCounts).map(([spec, count]) => {
                    const heightPercent = (count / maxCount) * 80 + 5; // offset
                    return (
                      <div key={spec} className="flex flex-col items-center w-12 group z-10 relative">
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap shadow z-20">
                          {count} Bookings
                        </div>
                        {/* Bar graphic */}
                        <div 
                          style={{ height: `${heightPercent}px` }}
                          className="w-full bg-[#2563eb] hover:bg-brand-600 transition-all duration-300 rounded-t-lg shadow-inner group-hover:scale-y-[1.03] origin-bottom cursor-pointer min-h-[6px]"
                        ></div>
                        <span className="text-[10px] text-slate-500 font-semibold mt-2.5 truncate w-full text-center" title={spec}>{spec.split(' ')[0]}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Daily Trends Area Chart */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Weekly Appointment Trends</h3>
              <div className="h-60 w-full relative px-2 pt-6">
                {/* SVG Area Chart */}
                <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35"/>
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0"/>
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="400" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="90" x2="400" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="140" x2="400" y2="140" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="190" x2="400" y2="190" stroke="#e2e8f0" strokeWidth="1" />

                  {/* Trend Line & Fill path */}
                  {(() => {
                    const counts = [2, 4, 3, 7, 5, 8, 9]; // Mock last 7 days booking trend
                    const widthBetween = 400 / 6;
                    const maxVal = Math.max(...counts, 1);
                    
                    const points = counts.map((c, idx) => {
                      const x = idx * widthBetween;
                      const y = 190 - (c / maxVal) * 140; // max height 140
                      return { x, y };
                    });

                    const linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
                    const areaPath = `${linePath} L 400 190 L 0 190 Z`;

                    return (
                      <>
                        {/* Area */}
                        <path d={areaPath} fill="url(#trendGradient)" />
                        {/* Line */}
                        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
                        {/* Dots */}
                        {points.map((p, idx) => (
                          <g key={idx} className="group cursor-pointer">
                            <circle cx={p.x} cy={p.y} r="5" className="fill-brand-500 stroke-white stroke-2 hover:r-7 transition-all duration-150" />
                            {/* Hover info */}
                            <title>Day {idx + 1}: {counts[idx]} Bookings</title>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
                {/* X Axis Labels */}
                <div className="absolute inset-x-0 bottom-[-10px] flex justify-between px-2 text-[9px] text-slate-400 font-semibold font-mono">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Logs */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-semibold text-slate-950 flex items-center">
                <TrendingUp className="h-5 w-5 text-brand-500 mr-2" /> Recent Appointment Audits
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-semibold border-b border-slate-100">
                    <th className="p-4 pl-6 text-xs uppercase tracking-wider">Patient</th>
                    <th className="p-4 text-xs uppercase tracking-wider">Consultant</th>
                    <th className="p-4 text-xs uppercase tracking-wider">Date & Time</th>
                    <th className="p-4 text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400">No appointments booked in the system.</td>
                    </tr>
                  ) : (
                    appointments.slice().reverse().map((apt) => (
                      <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-semibold text-slate-800">{apt.patient?.name || 'Anonymous Patient'}</td>
                        <td className="p-4">{apt.doctor?.name} ({apt.doctor?.specialization})</td>
                        <td className="p-4">{apt.date} at {apt.startTime}</td>
                        <td className="p-4">{getStatusBadge(apt.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
