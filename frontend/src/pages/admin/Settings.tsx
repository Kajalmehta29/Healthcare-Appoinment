import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { CheckCircle, User as UserIcon, Lock, Phone, Mail, Settings2, Shield } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    setSuccessMsg(null);
    try {
      await api.auth.updateProfile(user.id, {
        name,
        email,
        phone,
        ...(password ? { password } : {})
      });
      await refreshProfile();
      setSuccessMsg('Your administrative profile settings have been updated successfully.');
      setPassword('');
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm">
        <h2 className="text-xl font-black text-slate-900">Administrator Configurations</h2>
        <p className="text-xs text-slate-450 mt-1">Configure global clinic administrator privileges, email handles, and passwords.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-250 text-sm text-emerald-700 flex items-start">
          <CheckCircle className="h-5 w-5 text-emerald-600 mr-3 flex-shrink-0 mt-0.5" />
          <p>{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Avatar Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-center space-y-4 lg:col-span-1">
          <div className="h-20 w-20 rounded-full bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 font-black text-3xl mx-auto flex items-center justify-center">
            {name.charAt(0)}
          </div>
          
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-lg leading-none">{name}</h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mt-1.5">
              SYSTEM ADMIN ACCESS
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Permissions Level:</span>
              <span className="font-bold text-indigo-600 flex items-center">
                <Shield className="h-4 w-4 mr-0.5" /> Root Owner
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Security Index:</span>
              <span className="font-semibold text-emerald-500">Maximum</span>
            </div>
          </div>
        </div>

        {/* Right Side: Account Editor Form */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm lg:col-span-2 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-xl">
              <Settings2 className="h-6 w-6 text-brand-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Edit Account Details</h3>
              <p className="text-xs text-slate-450 mt-1">Keep administrative contact handles updated for secure system backups.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label-text">Admin Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-10 text-sm h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10 text-sm h-11"
                  />
                </div>
              </div>
              <div>
                <label className="label-text">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555-019-2834"
                    className="input-field pl-10 text-sm h-11"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="label-text">Change Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty to keep current password"
                  className="input-field pl-10 text-sm h-11"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 mt-4 text-xs font-bold"
            >
              {isLoading ? 'Updating details...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
