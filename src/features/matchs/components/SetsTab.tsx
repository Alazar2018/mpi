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
  p1Score: string | number;
  p2Score: string | number;
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
  tieBreak?: {
    scores: Array<{
      p1Score: number;
      p2Score: number;
      isSecondService?: boolean;
      type?: string;
      servePlacement?: string;
      courtPosition?: string;
      rallies?: string;
      missedShotWay?: string | null;
      missedShot?: string | null;
      placement?: string | null;
      betweenPointDuration?: number;
      p1Reaction?: string;
      p2Reaction?: string;
      winner?: string;
      server?: string;
    }>;
    winner?: string;
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
  sets: Set[];
  status: string;
  winner?: string;
  report?: any;
  totalGameTime?: number;
  courtSurface?: string;
  matchType?: string;
  matchCategory?: string;
  matchFormat?: string;
}

// Helper function to check if match format is tiebreak-only
const isTiebreakOnlyFormat = (matchFormat?: string): boolean => {
  return matchFormat ? matchFormat.startsWith('tiebreak') : false;
};

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

  // Calculate court rotation for a specific game
  const getCourtRotationForGame = (gameNumber: number) => {
    // Court rotates after every odd-indexed game (1, 3, 5, 7, etc.)
    // Game 1: considered as (0) - normal - no swap yet
    // Game 2: considered as (1) - normal - swap happens after this game
    // Game 3: considered as (2) - rotated - now swapped
    // Game 4: considered as (3) - rotated - swap back happens after this game
    // Game 5: considered as (4) - normal - back to normal
    // Game 6: considered as (5) - normal - swap happens after this game
    // Game 7: considered as (6) - rotated - now swapped again
    // etc.
    // Convert game number to 0-based index, then calculate rotation
    const gameIndex = gameNumber - 1;
    return Math.floor(gameIndex / 2) % 2;
  };

  // Get the correct player display order based on court rotation
  const getPlayerDisplayOrder = (gameNumber: number) => {
    const rotation = getCourtRotationForGame(gameNumber);
    
    if (rotation === 0) {
      // Normal rotation: P1 on left, P2 on right
      return {
        leftPlayer: matchData.p1,
        rightPlayer: matchData.p2,
        leftPlayerName: getPlayerName(matchData.p1),
        rightPlayerName: getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2'),
        leftPlayerId: 'playerOne',
        rightPlayerId: 'playerTwo'
      };
    } else {
      // Rotated: P2 on left, P1 on right
      return {
        leftPlayer: matchData.p2,
        rightPlayer: matchData.p1,
        leftPlayerName: getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2'),
        rightPlayerName: getPlayerName(matchData.p1),
        leftPlayerId: 'playerTwo',
        rightPlayerId: 'playerOne'
      };
    }
  };

  // Get the correct score display based on court rotation
  const getRotatedScore = (game: Game, gameNumber: number) => {
    const rotation = getCourtRotationForGame(gameNumber);
    
    if (game.scores && game.scores.length > 0) {
      const lastScore = game.scores[game.scores.length - 1];
      
      if (rotation === 0) {
        // Normal rotation: P1 score on left, P2 score on right
        return {
          leftScore: formatTennisScore(lastScore.p1Score),
          rightScore: formatTennisScore(lastScore.p2Score)
        };
      } else {
        // Rotated: P2 score on left, P1 score on right
        return {
          leftScore: formatTennisScore(lastScore.p2Score),
          rightScore: formatTennisScore(lastScore.p1Score)
        };
      }
    }
    
    // Default scores
    return { leftScore: '0', rightScore: '0' };
  };

  // Get the correct game winner display based on court rotation
  const getRotatedGameWinner = (game: Game, gameNumber: number) => {
    const rotation = getCourtRotationForGame(gameNumber);
    const playerOrder = getPlayerDisplayOrder(gameNumber);
    
    if (game.winner === 'playerOne') {
      return rotation === 0 ? playerOrder.leftPlayerName : playerOrder.rightPlayerName;
    } else if (game.winner === 'playerTwo') {
      return rotation === 0 ? playerOrder.rightPlayerName : playerOrder.leftPlayerName;
    }
    
    return 'Unknown';
  };

  // Get the correct server display based on court rotation
  const getRotatedServer = (game: Game, gameNumber: number) => {
    const rotation = getCourtRotationForGame(gameNumber);
    const playerOrder = getPlayerDisplayOrder(gameNumber);
    
    if (game.server === 'playerOne') {
      return rotation === 0 ? playerOrder.leftPlayerName : playerOrder.rightPlayerName;
    } else if (game.server === 'playerTwo') {
      return rotation === 0 ? playerOrder.rightPlayerName : playerOrder.leftPlayerName;
    }
    
    return 'Server not specified';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTennisScore = (score: string | number) => {
    const normalized = typeof score === 'number' ? score.toString() : score;
    switch (normalized) {
      case '0': return '0';
      case '15': return '15';
      case '30': return '30';
      case '40': return '40';
      case 'AD': return 'AD';
      default: return normalized;
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

  const formatTieBreakScore = (score: number) => {
    return Number.isFinite(score) ? score.toString() : '0';
  };

  const renderTieBreakPoints = (set: Set, setIndex: number) => {
    const tieBreakScores = set.tieBreak?.scores || [];

    return (
      <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h4 className="text-xl font-semibold text-[var(--text-primary)] transition-colors duration-300">
              Tie-Break Set {set.setNumber || setIndex + 1}
            </h4>
            <p className="text-sm text-[var(--text-secondary)] transition-colors duration-300">
              Final Score: {set.p1TotalScore}-{set.p2TotalScore}
            </p>
          </div>
          {set.tieBreak?.winner && (
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
              🏆 Tie-Break Winner: {set.tieBreak.winner === 'playerOne'
                ? getPlayerName(matchData.p1)
                : getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2')}
            </span>
          )}
        </div>

        {tieBreakScores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border-primary)]">
              <thead className="bg-[var(--bg-secondary)]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider transition-colors duration-300">
                    Point
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider transition-colors duration-300">
                    Score
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider transition-colors duration-300">
                    Winner
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider transition-colors duration-300">
                    Server
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider transition-colors duration-300">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {tieBreakScores.map((score, scoreIndex) => {
                  const winnerName = score.winner === 'playerOne'
                    ? getPlayerName(matchData.p1)
                    : score.winner === 'playerTwo'
                      ? getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2')
                      : 'N/A';

                  const serverName = score.server === 'playerOne'
                    ? getPlayerName(matchData.p1)
                    : score.server === 'playerTwo'
                      ? getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2')
                      : 'Unknown';

                  return (
                    <tr key={scoreIndex} className="transition-colors duration-300 hover:bg-[var(--bg-secondary)]">
                      <td className="px-4 py-3 text-sm text-[var(--text-primary)] font-medium">
                        Point {scoreIndex + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-primary)] font-semibold">
                        {formatTieBreakScore(score.p1Score)} - {formatTieBreakScore(score.p2Score)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                        {winnerName}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                        {serverName}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-secondary)] space-y-1">
                        {score.type && (
                          <div>
                            <span className="font-medium text-[var(--text-primary)] transition-colors duration-300">
                              {score.type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                            </span>
                          </div>
                        )}
                        {score.servePlacement && (
                          <div>Serve: <span className="capitalize text-[var(--text-primary)] transition-colors duration-300">{score.servePlacement}</span></div>
                        )}
                        {typeof score.betweenPointDuration === 'number' && (
                          <div>Duration: <span className="text-[var(--text-primary)] transition-colors duration-300">{score.betweenPointDuration}s</span></div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-[var(--text-tertiary)] transition-colors duration-300">
            No tie-break points recorded for this set.
          </div>
        )}
      </div>
    );
  };

  // Check if there's any data to display
  if (!matchData.sets || matchData.sets.length === 0) {
    return (
      <div className="p-6 bg-[var(--bg-primary)] min-h-screen transition-colors duration-300">
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-12 text-center border border-[var(--border-primary)] transition-colors duration-300">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 transition-colors duration-300">No Sets Data Available</h2>
          <p className="text-[var(--text-secondary)] mb-2 transition-colors duration-300">This match doesn't have any sets recorded yet.</p>
          <p className="text-sm text-[var(--text-tertiary)] transition-colors duration-300">Sets data will appear here once the match begins and scoring is tracked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[var(--bg-primary)] min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 transition-colors duration-300">Match Sets & Games</h2>
        <p className="text-[var(--text-secondary)] transition-colors duration-300">Detailed breakdown of each set with individual games and point-by-point analysis</p>
      </div>
      
      <div className="space-y-8">
        {matchData.sets.map((set, index) => (
          <div key={set._id} className="w-full">
            {/* Set Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2 transition-colors duration-300">Set {set.setNumber || index + 1}</h3>
              <div className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
                Set Score: {set.p1TotalScore}-{set.p2TotalScore}
              </div>
            </div>
            
            {/* Set Winner Badge - Only show for non-tiebreak-only matches */}
            {set.p1TotalScore !== null && set.p2TotalScore !== null && 
             !isTiebreakOnlyFormat(matchData.matchFormat) && (
              <div className="mb-4 text-center">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  set.p1TotalScore > set.p2TotalScore
                    ? 'text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-primary)]' 
                    : 'text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-primary)]'
                } transition-colors duration-300`}>
                  🏆 Set Winner: {set.p1TotalScore > set.p2TotalScore
                    ? getPlayerName(matchData.p1)
                    : getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2')
                  }
                </span>
              </div>
            )}

            {isTiebreakOnlyFormat(matchData.matchFormat) ? (
              renderTieBreakPoints(set, index)
            ) : (
              <>
                {/* Games Grid - 3 per row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {set.games && set.games.length > 0 ? (
                set.games.map((game, gameIndex) => {
                  const gameNumber = game.gameNumber || gameIndex + 1;
                  const playerOrder = getPlayerDisplayOrder(gameNumber);
                  const rotatedScore = getRotatedScore(game, gameNumber);
                  const courtRotation = getCourtRotationForGame(gameNumber);
                  
                  return (
                    <div key={game._id || gameIndex} className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-4 border border-[var(--border-primary)] transition-colors duration-300">
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-sm font-medium text-[var(--text-primary)] transition-colors duration-300">
                          Game {gameNumber}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] transition-colors duration-300">
                          {getRotatedServer(game, gameNumber)} serves
                        </div>
                      </div>
                      
                      {/* Court Rotation Indicator */}
                      <div className="text-xs text-[var(--text-tertiary)] mb-2 p-1 bg-[var(--bg-secondary)] rounded text-center transition-colors duration-300">
                        Court: {courtRotation === 0 ? 'Normal' : 'Rotated'} View
                      </div>
                      
                      {/* Game Score */}
                      <div className="flex justify-between items-center mb-3">
                        <div className="text-center flex-1">
                          <div className="text-xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                            {rotatedScore.leftScore}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">
                            {playerOrder.leftPlayerName}
                          </div>
                        </div>
                        <div className="text-center text-[var(--text-tertiary)] text-lg font-bold transition-colors duration-300">-</div>
                        <div className="text-center flex-1">
                          <div className="text-xl font-bold text-[var(--text-primary)] transition-colors duration-300">
                            {rotatedScore.rightScore}
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] transition-colors duration-300">
                            {playerOrder.rightPlayerName}
                          </div>
                        </div>
                      </div>
                      
                     
                      
                      {/* Game Result Summary */}
                      <div className="text-center mb-3 p-2 bg-[var(--bg-secondary)] rounded-lg transition-colors duration-300">
                        <div className="text-sm font-semibold text-[var(--text-primary)] mb-1 transition-colors duration-300">
                          Game Result
                        </div>
                        <div className="text-lg font-bold text-[var(--text-primary)] transition-colors duration-300">
                          {getRotatedGameWinner(game, gameNumber)} wins
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)] transition-colors duration-300">
                          Final Score: {rotatedScore.leftScore} - {rotatedScore.rightScore}
                        </div>
                      </div>
                      
                      {/* Game Winner */}
                      {game.winner && (
                        <div className="text-center mb-3">
                          <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                            'text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-primary)]'
                          } transition-colors duration-300`}>
                            🏆 Winner: {getRotatedGameWinner(game, gameNumber)}
                          </span>
                        </div>
                      )}
                      
                      {/* Game Points (if available) */}
                      {game.scores && game.scores.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[var(--border-primary)] transition-colors duration-300">
                          <div className="text-xs font-semibold text-[var(--text-primary)] mb-2 transition-colors duration-300">Point-by-Point:</div>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {game.scores.map((score, scoreIndex) => {
                              // Get the correct player names for this point based on court rotation
                              const pointPlayerOrder = getPlayerDisplayOrder(gameNumber);
                              const pointWinner = score.pointWinner === 'playerOne' ? 
                                (courtRotation === 0 ? pointPlayerOrder.leftPlayerName : pointPlayerOrder.rightPlayerName) :
                                (courtRotation === 0 ? pointPlayerOrder.rightPlayerName : pointPlayerOrder.leftPlayerName);
                              
                              // Get the correct scores for this point based on court rotation
                              const pointScore = courtRotation === 0 ? 
                                `${formatTennisScore(score.p1Score)}-${formatTennisScore(score.p2Score)}` :
                                `${formatTennisScore(score.p2Score)}-${formatTennisScore(score.p1Score)}`;
                              
                              return (
                                <div key={scoreIndex} className="bg-[var(--bg-secondary)] rounded p-2 border border-[var(--border-primary)] transition-colors duration-300">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-medium text-[var(--text-primary)] transition-colors duration-300">
                                      Point {scoreIndex + 1}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      'bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                                    } transition-colors duration-300`}>
                                      {pointWinner}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 gap-1 text-xs">
                                    <div>
                                      <span className="text-[var(--text-secondary)] transition-colors duration-300">Score: </span>
                                      <span className="font-medium text-[var(--text-primary)] transition-colors duration-300">{pointScore}</span>
                                    </div>
                                    {score.type && (
                                      <div>
                                        <span className="text-[var(--text-secondary)] transition-colors duration-300">Type: </span>
                                        <span className="font-medium capitalize text-[var(--text-primary)] transition-colors duration-300">{score.type.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                      </div>
                                    )}
                                    {score.servePlacement && (
                                      <div>
                                        <span className="text-[var(--text-secondary)] transition-colors duration-300">Serve: </span>
                                        <span className="font-medium capitalize text-[var(--text-primary)] transition-colors duration-300">{score.servePlacement}</span>
                                      </div>
                                    )}
                                    {score.placement && (
                                      <div>
                                        <span className="text-[var(--text-secondary)] transition-colors duration-300">Placement: </span>
                                        <span className="font-medium capitalize text-[var(--text-primary)] transition-colors duration-300">{score.placement.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
                  ) : (
                <div className="col-span-full text-center py-8 text-[var(--text-tertiary)] text-sm transition-colors duration-300">
                  No games recorded for this set
                </div>
                  )}
                </div>
                
                {/* Set Summary Footer */}
                <div className="mt-6 flex justify-between items-center pt-4 border-t border-[var(--border-primary)] bg-[var(--bg-card)] rounded-lg p-4 shadow-[var(--shadow-secondary)] transition-colors duration-300">
                  <div className="text-[var(--text-secondary)] transition-colors duration-300">Total Games: {set.games?.length || 0}</div>
                  <div className="text-[var(--text-secondary)] transition-colors duration-300">Set Score: {set.p1TotalScore}-{set.p2TotalScore}</div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetsTab;
