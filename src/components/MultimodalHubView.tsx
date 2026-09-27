import React, { useState, useRef } from 'react';
import {
  Camera,
  Mic,
  FileText,
  FileSpreadsheet,
  Plus,
  Play,
  Pause,
  MapPin,
  Sparkles,
  Search,
  Trash2,
  ExternalLink,
  Download,
} from 'lucide-react';
import { FieldObservation, ObservationType } from '../types';
import { CONSTRUCTION_ZONES } from '../data/sampleCivilData';

interface MultimodalHubViewProps {
  observations: FieldObservation[];
  onOpenIngestModal: () => void;
  onOpenCamModal?: () => void;
  onOpenAudioModal?: () => void;
  onOpenPdfModal?: () => void;
  onSelectOnMap: (obs: FieldObservation) => void;
  onCreateTask: (obs: FieldObservation) => void;
  onDeleteObservation: (id: string) => void;
}

export const MultimodalHubView: React.FC<MultimodalHubViewProps> = ({
  observations,
  onOpenIngestModal,
  onOpenCamModal,
  onOpenAudioModal,
  onOpenPdfModal,
  onSelectOnMap,
  onCreateTask,
  onDeleteObservation,
}) => {
  const [activeTypeTab, setActiveTypeTab] = useState<ObservationType | 'all'>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handleToggleAudio = (obs: FieldObservation) => {
    if (playingAudioId === obs.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (obs.audioBlobUrl) {
        const audio = new Audio(obs.audioBlobUrl);
        audioPlayerRef.current = audio;
        audio.onended = () => setPlayingAudioId(null);
        audio.onerror = () => setPlayingAudioId(null);
        audio.play().catch(() => {});
      }
      setPlayingAudioId(obs.id);
    }
  };

  // Filter observations
  const filtered = observations.filter((obs) => {
    if (activeTypeTab !== 'all' && obs.type !== activeTypeTab) return false;
    if (zoneFilter !== 'all' && obs.location.zoneId !== zoneFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = obs.title.toLowerCase().includes(q);
      const matchDesc = obs.description.toLowerCase().includes(q);
      const matchZone = obs.zone.toLowerCase().includes(q);
      const matchWbs = obs.wbsCode?.toLowerCase().includes(q);
      const matchTranscript =
        obs.audioTranscription?.toLowerCase().includes(q) ||
        obs.aiAnalysis?.transcription?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchZone && !matchWbs && !matchTranscript) {
        return false;
      }
    }
    return true;
  });

  const photoCount = observations.filter((o) => o.type === 'photo').length;
  const audioCount = observations.filter((o) => o.type === 'audio').length;
  const pdfCount = observations.filter((o) => o.type === 'pdf').length;
  const noteCount = observations.filter((o) => o.type === 'note').length;

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Top Banner & Multimodal Capture Quick Actions */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
              Pillar 1: Multimodal Ingestion
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {observations.length} Verified Records
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Site Telemetry & Evidence Repository
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Directly capture and update site data via laptop webcam, live microphone audio recording, or PDF delivery slip upload.
          </p>
        </div>

        {/* 3 Explicit Capture Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenCamModal || onOpenIngestModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Access laptop webcam to snap site photo"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            <span>Webcam Cam</span>
          </button>

          <button
            type="button"
            onClick={onOpenAudioModal || onOpenIngestModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Record live voice memo using laptop microphone"
          >
            <Mic className="w-3.5 h-3.5 text-rose-500" />
            <span>Voice Memo</span>
          </button>

          <button
            type="button"
            onClick={onOpenPdfModal || onOpenIngestModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Upload PDF tickets and engineering plans"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Modality Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTypeTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTypeTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({observations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeTab('photo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTypeTab === 'photo'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photos ({photoCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeTab('audio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTypeTab === 'audio'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice ({audioCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeTab('pdf')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTypeTab === 'pdf'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Slips ({pdfCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTypeTab('note')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
              activeTypeTab === 'note'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Notes ({noteCount})</span>
          </button>
        </div>

        {/* Zone Selector & Search */}
        <div className="flex items-center gap-2">
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Construction Zones</option>
            {CONSTRUCTION_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search observations..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-400 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* Grid of Observation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((obs) => {
          const isCritical = obs.aiAnalysis?.severity === 'critical';
          const isPlayingThisAudio = playingAudioId === obs.id;

          return (
            <div
              key={obs.id}
              className={`rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                isCritical
                  ? 'border-rose-300 dark:border-rose-900/60'
                  : 'border-slate-200/90 dark:border-slate-800'
              }`}
            >
              {/* Media Preview (Photo or Audio or PDF) */}
              {obs.type === 'photo' && obs.mediaUrl && (
                <div className="relative aspect-16/9 overflow-hidden bg-slate-100 dark:bg-slate-950 group">
                  <img
                    src={obs.mediaUrl}
                    alt={obs.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  {/* GPS Stamp overlay */}
                  <div className="absolute bottom-2 left-2 right-2 p-1.5 rounded-lg bg-slate-900/85 backdrop-blur-xs text-[10px] font-mono text-slate-200 flex items-center justify-between">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {obs.location.lat.toFixed(4)}°N, {Math.abs(obs.location.lng).toFixed(4)}°W
                    </span>
                    <span>AZM: {obs.location.bearingDegrees || 0}°</span>
                  </div>
                </div>
              )}

              {obs.type === 'audio' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                        <Mic className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
                        Voice Memo ({obs.audioDurationSeconds || 5}s)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAudio(obs)}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isPlayingThisAudio ? (
                        <>
                          <Pause className="w-3 h-3" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Play</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Waveform Visualization */}
                  <div className="flex items-center gap-1 h-7 justify-center py-1">
                    {(obs.audioWaveform || [25, 45, 70, 95, 60, 35, 80, 55, 30]).map(
                      (v, i) => (
                        <div
                          key={i}
                          className={`w-1.5 rounded-full transition-all ${
                            isPlayingThisAudio
                              ? 'bg-rose-500 animate-pulse'
                              : 'bg-slate-300 dark:bg-slate-700'
                          }`}
                          style={{ height: `${v}%` }}
                        />
                      )
                    )}
                  </div>
                </div>
              )}

              {obs.type === 'pdf' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {obs.pdfSheetNumber || 'SPEC-DOC'} [{obs.pdfDrawingRevision || 'REV-A'}]
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {obs.fileName || 'DOCUMENT.PDF'}
                      </span>
                    </div>
                  </div>
                  {obs.pdfUrl ? (
                    <a
                      href={obs.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>View</span>
                    </a>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      PARSED
                    </span>
                  )}
                </div>
              )}

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1">
                {/* Header Tag Row */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      obs.aiAnalysis?.severity === 'critical'
                        ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                        : obs.aiAnalysis?.severity === 'medium'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                        : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    }`}
                  >
                    {obs.aiAnalysis?.severity || 'info'} • {obs.aiAnalysis?.category?.replace('_', ' ') || 'progress'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {obs.wbsCode}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {obs.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {obs.description}
                  </p>
                </div>

                {/* Spoken transcription if audio */}
                {(obs.audioTranscription || obs.aiAnalysis?.transcription) && (
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 italic">
                    "{obs.audioTranscription || obs.aiAnalysis?.transcription}"
                  </div>
                )}

                {/* Key Metrics / Detected Elements */}
                {obs.aiAnalysis?.detectedElements && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {obs.aiAnalysis.detectedElements.slice(0, 3).map((el, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono"
                      >
                        ✓ {el}
                      </span>
                    ))}
                  </div>
                )}

                {/* Geolocation Tag */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span className="truncate max-w-[180px]">{obs.zone}</span>
                  <span>{obs.location.gridRef}</span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onSelectOnMap(obs)}
                  className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span>CAD Map Pin</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCreateTask(obs)}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Create WBS Task"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteObservation(obs.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete Observation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
