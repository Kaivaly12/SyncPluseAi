import React, { useState, useEffect } from 'react';
import { useNetwork } from '../context/NetworkContext';
import {
  Camera,
  Layers,
  AlertTriangle,
  Wifi,
  WifiOff,
  CheckCircle2,
  RefreshCw,
  Clock,
  Compass,
  MapPin,
  ChevronRight,
  Maximize2,
  Play,
  RotateCcw,
  Zap,
  Check,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  DRONE_DETECTIONS_DATA,
  DRONE_EVENT_LOGS,
  WBS_AUTO_UPDATES_DATA,
  GANTT_CRITICAL_PATH_ITEMS,
  CRITICAL_VARIANCE_ALERTS,
  INITIAL_PENDING_SYNC_ITEMS,
  CriticalVarianceAlert,
  WbsAutoUpdateItem,
} from '../data/infra4Data';

interface Infra4EngineViewProps {
  onOpenIngestModal?: () => void;
  onOpenCamModal?: () => void;
  onSelectWbsTask?: (code: string) => void;
}

export const Infra4EngineView: React.FC<Infra4EngineViewProps> = ({
  onOpenIngestModal,
  onOpenCamModal,
  onSelectWbsTask,
}) => {
  // Active selected engine tab (for single mobile view or all 4 grid view)
  const [activeEngineTab, setActiveEngineTab] = useState<'all' | 'capture' | 'schedule' | 'variance' | 'sync'>('all');

  // Pillar 1 state (Drone Scan)
  const [isDroneScanning, setIsDroneScanning] = useState(true);
  const [droneLogs, setDroneLogs] = useState<string[]>(DRONE_EVENT_LOGS);
  const [selectedDetection, setSelectedDetection] = useState<string | null>(null);

  // Pillar 2 state (WBS Updates)
  const [wbsList, setWbsList] = useState<WbsAutoUpdateItem[]>(WBS_AUTO_UPDATES_DATA);
  const [isScheduleSynced, setIsScheduleSynced] = useState(true);

  // Pillar 3 state (Variance & Alerts)
  const [selectedAlert, setSelectedAlert] = useState<CriticalVarianceAlert | null>(null);

  // Global Network state & Pillar 4 Offline Sync
  const { isOnline, isSimulatedOffline, toggleOfflineMode: toggleGlobalOffline } = useNetwork();
  const isOfflineMode = !isOnline || isSimulatedOffline;
  const [syncSpeedometerAngle, setSyncSpeedometerAngle] = useState(isOfflineMode ? -48 : 48);
  const [dataToSyncMb, setDataToSyncMb] = useState(12);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [pendingItems, setPendingItems] = useState(INITIAL_PENDING_SYNC_ITEMS);

  // Synchronize speedometer needle when network status changes
  useEffect(() => {
    if (isOfflineMode) {
      setSyncSpeedometerAngle(-48);
    } else {
      setSyncSpeedometerAngle(20);
      const timer = setTimeout(() => setSyncSpeedometerAngle(48), 600);
      return () => clearTimeout(timer);
    }
  }, [isOfflineMode]);

  // Handle Offline toggle
  const toggleOfflineMode = async () => {
    await toggleGlobalOffline();
  };

  // Force sync action
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleForceSync = () => {
    if (isOfflineMode) {
      setSyncNotice('Cannot sync while offline. Please disable offline mode first.');
      setTimeout(() => setSyncNotice(null), 3000);
      return;
    }
    setIsSyncingNow(true);
    setTimeout(() => {
      setDataToSyncMb(0);
      setSyncSpeedometerAngle(55);
      setIsSyncingNow(false);
      setPendingItems([]);
    }, 1200);
  };

  // Add simulated drone detection
  const handleSimulateNewScan = () => {
    const newLog = `Drone Segment P34 LiDAR mesh updated [${new Date().toLocaleTimeString()}]`;
    setDroneLogs((prev) => [newLog, ...prev.slice(0, 5)]);
    setIsDroneScanning(true);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Engine Banner */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              INFRA 4.0 Core
            </span>
            <span className="text-xs text-slate-400">Autonomous Engineering Framework</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
            4-Pillar Autonomous Infrastructure Engine
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Interconnected Field-to-Model Capture, Dynamic WBS Schedule-Linking, Predictive Discrepancy & Variance Alerts, and Edge Synchronization.
          </p>
        </div>

        {/* View mode segmented pill tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs overflow-x-auto self-start md:self-auto border border-slate-200/80 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setActiveEngineTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeEngineTab === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            All 4 Engines
          </button>
          <button
            type="button"
            onClick={() => setActiveEngineTab('capture')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeEngineTab === 'capture'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            1. Capture
          </button>
          <button
            type="button"
            onClick={() => setActiveEngineTab('schedule')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeEngineTab === 'schedule'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            2. Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveEngineTab('variance')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeEngineTab === 'variance'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            3. Variance
          </button>
          <button
            type="button"
            onClick={() => setActiveEngineTab('sync')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeEngineTab === 'sync'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            4. Offline Sync
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between animate-fade-in">
          <span>{syncNotice}</span>
          <button onClick={() => setSyncNotice(null)} className="font-bold ml-2">✕</button>
        </div>
      )}

      {/* Grid of the 4 Phone / Engine Screens */}
      <div
        className={`grid gap-6 ${
          activeEngineTab === 'all'
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
            : 'grid-cols-1 max-w-md mx-auto'
        }`}
      >
        {/* ========================================================= */}
        {/* PILLAR 1: Automated Data Capture Engine (Field-to-Model) */}
        {/* ========================================================= */}
        {(activeEngineTab === 'all' || activeEngineTab === 'capture') && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center">
                <Camera className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-tight">
                  Automated Data Capture
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Field-to-Model Telemetry</p>
              </div>
            </div>

            {/* Mobile Device Frame */}
            <div className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
              {/* Phone Header Bar */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-blue-600 flex items-center justify-center text-[8px] text-white font-bold">
                    1
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                    Site LiDAR & Visual Feed
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Live</span>
                </div>
              </div>

              {/* Drone Scan Active Screen */}
              <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-950 overflow-hidden group">
                <img
                  src="https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?auto=format&fit=crop&w=600&q=80"
                  alt="Drone Scan Active"
                  className="w-full h-full object-cover"
                />

                {/* Drone Scan Active Badge */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5 backdrop-blur-xs shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Drone Scan Active</span>
                </div>

                {/* Bounding Box 1: Formwork 85% */}
                <div
                  className="absolute border-2 border-amber-500 rounded-xs transition-all pointer-events-none"
                  style={{ top: '35%', left: '20%', width: '35%', height: '40%' }}
                >
                  <span className="absolute -top-3.5 left-0 px-1 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-medium">
                    Formwork 85%
                  </span>
                </div>

                {/* Bounding Box 2: Rebar 70% */}
                <div
                  className="absolute border-2 border-emerald-500 rounded-xs transition-all pointer-events-none"
                  style={{ top: '25%', left: '60%', width: '30%', height: '45%' }}
                >
                  <span className="absolute -top-3.5 left-0 px-1 py-0.2 rounded bg-emerald-500 text-slate-950 text-[9px] font-medium">
                    Rebar 70%
                  </span>
                </div>

                {/* Geolocation Stamp Overlay */}
                <div className="absolute bottom-1.5 left-2 right-2 px-2 py-1 rounded bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-[9px] text-slate-600 dark:text-slate-300 flex items-center justify-between border border-slate-200/80 dark:border-slate-700/80">
                  <span className="font-mono">Geo: 23.2372°N, 92.3534°E</span>
                  <Maximize2 className="w-3 h-3 text-slate-400" />
                </div>
              </div>

              {/* Site Camera Feed: Automated Detection */}
              <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                    <span>Automated Detections</span>
                    <button
                      onClick={handleSimulateNewScan}
                      className="text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Rescan
                    </button>
                  </div>

                  {/* Thumbnail Row */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {DRONE_DETECTIONS_DATA.map((det) => (
                      <div
                        key={det.id}
                        onClick={() => setSelectedDetection(det.id)}
                        className="relative rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-slate-400 transition-colors group"
                      >
                        <img
                          src={det.thumbnailUrl}
                          alt={det.label}
                          className="w-full h-11 object-cover"
                        />
                        <div className="p-1 text-center bg-white dark:bg-slate-900">
                          <span className="text-[9px] font-medium text-slate-700 dark:text-slate-300 block truncate">
                            {det.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event Log feed */}
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-1 max-h-20 overflow-y-auto">
                  {droneLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-1.5 truncate">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      <span className="text-slate-600 dark:text-slate-300">{log}</span>
                    </div>
                  ))}
                </div>

                {/* Action Trigger */}
                <button
                  type="button"
                  onClick={onOpenCamModal || onOpenIngestModal}
                  className="w-full mt-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>+ Ingest Field Telemetry</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PILLAR 2: Dynamic Schedule-Linking Layer (WBS Automation) */}
        {/* ========================================================= */}
        {(activeEngineTab === 'all' || activeEngineTab === 'schedule') && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-tight">
                  Schedule-Linking Layer
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Dynamic WBS Automation</p>
              </div>
            </div>

            {/* Mobile Device Frame */}
            <div className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
              {/* Phone Header Bar */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-600 flex items-center justify-center text-[8px] text-white font-bold">
                    2
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                    WBS Schedule Automation
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Synced</span>
              </div>

              {/* Gantt / Milestone Timeline Area */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-200/70 dark:border-slate-700/60 pb-1">
                  <span>Milestone Timeline</span>
                  <div className="flex items-center gap-3">
                    <span>Aug 23</span>
                    <span>Mar 24</span>
                    <span>May 24</span>
                  </div>
                </div>

                {/* Milestone Bar Lines */}
                <div className="space-y-1.5 py-1">
                  {GANTT_CRITICAL_PATH_ITEMS.map((item) => (
                    <div key={item.id} className="flex items-center text-[9px]">
                      <span className="w-12 text-slate-500 shrink-0">{item.date}</span>
                      <div className="flex-1 relative h-3.5 bg-slate-200/70 dark:bg-slate-800 rounded-sm overflow-hidden mx-1">
                        <div
                          className="absolute top-0.5 bottom-0.5 rounded-sm flex items-center px-1"
                          style={{
                            left: `${item.offsetPct}%`,
                            width: `${item.widthPct}%`,
                            backgroundColor: item.color,
                          }}
                        >
                          <span className="text-white font-medium truncate text-[8px]">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto-WBS Update from Field Data list */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    <span>Auto-WBS Updates</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Active Link
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {wbsList.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => onSelectWbsTask && onSelectWbsTask(item.code)}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-900 dark:text-white">
                              {item.code}:
                            </span>
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                              {item.statusText}
                            </span>
                          </div>
                          {item.varianceNote && (
                            <span className="text-[9px] text-amber-600 dark:text-amber-400 block mt-0.5">
                              ⚠️ {item.varianceNote}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schedule Synced Badge */}
                <div className="pt-2">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                        Schedule Baseline Synced
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">P6 • Project</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PILLAR 3: Discrepancy & Variance Engine (Alerting)        */}
        {/* ========================================================= */}
        {(activeEngineTab === 'all' || activeEngineTab === 'variance') && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-tight">
                  Variance Engine
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Predictive Discrepancy Alerting</p>
              </div>
            </div>

            {/* Mobile Device Frame */}
            <div className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
              {/* Phone Header Bar */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-amber-500 flex items-center justify-center text-[8px] text-slate-950 font-bold">
                    3
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                    Variance Intelligence
                  </span>
                </div>
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-medium">
                  {CRITICAL_VARIANCE_ALERTS.length} Alerts
                </span>
              </div>

              {/* Planned vs Actual Mini S-Curve with Delay Callout */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                  <span>Planned vs Actual</span>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="text-slate-500">• Planned</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">• Time-lag</span>
                  </div>
                </div>

                <div className="relative h-24 w-full">
                  {/* SVG mini chart */}
                  <svg viewBox="0 0 240 90" className="w-full h-full">
                    {/* Grid lines */}
                    <line x1="20" y1="20" x2="220" y2="20" className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="2 2" strokeWidth="0.8" />
                    <line x1="20" y1="45" x2="220" y2="45" className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="2 2" strokeWidth="0.8" />
                    <line x1="20" y1="70" x2="220" y2="70" className="stroke-slate-200 dark:stroke-slate-700" strokeDasharray="2 2" strokeWidth="0.8" />

                    {/* Planned curve */}
                    <path
                      d="M 20 75 Q 90 70 140 40 T 220 15"
                      fill="none"
                      className="stroke-slate-400 dark:stroke-slate-500"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                    />

                    {/* Actual curve with time-lag gap */}
                    <path
                      d="M 20 75 Q 90 72 140 55 T 195 35"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2"
                    />

                    {/* Callout box */}
                    <g transform="translate(100, 30)">
                      <rect
                        x="0"
                        y="0"
                        width="115"
                        height="26"
                        rx="6"
                        className="fill-white dark:fill-slate-800 stroke-amber-300 dark:stroke-amber-700"
                        strokeWidth="1"
                      />
                      <text x="6" y="11" className="fill-slate-500 dark:fill-slate-400" fontSize="8" fontWeight="500">
                        Delay Predicted:
                      </text>
                      <text x="6" y="21" className="fill-amber-600 dark:fill-amber-400 font-semibold" fontSize="9">
                        +4 Days, Column C3
                      </text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Variance Alert List */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div className="space-y-1.5">
                  {CRITICAL_VARIANCE_ALERTS.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle
                            className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                              alert.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'
                            }`}
                          />
                          <div>
                            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors block">
                              {alert.title}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {alert.description}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white shrink-0 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Predicted impact: 4 days</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Auto-Notified PE</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PILLAR 4: Low-Bandwidth Offline Sync (Architecture)       */}
        {/* ========================================================= */}
        {(activeEngineTab === 'all' || activeEngineTab === 'sync') && (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center">
                <Wifi className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-tight">
                  Low-Bandwidth Sync
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Edge & Offline Buffer</p>
              </div>
            </div>

            {/* Mobile Device Frame */}
            <div className="flex-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
              {/* Phone Header Bar */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-indigo-600 flex items-center justify-center text-[8px] text-white font-bold">
                    4
                  </div>
                  <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">
                    Edge Synchronizer
                  </span>
                </div>
                {isOfflineMode ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    <WifiOff className="w-3 h-3" /> OFFLINE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    <Wifi className="w-3 h-3" /> ONLINE
                  </span>
                )}
              </div>

              {/* Radial Speedometer Gauge (SYNC STATUS) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Sync Status
                </span>

                {/* Speedometer Radial Gauge */}
                <div className="relative w-44 h-24 flex items-center justify-center">
                  <svg viewBox="0 0 160 90" className="w-full h-full">
                    {/* Red Arc (Lagged): -180 to -120 deg */}
                    <path
                      d="M 20 80 A 60 60 0 0 1 45 32"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    {/* Amber Arc (Cloud-Synced): -120 to -60 deg */}
                    <path
                      d="M 47 30 A 60 60 0 0 1 113 30"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="10"
                    />
                    {/* Green Arc (Synced): -60 to 0 deg */}
                    <path
                      d="M 115 32 A 60 60 0 0 1 140 80"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />

                    {/* Needle Indicator */}
                    <g
                      transform={`translate(80, 80) rotate(${syncSpeedometerAngle})`}
                      className="transition-transform duration-700 ease-out"
                    >
                      <line x1="0" y1="0" x2="0" y2="-48" className="stroke-slate-800 dark:stroke-white" strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx="0" cy="0" r="5" className="fill-slate-800 dark:fill-white" />
                      <circle cx="0" cy="0" r="2" className="fill-white dark:fill-slate-900" />
                    </g>
                  </svg>

                  {/* Text overlays around gauge */}
                  <span className="absolute bottom-1 left-2 text-[9px] font-medium text-rose-500">
                    Lagged
                  </span>
                  <span className="absolute top-1 text-[9px] font-medium text-amber-500">
                    Cloud
                  </span>
                  <span className="absolute bottom-1 right-2 text-[9px] font-medium text-emerald-500">
                    Synced
                  </span>
                </div>

                {/* Offline Mode Toggle Switch */}
                <div className="mt-2.5 flex items-center justify-between w-full max-w-[190px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Offline Mode</span>
                  <button
                    type="button"
                    onClick={toggleOfflineMode}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isOfflineMode ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                        isOfflineMode ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Data to Sync & Pending Queue */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                    <span className="font-medium">Data to Sync: {dataToSyncMb}MB</span>
                    <span className="text-slate-400 text-[10px]">IndexedDB Cache</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-900 dark:bg-white transition-all duration-500"
                      style={{ width: `${Math.max(10, (dataToSyncMb / 15) * 100)}%` }}
                    />
                  </div>

                  {/* Pending Data Count badge */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      <Camera className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-900 dark:text-white block">
                        Pending Items:
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {pendingItems.length > 0 ? '14 Photos, 19 Progress Reports' : 'All records synchronized'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Force Sync Action Button */}
                <button
                  type="button"
                  onClick={handleForceSync}
                  disabled={isSyncingNow || isOfflineMode}
                  className={`w-full py-2 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSyncingNow
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      : isOfflineMode
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
                  <span>
                    {isSyncingNow ? 'Syncing to Cloud DB...' : isOfflineMode ? 'Offline (Sync Paused)' : 'Sync Now (12MB)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Variance Alert Details Popover / Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{selectedAlert.title}</h3>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium block">Affected Element</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedAlert.affectedElement}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium block">Root Cause</span>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">{selectedAlert.rootCause}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold block">
                  Recommended Mitigation
                </span>
                <p className="text-slate-700 dark:text-slate-200 mt-1">{selectedAlert.mitigationPlan}</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-xl text-xs cursor-pointer"
              >
                Acknowledge Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

