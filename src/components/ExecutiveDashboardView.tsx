import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Download,
  Info,
} from 'lucide-react';
import {
  PROJECT_METADATA,
  EVM_METRICS_DATA,
  S_CURVE_DATA,
  SPI_CPI_30_DAYS,
  MONTHLY_ACTIVITY_DISTRIBUTION,
  CONTRACTOR_PERFORMANCE_DATA,
  RECENT_ACTIVITY_FEED_DATA,
  RecentActivityFeedItem,
} from '../data/infra4Data';
import { DocumentVerificationModal } from './DocumentVerificationModal';

interface ExecutiveDashboardViewProps {
  onNavigateToEngines?: () => void;
  onNavigateToMobile?: () => void;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  onNavigateToEngines,
  onNavigateToMobile,
}) => {
  const [selectedActivity, setSelectedActivity] = useState<RecentActivityFeedItem | null>(null);
  const [hoveredSCurvePoint, setHoveredSCurvePoint] = useState<number | null>(null);
  const [hoveredSpiPoint, setHoveredSpiPoint] = useState<number | null>(null);

  // SVG S-Curve calculations
  const scurveWidth = 560;
  const scurveHeight = 220;
  const scurvePadding = { top: 20, right: 30, bottom: 35, left: 45 };

  const getSCurveX = (pct: number) => {
    return scurvePadding.left + (pct / 100) * (scurveWidth - scurvePadding.left - scurvePadding.right);
  };

  const getSCurveY = (val: number) => {
    return scurveHeight - scurvePadding.bottom - (val / 100) * (scurveHeight - scurvePadding.top - scurvePadding.bottom);
  };

  // Generate SVG path for Plan
  const planPath = S_CURVE_DATA.reduce((acc, pt, i) => {
    const x = getSCurveX(pt.timePercent);
    const y = getSCurveY(pt.plan);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Generate SVG path for Actual
  const actualPoints = S_CURVE_DATA.filter((pt) => pt.actual !== undefined);
  const actualPath = actualPoints.reduce((acc, pt, i) => {
    const x = getSCurveX(pt.timePercent);
    const y = getSCurveY(pt.actual!);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // SVG SPI/CPI 30-day calculations
  const trendWidth = 560;
  const trendHeight = 200;
  const trendPadding = { top: 20, right: 30, bottom: 35, left: 45 };

  // Y domain from 0.85 to 1.10
  const yMin = 0.85;
  const yMax = 1.10;

  const getTrendX = (dayIndex: number, total: number) => {
    return trendPadding.left + (dayIndex / (total - 1)) * (trendWidth - trendPadding.left - trendPadding.right);
  };

  const getTrendY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return trendHeight - trendPadding.bottom - ((clamped - yMin) / (yMax - yMin)) * (trendHeight - trendPadding.top - trendPadding.bottom);
  };

  const cpiPath = SPI_CPI_30_DAYS.reduce((acc, pt, i) => {
    const x = getTrendX(i, SPI_CPI_30_DAYS.length);
    const y = getTrendY(pt.cpi);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const spiPath = SPI_CPI_30_DAYS.reduce((acc, pt, i) => {
    const x = getTrendX(i, SPI_CPI_30_DAYS.length);
    const y = getTrendY(pt.spi);
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const baselineY = getTrendY(1.0);

  // Stacked Bar Calculation
  const maxStackValue = 450;
  const barSvgWidth = 560;
  const barSvgHeight = 200;
  const barPadding = { top: 20, right: 20, bottom: 30, left: 40 };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top Banner with Clean Minimalist Layout */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold flex items-center justify-center text-sm tracking-tight shadow-xs">
              OIL
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {PROJECT_METADATA.name}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {PROJECT_METADATA.enterprise}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {PROJECT_METADATA.projectTitle} • {PROJECT_METADATA.currentDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            {onNavigateToEngines && (
              <button
                type="button"
                onClick={onNavigateToEngines}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>INFRA 4.0 Engines</span>
              </button>
            )}
            {onNavigateToMobile && (
              <button
                type="button"
                onClick={onNavigateToMobile}
                className="px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Mobile Field View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Progress */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Overall Progress
            </span>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" /> On Schedule
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {EVM_METRICS_DATA.overallProgress}%
            </div>
            <span className="text-xs text-slate-400">
              Baseline 84%
            </span>
          </div>
          {/* Dual Progress Bar */}
          <div className="mt-3 w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-slate-900 dark:bg-white transition-all duration-500"
              style={{ width: `${EVM_METRICS_DATA.overallProgress}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Target: 84%</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">-12% Variance</span>
          </div>
        </div>

        {/* Cost Performance Index (CPI) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Cost Performance (CPI)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
              Under Budget
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {EVM_METRICS_DATA.cpi.toFixed(2)}
            </div>
            <span className="text-xs text-slate-400">Target ≥ 1.0</span>
          </div>
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Earned Value exceeds actual cost envelope across all civil packages.
          </p>
        </div>

        {/* Schedule Performance Index (SPI) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Schedule Performance (SPI)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40">
              Slight Delay
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {EVM_METRICS_DATA.spi.toFixed(2)}
            </div>
            <span className="text-xs text-slate-400">Target ≥ 1.0</span>
          </div>
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            4-day lag localized on Column C3 pier cap curing and delivery.
          </p>
        </div>

        {/* Activities in Progress */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active WBS Tasks
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
              4 Fronts
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {EVM_METRICS_DATA.activeActivities}
            </div>
            <span className="text-xs text-slate-400">Total 62</span>
          </div>
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Synchronized WBS nodes across multidisciplinary active shifts.
          </p>
        </div>
      </div>

      {/* Main Analytics Grid (Charts & Performance Summaries) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: S-Curve - Plan vs Actual Progress */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>S-Curve Progress Tracking</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cumulative project completion vs baseline plan
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600" /> Plan
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-white" /> Actual
                </span>
              </div>
            </div>

            {/* S-Curve SVG */}
            <div className="relative mt-5 w-full overflow-x-auto">
              <svg viewBox={`0 0 ${scurveWidth} ${scurveHeight}`} className="w-full h-auto">
                {/* Horizontal Grid lines */}
                {[0, 20, 40, 60, 80, 100].map((v) => {
                  const y = getSCurveY(v);
                  return (
                    <g key={v}>
                      <line
                        x1={scurvePadding.left}
                        y1={y}
                        x2={scurveWidth - scurvePadding.right}
                        y2={y}
                        className="stroke-slate-200 dark:stroke-slate-800"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={scurvePadding.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        className="fill-slate-400 dark:fill-slate-500"
                      >
                        {v}%
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Grid lines */}
                {[0, 20, 40, 60, 80, 100].map((v) => {
                  const x = getSCurveX(v);
                  return (
                    <g key={v}>
                      <line
                        x1={x}
                        y1={scurvePadding.top}
                        x2={x}
                        y2={scurveHeight - scurvePadding.bottom}
                        className="stroke-slate-200 dark:stroke-slate-800"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={x}
                        y={scurveHeight - scurvePadding.bottom + 16}
                        textAnchor="middle"
                        fontSize="10"
                        className="fill-slate-400 dark:fill-slate-500"
                      >
                        {v}%
                      </text>
                    </g>
                  );
                })}

                {/* Plan Curve */}
                <path d={planPath} fill="none" className="stroke-slate-400 dark:stroke-slate-600" strokeWidth="2" strokeDasharray="3 3" />

                {/* Actual Curve */}
                <path d={actualPath} fill="none" className="stroke-slate-900 dark:stroke-white" strokeWidth="2.5" />

                {/* Data Points on Actual */}
                {actualPoints.map((pt, i) => {
                  const x = getSCurveX(pt.timePercent);
                  const y = getSCurveY(pt.actual!);
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-slate-900 dark:fill-white stroke-white dark:stroke-slate-900 cursor-pointer hover:r-5 transition-all"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Delay Predicted Callout Box */}
                <g transform="translate(320, 95)">
                  <rect
                    x="0"
                    y="0"
                    width="145"
                    height="34"
                    rx="8"
                    className="fill-white dark:fill-slate-800 stroke-amber-300 dark:stroke-amber-700/60 shadow-sm"
                    strokeWidth="1"
                  />
                  <text x="10" y="14" className="fill-slate-500 dark:fill-slate-400" fontSize="9" fontWeight="500">
                    Delay Predicted:
                  </text>
                  <text x="10" y="27" className="fill-amber-600 dark:fill-amber-400" fontSize="11" fontWeight="600">
                    +4 Days, Column C3
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Project Time Elapsed: 70%</span>
            <span className="font-medium text-slate-900 dark:text-white">Actual Completion: 72%</span>
          </div>
        </div>

        {/* Chart 2: SPI and CPI Trends (Last 30 Days) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                  SPI and CPI 30-Day Trends
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Benchmark indexes relative to 1.0 parity baseline
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> CPI (Cost)
                </span>
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> SPI (Schedule)
                </span>
              </div>
            </div>

            {/* SPI/CPI SVG */}
            <div className="relative mt-5 w-full overflow-x-auto">
              <svg viewBox={`0 0 ${trendWidth} ${trendHeight}`} className="w-full h-auto">
                {/* Horizontal reference lines */}
                {[0.90, 0.95, 1.0, 1.05].map((val) => {
                  const y = getTrendY(val);
                  const isBaseline = val === 1.0;
                  return (
                    <g key={val}>
                      <line
                        x1={trendPadding.left}
                        y1={y}
                        x2={trendWidth - trendPadding.right}
                        y2={y}
                        className={isBaseline ? 'stroke-slate-400 dark:stroke-slate-500' : 'stroke-slate-200 dark:stroke-slate-800'}
                        strokeDasharray={isBaseline ? 'none' : '4 4'}
                        strokeWidth={isBaseline ? 1.5 : 1}
                      />
                      <text
                        x={trendPadding.left - 8}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="10"
                        className={isBaseline ? 'fill-slate-700 dark:fill-slate-300 font-semibold' : 'fill-slate-400 dark:fill-slate-500'}
                      >
                        {val.toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* CPI Curve */}
                <path d={cpiPath} fill="none" stroke="#10B981" strokeWidth="2.5" />

                {/* SPI Curve */}
                <path d={spiPath} fill="none" stroke="#F59E0B" strokeWidth="2.5" />

                {/* Trend Points */}
                {SPI_CPI_30_DAYS.map((pt, i) => {
                  const x = getTrendX(i, SPI_CPI_30_DAYS.length);
                  return (
                    <g key={i}>
                      <circle cx={x} cy={getTrendY(pt.cpi)} r="3" fill="#10B981" />
                      <circle cx={x} cy={getTrendY(pt.spi)} r="3" fill="#F59E0B" />
                    </g>
                  );
                })}

                {/* Date labels on bottom */}
                {[0, 5, 10, 15, 20, 25, 29].map((idx) => {
                  const x = getTrendX(idx, SPI_CPI_30_DAYS.length);
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={trendHeight - trendPadding.bottom + 16}
                      textAnchor="middle"
                      fontSize="9"
                      className="fill-slate-400 dark:fill-slate-500 font-mono"
                    >
                      {SPI_CPI_30_DAYS[idx]?.dateStr}
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">CPI 0.98 (Within Budget)</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">SPI 0.95 (Slight Delay)</span>
          </div>
        </div>
      </div>

      {/* Second Row: Monthly Activity Distribution & Project Performance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Activity Distribution (Civil, Piping, Electrical, Instrumentation) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                  Monthly Work Distribution
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Volume distribution across active engineering disciplines
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3.5 mt-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" /> Civil
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" /> Piping
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm" /> Electrical
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm" /> Instrumentation
              </span>
            </div>

            {/* Stacked Bars SVG */}
            <div className="relative mt-5 w-full overflow-x-auto">
              <svg viewBox={`0 0 ${barSvgWidth} ${barSvgHeight}`} className="w-full h-auto">
                {/* Horizontal lines */}
                {[0, 150, 300, 450].map((val) => {
                  const y =
                    barSvgHeight -
                    barPadding.bottom -
                    (val / maxStackValue) * (barSvgHeight - barPadding.top - barPadding.bottom);
                  return (
                    <g key={val}>
                      <line
                        x1={barPadding.left}
                        y1={y}
                        x2={barSvgWidth - barPadding.right}
                        y2={y}
                        className="stroke-slate-200 dark:stroke-slate-800"
                        strokeDasharray="4 4"
                        strokeWidth="1"
                      />
                      <text
                        x={barPadding.left - 6}
                        y={y + 4}
                        textAnchor="end"
                        fontSize="9"
                        className="fill-slate-400 dark:fill-slate-500"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Stacked bars */}
                {MONTHLY_ACTIVITY_DISTRIBUTION.map((item, idx) => {
                  const x =
                    barPadding.left +
                    (idx / MONTHLY_ACTIVITY_DISTRIBUTION.length) *
                      (barSvgWidth - barPadding.left - barPadding.right) +
                    6;
                  const barWidth = 24;

                  const civilHeight =
                    (item.civil / maxStackValue) * (barSvgHeight - barPadding.top - barPadding.bottom);
                  const pipingHeight =
                    (item.piping / maxStackValue) * (barSvgHeight - barPadding.top - barPadding.bottom);
                  const electricalHeight =
                    (item.electrical / maxStackValue) *
                    (barSvgHeight - barPadding.top - barPadding.bottom);
                  const instrHeight =
                    (item.instrumentation / maxStackValue) *
                    (barSvgHeight - barPadding.top - barPadding.bottom);

                  const yBottom = barSvgHeight - barPadding.bottom;
                  const yCivil = yBottom - civilHeight;
                  const yPiping = yCivil - pipingHeight;
                  const yElectrical = yPiping - electricalHeight;
                  const yInstr = yElectrical - instrHeight;

                  return (
                    <g key={item.month}>
                      {/* Civil (Bottom) */}
                      <rect
                        x={x}
                        y={yCivil}
                        width={barWidth}
                        height={civilHeight}
                        fill="#10B981"
                        rx="1"
                      />
                      {/* Piping */}
                      <rect
                        x={x}
                        y={yPiping}
                        width={barWidth}
                        height={pipingHeight}
                        fill="#F59E0B"
                        rx="1"
                      />
                      {/* Electrical */}
                      <rect
                        x={x}
                        y={yElectrical}
                        width={barWidth}
                        height={electricalHeight}
                        fill="#3B82F6"
                        rx="1"
                      />
                      {/* Instrumentation (Top) */}
                      <rect
                        x={x}
                        y={yInstr}
                        width={barWidth}
                        height={instrHeight}
                        fill="#6366F1"
                        rx="1"
                      />

                      {/* Month text label */}
                      <text
                        x={x + barWidth / 2}
                        y={barSvgHeight - barPadding.bottom + 14}
                        textAnchor="middle"
                        fontSize="9"
                        className="fill-slate-500 dark:fill-slate-400 font-mono"
                      >
                        {item.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Peak Activity: Civil Foundation → Piping Hydrocarbon Fab</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">Q3 Ramp Active</span>
          </div>
        </div>

        {/* Project Performance Summary */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Executive Performance Summary</span>
              </h3>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">EVM Status: STABLE</span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-750 space-y-1">
                <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                  Key Takeaways
                </span>
                <p>
                  Infrastructure project controls indicate healthy cost performance (CPI: 0.98), operating comfortably within approved capital expenditure envelopes.
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Critical path variance is localized to Column C3 segment assembly and ready-mix transport along haul route East.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-750 space-y-1">
                <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                  Trend Analysis
                </span>
                <p>
                  The 30-day moving average SPI of 0.95 indicates a projected schedule slip of 4 days if left unmitigated. The predictive engine recommends opening parallel rebar tie work at Pier Cap P14 to reclaim 2.5 critical path days.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Automated AI EVM Diagnostics</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">Updated 10 min ago</span>
          </div>
        </div>
      </div>

      {/* Contractor Performance Overview Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
              Contractor Performance Overview
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Multicontractor contribution, cost efficiency (CPI), and schedule compliance (SPI)
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">4 Active Consortiums</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px]">
                <th className="pb-3 font-semibold">Contractor</th>
                <th className="pb-3 font-semibold">Work Scope</th>
                <th className="pb-3 font-semibold text-right">Contribution</th>
                <th className="pb-3 font-semibold text-center">CPI</th>
                <th className="pb-3 font-semibold text-center">SPI</th>
                <th className="pb-3 font-semibold text-right">Active Crew</th>
                <th className="pb-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {CONTRACTOR_PERFORMANCE_DATA.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-semibold text-slate-900 dark:text-white">
                    {c.shortName}
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal">{c.name}</span>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{c.scope}</td>
                  <td className="py-3 text-right font-medium text-slate-800 dark:text-slate-200">
                    {c.contributionPct}%
                  </td>
                  <td className="py-3 text-center font-medium text-emerald-600 dark:text-emerald-400">
                    {c.cpi.toFixed(2)}
                  </td>
                  <td className="py-3 text-center font-medium text-amber-600 dark:text-amber-400">
                    {c.spi.toFixed(2)}
                  </td>
                  <td className="py-3 text-right text-slate-600 dark:text-slate-300">
                    {c.activeLabor} pax
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        c.status === 'Optimal'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                          : c.status === 'Within Budget'
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Feed with Evidence Verification */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
              Recent Activity Feed & Evidence Verification
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Certified field progress updates linked to source documents and batch records
            </p>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Certified Field Audit
          </span>
        </div>

        <div className="space-y-3">
          {RECENT_ACTIVITY_FEED_DATA.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 mt-0.5 shadow-2xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.timestamp}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {item.contractor}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      ID: {item.activityId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                    Status: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.status}</span> •{' '}
                    <span className="text-slate-600 dark:text-slate-400">{item.quantityNote}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Source: {item.sourceDoc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedActivity(item)}
                className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <span>View Document</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Verified Document Modal */}
      <DocumentVerificationModal
        isOpen={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        activityItem={selectedActivity}
      />
    </div>
  );
};
