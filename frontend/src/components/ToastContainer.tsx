import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Override window.alert to route messages to our custom Toast Notification UI
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      
      // Determine appropriate toast theme based on warning/success keywords in the alert message
      let type: 'info' | 'success' | 'error' = 'info';
      const lowercaseMsg = message.toLowerCase();
      if (
        lowercaseMsg.includes('success') || 
        lowercaseMsg.includes('confirmed') || 
        lowercaseMsg.includes('verified') || 
        lowercaseMsg.includes('updated') ||
        lowercaseMsg.includes('welcome')
      ) {
        type = 'success';
      } else if (
        lowercaseMsg.includes('fail') || 
        lowercaseMsg.includes('error') || 
        lowercaseMsg.includes('denied') || 
        lowercaseMsg.includes('expire') || 
        lowercaseMsg.includes('already exists') ||
        lowercaseMsg.includes('warning')
      ) {
        type = 'error';
      }

      setToasts((prev) => [...prev, { id, message, type }]);

      // Automatically auto-clear the popup after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start p-4 rounded-2xl border shadow-xl transition-all duration-300 animate-slide-in ${
              isSuccess
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-100'
                : isError
                ? 'bg-rose-50 border-rose-200 text-rose-955 dark:bg-rose-955/90 dark:border-rose-800 dark:text-rose-100'
                : 'bg-blue-50 border-blue-200 text-blue-955 dark:bg-blue-955/90 dark:border-blue-800 dark:text-blue-100'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isSuccess ? (
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : isError ? (
                <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              ) : (
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 flex-shrink-0 inline-flex text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
