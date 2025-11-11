import React, { useMemo } from 'react';

interface CourtCoverageData {
  p1?: {
    leftCourt?: number;
    middleCourt?: number;
    rightCourt?: number;
    net?: number;
    out?: number;
  };
  p2?: {
    leftCourt?: number;
    middleCourt?: number;
    rightCourt?: number;
    net?: number;
    out?: number;
  };
}

interface CourtCoverageCourtProps {
  p1Name: string;
  p2Name: string;
  data?: CourtCoverageData;
}

const sanitize = (value?: number) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const formatNumber = (value?: number, fallback = '0') => {
  if (!Number.isFinite(Number(value))) return fallback;
  return Number(value).toString();
};

const formatPercentage = (value?: number, total?: number) => {
  if (!total || total <= 0 || !Number.isFinite(Number(value))) return '0%';
  const percent = (Number(value) / total) * 100;
  return `${Math.round(percent)}%`;
};

const buildPlayerTotals = (player?: CourtCoverageData['p1']) => {
  const left = sanitize(player?.leftCourt);
  const middle = sanitize(player?.middleCourt);
  const right = sanitize(player?.rightCourt);
  const net = sanitize(player?.net);
  const out = sanitize(player?.out);
  const total = left + middle + right + net + out;

  return {
    total,
    zones: [
      { label: 'Left Court', raw: left, percent: total > 0 ? (left / total) * 100 : 0 },
      { label: 'Middle Court', raw: middle, percent: total > 0 ? (middle / total) * 100 : 0 },
      { label: 'Right Court', raw: right, percent: total > 0 ? (right / total) * 100 : 0 },
    ],
    net: { raw: net, percent: total > 0 ? (net / total) * 100 : 0 },
    out: { raw: out, percent: total > 0 ? (out / total) * 100 : 0 },
  };
};

const CourtCoverageCourt: React.FC<CourtCoverageCourtProps> = ({ p1Name, p2Name, data }) => {
  const coverage = useMemo(() => ({
    p1: buildPlayerTotals(data?.p1),
    p2: buildPlayerTotals(data?.p2),
  }), [data]);

  const hasData = coverage.p1.total > 0 || coverage.p2.total > 0;

  const summaryRows = [
    {
      label: 'Tracked Points',
      p1: formatNumber(coverage.p1.total, '—'),
      p2: formatNumber(coverage.p2.total, '—'),
    },
    {
      label: 'Net Touches',
      p1: `${formatNumber(coverage.p1.net.raw, '—')} (${formatPercentage(coverage.p1.net.raw, coverage.p1.total)})`,
      p2: `${formatNumber(coverage.p2.net.raw, '—')} (${formatPercentage(coverage.p2.net.raw, coverage.p2.total)})`,
    },
    {
      label: 'Shots Out',
      p1: `${formatNumber(coverage.p1.out.raw, '—')} (${formatPercentage(coverage.p1.out.raw, coverage.p1.total)})`,
      p2: `${formatNumber(coverage.p2.out.raw, '—')} (${formatPercentage(coverage.p2.out.raw, coverage.p2.total)})`,
    },
  ];

  return (
    <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-secondary)]">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Court Coverage Summary</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Raw totals and share of tracked points, broken down by court zones.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3 text-xs text-[var(--text-secondary)]">
          {summaryRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1">
              <span className="uppercase tracking-wide text-[var(--text-tertiary)]">{row.label}</span>
              <div className="flex items-center gap-4 text-[var(--text-primary)] font-semibold">
                <span>{row.p1}</span>
                <span className="h-3 w-px bg-[var(--border-primary)]" />
                <span>{row.p2}</span>
              </div>
            </div>
          ))}
        </div>

        {hasData ? (
          <div className="grid gap-3 md:grid-cols-2">
            {[{ name: p1Name, data: coverage.p1 }, { name: p2Name, data: coverage.p2 }].map((player) => (
              <div key={player.name} className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-3 shadow-[var(--shadow-secondary)]">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{player.name}</span>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    Total {formatNumber(player.data.total, '—')} tracked points
                  </span>
                </div>

                <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                  {player.data.zones.map((zone) => (
                    <div key={zone.label} className="flex items-center justify-between">
                      <span className="uppercase tracking-wide">{zone.label}</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {formatNumber(zone.raw, '0')} ({formatPercentage(zone.raw, player.data.total)})
                      </span>
                    </div>
                  ))}
                  <div className="mt-3 flex items-center justify-between border-t border-[var(--border-primary)] pt-2 text-[var(--text-secondary)]">
                    <span className="uppercase tracking-wide">Net Touches</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatNumber(player.data.net.raw)} ({formatPercentage(player.data.net.raw, player.data.total)})
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[var(--text-secondary)]">
                    <span className="uppercase tracking-wide">Shots Out</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {formatNumber(player.data.out.raw)} ({formatPercentage(player.data.out.raw, player.data.total)})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-5 text-center text-xs text-[var(--text-secondary)]">
            No positional tracking data recorded for this match yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default CourtCoverageCourt;

