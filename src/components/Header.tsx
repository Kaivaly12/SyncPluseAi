import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserNotification } from '../types';
import { NetworkStatusIndicator } from './NetworkStatusIndicator';
import {
  Sun,
  Moon,
  Plus,
  Bell,
  LogOut,
  User as UserIcon,
  Download,
  Calendar,
  Camera,
  MapPin,
  Sparkles,
  BarChart3,
  Smartphone,
  Cpu,
  Activity,
  ChevronDown,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export type ActiveAppView =
  | 'executive_evm'
  | 'infra4_engines'
  | 'mobile_field'
  | 'map'
  | 'ingest'
  | 'report'
  | 'tasks';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  notifications: UserNotification[];
  isNotificationsOpen: boolean;
  onToggleNotifications: () => void;
  onOpenAuthModal: () => void;
  onOpenCreateTask: () => void;
  onOpenIngestModal: () => void;
  onExportCsv: () => void;
  onExportCalendar: () => void;
  isSyncing: boolean;
  activeView: ActiveAppView;
  onViewChange: (view: ActiveAppView) => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  notifications,
  isNotificationsOpen,
  onToggleNotifications,
  onOpenAuthModal,
  onOpenCreateTask,
  onOpenIngestModal,
  onExportCsv,
  onExportCalendar,
  isSyncing,
  activeView,
  onViewChange,
}) => {
  const { user, logout } = useAuth();
  const unreadAlertsCount = notifications.length;
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isMoreViewsOpen, setIsMoreViewsOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const moreViewsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (moreViewsRef.current && !moreViewsRef.current.contains(event.target as Node)) {
        setIsMoreViewsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSecondaryActive = ['ingest', 'report', 'tasks'].includes(activeView);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onViewChange('executive_evm')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-950 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                    SyncPulse
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    INFRA 4.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  OIL INDIA LIMITED
                </p>
              </div>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs ml-3">
              <button
                type="button"
                onClick={() => onViewChange('executive_evm')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeView === 'executive_evm'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Executive EVM</span>
              </button>

              <button
                type="button"
                onClick={() => onViewChange('infra4_engines')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeView === 'infra4_engines'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>INFRA 4.0 Engines</span>
              </button>

              <button
                type="button"
                onClick={() => onViewChange('mobile_field')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeView === 'mobile_field'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Field</span>
              </button>

              <button
                type="button"
                onClick={() => onViewChange('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  activeView === 'map'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Site CAD Map</span>
              </button>

              {/* Minimalist More Views Dropdown */}
              <div className="relative" ref={moreViewsRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreViewsOpen(!isMoreViewsOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                    isSecondaryActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>
                    {activeView === 'ingest'
                      ? 'Ingest Hub'
                      : activeView === 'report'
                      ? 'AI Report'
                      : activeView === 'tasks'
                      ? 'WBS Tasks'
                      : 'More'}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>

                {isMoreViewsOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <button
                      type="button"
                      onClick={() => {
                        onViewChange('ingest');
                        setIsMoreViewsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeView === 'ingest'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5 text-slate-500" />
                      <span>Multimodal Hub</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onViewChange('report');
                        setIsMoreViewsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeView === 'report'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                      <span>AI Daily Report</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onViewChange('tasks');
                        setIsMoreViewsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeView === 'tasks'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>WBS Work Tasks</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Actions: Minimalist & Clean */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Firestore / Local Cache Network Status Indicator */}
            <NetworkStatusIndicator />

            {/* Quick Ingest Button */}
            <button
              id="header-ingest-btn"
              type="button"
              onClick={onOpenIngestModal}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Capture Data</span>
            </button>

            {/* Quick Add Task Button */}
            <button
              id="header-create-task-btn"
              type="button"
              onClick={onOpenCreateTask}
              className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Task</span>
            </button>

            {/* Minimal Export Menu */}
            <div className="relative hidden md:block" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Export data reports"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      onExportCsv();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Export Tasks as CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onExportCalendar();
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Export Deadlines (.ics)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Deadline / Alerts Bell */}
            <div className="relative">
              <button
                id="header-notifications-btn"
                type="button"
                onClick={onToggleNotifications}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Upcoming Deadlines & Alerts"
              >
                <Bell className="w-4 h-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              id="header-dark-mode-toggle"
              type="button"
              onClick={onToggleDarkMode}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle Theme"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile / Authentication */}
            {user ? (
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-slate-800">
                <div
                  className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center text-xs"
                  title={user.email || 'Inspector'}
                >
                  {user.email ? user.email.slice(0, 1).toUpperCase() : 'PE'}
                </div>
                <button
                  onClick={() => logout()}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="header-auth-btn"
                type="button"
                onClick={onOpenAuthModal}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex lg:hidden items-center gap-1 border-t border-slate-200/80 dark:border-slate-800/80 py-2 text-xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onViewChange('executive_evm')}
            className={`px-3 py-1.5 text-center font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeView === 'executive_evm'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            EVM Dashboard
          </button>
          <button
            type="button"
            onClick={() => onViewChange('infra4_engines')}
            className={`px-3 py-1.5 text-center font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeView === 'infra4_engines'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            INFRA 4.0
          </button>
          <button
            type="button"
            onClick={() => onViewChange('mobile_field')}
            className={`px-3 py-1.5 text-center font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeView === 'mobile_field'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mobile App
          </button>
          <button
            type="button"
            onClick={() => onViewChange('map')}
            className={`px-3 py-1.5 text-center font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeView === 'map'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            CAD Map
          </button>
          <button
            type="button"
            onClick={() => onViewChange('ingest')}
            className={`px-3 py-1.5 text-center font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeView === 'ingest'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Ingest
          </button>
          <button
            type="button"
            onClick={() => onViewChange('report')}
            className={`px-3 py-1.5 text-center font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeView === 'report'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Daily Report
          </button>
          <button
            type="button"
            onClick={() => onViewChange('tasks')}
            className={`px-3 py-1.5 text-center font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeView === 'tasks'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            WBS Tasks
          </button>
        </div>
      </div>
    </header>
  );
};
