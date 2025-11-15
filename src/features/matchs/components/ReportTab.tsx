import React, { useMemo } from 'react';
import CourtCoverageCourt from './CourtCoverageCourt';

interface Player {
  _id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface PlayerMatchReport {
  service?: {
    totalServices?: number;
    firstServicePercentage?: number;
    secondServicePercentage?: number;
    aces?: number;
    doubleFaults?: number;
    firstServices?: number;
    secondServices?: number;
  };
  points?: {
    totalPointsWon?: number;
    winners?: number;
    unforcedErrors?: number;
    forcedErrors?: number;
  };
  rallies?: {
    oneToFour?: number;
    fiveToEight?: number;
    nineToTwelve?: number;
    thirteenToTwenty?: number;
    twentyOnePlus?: number;
  };
  conversion?: {
    firstServicePointsWon?: number;
    secondServicePointsWon?: number;
    receivingPointsWon?: number;
    breakPoints?: number;
    gamePoints?: number;
  };
  response?: {
    negativeResponses?: number;
    positiveResponses?: number;
    negativeSelfTalks?: number;
    positiveSelfTalks?: number;
    noResponses?: number;
  };
  courtPositions?: {
    out?: number;
    outPercentage?: number;
    net?: number;
    netPercentage?: number;
    leftCourt?: number;
    leftCourtPercentage?: number;
    middleCourt?: number;
    middleCourtPercentage?: number;
    rightCourt?: number;
    rightCourtPercentage?: number;
  };
}

interface JointReport {
  points?: {
    total?: number;
    p1?: { won?: number; wonPercentage?: number };
    p2?: { won?: number; wonPercentage?: number };
  };
  winners?: {
    total?: number;
    p1?: {
      percentage?: number;
      forehand?: number;
      backhand?: number;
      returnForehand?: number;
      returnBackhand?: number;
    };
    p2?: {
      percentage?: number;
      forehand?: number;
      backhand?: number;
      returnForehand?: number;
      returnBackhand?: number;
    };
  };
  errorStats?: {
    total?: number;
    p1?: {
      forced?: {
        percentage?: number;
        forehand?: { total?: number; volley?: number; slice?: number };
        backhand?: { total?: number; volley?: number; slice?: number };
      };
      unforced?: {
        percentage?: number;
        forehand?: { total?: number; volley?: number; slice?: number; swingingVolley?: number; dropShot?: number };
        backhand?: { total?: number; volley?: number; slice?: number; swingingVolley?: number; dropShot?: number };
      };
    };
    p2?: {
      forced?: {
        percentage?: number;
        forehand?: { total?: number; volley?: number; slice?: number };
        backhand?: { total?: number; volley?: number; slice?: number };
      };
      unforced?: {
        percentage?: number;
        forehand?: { total?: number; volley?: number; slice?: number; swingingVolley?: number; dropShot?: number };
        backhand?: { total?: number; volley?: number; slice?: number; swingingVolley?: number; dropShot?: number };
      };
    };
  };
  lastShot?: {
    p1?: { winPercentage?: number; losePercentage?: number };
    p2?: { winPercentage?: number; losePercentage?: number };
  };
  breakPoints?: {
    p1?: { total?: number; saved?: number; savedPercentage?: number; converted?: number; convertedPercentage?: number };
    p2?: { total?: number; saved?: number; savedPercentage?: number; converted?: number; convertedPercentage?: number };
  };
  gamePoints?: {
    p1?: { total?: number; saved?: number; savedPercentage?: number; converted?: number; convertedPercentage?: number };
    p2?: { total?: number; saved?: number; savedPercentage?: number; converted?: number; convertedPercentage?: number };
  };
  serves?: {
    total?: number;
    p1?: {
      firstServesWon?: number;
      firstServesWonPercentage?: number;
      firstServesLost?: number;
      firstServesLostPercentage?: number;
      secondServesWon?: number;
      secondServesWonPercentage?: number;
      secondServesLost?: number;
      secondServesLostPercentage?: number;
    };
    p2?: {
      firstServesWon?: number;
      firstServesWonPercentage?: number;
      firstServesLost?: number;
      firstServesLostPercentage?: number;
      secondServesWon?: number;
      secondServesWonPercentage?: number;
      secondServesLost?: number;
      secondServesLostPercentage?: number;
    };
  };
  firstServePlacement?: {
    p1?: { wide?: number; widePercentage?: number; body?: number; bodyPercentage?: number; t?: number; tPercentage?: number; net?: number; netPercentage?: number };
    p2?: { wide?: number; widePercentage?: number; body?: number; bodyPercentage?: number; t?: number; tPercentage?: number; net?: number; netPercentage?: number };
  };
  acesPlacement?: {
    p1?: { wide?: number; widePercentage?: number; body?: number; bodyPercentage?: number; t?: number; tPercentage?: number; net?: number; netPercentage?: number };
    p2?: { wide?: number; widePercentage?: number; body?: number; bodyPercentage?: number; t?: number; tPercentage?: number; net?: number; netPercentage?: number };
  };
  returnStats?: {
    p1?: {
      total?: number;
      firstServe?: number;
      firstServePercentage?: number;
      firstServeWon?: number;
      firstServeWonPercentage?: number;
      firstServeLost?: number;
      firstServeLostPercentage?: number;
      secondServe?: number;
      secondServePercentage?: number;
      secondServeWon?: number;
      secondServeWonPercentage?: number;
      secondServeLost?: number;
      secondServeLostPercentage?: number;
    };
    p2?: {
      total?: number;
      firstServe?: number;
      firstServePercentage?: number;
      firstServeWon?: number;
      firstServeWonPercentage?: number;
      firstServeLost?: number;
      firstServeLostPercentage?: number;
      secondServe?: number;
      secondServePercentage?: number;
      secondServeWon?: number;
      secondServeWonPercentage?: number;
      secondServeLost?: number;
      secondServeLostPercentage?: number;
    };
  };
  rallyLengthFrequency?: {
    oneToFour?: number;
    fiveToEight?: number;
    nineToTwelve?: number;
    thirteenToTwenty?: number;
    twentyOnePlus?: number;
  };
  averageRally?: number;
  courtPositions?: {
    p1?: { out?: number; outPercentage?: number; net?: number; netPercentage?: number; leftCourt?: number; leftCourtPercentage?: number; middleCourt?: number; middleCourtPercentage?: number; rightCourt?: number; rightCourtPercentage?: number };
    p2?: { out?: number; outPercentage?: number; net?: number; netPercentage?: number; leftCourt?: number; leftCourtPercentage?: number; middleCourt?: number; middleCourtPercentage?: number; rightCourt?: number; rightCourtPercentage?: number };
  };
}

interface MatchData {
  _id: string;
  p1: Player | string;
  p2: Player | string;
  p1IsObject: boolean;
  p2IsObject: boolean;
  p1Name?: string;
  p2Name?: string;
  sets: any[];
  status?: string;
  winner?: string;
  report?: JointReport;
  p1MatchReport?: PlayerMatchReport;
  p2MatchReport?: PlayerMatchReport;
  totalGameTime?: number;
  courtSurface?: string;
  matchType?: string;
  matchCategory?: string;
}

interface ReportTabProps {
  matchData: MatchData;
}

interface SummaryCardConfig {
  title: string;
  value: string;
  hint?: string;
  accent?: 'emerald' | 'sky' | 'amber' | 'violet' | 'rose' | 'neutral';
}

interface ComparisonRowConfig {
  label: string;
  p1Value?: number | null;
  p2Value?: number | null;
  p1Display?: string;
  p2Display?: string;
  showBar?: boolean;
  valueType?: 'number' | 'percentage';
}

const formatNumber = (value?: number | null, fallback = '—') => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.abs(num % 1) < 0.01 ? num.toFixed(0) : num.toFixed(1).replace(/\.0$/, '');
};

const formatPercentage = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '0%';
  const num = Number(value);
  const formatted = Math.abs(num % 1) < 0.05 ? num.toFixed(0) : num.toFixed(1);
  return `${formatted.replace(/\.0$/, '')}%`;
};

const formatCountWithPercent = (count?: number | null, percentage?: number | null) => {
  const countDisplay = formatNumber(count, '0');
  const percentDisplay = formatPercentage(percentage);
  return `${countDisplay} (${percentDisplay})`;
};

const formatRatio = (converted?: number | null, total?: number | null) => {
  return `${formatNumber(converted, '0')} / ${formatNumber(total, '0')}`;
};

const formatDuration = (minutes?: number | null) => {
  if (minutes === undefined || minutes === null || Number.isNaN(Number(minutes)) || Number(minutes) <= 0) return '—';
  const totalMinutes = Math.round(Number(minutes));
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

const formatStatus = (status?: string) => {
  if (!status) return '—';
  return status.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
};

const formatSectionTitle = (key: string) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase());
};

const formatPlacementValue = (count?: number, percentage?: number) => {
  if (count === undefined && percentage === undefined) return '—';
  const countDisplay = formatNumber(count, '0');
  const percentageDisplay = percentage !== undefined ? formatPercentage(percentage) : '';
  return percentageDisplay ? `${countDisplay} (${percentageDisplay})` : countDisplay;
};

  const getPlayerName = (player: Player | string) => {
  if (typeof player === 'object' && player?.firstName) {
    return `${player.firstName} ${player.lastName ?? ''}`.trim();
    }
    return player as string;
  };

const StatCard: React.FC<SummaryCardConfig> = ({ title, value, hint, accent = 'neutral' }) => {
  const accentClasses: Record<string, string> = {
    emerald: 'border-emerald-300/60 bg-emerald-500/5',
    sky: 'border-sky-300/60 bg-sky-500/5',
    amber: 'border-amber-300/60 bg-amber-500/5',
    violet: 'border-violet-300/60 bg-violet-500/5',
    rose: 'border-rose-300/60 bg-rose-500/5',
    neutral: 'border-[var(--border-primary)] bg-[var(--bg-secondary)]',
  };

  return (
    <div className={`rounded-xl border p-4 transition-all duration-300 ${accentClasses[accent]}`}>
      <div className="text-xs uppercase tracking-wide text-[var(--text-tertiary)] mb-1">{title}</div>
      <div className="text-2xl font-semibold text-[var(--text-primary)]">{value}</div>
      {hint && <div className="text-xs text-[var(--text-secondary)] mt-1">{hint}</div>}
    </div>
  );
};

const ComparisonCard: React.FC<{
  title: string;
  description?: string;
  rows: ComparisonRowConfig[];
  accent?: 'emerald' | 'sky' | 'violet';
}> = ({ title, description, rows, accent = 'violet' }) => {
  const accentBorder: Record<string, string> = {
    emerald: 'border-emerald-300/60',
    sky: 'border-sky-300/60',
    violet: 'border-violet-300/60',
  };

    return (
    <div className={`bg-[var(--bg-card)] rounded-2xl border ${accentBorder[accent]} px-6 py-5 shadow-[var(--shadow-secondary)] transition-colors duration-300`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>}
      </div>
      <div className="space-y-4">
        {rows.map((row) => (
          <ComparisonRow key={row.label} {...row} />
        ))}
        </div>
      </div>
    );
};

const ComparisonRow: React.FC<ComparisonRowConfig> = ({
  label,
  p1Value,
  p2Value,
  p1Display,
  p2Display,
  showBar,
  valueType = 'number',
}) => {
  const formattedP1 = p1Display ?? (valueType === 'percentage' ? formatPercentage(p1Value) : formatNumber(p1Value, '0'));
  const formattedP2 = p2Display ?? (valueType === 'percentage' ? formatPercentage(p2Value) : formatNumber(p2Value, '0'));

  const total = (Number(p1Value) || 0) + (Number(p2Value) || 0);
  const p1Share = showBar && total > 0 ? (Number(p1Value) || 0) / total : 0.5;
  const p2Share = showBar && total > 0 ? (Number(p2Value) || 0) / total : 0.5;

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-sm text-[var(--text-secondary)]">{label}</div>
        <div className="flex items-center gap-6 text-right">
          <span className="min-w-[72px] text-sm font-semibold text-emerald-500">{formattedP1}</span>
          <span className="h-6 w-px bg-[var(--border-primary)]" />
          <span className="min-w-[72px] text-sm font-semibold text-sky-500">{formattedP2}</span>
        </div>
      </div>
      {showBar && (
        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
          <div className="bg-emerald-500 transition-all duration-300" style={{ width: `${p1Share * 100}%` }} />
          <div className="bg-sky-500 transition-all duration-300" style={{ width: `${p2Share * 100}%` }} />
        </div>
      )}
    </div>
  );
};

const StatChip: React.FC<{ label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }> = ({
  label,
  value,
  tone = 'default',
}) => {
  const toneClasses: Record<string, string> = {
    default: 'bg-[var(--bg-secondary)] border-[var(--border-primary)]',
    success: 'bg-emerald-500/10 border-emerald-400/50 text-emerald-600',
    warning: 'bg-amber-500/10 border-amber-400/50 text-amber-600',
    danger: 'bg-rose-500/10 border-rose-400/50 text-rose-600',
  };

  return (
    <div className={`rounded-xl border px-3 py-2 text-left transition-colors duration-300 ${toneClasses[tone]}`}>
      <div className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">{label}</div>
      <div className="text-base font-semibold text-[var(--text-primary)]">{value}</div>
              </div>
  );
};

const StatGroup: React.FC<{ title: string; items: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }[] }> = ({
  title,
  items,
}) => {
  const filteredItems = items.filter((item) => item.value && item.value !== '—' && item.value !== '0');
  if (filteredItems.length === 0) return null;

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide text-[var(--text-tertiary)] mb-2">{title}</h4>
      <div className="grid grid-cols-2 gap-3">
        {filteredItems.map((item) => (
          <StatChip key={item.label} {...item} />
        ))}
              </div>
            </div>
  );
};

const PlacementCard: React.FC<{
  title: string;
  p1Name: string;
  p2Name: string;
  data?: { p1?: Record<string, number | undefined>; p2?: Record<string, number | undefined> };
}> = ({ title, p1Name, p2Name, data }) => {
  if (!data?.p1 && !data?.p2) return null;

  const rows = [
    { key: 'wide', label: 'Wide' },
    { key: 'body', label: 'Body' },
    { key: 't', label: 'T' },
    { key: 'net', label: 'Net' },
  ];

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] px-6 py-5 shadow-[var(--shadow-secondary)] transition-colors duration-300">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{title}</h3>
      <div className="overflow-hidden rounded-xl border border-[var(--border-primary)]">
        <div className="grid grid-cols-3 bg-[var(--bg-secondary)] px-4 py-2 text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
          <span>Location</span>
          <span className="text-right">{p1Name}</span>
          <span className="text-right">{p2Name}</span>
              </div>
        {rows.map(({ key, label }) => (
          <div key={key} className="grid grid-cols-3 border-t border-[var(--border-primary)] px-4 py-2 text-sm">
            <span className="text-[var(--text-secondary)]">{label}</span>
            <span className="text-right font-semibold text-emerald-500">
              {formatPlacementValue(data?.p1?.[key], data?.p1?.[`${key}Percentage` as keyof typeof data.p1] as number | undefined)}
            </span>
            <span className="text-right font-semibold text-sky-500">
              {formatPlacementValue(data?.p2?.[key], data?.p2?.[`${key}Percentage` as keyof typeof data.p2] as number | undefined)}
            </span>
          </div>
        ))}
          </div>
        </div>
  );
};

const ReturnPlacementCard: React.FC<{
  title: string;
  p1Name: string;
  p2Name: string;
  data?: {
    p1?: Record<string, Record<string, number | undefined>>;
    p2?: Record<string, Record<string, number | undefined>>;
  };
}> = ({ title, p1Name, p2Name, data }) => {
  const allSections = Array.from(
    new Set([
      ...(data?.p1 ? Object.keys(data.p1) : []),
      ...(data?.p2 ? Object.keys(data.p2) : []),
    ]),
  );

  if (allSections.length === 0) return null;

  const preferredOrder = [
    'firstServe',
    'firstServeForehand',
    'firstServeBackhand',
    'secondServe',
    'secondServeForehand',
    'secondServeBackhand',
  ];

  const orderedSections = [
    ...preferredOrder.filter((key) => allSections.includes(key)),
    ...allSections.filter((key) => !preferredOrder.includes(key)),
  ];

  const rows = [
    { key: 'wide', label: 'Wide' },
    { key: 'body', label: 'Body' },
    { key: 't', label: 'T' },
    { key: 'net', label: 'Net' },
  ];

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] px-6 py-5 shadow-[var(--shadow-secondary)] transition-colors duration-300">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{title}</h3>
      <div className="space-y-4">
        {orderedSections.map((sectionKey) => {
          const p1Section = data?.p1?.[sectionKey];
          const p2Section = data?.p2?.[sectionKey];
          if (!p1Section && !p2Section) return null;

          return (
            <div key={sectionKey} className="overflow-hidden rounded-xl border border-[var(--border-primary)]">
              <div className="bg-[var(--bg-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                {formatSectionTitle(sectionKey)}
              </div>
              <div className="grid grid-cols-3 bg-[var(--bg-secondary)] px-4 py-2 text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                <span>Location</span>
                <span className="text-right">{p1Name}</span>
                <span className="text-right">{p2Name}</span>
              </div>
              {rows.map(({ key, label }) => (
                <div key={key} className="grid grid-cols-3 border-t border-[var(--border-primary)] px-4 py-2 text-sm">
                  <span className="text-[var(--text-secondary)]">{label}</span>
                  <span className="text-right font-semibold text-emerald-500">
                    {formatPlacementValue(
                      p1Section?.[key],
                      p1Section?.[`${key}Percentage` as keyof typeof p1Section] as number | undefined,
                    )}
                  </span>
                  <span className="text-right font-semibold text-sky-500">
                    {formatPlacementValue(
                      p2Section?.[key],
                      p2Section?.[`${key}Percentage` as keyof typeof p2Section] as number | undefined,
                    )}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DistributionCard: React.FC<{
  title: string;
  items: { label: string; value?: number | null }[];
}> = ({ title, items }) => {
  const total = items.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
  if (total === 0) return null;

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] px-6 py-5 shadow-[var(--shadow-secondary)] transition-colors duration-300">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item) => {
          const value = Number(item.value) || 0;
          const percent = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>{item.label}</span>
                <span className="text-[var(--text-primary)] font-medium">
                  {formatNumber(value, '0')} ({formatPercentage(percent)})
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-[var(--bg-secondary)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
              </div>
            </div>
  );
};

const PlayerReportCard: React.FC<{
  playerName: string;
  report?: PlayerMatchReport;
  accent?: 'emerald' | 'sky';
}> = ({ playerName, report, accent = 'emerald' }) => {
  const accentBorder = accent === 'emerald' ? 'border-emerald-300/60' : 'border-sky-300/60';

  return (
    <div className={`rounded-2xl border ${accentBorder} bg-[var(--bg-card)] px-6 py-5 shadow-[var(--shadow-secondary)] transition-colors duration-300`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{playerName}</h3>
        <span className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">Player Report</span>
          </div>
      {!report ? (
        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-5 text-sm text-[var(--text-secondary)]">
          No player-specific report recorded yet.
        </div>
      ) : (
        <div className="space-y-5">
          <StatGroup
            title="Serving"
            items={[
              { label: 'Total Serves', value: formatNumber(report.service?.totalServices, '0') },
              { label: '1st Serves Attempted', value: formatNumber(report.service?.firstServices, '0') },
              { label: '2nd Serves Attempted', value: formatNumber(report.service?.secondServices, '0') },
              { label: '1st Serve %', value: formatPercentage(report.service?.firstServicePercentage) },
              { label: '2nd Serve %', value: formatPercentage(report.service?.secondServicePercentage) },
              { label: 'Aces', value: formatNumber(report.service?.aces, '0'), tone: 'success' },
              { label: 'Double Faults', value: formatNumber(report.service?.doubleFaults, '0'), tone: 'danger' },
            ]}
          />

          <StatGroup
            title="Point Conversion"
            items={[
              { label: 'Points Won', value: formatNumber(report.points?.totalPointsWon, '0'), tone: 'success' },
              { label: 'Winners', value: formatNumber(report.points?.winners, '0'), tone: 'success' },
              { label: 'Forced Errors', value: formatNumber(report.points?.forcedErrors, '0'), tone: 'warning' },
              { label: 'Unforced Errors', value: formatNumber(report.points?.unforcedErrors, '0'), tone: 'danger' },
              { label: '1st Serve Pts Won', value: formatNumber(report.conversion?.firstServicePointsWon, '0') },
              { label: '2nd Serve Pts Won', value: formatNumber(report.conversion?.secondServicePointsWon, '0') },
              { label: 'Receiving Pts Won', value: formatNumber(report.conversion?.receivingPointsWon, '0') },
              { label: 'Game Points', value: formatNumber(report.conversion?.gamePoints, '0') },
              { label: 'Break Points', value: formatNumber(report.conversion?.breakPoints, '0') },
            ]}
          />

          <StatGroup
            title="Mindset & Response"
            items={[
              { label: 'Positive Responses', value: formatNumber(report.response?.positiveResponses, '0'), tone: 'success' },
              { label: 'Negative Responses', value: formatNumber(report.response?.negativeResponses, '0'), tone: 'danger' },
              { label: 'Positive Self Talk', value: formatNumber(report.response?.positiveSelfTalks, '0'), tone: 'success' },
              { label: 'Negative Self Talk', value: formatNumber(report.response?.negativeSelfTalks, '0'), tone: 'danger' },
              { label: 'No Responses', value: formatNumber(report.response?.noResponses, '0') },
            ]}
          />

          <StatGroup
            title="Rally Length"
            items={[
              { label: '1-4 shots', value: formatNumber(report.rallies?.oneToFour, '0') },
              { label: '5-8 shots', value: formatNumber(report.rallies?.fiveToEight, '0') },
              { label: '9-12 shots', value: formatNumber(report.rallies?.nineToTwelve, '0') },
              { label: '13-20 shots', value: formatNumber(report.rallies?.thirteenToTwenty, '0') },
              { label: '21+ shots', value: formatNumber(report.rallies?.twentyOnePlus, '0') },
            ]}
          />

          <StatGroup
            title="Court Usage"
            items={[
              {
                label: 'Left Court',
                value: formatCountWithPercent(report.courtPositions?.leftCourt, report.courtPositions?.leftCourtPercentage),
              },
              {
                label: 'Middle Court',
                value: formatCountWithPercent(report.courtPositions?.middleCourt, report.courtPositions?.middleCourtPercentage),
              },
              {
                label: 'Right Court',
                value: formatCountWithPercent(report.courtPositions?.rightCourt, report.courtPositions?.rightCourtPercentage),
              },
              {
                label: 'Net Visits',
                value: formatCountWithPercent(report.courtPositions?.net, report.courtPositions?.netPercentage),
              },
              {
                label: 'Out',
                value: formatCountWithPercent(report.courtPositions?.out, report.courtPositions?.outPercentage),
                tone: 'warning',
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

const ReportTab: React.FC<ReportTabProps> = ({ matchData }) => {
  const jointReport = matchData.report;
  const p1Report = matchData.p1MatchReport;
  const p2Report = matchData.p2MatchReport;

  const hasAnyData = jointReport || p1Report || p2Report;

  if (!hasAnyData) {
    return (
      <div className="p-6 bg-[var(--bg-primary)] min-h-screen transition-colors duration-300">
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-primary)] p-12 text-center shadow-[var(--shadow-secondary)] transition-colors duration-300">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No Report Data Available</h2>
          <p className="text-[var(--text-secondary)]">
            This match doesn&apos;t have any detailed report data recorded yet. Reports will appear here once tracking data is saved.
          </p>
              </div>
            </div>
    );
  }

  const p1Name = getPlayerName(matchData.p1);
  const p2Name = getPlayerName(matchData.p2);

  const summaryCards: SummaryCardConfig[] = useMemo(() => {
    const totalPoints =
      jointReport?.points?.total ??
      (Number(p1Report?.points?.totalPointsWon) || 0) + (Number(p2Report?.points?.totalPointsWon) || 0);
    const totalServes =
      jointReport?.serves?.total ??
      (Number(p1Report?.service?.totalServices) || 0) + (Number(p2Report?.service?.totalServices) || 0);
    const totalAces = (Number(p1Report?.service?.aces) || 0) + (Number(p2Report?.service?.aces) || 0);

    return [
      {
        title: 'Total Points Played',
        value: formatNumber(totalPoints),
        hint: 'Combined from tracking data',
        accent: 'emerald' as const,
      },
      {
        title: 'Total Serves',
        value: formatNumber(totalServes),
        hint: 'Sum of both players',
        accent: 'sky' as const,
      },
      {
        title: 'Average Rally Length',
        value: jointReport?.averageRally !== undefined ? `${formatNumber(jointReport.averageRally)} shots` : '—',
        hint: jointReport?.averageRally !== undefined ? 'From match report' : undefined,
        accent: 'violet' as const,
      },
      {
        title: 'Match Duration',
        value: formatDuration(matchData.totalGameTime ? matchData.totalGameTime / 60 : undefined),
        hint: matchData.totalGameTime ? 'Tracked time' : undefined,
        accent: 'amber' as const,
      },
      {
        title: 'Aces Recorded',
        value: formatNumber(totalAces, '0'),
        hint: 'From player reports',
        accent: 'rose' as const,
      },
      {
        title: 'Match Status',
        value: formatStatus(matchData.status),
        accent: 'neutral' as const,
      },
    ].filter((card) => card.value && card.value !== '—');
  }, [jointReport, p1Report, p2Report, matchData.totalGameTime, matchData.status]);

  const headToHeadRows: ComparisonRowConfig[] = useMemo(() => {
    if (!jointReport) return [];
    return [
      {
        label: 'Points Won',
        p1Value: jointReport.points?.p1?.won,
        p2Value: jointReport.points?.p2?.won,
        p1Display: formatCountWithPercent(jointReport.points?.p1?.won, jointReport.points?.p1?.wonPercentage),
        p2Display: formatCountWithPercent(jointReport.points?.p2?.won, jointReport.points?.p2?.wonPercentage),
        showBar: true,
      },
      {
        label: 'Break Points Converted',
        p1Display: formatRatio(jointReport.breakPoints?.p1?.converted, jointReport.breakPoints?.p1?.total),
        p2Display: formatRatio(jointReport.breakPoints?.p2?.converted, jointReport.breakPoints?.p2?.total),
      },
      {
        label: 'Game Points Converted',
        p1Display: formatRatio(jointReport.gamePoints?.p1?.converted, jointReport.gamePoints?.p1?.total),
        p2Display: formatRatio(jointReport.gamePoints?.p2?.converted, jointReport.gamePoints?.p2?.total),
      },
      {
        label: 'Last Shot Win %',
        p1Value: jointReport.lastShot?.p1?.winPercentage,
        p2Value: jointReport.lastShot?.p2?.winPercentage,
        valueType: 'percentage',
      },
    ];
  }, [jointReport]);

  const serveRows: ComparisonRowConfig[] = useMemo(() => {
    if (!jointReport) return [];
    return [
      {
        label: '1st Serves Won',
        p1Value: jointReport.serves?.p1?.firstServesWon,
        p2Value: jointReport.serves?.p2?.firstServesWon,
        showBar: true,
      },
      {
        label: '1st Serve Win %',
        p1Value: jointReport.serves?.p1?.firstServesWonPercentage,
        p2Value: jointReport.serves?.p2?.firstServesWonPercentage,
        valueType: 'percentage',
      },
      {
        label: '2nd Serves Won',
        p1Value: jointReport.serves?.p1?.secondServesWon,
        p2Value: jointReport.serves?.p2?.secondServesWon,
        showBar: true,
      },
      {
        label: '2nd Serve Win %',
        p1Value: jointReport.serves?.p1?.secondServesWonPercentage,
        p2Value: jointReport.serves?.p2?.secondServesWonPercentage,
        valueType: 'percentage',
      },
      {
        label: 'Aces',
        p1Value: p1Report?.service?.aces,
        p2Value: p2Report?.service?.aces,
        showBar: true,
      },
    ];
  }, [jointReport, p1Report, p2Report]);

  const returnRows: ComparisonRowConfig[] = useMemo(() => {
    if (!jointReport) return [];
    return [
      {
        label: '1st Serve Return %',
        p1Value: jointReport.returnStats?.p1?.firstServeWonPercentage,
        p2Value: jointReport.returnStats?.p2?.firstServeWonPercentage,
        valueType: 'percentage',
      },
      {
        label: '2nd Serve Return %',
        p1Value: jointReport.returnStats?.p1?.secondServeWonPercentage,
        p2Value: jointReport.returnStats?.p2?.secondServeWonPercentage,
        valueType: 'percentage',
      },
      {
        label: 'Return Winners (est.)',
        p1Value:
          (jointReport.winners?.p1?.returnForehand || 0) + (jointReport.winners?.p1?.returnBackhand || 0),
        p2Value:
          (jointReport.winners?.p2?.returnForehand || 0) + (jointReport.winners?.p2?.returnBackhand || 0),
        showBar: true,
      },
    ];
  }, [jointReport]);

  const errorRows: ComparisonRowConfig[] = useMemo(() => {
    if (!jointReport) return [];
    const p1Forced =
      (jointReport.errorStats?.p1?.forced?.forehand?.total || 0) +
      (jointReport.errorStats?.p1?.forced?.backhand?.total || 0);
    const p2Forced =
      (jointReport.errorStats?.p2?.forced?.forehand?.total || 0) +
      (jointReport.errorStats?.p2?.forced?.backhand?.total || 0);
    const p1Unforced =
      (jointReport.errorStats?.p1?.unforced?.forehand?.total || 0) +
      (jointReport.errorStats?.p1?.unforced?.backhand?.total || 0);
    const p2Unforced =
      (jointReport.errorStats?.p2?.unforced?.forehand?.total || 0) +
      (jointReport.errorStats?.p2?.unforced?.backhand?.total || 0);
    const p1Winners =
      (jointReport.winners?.p1?.forehand || 0) +
      (jointReport.winners?.p1?.backhand || 0) +
      (jointReport.winners?.p1?.returnForehand || 0) +
      (jointReport.winners?.p1?.returnBackhand || 0);
    const p2Winners =
      (jointReport.winners?.p2?.forehand || 0) +
      (jointReport.winners?.p2?.backhand || 0) +
      (jointReport.winners?.p2?.returnForehand || 0) +
      (jointReport.winners?.p2?.returnBackhand || 0);

    return [
      {
        label: 'Total Winners',
        p1Value: p1Winners,
        p2Value: p2Winners,
        showBar: true,
      },
      {
        label: 'Forced Errors',
        p1Value: p1Forced,
        p2Value: p2Forced,
        showBar: true,
      },
      {
        label: 'Unforced Errors',
        p1Value: p1Unforced,
        p2Value: p2Unforced,
        showBar: true,
      },
    ];
  }, [jointReport]);

  return (
    <div className="p-6 bg-[var(--bg-primary)] min-h-screen transition-colors duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Match Report & Insights</h2>
        <p className="text-[var(--text-secondary)]">
          Snapshot of the match, head-to-head comparisons, and player-specific analytics.
        </p>
            </div>

      <div className="space-y-8">
         {summaryCards.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {summaryCards.map((card) => (
              <StatCard key={card.title} {...card} />
            ))}
          </div>
        )}

        {jointReport && (
          <div className="grid gap-6 lg:grid-cols-2">
            <ComparisonCard
              title="Head-to-head Summary"
              description="Key match-defining pressure moments and momentum indicators."
              rows={headToHeadRows}
              accent="violet"
            />
            <ComparisonCard
              title="Serve Performance"
              description="How well each player held serve under pressure."
              rows={serveRows}
              accent="emerald"
            />
          </div>
        )}

        {jointReport && (
          <ComparisonCard
            title="Return & Shot Making"
            description="Effectiveness on return games and shot conversion."
            rows={[...returnRows, ...errorRows]}
            accent="sky"
          />
        )}

        {(p1Report || p2Report) && (
          <div className="grid gap-6 md:grid-cols-2">
            <PlayerReportCard playerName={p1Name} report={p1Report} accent="emerald" />
            <PlayerReportCard playerName={p2Name} report={p2Report} accent="sky" />
          </div>
        )}

        {jointReport && (
          <div className="grid gap-6 lg:grid-cols-2">
            <PlacementCard
              title="First Serve Placement"
              p1Name={p1Name}
              p2Name={p2Name}
              data={jointReport.firstServePlacement as any}
            />
            <PlacementCard
              title="Second Serve Placement"
              p1Name={p1Name}
              p2Name={p2Name}
              data={jointReport.secondServePlacement as any}
            />
            <PlacementCard
              title="Aces Placement"
              p1Name={p1Name}
              p2Name={p2Name}
              data={jointReport.acesPlacement as any}
            />
          </div>
        )}

        {jointReport?.returnPlacement && (
          <ReturnPlacementCard
            title="Return Placement Breakdown"
            p1Name={p1Name}
            p2Name={p2Name}
            data={jointReport.returnPlacement as any}
          />
        )}

        {jointReport?.rallyLengthFrequency && (
          <DistributionCard
            title="Rally Length Distribution"
            items={[
              { label: '1-4 shots', value: jointReport.rallyLengthFrequency.oneToFour },
              { label: '5-8 shots', value: jointReport.rallyLengthFrequency.fiveToEight },
              { label: '9-12 shots', value: jointReport.rallyLengthFrequency.nineToTwelve },
              { label: '13-20 shots', value: jointReport.rallyLengthFrequency.thirteenToTwenty },
              { label: '21+ shots', value: jointReport.rallyLengthFrequency.twentyOnePlus },
            ]}
          />
        )}

        {jointReport && (
          <CourtCoverageCourt
            p1Name={p1Name}
            p2Name={p2Name}
            data={jointReport.courtPositions}
          />
        )}
      </div>
    </div>
  );
};

export default ReportTab;