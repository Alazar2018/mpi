import React from 'react';

interface Player {
  _id: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

interface MatchReport {
  points: {
    total: number;
    p1: { won: number; wonPercentage: number };
    p2: { won: number; wonPercentage: number };
  };
  winners: {
    total: number;
    p1: { percentage: number; forehand: number; backhand: number; returnForehand: number; returnBackhand: number };
    p2: { percentage: number; forehand: number; backhand: number; returnForehand: number; returnBackhand: number };
  };
  errorStats: {
    total: number;
    p1: {
      forced: {
        percentage: number;
        forehand: { total: number; volley: number; slice: number };
        backhand: { total: number; volley: number; slice: number };
      };
      unforced: {
        percentage: number;
        forehand: { total: number; volley: number; slice: number; swingingVolley: number; dropShot: number };
        backhand: { total: number; volley: number; slice: number; swingingVolley: number; dropShot: number };
      };
    };
    p2: {
      forced: {
        percentage: number;
        forehand: { total: number; volley: number; slice: number };
        backhand: { total: number; volley: number; slice: number };
      };
      unforced: {
        percentage: number;
        forehand: { total: number; volley: number; slice: number; swingingVolley: number; dropShot: number };
        backhand: { total: number; volley: number; slice: number; swingingVolley: number; dropShot: number };
      };
    };
  };
  lastShot: {
    p1: { winPercentage: number; losePercentage: number };
    p2: { winPercentage: number; losePercentage: number };
  };
  breakPoints: {
    p1: { total: number; saved: number; savedPercentage: number; converted: number; convertedPercentage: number };
    p2: { total: number; saved: number; savedPercentage: number; converted: number; convertedPercentage: number };
  };
  gamePoints: {
    p1: { total: number; saved: number; savedPercentage: number; converted: number; convertedPercentage: number };
    p2: { total: number; saved: number; savedPercentage: number; converted: number; convertedPercentage: number };
  };
  serves: {
    total: number;
    p1: {
      firstServesWon: number;
      firstServesWonPercentage: number;
      firstServesLost: number;
      firstServesLostPercentage: number;
      secondServesWon: number;
      secondServesWonPercentage: number;
      secondServesLost: number;
      secondServesLostPercentage: number;
    };
    p2: {
      firstServesWon: number;
      firstServesWonPercentage: number;
      firstServesLost: number;
      firstServesLostPercentage: number;
      secondServesWon: number;
      secondServesWonPercentage: number;
      secondServesLost: number;
      secondServesLostPercentage: number;
    };
  };
  firstServePlacement: {
    p1: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
    p2: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
  };
  secondServePlacement: {
    p1: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
    p2: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
  };
  acesPlacement: {
    p1: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
    p2: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
  };
  returnStats: {
    p1: {
      total: number;
      firstServe: number;
      firstServePercentage: number;
      firstServeWon: number;
      firstServeWonPercentage: number;
      firstServeLost: number;
      firstServeLostPercentage: number;
      secondServe: number;
      secondServePercentage: number;
      secondServeWon: number;
      secondServeWonPercentage: number;
      secondServeLost: number;
      secondServeLostPercentage: number;
    };
    p2: {
      total: number;
      firstServe: number;
      firstServePercentage: number;
      firstServeWon: number;
      firstServeWonPercentage: number;
      firstServeLost: number;
      firstServeLostPercentage: number;
      secondServe: number;
      secondServePercentage: number;
      secondServeWon: number;
      secondServeWonPercentage: number;
      secondServeLost: number;
      secondServeLostPercentage: number;
    };
  };
  returnPlacement: {
    p1: {
      firstServe: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
      firstServeForehand: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
      firstServeBackhand: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
      secondServe: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
      secondServeForehand: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
      secondServeBackhand: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
    };
    p2: {
      firstServe: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
      firstServeForehand: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
      firstServeBackhand: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
      secondServe: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
      secondServeForehand: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
      secondServeBackhand: { wide: number; widePercentage: number; body: number; bodyPercentage: number; t: number; tPercentage: number; net: number; netPercentage: number };
    };
  };
  rallyLengthFrequency: {
    oneToFour: number;
    fiveToEight: number;
    nineToTwelve: number;
    thirteenToTwenty: number;
    twentyOnePlus: number;
  };
  averageRally: number;
  courtPositions: {
    p1: { out: number; outPercentage: number; net: number; netPercentage: number; leftCourt: number; leftCourtPercentage: number; middleCourt: number; middleCourtPercentage: number; rightCourt: number; rightCourtPercentage: number };
    p2: { out: number; outPercentage: number; net: number; netPercentage: number; leftCourt: number; leftCourtPercentage: number; middleCourt: number; middleCourtPercentage: number; rightCourt: number; rightCourtPercentage: number };
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
  status: string;
  winner?: string;
  report?: MatchReport;
  totalGameTime?: number;
  courtSurface?: string;
  matchType?: string;
  matchCategory?: string;
}

interface ReportTabProps {
  matchData: MatchData;
}

const ReportTab: React.FC<ReportTabProps> = ({ matchData }) => {
  const getPlayerName = (player: Player | string) => {
    if (typeof player === 'object' && player.firstName) {
      return `${player.firstName} ${player.lastName}`;
    }
    return player as string;
  };

  const formatPercentage = (value: number) => {
    if (value === undefined || value === null) return '0%';
    return `${Math.round(value)}%`;
  };

  const formatNumber = (value: number) => {
    if (value === undefined || value === null) return '0';
    return value.toString();
  };

  // Check if there's any report data to display
  if (!matchData.report) {
    return (
      <div className="p-6 bg-[var(--bg-primary)] min-h-screen transition-colors duration-300">
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-12 text-center border border-[var(--border-primary)] transition-colors duration-300">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 transition-colors duration-300">No Report Data Available</h2>
          <p className="text-[var(--text-secondary)] mb-2 transition-colors duration-300">This match doesn't have any detailed report data recorded yet.</p>
          <p className="text-sm text-[var(--text-tertiary)] transition-colors duration-300">Report data will appear here once the match is completed and analyzed.</p>
        </div>
      </div>
    );
  }

  const report = matchData.report;
  const p1Name = getPlayerName(matchData.p1);
  const p2Name = getPlayerName(matchData.p2);

  return (
    <div className="p-6 bg-[var(--bg-primary)] min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 transition-colors duration-300">Match Report & Statistics</h2>
        <p className="text-[var(--text-secondary)] transition-colors duration-300">Comprehensive analysis of match performance and statistics</p>
      </div>

      <div className="space-y-6">
        {/* Match Overview */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">Match Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                {formatNumber(report.points.total)}
              </div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Total Points</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                {formatNumber(report.averageRally)}
              </div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Avg Rally Length</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                {formatNumber(report.serves.total)}
              </div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Total Serves</div>
            </div>
          </div>
        </div>

        {/* Points Won */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">Points Won</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 transition-colors duration-300">
                {formatNumber(report.points.p1.won)}
              </div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">{p1Name}</div>
              <div className="text-xs text-[var(--text-tertiary)] transition-colors duration-300">
                {formatPercentage(report.points.p1.wonPercentage)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 transition-colors duration-300">
                {formatNumber(report.points.p2.won)}
              </div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">{p2Name}</div>
              <div className="text-xs text-[var(--text-tertiary)] transition-colors duration-300">
                {formatPercentage(report.points.p2.wonPercentage)}
              </div>
            </div>
          </div>
        </div>

        {/* Service Statistics */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">Service Statistics</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Metric</div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">{p1Name}</div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">{p2Name}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">1st Serves Won</div>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                {formatNumber(report.serves.p1.firstServesWon)}
              </div>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                {formatNumber(report.serves.p2.firstServesWon)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">1st Serve %</div>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                {formatPercentage(report.serves.p1.firstServesWonPercentage)}
              </div>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                {formatPercentage(report.serves.p2.firstServesWonPercentage)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">2nd Serves Won</div>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                {formatNumber(report.serves.p1.secondServesWon)}
              </div>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                {formatNumber(report.serves.p2.secondServesWon)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">2nd Serve %</div>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                {formatPercentage(report.serves.p1.secondServesWonPercentage)}
              </div>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                {formatPercentage(report.serves.p2.secondServesWonPercentage)}
              </div>
            </div>
          </div>
        </div>

        {/* Serve Placement */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">First Serve Placement</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 transition-colors duration-300">{p1Name}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.firstServePlacement.p1.wide)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Wide</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.firstServePlacement.p1.body)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Body</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.firstServePlacement.p1.t)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">T</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.firstServePlacement.p1.net)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Net</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 transition-colors duration-300">{p2Name}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.firstServePlacement.p2.wide)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Wide</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.firstServePlacement.p2.body)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Body</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.firstServePlacement.p2.t)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">T</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.firstServePlacement.p2.net)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Net</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Return Statistics */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">Return Statistics</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Metric</div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">{p1Name}</div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">{p2Name}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">1st Serve Return %</div>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                {formatPercentage(report.returnStats.p1.firstServeWonPercentage)}
              </div>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                {formatPercentage(report.returnStats.p2.firstServeWonPercentage)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">2nd Serve Return %</div>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                {formatPercentage(report.returnStats.p1.secondServeWonPercentage)}
              </div>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                {formatPercentage(report.returnStats.p2.secondServeWonPercentage)}
              </div>
            </div>
          </div>
        </div>

        {/* Winners & Errors */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">Winners & Errors</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Metric</div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">{p1Name}</div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">{p2Name}</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Winners</div>
              <div className="text-lg font-semibold text-green-600 transition-colors duration-300">
                {formatNumber(report.winners.p1.forehand + report.winners.p1.backhand + report.winners.p1.returnForehand + report.winners.p1.returnBackhand)}
              </div>
              <div className="text-lg font-semibold text-green-600 transition-colors duration-300">
                {formatNumber(report.winners.p2.forehand + report.winners.p2.backhand + report.winners.p2.returnForehand + report.winners.p2.returnBackhand)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Forced Errors</div>
              <div className="text-lg font-semibold text-orange-600 transition-colors duration-300">
                {formatNumber(report.errorStats.p1.forced.forehand.total + report.errorStats.p1.forced.backhand.total)}
              </div>
              <div className="text-lg font-semibold text-orange-600 transition-colors duration-300">
                {formatNumber(report.errorStats.p2.forced.forehand.total + report.errorStats.p2.forced.backhand.total)}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Unforced Errors</div>
              <div className="text-lg font-semibold text-red-600 transition-colors duration-300">
                {formatNumber(report.errorStats.p1.unforced.forehand.total + report.errorStats.p1.unforced.backhand.total)}
              </div>
              <div className="text-lg font-semibold text-red-600 transition-colors duration-300">
                {formatNumber(report.errorStats.p2.unforced.forehand.total + report.errorStats.p2.unforced.backhand.total)}
              </div>
            </div>
          </div>
        </div>

        {/* Break Points & Game Points */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">Break Points & Game Points</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 transition-colors duration-300">Break Points</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)] transition-colors duration-300">{p1Name}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.breakPoints.p1.converted)}/{formatNumber(report.breakPoints.p1.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)] transition-colors duration-300">{p2Name}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.breakPoints.p2.converted)}/{formatNumber(report.breakPoints.p2.total)}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 transition-colors duration-300">Game Points</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)] transition-colors duration-300">{p1Name}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.gamePoints.p1.converted)}/{formatNumber(report.gamePoints.p1.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--text-secondary)] transition-colors duration-300">{p2Name}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.gamePoints.p2.converted)}/{formatNumber(report.gamePoints.p2.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rally Length Distribution */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">Rally Length Distribution</h3>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                {formatNumber(report.rallyLengthFrequency.oneToFour)}
              </div>
              <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">1-4 shots</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                {formatNumber(report.rallyLengthFrequency.fiveToEight)}
              </div>
              <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">5-8 shots</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                {formatNumber(report.rallyLengthFrequency.nineToTwelve)}
              </div>
              <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">9-12 shots</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                {formatNumber(report.rallyLengthFrequency.thirteenToTwenty)}
              </div>
              <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">13-20 shots</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                {formatNumber(report.rallyLengthFrequency.twentyOnePlus)}
              </div>
              <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">21+ shots</div>
            </div>
          </div>
        </div>

        {/* Court Positions */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">Court Positions</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 transition-colors duration-300">{p1Name}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.courtPositions.p1.leftCourt)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Left Court</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.courtPositions.p1.middleCourt)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Middle Court</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.courtPositions.p1.rightCourt)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Right Court</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.courtPositions.p1.net)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Net</div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 transition-colors duration-300">{p2Name}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.courtPositions.p2.leftCourt)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Left Court</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.courtPositions.p2.middleCourt)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Middle Court</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.courtPositions.p2.rightCourt)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Right Court</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                    {formatNumber(report.courtPositions.p2.net)}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">Net</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportTab;