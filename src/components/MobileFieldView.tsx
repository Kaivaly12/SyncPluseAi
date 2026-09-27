import React, { useState } from 'react';
import {
  Activity,
  TrendingUp,
  MessageSquare,
  Mic,
  Camera,
  FileText,
  FileSpreadsheet,
  Link as LinkIcon,
  Clock,
  ChevronRight,
  Bell,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  Plus,
} from 'lucide-react';
import {
  EVM_METRICS_DATA,
  RECENT_ACTIVITY_FEED_DATA,
  RecentActivityFeedItem,
} from '../data/infra4Data';
import { DocumentVerificationModal } from './DocumentVerificationModal';

interface MobileFieldViewProps {
  onOpenIngestModal?: () => void;
  onOpenCamModal?: () => void;
  onOpenAudioModal?: () => void;
  onOpenPdfModal?: () => void;
}

export const MobileFieldView: React.FC<MobileFieldViewProps> = ({
  onOpenIngestModal,
  onOpenCamModal,
  onOpenAudioModal,
  onOpenPdfModal,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<RecentActivityFeedItem | null>(null);
  const [showQuickNoteModal, setShowQuickNoteModal] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteSuccess, setQuickNoteSuccess] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleQuickNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteText.trim()) return;
    setQuickNoteSuccess(true);
    setTimeout(() => {
      setQuickNoteSuccess(false);
      setShowQuickNoteModal(false);
      setQuickNoteText('');
    }, 1200);
  };

  const handleExportXlsx = () => {
    setExportNotice('Exporting WBS schedule matrix to XLSX format...');
    setTimeout(() => setExportNotice(null), 3000);
  };

  return (
    <div className="flex justify-center p-2 sm:p-6 animate-fade-in font-sans">
      {/* Mobile Device Container */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[32px] shadow-lg overflow-hidden flex flex-col min-h-[800px] relative">
        {/* Mobile Status Bar */}
        <div className="px-7 pt-3 pb-1 flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800/80">
          <span>09:41</span>
          {/* Dynamic island cutout */}
          <div className="w-16 h-3.5 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">5G</span>
            <div className="w-4 h-2 rounded-xs border border-slate-400 p-0.5">
              <div className="w-2.5 h-full bg-slate-500 dark:bg-slate-300" />
            </div>
          </div>
        </div>

        {/* SyncPulse Mobile App Header */}
        <div className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
                <span>SyncPulse Field</span>
              </h1>
              <p className="text-[10px] text-slate-400">05 September 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-medium">Site Engineer</span>
            </div>
            <div className="relative p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
            </div>
          </div>
        </div>

        {exportNotice && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fade-in">
            <span>{exportNotice}</span>
            <button onClick={() => setExportNotice(null)} className="font-bold ml-2">✕</button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Section 1: OVERALL PROGRESS */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                Overall Progress
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                <TrendingUp className="w-3.5 h-3.5" /> Trend +2.4%
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {EVM_METRICS_DATA.overallProgress}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Target: 84%
              </span>
            </div>

            {/* Clean Progress bar */}
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-slate-900 dark:bg-white transition-all duration-500"
                style={{ width: `${EVM_METRICS_DATA.overallProgress}%` }}
              />
            </div>
          </div>

          {/* Section 2: EVM Metrics Row */}
          <div className="grid grid-cols-3 gap-2">
            {/* CPI */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">
                CPI (Cost)
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white my-1">
                {EVM_METRICS_DATA.cpi.toFixed(2)}
              </span>
              <span className="text-[9px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1 py-0.5 rounded text-center">
                Under budget
              </span>
            </div>

            {/* SPI */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">
                SPI (Schedule)
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white my-1">
                {EVM_METRICS_DATA.spi.toFixed(2)}
              </span>
              <span className="text-[9px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1 py-0.5 rounded text-center">
                Slight delay
              </span>
            </div>

            {/* Active Activities */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">
                Active WBS
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white my-1">
                {EVM_METRICS_DATA.activeActivities}
              </span>
              <span className="text-[9px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-center">
                Tasks
              </span>
            </div>
          </div>

          {/* Section 3: QUICK INPUT Buttons */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Quick Field Actions
            </span>

            <div className="grid grid-cols-2 gap-2">
              {/* Webcam / Cam */}
              <button
                type="button"
                onClick={onOpenCamModal || onOpenIngestModal}
                className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center gap-2.5 transition-all cursor-pointer group text-left"
              >
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Webcam Cam
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Live camera scan</span>
                </div>
              </button>

              {/* Voice Rec */}
              <button
                type="button"
                onClick={onOpenAudioModal || onOpenIngestModal}
                className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center gap-2.5 transition-all cursor-pointer group text-left"
              >
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <Mic className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Voice Memo
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Mic recording</span>
                </div>
              </button>

              {/* Upload PDF */}
              <button
                type="button"
                onClick={onOpenPdfModal || onOpenIngestModal}
                className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center gap-2.5 transition-all cursor-pointer group text-left"
              >
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Upload PDF
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Tickets & plans</span>
                </div>
              </button>

              {/* Text Update */}
              <button
                type="button"
                onClick={() => setShowQuickNoteModal(true)}
                className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center gap-2.5 transition-all cursor-pointer group text-left"
              >
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Text Update
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Shift log note</span>
                </div>
              </button>
            </div>

            {/* Link Schedule Full Width Button */}
            <button
              type="button"
              onClick={onOpenIngestModal}
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <LinkIcon className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    Link Observation to WBS
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Associate telemetry with Primavera schedule code</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white" />
            </button>
          </div>

          {/* Section 4: RECENT ACTIVITY */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Recent Field Updates
              </span>
              <span className="text-[10px] text-slate-400">Live feed</span>
            </div>

            <div className="space-y-2">
              {/* Activity item 1 */}
              <div
                onClick={() => setSelectedActivity(RECENT_ACTIVITY_FEED_DATA[0])}
                className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-500" /> 10 min ago
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">L&T Heavy Civil</span>
                </div>
                <p className="text-xs text-slate-900 dark:text-white font-medium mt-1">
                  Civil Supervisor (L&T) logged: Foundation F12 completed (80 m3)
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Source verified: L24_DailyReport.pdf
                </span>
              </div>

              {/* Activity item 2 */}
              <div
                onClick={() => setSelectedActivity(RECENT_ACTIVITY_FEED_DATA[1])}
                className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500" /> 45 min ago
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Piping Tech</span>
                </div>
                <p className="text-xs text-slate-900 dark:text-white font-medium mt-1">
                  Piping Contractor logged: Line L24 fab finished (12 spools)
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Source verified: L24_DailyReport.pdf
                </span>
              </div>

              {/* Activity item 3 */}
              <div
                onClick={() => setSelectedActivity(RECENT_ACTIVITY_FEED_DATA[2])}
                className="p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-500" /> 1h ago
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Siemens Power</span>
                </div>
                <p className="text-xs text-slate-900 dark:text-white font-medium mt-1">
                  Siemens Electrical: upload daily scan
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Source verified: Siemens_Scan_05Sep.scan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around text-slate-500 dark:text-slate-400">
          <button
            type="button"
            className="text-slate-900 dark:text-white flex flex-col items-center gap-1 cursor-pointer"
          >
            <Activity className="w-4 h-4" />
            <span className="text-[9px] font-medium">Dashboard</span>
          </button>
          <button
            type="button"
            onClick={onOpenCamModal || onOpenIngestModal}
            className="flex flex-col items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Open Webcam Camera"
          >
            <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[9px] font-medium">Cam</span>
          </button>
          <button
            type="button"
            onClick={onOpenAudioModal || onOpenIngestModal}
            className="flex flex-col items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Record Voice Memo"
          >
            <Mic className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-[9px] font-medium">Voice</span>
          </button>
          <button
            type="button"
            onClick={onOpenPdfModal || onOpenIngestModal}
            className="flex flex-col items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Upload PDF Document"
          >
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[9px] font-medium">PDF</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedActivity(RECENT_ACTIVITY_FEED_DATA[0])}
            className="flex flex-col items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[9px] font-medium">Verified</span>
          </button>
        </div>

        {/* Home Indicator line */}
        <div className="w-24 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2" />
      </div>

      {/* Quick Note Modal */}
      {showQuickNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Log Text Update</h3>
              <button
                onClick={() => setShowQuickNoteModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {quickNoteSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Shift Log Recorded</p>
              </div>
            ) : (
              <form onSubmit={handleQuickNoteSubmit} className="space-y-3">
                <textarea
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  placeholder="e.g. Pier C3 rebar cover inspection passed, tremie pour scheduled at 16:00..."
                  className="w-full h-28 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 placeholder:text-slate-400"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Field Feed</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Verified Document Modal */}
      <DocumentVerificationModal
        isOpen={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        activityItem={selectedActivity}
      />
    </div>
  );
};

