import React from 'react';

interface Player {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  avatar?: string;
}

interface Score {
  p1Score: string;
  p2Score: string;
  isSecondService?: boolean;
  type?: string;
  servePlacement?: string;
  courtPosition?: string;
  rallies?: string;
  missedShotWay?: string;
  missedShot?: string;
  placement?: string;
  betweenPointDuration?: number;
  p1Reaction?: string;
  p2Reaction?: string;
  server?: string;
  pointWinner?: string;
}

interface Game {
  gameNumber: number;
  scores: Score[];
  winner?: string;
  server: string;
  _id?: string;
}

interface Set {
  _id: string;
  setNumber: number;
  p1TotalScore: number;
  p2TotalScore: number;
  p1SetReport?: {
    service: {
      aces: number;
      doubleFaults: number;
      firstServePercentage: number;
      secondServePercentage: number;
    };
    return: {
      breakPointsWon: number;
      breakPointsFaced: number;
    };
  };
  p2SetReport?: {
    service: {
      aces: number;
      doubleFaults: number;
      firstServePercentage: number;
      secondServePercentage: number;
    };
    return: {
      breakPointsWon: number;
      breakPointsFaced: number;
    };
  };
  games?: Game[];
}

interface MatchData {
  _id: string;
  p1: Player | string;
  p2: Player | string;
  p1IsObject: boolean;
  p2IsObject: boolean;
  p1Name?: string;
  p2Name?: string;
  sets: Set[];
  status: string;
  winner?: string;
  report?: any;
  totalGameTime?: number;
  courtSurface?: string;
  matchType?: string;
  matchCategory?: string;
}

interface SetsTabProps {
  matchData: MatchData;
}

const SetsTab: React.FC<SetsTabProps> = ({ matchData }) => {
  const getPlayerName = (player: Player | string) => {
    if (typeof player === 'object' && player.firstName) {
      return `${player.firstName} ${player.lastName}`;
    }
    return player as string;
  };

  const getPlayerAvatar = (player: Player | string) => {
    if (typeof player === 'object' && player.avatar) {
      return player.avatar;
    }
    return '/default-avatar.png'; // Default avatar fallback
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTennisScore = (score: string) => {
    switch (score) {
      case '0': return '0';
      case '15': return '15';
      case '30': return '30';
      case '40': return '40';
      case 'AD': return 'AD';
      default: return score;
    }
  };

  const getGameFinalScore = (game: Game) => {
    // Get the final score from the last point played in the game
    if (game.scores && game.scores.length > 0) {
      const lastScore = game.scores[game.scores.length - 1];
      return {
        p1: formatTennisScore(lastScore.p1Score),
        p2: formatTennisScore(lastScore.p2Score)
      };
    }
    
    // If no scores available, show 0-0
    return { p1: '0', p2: '0' };
  };

  // Check if there's any data to display
  if (!matchData.sets || matchData.sets.length === 0) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Sets Data Available</h2>
          <p className="text-gray-600 mb-2">This match doesn't have any sets recorded yet.</p>
          <p className="text-sm text-gray-500">Sets data will appear here once the match begins and scoring is tracked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Match Sets & Games</h2>
        <p className="text-gray-600">Detailed breakdown of each set with individual games and point-by-point analysis</p>
      </div>
      
      <div className="space-y-8">
        {matchData.sets.map((set, index) => (
          <div key={set._id} className="w-full">
            {/* Set Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-blue-600 mb-2">Set {set.setNumber || index + 1}</h3>
              <div className="text-lg font-semibold text-gray-800">
                Set Score: {set.p1TotalScore}-{set.p2TotalScore}
              </div>
            </div>
            
            {/* Set Winner Badge */}
            {set.p1TotalScore !== null && set.p2TotalScore !== null && (
              <div className="mb-4 text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  set.p1TotalScore > set.p2TotalScore
                    ? 'text-green-600 bg-green-100 border border-green-200' 
                    : 'text-blue-600 bg-blue-100 border border-blue-200'
                }`}>
                  🏆 Set Winner: {set.p1TotalScore > set.p2TotalScore
                    ? getPlayerName(matchData.p1)
                    : getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2')
                  }
                </span>
              </div>
            )}

            {/* Games Grid - 3 per row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {set.games && set.games.length > 0 ? (
                set.games.map((game, gameIndex) => (
                  <div key={game._id || gameIndex} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-sm font-medium text-gray-800">
                        Game {game.gameNumber || gameIndex + 1}
                      </div>
                      <div className="text-xs text-gray-500">
                        {game.server === 'playerOne' 
                          ? `${getPlayerName(matchData.p1)} serves`
                          : game.server === 'playerTwo'
                          ? `${getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2')} serves`
                          : 'Server not specified'
                        }
                      </div>
                    </div>
                    
                    {/* Game Score */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-center flex-1">
                        <div className="text-xl font-bold text-gray-800">
                          {getGameFinalScore(game).p1}
                        </div>
                        <div className="text-xs text-gray-600">
                          {getPlayerName(matchData.p1)}
                        </div>
                      </div>
                      <div className="text-center text-gray-400 text-lg font-bold">-</div>
                      <div className="text-center flex-1">
                        <div className="text-xl font-bold text-gray-800">
                          {getGameFinalScore(game).p2}
                        </div>
                        <div className="text-xs text-gray-600">
                          {getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Debug Info - Remove this after fixing */}
                    <div className="text-xs text-gray-500 mb-2 p-2 bg-yellow-50 rounded">
                      Debug: Scores count: {game.scores?.length || 0} | 
                      Final game score (last score): {game.scores && game.scores.length > 0 ? 
                        `${game.scores[game.scores.length - 1].p1Score}-${game.scores[game.scores.length - 1].p2Score}` : 'None'
                      }
                    </div>
                    
                    {/* Game Result Summary */}
                    <div className="text-center mb-3 p-2 bg-gray-50 rounded-lg">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        Game Result
                      </div>
                      <div className="text-lg font-bold">
                        {game.winner === 'playerOne' 
                          ? `${getPlayerName(matchData.p1)} wins`
                          : `${getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2')} wins`
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        Final Score: {getGameFinalScore(game).p1} - {getGameFinalScore(game).p2}
                      </div>
                    </div>
                    
                    {/* Game Winner */}
                    {game.winner && (
                      <div className="text-center mb-3">
                        <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                          game.winner === 'playerOne' 
                            ? 'text-green-600 bg-green-100 border border-green-200' 
                            : 'text-blue-600 bg-blue-100 border border-blue-200'
                        }`}>
                          🏆 Winner: {game.winner === 'playerOne' 
                            ? getPlayerName(matchData.p1)
                            : getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2')
                          }
                        </span>
                      </div>
                    )}
                    
                    {/* Game Points (if available) */}
                    {game.scores && game.scores.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-700 mb-2">Point-by-Point:</div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {game.scores.map((score, scoreIndex) => (
                            <div key={scoreIndex} className="bg-gray-50 rounded p-2 border border-gray-100">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium text-gray-800">
                                  Point {scoreIndex + 1}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded ${
                                  score.pointWinner === 'playerOne' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {score.pointWinner === 'playerOne' 
                                    ? getPlayerName(matchData.p1)
                                    : getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2')
                                  }
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-1 text-xs">
                                <div>
                                  <span className="text-gray-600">Score: </span>
                                  <span className="font-medium">{formatTennisScore(score.p1Score)}-{formatTennisScore(score.p2Score)}</span>
                                </div>
                                {score.type && (
                                  <div>
                                    <span className="text-gray-600">Type: </span>
                                    <span className="font-medium capitalize">{score.type.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                  </div>
                                )}
                                {score.servePlacement && (
                                  <div>
                                    <span className="text-gray-600">Serve: </span>
                                    <span className="font-medium capitalize">{score.servePlacement}</span>
                                  </div>
                                )}
                                {score.placement && (
                                  <div>
                                    <span className="text-gray-600">Placement: </span>
                                    <span className="font-medium capitalize">{score.placement.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 text-sm">
                  No games recorded for this set
                </div>
              )}
            </div>
            
            {/* Set Summary Footer */}
            <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200 bg-white rounded-lg p-4 shadow-sm">
              <div className="text-gray-600">Total Games: {set.games?.length || 0}</div>
              <div className="text-gray-600">Set Score: {set.p1TotalScore}-{set.p2TotalScore}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetsTab;
