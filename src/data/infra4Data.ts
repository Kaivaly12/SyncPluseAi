// Real-time Infrastructure Project Analytics and INFRA 4.0 Data Models
// Grounded in SyncPulse - Digital Engineering INFRA 4.0

export interface EVMMetrics {
  overallProgress: number; // 72%
  cpi: number; // 0.98
  spi: number; // 0.95
  activeActivities: number; // 48
  delayPredictedDays: number; // 4
  delayPredictedLocation: string; // 'Column C3'
  budgetStatus: 'Within Budget' | 'Over Budget' | 'Critical Overrun';
  scheduleStatus: 'On Schedule' | 'Slight Delay' | 'Critical Delay';
}

export interface SCurvePoint {
  timePercent: number; // 0, 10, 20... 100
  plan: number;
  actual?: number;
  projected?: number;
}

export interface SpiCpiTrendPoint {
  day: number;
  cpi: number;
  spi: number;
  dateStr: string;
}

export interface MonthlyActivityDistribution {
  month: string;
  civil: number;
  piping: number;
  electrical: number;
  instrumentation: number;
}

export interface ContractorPerformance {
  id: string;
  name: string;
  shortName: string;
  scope: string;
  contributionPct: number;
  cpi: number;
  spi: number;
  status: 'Optimal' | 'Within Budget' | 'Slight Delay' | 'Attention Required';
  activeLabor: number;
}

export interface RecentActivityFeedItem {
  id: string;
  timestamp: string;
  relativeTime: string;
  contractor: string;
  contractorBadge: string;
  role: string;
  activityId: string;
  wbsCode: string;
  status: string;
  quantityNote: string;
  sourceDoc: string;
  docType: 'pdf' | 'scan' | 'lab_report' | 'batch_slip';
  docUrl?: string;
  verified: boolean;
}

export interface DroneDetectionItem {
  id: string;
  label: string;
  confidence: number;
  status: 'verified' | 'analyzing' | 'warning';
  boundingBox: { x: number; y: number; width: number; height: number }; // percentage 0-100
  thumbnailUrl: string;
}

export interface WbsAutoUpdateItem {
  id: string;
  code: string;
  title: string;
  statusText: string;
  statusType: 'updated' | 'linked' | 'pending';
  progress: number;
  lastUpdated: string;
  discipline: string;
  varianceNote?: string;
}

export interface CriticalVarianceAlert {
  id: string;
  type: 'variance' | 'material_delay' | 'quality_mismatch';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  affectedElement: string;
  impactDays: number;
  timeAgo: string;
  rootCause: string;
  mitigationPlan: string;
}

export interface PendingSyncItem {
  id: string;
  type: 'photo' | 'report' | 'drone_scan' | 'voice_memo';
  title: string;
  sizeKb: number;
  timestamp: string;
  thumbnailUrl?: string;
  status: 'pending' | 'syncing' | 'synced';
}

// -------------------------------------------------------------
// Live Concrete Datasets
// -------------------------------------------------------------

export const PROJECT_METADATA = {
  name: 'SyncPulse - Real-Time Infrastructure Project Dashboard',
  enterprise: 'OIL INDIA LIMITED (OIL)',
  projectTitle: 'Planning-to-Execution Bridge (EVM Analytics)',
  currentDate: '05 September 2026',
  location: 'Assam Hydrocarbon Expansion - Pipeline & Viaduct Segment 4',
  coordinates: '23.2372406°N, 92.35341°E',
  activeShift: 'Day Shift 07:00 - 19:00',
  geodeticDatum: 'WGS84 UTM Zone 46N',
};

export const EVM_METRICS_DATA: EVMMetrics = {
  overallProgress: 72,
  cpi: 0.98,
  spi: 0.95,
  activeActivities: 48,
  delayPredictedDays: 4,
  delayPredictedLocation: 'Column C3',
  budgetStatus: 'Within Budget',
  scheduleStatus: 'Slight Delay',
};

export const S_CURVE_DATA: SCurvePoint[] = [
  { timePercent: 0, plan: 0, actual: 0 },
  { timePercent: 10, plan: 4, actual: 3 },
  { timePercent: 20, plan: 10, actual: 9 },
  { timePercent: 30, plan: 20, actual: 18 },
  { timePercent: 40, plan: 35, actual: 31 },
  { timePercent: 50, plan: 52, actual: 46 },
  { timePercent: 60, plan: 70, actual: 64 },
  { timePercent: 70, plan: 84, actual: 72, projected: 76 },
  { timePercent: 80, plan: 93, projected: 86 },
  { timePercent: 90, plan: 98, projected: 95 },
  { timePercent: 100, plan: 100, projected: 100 },
];

export const SPI_CPI_30_DAYS: SpiCpiTrendPoint[] = [
  { day: 1, cpi: 1.02, spi: 0.99, dateStr: '06 Aug' },
  { day: 3, cpi: 1.01, spi: 0.98, dateStr: '08 Aug' },
  { day: 5, cpi: 1.03, spi: 0.97, dateStr: '10 Aug' },
  { day: 7, cpi: 0.99, spi: 0.96, dateStr: '12 Aug' },
  { day: 9, cpi: 1.00, spi: 0.98, dateStr: '14 Aug' },
  { day: 11, cpi: 0.97, spi: 0.95, dateStr: '16 Aug' },
  { day: 13, cpi: 0.98, spi: 0.94, dateStr: '18 Aug' },
  { day: 15, cpi: 0.99, spi: 0.96, dateStr: '20 Aug' },
  { day: 17, cpi: 0.98, spi: 0.95, dateStr: '22 Aug' },
  { day: 19, cpi: 1.01, spi: 0.97, dateStr: '24 Aug' },
  { day: 21, cpi: 0.99, spi: 0.95, dateStr: '26 Aug' },
  { day: 23, cpi: 0.98, spi: 0.96, dateStr: '28 Aug' },
  { day: 25, cpi: 0.99, spi: 0.95, dateStr: '30 Aug' },
  { day: 27, cpi: 0.97, spi: 0.94, dateStr: '01 Sep' },
  { day: 29, cpi: 0.98, spi: 0.95, dateStr: '03 Sep' },
  { day: 30, cpi: 0.98, spi: 0.95, dateStr: '05 Sep' },
];

export const MONTHLY_ACTIVITY_DISTRIBUTION: MonthlyActivityDistribution[] = [
  { month: 'Jan', civil: 120, piping: 30, electrical: 15, instrumentation: 10 },
  { month: 'Feb', civil: 145, piping: 45, electrical: 22, instrumentation: 14 },
  { month: 'Mar', civil: 175, piping: 70, electrical: 38, instrumentation: 20 },
  { month: 'Apr', civil: 190, piping: 95, electrical: 55, instrumentation: 30 },
  { month: 'May', civil: 160, piping: 120, electrical: 80, instrumentation: 45 },
  { month: 'Jun', civil: 140, piping: 150, electrical: 95, instrumentation: 60 },
  { month: 'Jul', civil: 110, piping: 170, electrical: 110, instrumentation: 75 },
  { month: 'Aug', civil: 95, piping: 185, electrical: 130, instrumentation: 90 },
  { month: 'Sep', civil: 85, piping: 195, electrical: 145, instrumentation: 105 },
  { month: 'Oct', civil: 60, piping: 160, electrical: 155, instrumentation: 120 },
  { month: 'Nov', civil: 40, piping: 120, electrical: 140, instrumentation: 110 },
  { month: 'Dec', civil: 25, piping: 80, electrical: 110, instrumentation: 95 },
];

export const CONTRACTOR_PERFORMANCE_DATA: ContractorPerformance[] = [
  {
    id: 'cont-1',
    name: 'Larsen & Toubro Heavy Civil (L&T)',
    shortName: 'Contractor 1 (L&T)',
    scope: 'Substructure, Drilled Shafts, Segmental Piers',
    contributionPct: 35.5,
    cpi: 0.98,
    spi: 0.95,
    status: 'Within Budget',
    activeLabor: 142,
  },
  {
    id: 'cont-2',
    name: 'Piping Technology & Hydro Systems',
    shortName: 'Contractor 2 (Piping Tech)',
    scope: 'High-Pressure Hydrocarbon Line L24 Spool Fab',
    contributionPct: 27.5,
    cpi: 0.99,
    spi: 0.97,
    status: 'Optimal',
    activeLabor: 98,
  },
  {
    id: 'cont-3',
    name: 'Siemens Energy & Power Infrastructure',
    shortName: 'Contractor 3 (Siemens Power)',
    scope: '33kV Substation, Switchgear, Cathodic Protection',
    contributionPct: 18.5,
    cpi: 0.95,
    spi: 0.90,
    status: 'Slight Delay',
    activeLabor: 64,
  },
  {
    id: 'cont-4',
    name: 'Yokogawa Process Instrumentation Ltd.',
    shortName: 'Contractor 4 (Instrumentation)',
    scope: 'SCADA Telemetry, RTU Cabinets, Pipeline Sensing',
    contributionPct: 18.5,
    cpi: 0.95,
    spi: 0.98,
    status: 'Optimal',
    activeLabor: 48,
  },
];

export const RECENT_ACTIVITY_FEED_DATA: RecentActivityFeedItem[] = [
  {
    id: 'act-1',
    timestamp: '05 Sep 2026 14:15',
    relativeTime: '10 min ago',
    contractor: 'Civil Supervisor (Larsen & Toubro)',
    contractorBadge: 'L&T Civil',
    role: 'Site Supervisor',
    activityId: 'WBS-L4-PILE-F12',
    wbsCode: '1.1.2.4',
    status: 'Completed',
    quantityNote: 'Foundation F12 completed (80 m3)',
    sourceDoc: 'L24_DailyReport.pdf',
    docType: 'pdf',
    verified: true,
  },
  {
    id: 'act-2',
    timestamp: '05 Sep 2026 13:40',
    relativeTime: '45 min ago',
    contractor: 'Piping Contractor',
    contractorBadge: 'Piping Tech',
    role: 'Lead Welder QA',
    activityId: 'WBS-L3-PIPE-L24',
    wbsCode: '2.4.1.2',
    status: 'Fabrication in Progress',
    quantityNote: 'Line L24 fab finished (12 spools, 45% completion)',
    sourceDoc: 'L24_DailyReport.pdf',
    docType: 'pdf',
    verified: true,
  },
  {
    id: 'act-3',
    timestamp: '05 Sep 2026 12:45',
    relativeTime: '1h ago',
    contractor: 'Siemens Electrical',
    contractorBadge: 'Siemens Energy',
    role: 'Field Engineer',
    activityId: 'WBS-L2-ELEC-T1',
    wbsCode: '3.1.0.8',
    status: 'Daily Scan Uploaded',
    quantityNote: 'Substation Transformer 33kV Uplink Verified',
    sourceDoc: 'Siemens_Scan_05Sep.scan',
    docType: 'scan',
    verified: true,
  },
  {
    id: 'act-4',
    timestamp: '05 Sep 2026 11:15',
    relativeTime: '3h ago',
    contractor: 'Autonomous Drone Fleet',
    contractorBadge: 'DJI Matrice 350',
    role: 'LiDAR Survey Pilot',
    activityId: 'WBS-L1-AERO-SCAN-P34',
    wbsCode: '0.4.8.1',
    status: 'Photogrammetry Orthomosaic Mesh Processed',
    quantityNote: 'Segment P34 alignment verified (+-3mm tolerance)',
    sourceDoc: 'Segment_P34_LiDAR.pdf',
    docType: 'pdf',
    verified: true,
  },
];

// INFRA 4.0 Data Capture Engine
export const DRONE_DETECTIONS_DATA: DroneDetectionItem[] = [
  {
    id: 'det-1',
    label: 'Formwork 85%',
    confidence: 85,
    status: 'verified',
    boundingBox: { x: 18, y: 32, width: 22, height: 28 },
    thumbnailUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'det-2',
    label: 'Rebar 70%',
    confidence: 70,
    status: 'verified',
    boundingBox: { x: 44, y: 28, width: 24, height: 32 },
    thumbnailUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'det-3',
    label: 'Rebar 70%',
    confidence: 70,
    status: 'verified',
    boundingBox: { x: 72, y: 30, width: 20, height: 26 },
    thumbnailUrl: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=400&q=80',
  },
];

export const DRONE_EVENT_LOGS: string[] = [
  'Event Log: Segment P34 complete',
  'Event Log: Segment P34 complete',
  'Event Log: Segment P34 complete',
  'Event Log: Segment P34 complete complete',
  'Event Log: Column C3 rebar cover scan verified (45mm)',
  'Event Log: Tremie pipe depth sensor calibrated: -18.2m',
];

// INFRA 4.0 Dynamic Schedule-Linking Layer
export const WBS_AUTO_UPDATES_DATA: WbsAutoUpdateItem[] = [
  {
    id: 'wbs-up-1',
    code: '1.1.2',
    title: 'Pile Foundation',
    statusText: 'UPDATED to 95%',
    statusType: 'updated',
    progress: 95,
    lastUpdated: '10 min ago',
    discipline: 'Civil',
  },
  {
    id: 'wbs-up-2',
    code: '1.1.3',
    title: 'Column C3',
    statusText: 'LINKED & UPDATED',
    statusType: 'linked',
    progress: 68,
    lastUpdated: '25 min ago',
    discipline: 'Civil',
    varianceNote: 'Delay Predicted: +4 Days',
  },
  {
    id: 'wbs-up-3',
    code: '1.1.3',
    title: 'Column C3 (Pier Head Cap)',
    statusText: 'LINKED & UPDATED',
    statusType: 'linked',
    progress: 68,
    lastUpdated: '40 min ago',
    discipline: 'Civil',
  },
  {
    id: 'wbs-up-4',
    code: '1.1.3',
    title: 'Column C3 (Anchor Bolts)',
    statusText: 'LINKED & UPDATED',
    statusType: 'linked',
    progress: 74,
    lastUpdated: '1h ago',
    discipline: 'Civil',
  },
  {
    id: 'wbs-up-5',
    code: '2.1.0',
    title: 'High-Pressure Gas Manifold',
    statusText: 'LINKED & UPDATED',
    statusType: 'linked',
    progress: 58,
    lastUpdated: '2h ago',
    discipline: 'Piping',
  },
];

export const GANTT_CRITICAL_PATH_ITEMS = [
  {
    id: 'cp-1',
    date: '09 Aug 24',
    title: 'Pile Foundation F10-F14',
    status: 'Critical Path',
    color: '#06B6D4', // Cyan
    offsetPct: 10,
    widthPct: 35,
  },
  {
    id: 'cp-2',
    date: '11 Aug 23',
    title: 'Pier Column C3 Erection',
    status: 'Critical Path',
    color: '#F97316', // Orange
    offsetPct: 38,
    widthPct: 28,
  },
  {
    id: 'cp-3',
    date: '11 Aug 23',
    title: 'Formwork Shoring System',
    status: 'Milestones 1',
    color: '#10B981', // Emerald
    offsetPct: 45,
    widthPct: 22,
  },
  {
    id: 'cp-4',
    date: '12 Aug 24',
    title: 'Pre-Stressed Tendon Tensioning',
    status: 'Milestones 2',
    color: '#8B5CF6', // Purple
    offsetPct: 58,
    widthPct: 25,
  },
  {
    id: 'cp-5',
    date: '13 Aug 24',
    title: 'Deck Slab Concrete Casting',
    status: 'Milestones 3',
    color: '#3B82F6', // Blue
    offsetPct: 72,
    widthPct: 25,
  },
];

// INFRA 4.0 Discrepancy & Variance Alerts
export const CRITICAL_VARIANCE_ALERTS: CriticalVarianceAlert[] = [
  {
    id: 'var-1',
    type: 'variance',
    severity: 'critical',
    title: 'Variance Detected: Qty Mismatch 12%',
    description: 'Measured rebar mass in Pier C3 cap deviates 12% below structural schedule specs.',
    affectedElement: 'Pier C3 Cap (WBS 1.1.3)',
    impactDays: 4,
    timeAgo: '20 min ago',
    rootCause: 'Rebar fabricator substituted #8 bar with #6 bar without submittal signoff.',
    mitigationPlan: 'Issue hold notice. Structural PE review for supplementary rebar cage splice.',
  },
  {
    id: 'var-2',
    type: 'material_delay',
    severity: 'high',
    title: 'Alert: Material Delay - Delay P-Segment 4',
    description: 'Specialty high-tensile anchor heads delayed at dry-port logistics hub.',
    affectedElement: 'Segment P-4 Hydrocarbon Crossing',
    impactDays: 3,
    timeAgo: '1h ago',
    rootCause: 'Customs clearance hold on imported alloy certificates.',
    mitigationPlan: 'Expedited customs clearance agent deployed. Parallel work front opened at Pier 7.',
  },
  {
    id: 'var-3',
    type: 'material_delay',
    severity: 'medium',
    title: 'Alert: Material: Direct Delay P-Segment 4',
    description: 'Ready-mix batch truck turnaround exceeded 90 min initial setting threshold.',
    affectedElement: 'Segment P-4 Retaining Wall',
    impactDays: 1,
    timeAgo: '3h ago',
    rootCause: 'Heavy road congestion along East Haul bypass.',
    mitigationPlan: 'Reject batch truck #104. Reroute mixer traffic to North Access Corridor.',
  },
];

// INFRA 4.0 Low-Bandwidth Offline Sync Data
export const INITIAL_PENDING_SYNC_ITEMS: PendingSyncItem[] = [
  {
    id: 'sync-1',
    type: 'photo',
    title: 'Pier_P14_Rebar_Azimuth180.jpg',
    sizeKb: 1450,
    timestamp: '14:22',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?auto=format&fit=crop&w=200&q=80',
    status: 'pending',
  },
  {
    id: 'sync-2',
    type: 'report',
    title: 'BatchTicket_BT9042_ReadyMix.pdf',
    sizeKb: 820,
    timestamp: '14:10',
    status: 'pending',
  },
  {
    id: 'sync-3',
    type: 'voice_memo',
    title: 'VoiceMemo_Inspector_TrenchHazard.m4a',
    sizeKb: 2100,
    timestamp: '13:50',
    status: 'pending',
  },
  {
    id: 'sync-4',
    type: 'drone_scan',
    title: 'LiDAR_Segment_P34_Pointcloud.las',
    sizeKb: 7800,
    timestamp: '13:15',
    status: 'pending',
  },
];
