import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Activity, ArrowRight, ShieldCheck, Stethoscope, User as UserIcon, Sun, Moon } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Theme support
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('medsync_theme') as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('medsync_theme', theme);
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const user = await login(email, password);
      if (user.role === 'PATIENT') navigate('/patient');
      else if (user.role === 'DOCTOR') navigate('/doctor');
      else if (user.role === 'ADMIN') navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (roleEmail: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await login(roleEmail);
      if (user.role === 'PATIENT') navigate('/patient');
      else if (user.role === 'DOCTOR') navigate('/doctor');
      else if (user.role === 'ADMIN') navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-50">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </div>

      {/* Background blobs for premium look */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-teal/10 rounded-full blur-[120px]"></div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-10 max-w-5xl w-full z-10 mx-auto px-4 py-8">
        {/* Left Column: Login Panel */}
        <div className="max-w-md w-full flex flex-col">
          {/* Brand logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-brand-500/10 rounded-2xl border border-brand-500/20 mb-4 animate-pulse">
              <Activity className="h-8 w-8 text-brand-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">MedSync Clinic</h2>
            <p className="mt-2 text-slate-400 text-sm">Professional Patient-Doctor Appointment Care Portal</p>
          </div>

          {/* Card panel */}
          <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-8 shadow-xl">
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-500/15 border border-rose-500/35 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
                  Enter Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@medsync.com or patient@medsync.com"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-2">
                  Enter Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full py-3 bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none group"
              >
                {isLoading ? 'Verifying...' : 'Continue to Dashboard'}
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>

            {/* Quick Logins */}
            <div className="mt-8 pt-6 border-t border-slate-700/60">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                Quick Sandbox Logins
              </p>
              <p className="text-[10px] text-slate-500 mb-4 text-center leading-relaxed">
                Click below to login instantly, or select from the demo directory
              </p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => handleQuickLogin('patient@medsync.com')}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center p-3 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-750 transition-colors text-slate-300 hover:text-white"
                >
                  <UserIcon className="h-5 w-5 mb-1.5 text-brand-500" />
                  <span className="text-[10px] font-bold font-mono">Patient</span>
                  <span className="text-[8px] text-slate-500 font-mono mt-1 overflow-hidden text-ellipsis whitespace-nowrap w-full">patient@medsync.com</span>
                </button>

                <button
                  onClick={() => handleQuickLogin('doctor@medsync.com')}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center p-3 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-750 transition-colors text-slate-300 hover:text-white"
                >
                  <Stethoscope className="h-5 w-5 mb-1.5 text-accent-teal" />
                  <span className="text-[10px] font-bold font-mono">Doctor</span>
                  <span className="text-[8px] text-slate-500 font-mono mt-1 overflow-hidden text-ellipsis whitespace-nowrap w-full">doctor@medsync.com</span>
                </button>

                <button
                  onClick={() => handleQuickLogin('admin@medsync.com')}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center p-3 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-750 transition-colors text-slate-300 hover:text-white"
                >
                  <ShieldCheck className="h-5 w-5 mb-1.5 text-accent-amber" />
                  <span className="text-[10px] font-bold font-mono">Admin</span>
                  <span className="text-[8px] text-slate-500 font-mono mt-1 overflow-hidden text-ellipsis whitespace-nowrap w-full">admin@medsync.com</span>
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              Need a patient account?{' '}
              <Link to="/register" className="text-brand-500 hover:text-brand-400 font-semibold hover:underline">
                Create an account
              </Link>
            </p>
            <div className="mt-4">
              <Link to="/privacy" className="text-xs text-slate-400 dark:text-slate-550 hover:underline">
                Privacy Policy & Terms
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Sandbox Seed Credentials Directory */}
        <div className="w-full lg:w-[380px] bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/80 p-6 shadow-xl text-slate-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2.5 mb-4 pb-3 border-b border-slate-700/50">
              <Activity className="h-5 w-5 text-brand-500 animate-pulse" />
              <h3 className="font-bold text-slate-100 uppercase tracking-wider text-xs">Sandbox Demo Directory</h3>
            </div>
            
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Use these pre-configured user profiles to test different platform roles. All profiles share the password:
              <span className="block mt-1.5 font-bold font-mono text-center text-xs bg-slate-900 px-2 py-1.5 rounded border border-slate-800 text-brand-450">password</span>
            </p>

            <div className="space-y-4">
              <div>
                <p className="font-bold text-slate-300 text-xs mb-2 flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-teal mr-2"></span>👨‍⚕️ Seeded Doctors
                </p>
                <div className="space-y-1.5">
                  {[
                    { email: 'doctor@medsync.com', name: 'Dr. Sarah Jenkins' },
                    { email: 'alex.rivera@medsync.com', name: 'Dr. Alex Rivera' },
                    { email: 'emily.chen@medsync.com', name: 'Dr. Emily Chen' },
                  ].map((d) => (
                    <div key={d.email} className="p-2.5 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-slate-750/70 transition-all flex items-center justify-between gap-2">
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-slate-200 font-bold leading-none mb-1">{d.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono overflow-hidden text-ellipsis whitespace-nowrap">{d.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setEmail(d.email);
                          setPassword('password');
                        }}
                        className="px-2 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 hover:text-brand-350 text-[9px] font-bold rounded-lg border border-brand-500/20 transition-colors flex-shrink-0"
                      >
                        Auto-fill
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-300 text-xs mb-2 flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500 mr-2"></span>👤 Seeded Patients
                </p>
                <div className="space-y-1.5">
                  {[
                    { email: 'patient@medsync.com', name: 'John Doe' },
                    { email: 'jane.smith@medsync.com', name: 'Jane Smith' },
                    { email: 'bob.johnson@medsync.com', name: 'Bob Johnson' },
                  ].map((p) => (
                    <div key={p.email} className="p-2.5 bg-slate-900/40 border border-slate-800 rounded-xl hover:border-slate-750/70 transition-all flex items-center justify-between gap-2">
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-slate-200 font-bold leading-none mb-1">{p.name}</p>
                        <p className="text-[9px] text-slate-500 font-mono overflow-hidden text-ellipsis whitespace-nowrap">{p.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setEmail(p.email);
                          setPassword('password');
                        }}
                        className="px-2 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 hover:text-brand-350 text-[9px] font-bold rounded-lg border border-brand-500/20 transition-colors flex-shrink-0"
                      >
                        Auto-fill
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/50 text-[9px] text-slate-500 text-center">
            MedSync Dev Sandbox • Seed timeline assets active
          </div>
        </div>
      </div>
    </div>
  );
};
