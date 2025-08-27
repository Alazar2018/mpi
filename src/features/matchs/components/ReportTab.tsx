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
  report?: any;
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Check if there's any report data to display
  if (!matchData.report) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Match Report Available</h2>
          <p className="text-gray-600 mb-2">This match doesn't have any detailed report data recorded yet.</p>
          <p className="text-sm text-gray-500">Detailed statistics and analysis will appear here once the match is completed and analyzed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Match Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Match Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatTime(matchData.totalGameTime || 0)}</div>
            <div className="text-sm text-gray-600">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{matchData.courtSurface || 'N/A'}</div>
            <div className="text-sm text-gray-600">Court Surface</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{matchData.matchType || 'N/A'}</div>
            <div className="text-sm text-gray-600">Match Type</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{matchData.matchCategory || 'N/A'}</div>
            <div className="text-sm text-gray-600">Category</div>
          </div>
        </div>
      </div>

      {/* Statistics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Servings Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Servings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.serves.p1.firstServesWon + matchData.report?.serves.p1.secondServesWon}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">Total Services</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.serves.p2.firstServesWon + matchData.report?.serves.p2.secondServesWon}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.serves.p1.firstServesWon}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">First Serves</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.serves.p2.firstServesWon}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.serves.p1.secondServesWon}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">Second Serves</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.serves.p2.secondServesWon}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {formatPercentage(matchData.report?.serves.p1.firstServesWonPercentage)}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">1st Service %</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {formatPercentage(matchData.report?.serves.p2.firstServesWonPercentage)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {formatPercentage(matchData.report?.serves.p1.secondServesWonPercentage)}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">2nd Service %</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {formatPercentage(matchData.report?.serves.p2.secondServesWonPercentage)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.acesPlacement.p1.t + matchData.report?.acesPlacement.p1.wide + matchData.report?.acesPlacement.p1.body}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">Aces</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.acesPlacement.p2.t + matchData.report?.acesPlacement.p2.wide + matchData.report?.acesPlacement.p2.body}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Points Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Points</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.points.p1.won}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">Total Points Won</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.points.p2.won}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.winners.p1.forehand + matchData.report?.winners.p1.backhand + matchData.report?.winners.p1.returnForehand + matchData.report?.winners.p1.returnBackhand}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">Winners</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.winners.p2.forehand + matchData.report?.winners.p2.backhand + matchData.report?.winners.p2.returnForehand + matchData.report?.winners.p2.returnBackhand}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.errorStats.p1.unforced.total || 0}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">Unforced Errors</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.errorStats.p2.unforced.total || 0}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.errorStats.p1.forced.total || 0}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">Forced Errors</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.errorStats.p2.forced.total || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Conversions Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Conversions</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.serves.p1.firstServesWon}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">First Serves Points Won</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.serves.p2.firstServesWon}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.serves.p1.secondServesWon}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">Second Serve</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.serves.p2.secondServesWon}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.returnStats.p1.firstServeWon + matchData.report?.returnStats.p1.secondServeWon}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">Receiving Points Won</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.returnStats.p2.firstServeWon + matchData.report?.returnStats.p2.secondServeWon}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.errorStats.p1.unforced.total || 0}
                </span>
              </div>
              <div className="text-center flex-1 text-gray-600">Unforced Errors</div>
              <div className="text-center flex-1">
                <span className="text-lg font-semibold text-gray-800">
                  {matchData.report?.errorStats.p2.unforced.total || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Names Display */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center space-x-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-green-600">
                {getPlayerName(matchData.p1) ? getPlayerName(matchData.p1).split(' ').map(n => n[0]).join('') : 'P1'}
              </span>
            </div>
            <div className="font-semibold text-gray-800">{getPlayerName(matchData.p1) || 'Player 1'}</div>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-xl font-bold text-blue-600">
                {getPlayerName(matchData.p2) ? getPlayerName(matchData.p2).split(' ').map(n => n[0]).join('') : 'P2'}
              </span>
            </div>
            <div className="font-semibold text-gray-800">{getPlayerName(matchData.p2) || 'Player 2'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportTab;
