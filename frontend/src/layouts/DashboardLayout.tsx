import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, 
  Users, 
  Clock, 
  LogOut, 
  Bell, 
  User as UserIcon, 
  FileText, 
  Shield, 
  PlusCircle, 
  Settings,
  Activity,
  Menu,
  X,
  CalendarDays,
  Sun,
  Moon,
  Clipboard as ClipboardIcon
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
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

  // Real-time notifications state filtered by user email
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifs = () => {
    if (!user) return;
    const all = JSON.parse(localStorage.getItem('medsync_notifications') || '[]');
    const userNotifs = all.filter((n: any) => n.recipientEmail === user.email);
    setNotifications(userNotifs);
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    await api.notifications.markAsRead(id);
    fetchNotifs();
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await api.notifications.markAllAsRead(user.email);
    fetchNotifs();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <Activity className="h-10 w-10 text-brand-500 animate-spin" />
          <p className="text-slate-500 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <Shield className="h-12 w-12 text-accent-rose mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-500 mb-6">Your account role does not have authorization to view this panel.</p>
          <button onClick={() => navigate('/')} className="btn-primary w-full">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Sidebar mapping based on Roles
  let sidebarItems: SidebarItem[] = [];

  if (user.role === 'PATIENT') {
    sidebarItems = [
      { name: 'My Dashboard', path: '/patient', icon: <Activity className="h-5 w-5" /> },
      { name: 'My Calendar', path: '/patient/calendar', icon: <CalendarDays className="h-5 w-5" /> },
      { name: 'All Appointments', path: '/patient/appointments', icon: <Calendar className="h-5 w-5" /> },
      { name: 'Book Appointment', path: '/patient/book', icon: <PlusCircle className="h-5 w-5" /> },
      { name: 'Medical History', path: '/patient/history', icon: <FileText className="h-5 w-5" /> },
      { name: 'Profile Settings', path: '/patient/settings', icon: <Settings className="h-5 w-5" /> },
    ];
  } else if (user.role === 'DOCTOR') {
    sidebarItems = [
      { name: 'Doctor Dashboard', path: '/doctor', icon: <Activity className="h-5 w-5" /> },
      { name: 'All Medical Queues', path: '/doctor/queues', icon: <ClipboardIcon className="h-5 w-5" /> },
      { name: 'Patient History', path: '/doctor/history', icon: <FileText className="h-5 w-5" /> },
      { name: 'Control Panel Settings', path: '/doctor/settings', icon: <Settings className="h-5 w-5" /> },
    ];
  } else if (user.role === 'ADMIN') {
    sidebarItems = [
      { name: 'Admin Dashboard', path: '/admin', icon: <Shield className="h-5 w-5" /> },
      { name: 'Manage Doctors', path: '/admin/doctors', icon: <Users className="h-5 w-5" /> },
      { name: 'Doctor Leaves', path: '/admin/leaves', icon: <Clock className="h-5 w-5" /> },
      { name: 'Profile Settings', path: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
    ];
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/patient': return 'Patient Portal';
      case '/patient/book': return 'Schedule an Appointment';
      case '/patient/history': return 'My Medical History';
      case '/patient/settings': return 'My Profile Settings';
      case '/doctor': return 'Doctor Queue Dashboard';
      case '/doctor/queues': return 'All Medical Queues';
      case '/doctor/settings': return 'Clinical Parameters & Profile';
      case '/doctor/history': return 'Patient Medical Logs';
      case '/admin': return 'System Administration';
      case '/admin/doctors': return 'Manage Clinical Staff';
      case '/admin/leaves': return 'Staff Leave Scheduler';
      case '/admin/settings': return 'System Admin Settings';
      default: return 'MedSync Portal';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-20 bg-slate-900/95 backdrop-blur-md text-white flex-shrink-0 border-r border-white/10 transition-all duration-300 overflow-x-hidden">
        <div className="h-16 flex items-center justify-center bg-slate-955/80 border-b border-white/5">
          <Link to="/" className="hover:scale-110 transition-transform duration-200" title="MedSync Home">
            <Activity className="h-6 w-6 text-brand-500 animate-pulse" />
          </Link>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-3 overflow-y-auto overflow-x-hidden flex flex-col items-center">
          {sidebarItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative group flex items-center justify-center p-3.5 rounded-xl transition-all duration-200 ${
                  active 
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                {/* Custom Tooltip */}
                <div className="absolute left-full ml-3 px-2 py-1.5 bg-slate-950/95 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50 shadow-md border border-white/10">
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout footer */}
        <div className="p-3 border-t border-white/5 bg-slate-955/40 flex flex-col items-center space-y-4 py-6">
          <div className="relative group flex items-center justify-center">
            <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 font-semibold border border-brand-500/20 shadow-inner">
              {user.name.charAt(0)}
            </div>
            {/* Tooltip for profile */}
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950/95 text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50 shadow-md border border-white/10">
              <span className="block font-semibold">{user.name}</span>
              <span className="text-[9px] text-slate-400 font-normal uppercase">{user.role}</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="relative group p-3 rounded-xl text-slate-400 hover:bg-rose-500/15 hover:text-rose-450 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            {/* Tooltip for logout */}
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-rose-950/95 text-rose-300 text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap z-50 shadow-md border border-rose-500/20">
              Logout
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 flex-shrink-0 z-10 shadow-sm shadow-slate-100">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg md:hidden text-slate-600 hover:bg-slate-50"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">{getPageTitle()}</h1>
            
            {/* Search Bar mockup */}
            <div className="relative w-64 max-w-xs hidden lg:block ml-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search anything..."
                disabled
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 text-slate-500 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors focus:outline-none"
              title="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>

            {/* Notification Drawer Trigger */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 text-slate-500 hover:text-slate-600 hover:bg-slate-50 rounded-full relative transition-colors focus:outline-none"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-accent-rose text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Card */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Clinical Alerts</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-[10px] text-brand-500 hover:underline font-bold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-slate-400">No recent alerts.</p>
                    ) : (
                      notifications.slice().reverse().map((n: any) => (
                        <div 
                          key={n.id} 
                          onClick={() => !n.read && handleMarkAsRead(n.id)}
                          className={`px-4 py-3 text-xs cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                            n.read ? 'hover:bg-slate-50 text-slate-500' : 'bg-brand-50/30 hover:bg-brand-50/50 text-slate-800 font-medium'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <p className="leading-relaxed">{n.message}</p>
                            <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0 mt-1"></span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-slate-200"></div>

            <div className="flex items-center space-x-3 text-left">
              <div className="hidden md:block">
                <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-450 font-medium mt-1 font-mono">{user.email}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-600 text-xs shadow-sm">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic View Panel */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="relative flex flex-col w-64 bg-slate-950 text-white h-full shadow-xl">
            <div className="h-16 flex items-center justify-between px-6 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center">
                <Activity className="h-6 w-6 text-brand-500 mr-3" />
                <span className="text-lg font-bold tracking-tight">MedSync</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {sidebarItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-150 ${
                      active 
                        ? 'bg-brand-500 text-white' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <div className="truncate">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 uppercase">{user.role}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-800"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
