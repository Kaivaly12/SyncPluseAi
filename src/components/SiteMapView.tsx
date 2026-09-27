import React, { useState } from 'react';
import {
  MapPin,
  Compass,
  Layers,
  Camera,
  Mic,
  FileText,
  AlertTriangle,
  Play,
  Pause,
  Plus,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Info,
  CheckCircle2,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { FieldObservation, ConstructionZone, ObservationType } from '../types';
import { CONSTRUCTION_ZONES } from '../data/sampleCivilData';

interface SiteMapViewProps {
  observations: FieldObservation[];
  onSelectObservation: (obs: FieldObservation) => void;
  onAddObservationAtLocation: (coords: { lat: number; lng: number }, zoneId: string) => void;
  onCreateTaskFromObservation?: (obs: FieldObservation) => void;
}

export const SiteMapView: React.FC<SiteMapViewProps> = ({
  observations,
  onSelectObservation,
  onAddObservationAtLocation,
  onCreateTaskFromObservation,
}) => {
  // Map display settings
  const [mapMode, setMapMode] = useState<'blueprint' | 'satellite' | 'heatmap'>('blueprint');
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Selected Pin for Inspector Drawer
  const [activeObservation, setActiveObservation] = useState<FieldObservation | null>(
    observations[0] || null
  );
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Filter observations
  const filteredObservations = observations.filter((obs) => {
    if (selectedZoneFilter !== 'all' && obs.location.zoneId !== selectedZoneFilter) {
      return false;
    }
    if (selectedTypeFilter !== 'all' && obs.type !== selectedTypeFilter) {
      return false;
    }
    if (showCriticalOnly && obs.aiAnalysis?.severity !== 'critical') {
      return false;
    }
    return true;
  });

  // Map click to add observation at coordinates
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;

    // Convert relative % to realistic coordinates
    const calcLat = +(37.7758 - (yPct / 100) * 0.0018).toFixed(5);
    const calcLng = +(-122.4202 + (xPct / 100) * 0.0028).toFixed(5);

    // Find nearest zone
    let assignedZone = 'zone-a';
    if (xPct > 40 && yPct < 60) assignedZone = 'zone-b';
    else if (xPct < 38 && yPct > 55) assignedZone = 'zone-c';
    else if (xPct > 80 && yPct < 60) assignedZone = 'zone-d';
    else if (yPct > 60) assignedZone = 'zone-e';

    onAddObservationAtLocation({ lat: calcLat, lng: calcLng }, assignedZone);
  };

  // Convert GPS lat/lng to map percentage x/y
  const getCoordinatesPct = (lat: number, lng: number) => {
    const minLat = 37.7740;
    const maxLat = 37.7758;
    const minLng = -122.4202;
    const maxLng = -122.4174;

    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;

    return {
      x: Math.max(4, Math.min(96, x)),
      y: Math.max(6, Math.min(94, y)),
    };
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full h-[calc(100vh-180px)] min-h-[640px]">
      {/* MAP CANVAS CONTAINER */}
      <div className="flex-1 flex flex-col rounded-2xl bg-slate-900 border border-slate-700/80 overflow-hidden shadow-xl relative">
        {/* Top Floating Map Controls Bar */}
        <div className="absolute top-3 left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
          {/* Map Layer Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-700/80 shadow-lg text-xs">
            <button
              type="button"
              onClick={() => setMapMode('blueprint')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                mapMode === 'blueprint'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              CAD Grid
            </button>
            <button
              type="button"
              onClick={() => setMapMode('satellite')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                mapMode === 'satellite'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Satellite Topo
            </button>
            <button
              type="button"
              onClick={() => setMapMode('heatmap')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                mapMode === 'heatmap'
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Risk Heatmap
            </button>
          </div>

          {/* Filters: Zone, Modality, Hazard */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950/90 text-xs font-semibold text-slate-200 border border-slate-700/80 backdrop-blur-md focus:outline-none"
            >
              <option value="all">All Site Zones (A–E)</option>
              {CONSTRUCTION_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>

            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950/90 text-xs font-semibold text-slate-200 border border-slate-700/80 backdrop-blur-md focus:outline-none"
            >
              <option value="all">All Formats (Photo/Audio/PDF/Note)</option>
              <option value="photo">Photos Only</option>
              <option value="audio">Voice Memos Only</option>
              <option value="pdf">PDF Specs & Slips Only</option>
              <option value="note">Notes Only</option>
            </select>

            <button
              type="button"
              onClick={() => setShowCriticalOnly(!showCriticalOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md flex items-center gap-1.5 transition-colors ${
                showCriticalOnly
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-950/90 text-slate-300 border-slate-700/80 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Critical Only</span>
            </button>
          </div>
        </div>

        {/* INTERACTIVE SVG MAP STAGE */}
        <div
          className={`flex-1 w-full h-full relative cursor-crosshair select-none transition-all duration-300 ${
            mapMode === 'blueprint'
              ? 'bg-[#0b1329]'
              : mapMode === 'satellite'
              ? 'bg-[#18231c]'
              : 'bg-[#180e14]'
          }`}
          onClick={handleMapClick}
        >
          {/* Engineering CAD Grid Background Pattern */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <defs>
              <pattern
                id="cad-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke={mapMode === 'blueprint' ? '#38bdf8' : '#eab308'}
                  strokeWidth="0.8"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cad-grid)" />
          </svg>

          {/* Construction Site Structural Zones & Polygons */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {CONSTRUCTION_ZONES.map((zone) => {
              const pointsStr = zone.polygonCoords
                .map((p) => `${p.x}%,${p.y}%`)
                .join(' ');
              const isHighlighted =
                selectedZoneFilter === 'all' || selectedZoneFilter === zone.id;

              return (
                <g key={zone.id} className="transition-opacity duration-200">
                  <polygon
                    points={pointsStr}
                    fill={zone.color}
                    fillOpacity={
                      mapMode === 'heatmap' && zone.activeHazardsCount > 0
                        ? '0.35'
                        : isHighlighted
                        ? '0.12'
                        : '0.04'
                    }
                    stroke={zone.color}
                    strokeWidth={isHighlighted ? '2' : '1'}
                    strokeDasharray={zone.id === 'zone-c' ? '6 4' : 'none'}
                  />
                  {/* Zone Watermark Tag */}
                  <text
                    x={`${zone.centerPoint.x}%`}
                    y={`${zone.centerPoint.y}%`}
                    fill={zone.color}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                    opacity={isHighlighted ? 0.85 : 0.3}
                  >
                    [{zone.code}: {zone.gridArea}]
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Structural Gridline Labels (Grids A-F across top, 1-10 down side) */}
          <div className="absolute top-12 left-4 right-4 flex justify-between pointer-events-none text-[10px] font-mono text-slate-500 font-bold">
            <span>GRID A</span>
            <span>GRID B</span>
            <span>GRID C</span>
            <span>GRID D</span>
            <span>GRID E</span>
            <span>GRID F</span>
          </div>
          <div className="absolute top-16 bottom-12 left-2 flex flex-col justify-between pointer-events-none text-[10px] font-mono text-slate-500 font-bold">
            <span>01</span>
            <span>03</span>
            <span>05</span>
            <span>07</span>
            <span>09</span>
          </div>

          {/* GEOTAGGED OBSERVATION PINS WITH DIRECTIONAL CAMERA CONES */}
          {filteredObservations.map((obs) => {
            const { x, y } = getCoordinatesPct(obs.location.lat, obs.location.lng);
            const isSelected = activeObservation?.id === obs.id;
            const isCritical = obs.aiAnalysis?.severity === 'critical';
            const bearing = obs.location.bearingDegrees || 0;

            return (
              <div
                key={obs.id}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveObservation(obs);
                  onSelectObservation(obs);
                }}
              >
                {/* Visual Sight / Camera Direction Cone for Photos */}
                {obs.type === 'photo' && (
                  <div
                    className="absolute w-24 h-24 pointer-events-none -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 origin-center transition-transform"
                    style={{ transform: `rotate(${bearing}deg)` }}
                  >
                    <svg viewBox="0 0 100 100" className="w-full h-full opacity-35 group-hover:opacity-60 transition-opacity">
                      <defs>
                        <linearGradient id={`cone-${obs.id}`} x1="0" y1="1" x2="0" y2="0">
                          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <polygon
                        points="50,50 20,0 80,0"
                        fill={`url(#cone-${obs.id})`}
                      />
                    </svg>
                  </div>
                )}

                {/* Pulsating Ping for Critical Hazards */}
                {isCritical && (
                  <span className="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping" />
                )}

                {/* Main Pin Badge */}
                <div
                  className={`relative p-2 rounded-xl shadow-xl transition-transform duration-200 border ${
                    isSelected
                      ? 'scale-125 ring-2 ring-amber-400 bg-slate-900 border-amber-400 text-amber-400'
                      : isCritical
                      ? 'bg-rose-600 text-white border-rose-400 hover:scale-110'
                      : obs.type === 'photo'
                      ? 'bg-amber-500 text-slate-950 border-amber-300 hover:scale-110'
                      : obs.type === 'audio'
                      ? 'bg-sky-500 text-slate-950 border-sky-300 hover:scale-110'
                      : obs.type === 'pdf'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300 hover:scale-110'
                      : 'bg-slate-800 text-slate-200 border-slate-600 hover:scale-110'
                  }`}
                >
                  {obs.type === 'photo' && <Camera className="w-4 h-4" />}
                  {obs.type === 'audio' && <Mic className="w-4 h-4" />}
                  {obs.type === 'pdf' && <FileText className="w-4 h-4" />}
                  {obs.type === 'note' && <MapPin className="w-4 h-4" />}
                </div>

                {/* Tooltip on Hover */}
                <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 px-2 py-1 rounded bg-slate-950/90 text-white text-[10px] font-mono whitespace-nowrap border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-lg">
                  {obs.title.slice(0, 24)}...
                </div>
              </div>
            );
          })}

          {/* Bottom HUD: Site Telemetry Readout & Compass Rose */}
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
            {/* Coordinates & Scale Bar */}
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md pointer-events-auto text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-1.5 text-amber-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>DATUM: 37.7754°N, 122.4198°W</span>
              </div>
              <span className="text-slate-600">|</span>
              {/* Graphical 50m Scale Bar */}
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1 bg-amber-400/80 border-x border-amber-300" />
                <span className="text-[10px] text-slate-400">50 METERS</span>
              </div>
            </div>

            {/* Compass Rose */}
            <div className="p-2 rounded-xl bg-slate-950/90 border border-slate-800 backdrop-blur-md pointer-events-auto flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
              <Compass className="w-4 h-4 text-sky-400 animate-spin-slow" />
              <span>NORTH 000°</span>
            </div>
          </div>
        </div>
      </div>

      {/* INSPECTION DETAIL DRAWER (RIGHT PANEL) */}
      <div className="w-full lg:w-96 rounded-2xl bg-slate-900 border border-slate-700/80 p-5 flex flex-col justify-between shadow-xl overflow-y-auto">
        {activeObservation ? (
          <div className="space-y-4">
            {/* Header Badge */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    activeObservation.type === 'photo'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : activeObservation.type === 'audio'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {activeObservation.type.toUpperCase()} OBSERVATION
                </span>
                {activeObservation.aiAnalysis?.severity === 'critical' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" />
                    Critical
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {activeObservation.location.gridRef}
              </span>
            </div>

            {/* Title & Zone */}
            <div>
              <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                {activeObservation.title}
              </h3>
              <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                {activeObservation.zone}
              </p>
            </div>

            {/* Media Visualizer: Photo Preview or Audio Player */}
            {activeObservation.type === 'photo' && activeObservation.mediaUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-800 aspect-16/10 bg-slate-950">
                <img
                  src={activeObservation.mediaUrl}
                  alt={activeObservation.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-slate-950/80 backdrop-blur-xs text-[10px] font-mono text-slate-300 flex items-center justify-between">
                  <span>HEADING: {activeObservation.location.bearingDegrees}° AZM</span>
                  <span>ELEV: +{activeObservation.location.elevationMeters}m</span>
                </div>
              </div>
            )}

            {activeObservation.type === 'audio' && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    Duration: {activeObservation.audioDurationSeconds || 42}s
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                    className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors flex items-center gap-1.5 text-xs shadow-md"
                  >
                    {isPlayingAudio ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Play Memo</span>
                      </>
                    )}
                  </button>
                </div>
                {/* Waveform graphic */}
                <div className="flex items-center gap-1 h-8 justify-center">
                  {(activeObservation.audioWaveform || [20, 50, 80, 40, 90, 70, 30, 85, 60, 40]).map(
                    (val, idx) => (
                      <div
                        key={idx}
                        className={`w-1.5 rounded-full transition-all ${
                          isPlayingAudio ? 'bg-amber-400 animate-pulse' : 'bg-sky-400'
                        }`}
                        style={{ height: `${val}%` }}
                      />
                    )
                  )}
                </div>
                {activeObservation.aiAnalysis?.transcription && (
                  <p className="text-xs text-slate-300 italic bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {activeObservation.aiAnalysis.transcription}
                  </p>
                )}
              </div>
            )}

            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">GPS LATITUDE</span>
                <span className="text-slate-200 font-bold">
                  {activeObservation.location.lat.toFixed(5)}°N
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">GPS LONGITUDE</span>
                <span className="text-slate-200 font-bold">
                  {activeObservation.location.lng.toFixed(5)}°W
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">WBS CODE</span>
                <span className="text-amber-400 font-bold">
                  {activeObservation.wbsCode || '01-GEN-010'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">INSPECTOR</span>
                <span className="text-slate-200 truncate block">
                  {activeObservation.author}
                </span>
              </div>
            </div>

            {/* AI Engineering Insights */}
            {activeObservation.aiAnalysis && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                  <span>AI Structural Findings</span>
                  <span className="font-mono text-slate-400">
                    {(activeObservation.aiAnalysis.confidenceScore * 100).toFixed(0)}% Conf
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {activeObservation.aiAnalysis.summary}
                </p>

                {activeObservation.aiAnalysis.recommendedAction && (
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                    <strong>Required Action:</strong> {activeObservation.aiAnalysis.recommendedAction}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <MapPin className="w-10 h-10 text-slate-600 mb-2" />
            <p className="font-bold text-slate-300 text-sm">No Location Selected</p>
            <p className="text-xs mt-1">
              Click any geotagged pin on the site map to inspect photos, audio memos, and AI defect analysis.
            </p>
          </div>
        )}

        {/* Action button: Create Task from this Observation */}
        {activeObservation && (
          <div className="pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => onCreateTaskFromObservation?.(activeObservation)}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Generate WBS Task from Observation</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
