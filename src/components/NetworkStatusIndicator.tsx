import React, { useState, useRef, useEffect } from 'react';
import { useNetwork } from '../context/NetworkContext';
import {
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Cloud,
  ChevronDown,
  Info,
} from 'lucide-react';

export const NetworkStatusIndicator: React.FC = () => {
  const {
    isOnline,
    status,
    isBrowserOnline,
    isFirestoreConnected,
    isUsingCache,
    hasPendingWrites,
    pendingWritesCount,
    lastSyncTime,
    isSimulatedOffline,
    toggleOfflineMode,
    reconnect,
  } = useNetwork();

  const [isOpen, setIsOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await toggleOfflineMode();
    } finally {
      setIsToggling(false);
    }
  };

  const handleReconnect = async () => {
    setIsToggling(true);
    try {
      await reconnect();
    } finally {
      setIsToggling(false);
    }
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Not yet synced';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="network-status-indicator-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Network status: ${isOnline ? 'Online, connected to Firestore' : 'Offline, using local cache'}`}
        className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
          isOnline
            ? 'bg-emerald-50/90 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border-emerald-200/90 dark:border-emerald-800/70 text-emerald-800 dark:text-emerald-300 shadow-2xs'
            : 'bg-amber-50/95 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/70 border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 shadow-2xs'
        }`}
      >
        {/* Status Light Dot */}
        {isOnline ? (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        ) : (
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse" />
          </span>
        )}

        {/* Icon */}
        {isOnline ? (
          <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        )}

        {/* Text Label */}
        <span className="font-semibold tracking-tight">
          {isOnline ? (
            'Online'
          ) : (
            <span>
              Offline <span className="hidden sm:inline font-normal opacity-90">(Cache)</span>
            </span>
          )}
        </span>

        {/* Pending Writes Pill */}
        {hasPendingWrites && (
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 animate-pulse">
            {pendingWritesCount > 0 ? `${pendingWritesCount} queued` : 'Queued'}
          </span>
        )}

        <ChevronDown
          className={`w-3 h-3 transition-transform opacity-60 group-hover:opacity-100 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div
          id="network-status-popover"
          className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {isOnline ? 'Firestore Online' : 'Local Cache Active'}
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                SyncPulse Offline-First Synchronization Engine
              </p>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                isOnline
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
              }`}
            >
              {isOnline ? 'Live Socket' : 'Offline Cache'}
            </span>
          </div>

          {/* Status Metrics */}
          <div className="space-y-2.5 py-3 border-b border-slate-100 dark:border-slate-800 text-xs">
            {/* Primary Connection */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-slate-400" />
                Connection
              </span>
              <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                {isOnline ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Connected to Cloud Firestore
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    Disconnected (Offline)
                  </>
                )}
              </span>
            </div>

            {/* Storage Layer */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                Storage Engine
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {isOnline
                  ? 'Cloud Firestore & Cache'
                  : 'IndexedDB Local Cache (Offline)'}
              </span>
            </div>

            {/* Pending Writes */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                Pending Queue
              </span>
              <span
                className={`font-semibold ${
                  hasPendingWrites
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {hasPendingWrites
                  ? `${pendingWritesCount > 0 ? pendingWritesCount : '1'} update(s) awaiting sync`
                  : '0 queued (All synced)'}
              </span>
            </div>

            {/* Last Synchronized */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                Last Server Sync
              </span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                {formatLastSync(lastSyncTime)}
              </span>
            </div>
          </div>

          {/* Offline Capability Guarantee Banner */}
          <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <p>
                <strong>Offline-First Resilience:</strong> When working in remote
                oilfield zones, tunnels, or zero-connectivity sites, tasks,
                shift logs, and observations are stored in browser memory/IndexedDB and
                automatically push to the schedule once reconnected.
              </p>
            </div>
          </div>

          {/* Interactive Simulation & Actions */}
          <div className="mt-3.5 pt-2 flex items-center gap-2">
            {isOnline ? (
              <button
                type="button"
                onClick={handleToggle}
                disabled={isToggling}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                <span>Simulate Field Offline Mode</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReconnect}
                disabled={isToggling}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isToggling ? 'animate-spin' : ''}`} />
                <span>Reconnect to Firestore</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
