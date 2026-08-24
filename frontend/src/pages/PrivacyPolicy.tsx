import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Calendar, Brain, Eye, Share2, Lock } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-250 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation / Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Go Back</span>
          </button>

          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
              Medsync
            </span>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-brand-500/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
          <div className="relative space-y-4">
            <span className="text-[10px] bg-brand-50 dark:bg-brand-550/10 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/20 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              Legal Agreement
            </span>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              Last updated: August 24, 2026. This Privacy Policy describes our policies and procedures on the collection, use, and disclosure of your information when you use our Healthcare Appointment application.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          
          {/* Section 1: Google Calendar OAuth Scopes */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 text-brand-600 dark:text-brand-400">
              <div className="p-2 bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 rounded-xl">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Google Calendar Integration & API Data
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
              Medsync allows patients and doctors to sync scheduled appointments directly with their Google Calendars using Google OAuth 2.0 credentials. 
            </p>
            <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-750 text-xs space-y-3">
              <p className="font-bold text-slate-700 dark:text-slate-300">
                How we access, use, and store Google user data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Scope Used:</strong> We request the <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono text-[10px]">https://www.googleapis.com/auth/calendar</code> scope to create, modify, or delete calendar events for appointments you explicitly book, reschedule, or cancel on our platform.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Storage:</strong> Google OAuth tokens (access tokens and refresh tokens) are securely encrypted and stored in our database. We do not store any other Google account details.
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Usage:</strong> Calendar operations occur solely in response to user actions (e.g. confirming a booking, reschedule requests, or marking doctor leave days).
                </li>
                <li>
                  <strong className="text-slate-800 dark:text-slate-200">Sharing:</strong> We do not share Google user data or calendar entries with any third-party services.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: AI Pre-Visit Consultation Summary */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                AI Diagnostics & Gemini API Processing
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
              Medsync utilizes the Google Gemini API to analyze patient symptoms, evaluate urgency, and summarize clinical consultations for user-friendly post-visit summaries.
            </p>
            <div className="bg-indigo-50/30 dark:bg-indigo-950/10 p-5 rounded-2xl border border-indigo-100/50 dark:border-indigo-950/20 text-xs space-y-2">
              <p className="font-bold text-indigo-900 dark:text-indigo-300">Data Processing Framework:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-400">
                <li>Patient symptoms and doctor's clinical notes are sent to the Google Gemini API for structural analysis.</li>
                <li>No personally identifiable information (PII) like names, birthdates, or contact numbers are passed to the Gemini API during analysis.</li>
                <li>Data submitted to the API is governed by the Google API Terms of Service to ensure compliance with enterprise-grade data privacy and secure endpoints.</li>
              </ul>
            </div>
          </div>

          {/* Section 3: Information Collection */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 text-slate-900 dark:text-white">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold">Data We Collect</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
              To provide a seamless healthcare scheduling experience, we collect the following personal parameters:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-750">
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">For Patients:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-550 dark:text-slate-400">
                  <li>Full Name and Email Address</li>
                  <li>Phone Number (for medication reminders)</li>
                  <li>Symptom logs and AI summaries</li>
                </ul>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-750">
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">For Doctors:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-550 dark:text-slate-400">
                  <li>Clinical Specialization and Name</li>
                  <li>Weekly shift schedules and slot durations</li>
                  <li>Leave logs and calendar events</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 4: Data Security */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Data Security & Storage</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
              We secure your database records using industry-standard measures:
            </p>
            <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-450 space-y-2">
              <li>Passcodes and passwords are hashed using bcrypt before database storage.</li>
              <li>Network requests are handled securely using JWT (JSON Web Token) authentication.</li>
              <li>Database hosting is provided by Neon Serverless Postgres with complete SSL transport protection.</li>
            </ul>
          </div>

          {/* Section 5: Data Sharing & User Control */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl">
                <Share2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Your Choices & Control</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed">
              You maintain full authority over your data. You can disconnect your Google Calendar at any time from your Account Settings. Unlinking calendar integrations immediately destroys associated access tokens from our database and stops calendar updates.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-450">
              If you have any questions or queries regarding this privacy notice, you can contact us at support@medsync.com.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
