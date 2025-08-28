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
    p1: { forced: any; unforced: any };
    p2: { forced: any; unforced: any };
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

  return (
    <div className="p-6 bg-[var(--bg-primary)] min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 transition-colors duration-300">Match Report & Statistics</h2>
        <p className="text-[var(--text-secondary)] transition-colors duration-300">Comprehensive analysis of match performance and statistics</p>
      </div>

      <div className="space-y-6">
        {/* Service Section */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">Service Statistics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {matchData.report?.serves.p1.firstServesWon}
                </span>
              </div>
              <div className="text-center flex-1 text-[var(--text-secondary)] transition-colors duration-300">First Serves</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {matchData.report?.serves.p2.firstServesWon}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {matchData.report?.serves.p1.secondServesWon}
                </span>
              </div>
              <div className="text-center flex-1 text-[var(--text-secondary)] transition-colors duration-300">Second Serves</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {matchData.report?.serves.p2.secondServesWon}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {formatPercentage(matchData.report?.serves.p1.firstServesWonPercentage)}
                </span>
              </div>
              <div className="text-center flex-1 text-[var(--text-secondary)] transition-colors duration-300">1st Service %</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {formatPercentage(matchData.report?.serves.p2.firstServesWonPercentage)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {formatPercentage(matchData.report?.serves.p1.secondServesWonPercentage)}
                </span>
              </div>
              <div className="text-center flex-1 text-[var(--text-secondary)] transition-colors duration-300">2nd Service %</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {formatPercentage(matchData.report?.serves.p2.secondServesWonPercentage)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {matchData.report?.acesPlacement.p1.t + matchData.report?.acesPlacement.p1.wide + matchData.report?.acesPlacement.p1.body}
                </span>
              </div>
              <div className="text-center flex-1 text-[var(--text-secondary)] transition-colors duration-300">Aces</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {matchData.report?.acesPlacement.p2.t + matchData.report?.acesPlacement.p2.wide + matchData.report?.acesPlacement.p2.body}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Points Section */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">Points</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {matchData.report?.points.p1.won}
                </span>
              </div>
              <div className="text-center flex-1 text-[var(--text-secondary)] transition-colors duration-300">Total Points Won</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {matchData.report?.points.p2.won}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {matchData.report?.winners.p1.forehand + matchData.report?.winners.p1.backhand + matchData.report?.winners.p1.returnForehand + matchData.report?.winners.p1.returnBackhand}
                </span>
              </div>
              <div className="text-center flex-1 text-[var(--text-secondary)] transition-colors duration-300">Winners</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {matchData.report?.winners.p2.forehand + matchData.report?.winners.p2.backhand + matchData.report?.winners.p2.returnForehand + matchData.report?.winners.p2.returnBackhand}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {matchData.report?.errorStats.p1.forced + matchData.report?.errorStats.p1.unforced}
                </span>
              </div>
              <div className="text-center flex-1 text-[var(--text-secondary)] transition-colors duration-300">Errors</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {matchData.report?.errorStats.p2.forced + matchData.report?.errorStats.p2.unforced}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Serve Placement Section */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">First Serve Placement</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                {matchData.report?.firstServePlacement.p1.wide}
              </div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Wide</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                {matchData.report?.firstServePlacement.p1.body}
              </div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Body</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                {matchData.report?.firstServePlacement.p1.t}
              </div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">T</div>
            </div>
          </div>
        </div>

        {/* Return Statistics */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">Return Statistics</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {formatPercentage(matchData.report?.returnStats.p1.firstServeWonPercentage)}
                </span>
              </div>
              <div className="text-center flex-1 text-[var(--text-secondary)] transition-colors duration-300">1st Serve Return %</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {formatPercentage(matchData.report?.returnStats.p2.firstServeWonPercentage)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {formatPercentage(matchData.report?.returnStats.p1.secondServeWonPercentage)}
                </span>
              </div>
              <div className="text-center flex-1 text-[var(--text-secondary)] transition-colors duration-300">2nd Serve Return %</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                  {formatPercentage(matchData.report?.returnStats.p2.secondServeWonPercentage)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Match Summary */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 transition-colors duration-300">Match Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-[var(--bg-secondary)] rounded-lg transition-colors duration-300">
              <div className="text-2xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                {getPlayerName(matchData.p1)}
              </div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Player 1</div>
            </div>
            <div className="text-center p-4 bg-[var(--bg-secondary)] rounded-lg transition-colors duration-300">
              <div className="text-2xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                {getPlayerName(matchData.p2)}
              </div>
              <div className="text-sm text-[var(--text-secondary)] transition-colors duration-300">Player 2</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportTab;
