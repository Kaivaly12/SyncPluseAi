export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  order: number;
  dueDate: string; // ISO string or YYYY-MM-DD
  progress: number; // 0 to 100
  discipline?: string; // e.g. Civil, Piping, Electrical, HSE, General
  wbsCode?: string; // e.g. L4-CIV-002 (relevant to infrastructure/WBS tracking)
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  googleCalendarEventId?: string;
}

export interface UserNotification {
  id: string;
  taskId: string;
  taskTitle: string;
  type: 'due_soon' | 'overdue' | 'status_changed' | 'system';
  message: string;
  dueDate: string;
  read: boolean;
  timestamp: number;
  priority: Priority;
}

export interface TaskFilterOptions {
  search: string;
  priority: Priority | 'all';
  status: TaskStatus | 'all';
  discipline: string;
  sortBy: 'order' | 'dueDate' | 'priority' | 'title' | 'progress';
  sortDirection: 'asc' | 'desc';
}

// -------------------------------------------------------------
// Civil Construction Multimodal Field Data & Geospatial Types
// -------------------------------------------------------------

export type ObservationType = 'photo' | 'audio' | 'pdf' | 'note';

export type ObservationCategory =
  | 'progress'
  | 'safety_hazard'
  | 'quality_defect'
  | 'material_delivery'
  | 'weather_delay';

export type ObservationSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface SiteLocation {
  lat: number;
  lng: number;
  elevationMeters: number;
  bearingDegrees?: number; // Compass azimuth 0-360 deg
  zoneId: string;
  gridRef: string; // e.g., 'B-4', 'E-8'
  addressLabel?: string;
}

export interface AIAnalysisResult {
  category: ObservationCategory;
  severity: ObservationSeverity;
  summary: string;
  detectedElements: string[];
  recommendedAction?: string;
  transcription?: string; // For audio voice memos
  keyMetrics?: Record<string, string | number>; // e.g. { "Slump (mm)": 110, "Concrete Batch": "C35/45", "Batch Ticket": "BT-88912" }
  confidenceScore: number; // 0 to 1
  suggestedWbsCode?: string;
}

export interface FieldObservation {
  id: string;
  userId?: string;
  type: ObservationType;
  title: string;
  description: string;
  zone: string;
  wbsCode?: string;
  timestamp: number;
  author: string;
  authorRole?: string;
  location: SiteLocation;
  // Modality-specific payloads
  mediaUrl?: string; // Data URL or asset path
  fileName?: string;
  fileSize?: string;
  audioBlobUrl?: string;
  audioTranscription?: string;
  audioDurationSeconds?: number;
  audioWaveform?: number[]; // Normalized amplitude points for visual wave
  pdfUrl?: string;
  pdfDocType?: string;
  pdfSheetNumber?: string;
  pdfDrawingRevision?: string;
  // AI Insights
  aiAnalysis?: AIAnalysisResult;
  linkedTaskId?: string;
  status: 'flagged' | 'reviewed' | 'resolved';
}

export interface ConstructionZone {
  id: string;
  name: string;
  code: string; // e.g. 'ZONE-A'
  gridArea: string; // e.g. 'Grids A1-C5'
  color: string;
  polygonCoords: { x: number; y: number }[]; // 0-100% relative coordinates on site plan
  centerPoint: { x: number; y: number };
  centerLat: number;
  centerLng: number;
  currentWork: string;
  leadContractor: string;
  activeHazardsCount: number;
}

export interface DailySiteReport {
  id: string;
  reportDate: string; // YYYY-MM-DD
  shiftType: 'day_shift' | 'night_shift';
  generatedAt: number;
  author: string;
  weather: {
    condition: string; // e.g. 'Clear / Dry'
    tempC: number;
    windKmh: number;
    precipitationMm: number;
    siteTrafficability: 'Optimal' | 'Restricted' | 'Suspended';
  };
  headcount: {
    trade: string;
    count: number;
    company: string;
  }[];
  executiveSummary: string;
  criticalPathStatus: 'On Schedule' | 'Minor Delay' | 'Critical Path At Risk';
  zoneProgress: {
    zoneName: string;
    wbsCode: string;
    description: string;
    completionPct: number;
    photoEvidenceCount: number;
  }[];
  materialDeliveries: {
    material: string;
    supplier: string;
    ticketNumber: string;
    quantity: string;
    qualityStatus: 'Passed' | 'Pending Test' | 'Rejected';
  }[];
  safetyHazards: {
    id: string;
    title: string;
    severity: ObservationSeverity;
    location: string;
    actionRequired: string;
    status: 'Open' | 'Mitigated';
  }[];
  delaysAndImpacts: {
    cause: string;
    affectedTrade: string;
    hoursLost: number;
    mitigationPlan: string;
  }[];
  plannedForTomorrow: string[];
}

export type ActiveAppView =
  | 'executive_evm'
  | 'infra4_engines'
  | 'mobile_field'
  | 'sitemap'
  | 'multimodal_feed'
  | 'kanban'
  | 'list'
  | 'daily_report';

export type NetworkConnectionStatus = 'online' | 'offline';

export interface FirestoreSyncMetadata {
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export interface NetworkStateInfo {
  status: NetworkConnectionStatus;
  isOnline: boolean;
  isBrowserOnline: boolean;
  isFirestoreConnected: boolean;
  isUsingCache: boolean;
  hasPendingWrites: boolean;
  lastSyncTime: Date | null;
  isSimulatedOffline: boolean;
}

