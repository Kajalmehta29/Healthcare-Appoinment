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
      setError(err.message || 'Login failed. Please verify credentials.');
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
      setError(err.message || 'Quick login failed.');
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
 
      <div className="max-w-md w-full z-10">
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">
              Quick Sandbox Logins
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleQuickLogin('patient@medsync.com')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-3 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-750 transition-colors text-slate-300 hover:text-white"
              >
                <UserIcon className="h-5 w-5 mb-1.5 text-brand-500" />
                <span className="text-[10px] font-medium font-mono">Patient</span>
              </button>

              <button
                onClick={() => handleQuickLogin('doctor@medsync.com')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-3 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-750 transition-colors text-slate-300 hover:text-white"
              >
                <Stethoscope className="h-5 w-5 mb-1.5 text-accent-teal" />
                <span className="text-[10px] font-medium font-mono">Doctor</span>
              </button>

              <button
                onClick={() => handleQuickLogin('admin@medsync.com')}
                disabled={isLoading}
                className="flex flex-col items-center justify-center p-3 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-750 transition-colors text-slate-300 hover:text-white"
              >
                <ShieldCheck className="h-5 w-5 mb-1.5 text-accent-amber" />
                <span className="text-[10px] font-medium font-mono">Admin</span>
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
        </div>
      </div>
    </div>
  );
};
