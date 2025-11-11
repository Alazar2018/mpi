import React, { useState, useMemo, useEffect } from 'react';

interface Player {
  _id: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

interface Score {
  p1Score: string | number;
  p2Score: string | number;
  pointWinner: string;
  server: string;
}

interface Game {
  gameNumber: number;
  scores: Score[];
  winner: string;
  server: string;
}

interface Set {
  _id: string;
  p1TotalScore: number;
  p2TotalScore: number;
  winner: string;
  games: Game[];
  tieBreak?: {
    scores: Array<{
      p1Score: number;
      p2Score: number;
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

interface MomentumTabProps {
  matchData: MatchData;
}

type MomentumPoint = {
  index: number;
  momentum: number;
  scoreLabel: string;
  winner: 'playerOne' | 'playerTwo' | 'none';
  game: number;
  isGamePoint: boolean;
};

const generateMomentumPath = (
  data: MomentumPoint[],
  getX: (momentum: number) => number,
  getY: (index: number) => number
) => {
  if (data.length === 0) return '';

  return data
    .map((point, index) => {
      const x = getX(point.momentum);
      const y = getY(index);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
};

const MomentumTab: React.FC<MomentumTabProps> = ({ matchData }) => {
  const [selectedSet, setSelectedSet] = useState<'all' | number>('all');
  const [selectedGame, setSelectedGame] = useState<'all' | number>('all');

  const isTiebreakOnlyFormat = (matchFormat?: string): boolean => {
    return matchFormat ? matchFormat.startsWith('tiebreak') : false;
  };

  const isTieBreakMatch = useMemo(
    () => isTiebreakOnlyFormat(matchData.matchFormat),
    [matchData.matchFormat]
  );

  useEffect(() => {
    if (isTieBreakMatch) {
      setSelectedSet(1);
      setSelectedGame(1);
    } else {
      setSelectedSet('all');
      setSelectedGame('all');
    }
  }, [isTieBreakMatch]);

  useEffect(() => {
    if (!isTieBreakMatch) {
      setSelectedGame('all');
    }
  }, [selectedSet, isTieBreakMatch]);

  const formatScoreValue = (score: string | number | undefined) => {
    if (score === undefined || score === null) return '0';
    return typeof score === 'number' ? score.toString() : score;
  };

  // Calculate momentum data for a specific set
  const calculateMomentum = (set: Set, gameFilter: 'all' | number) => {
    const momentumData: MomentumPoint[] = [];
    let currentMomentum = 0;

    const games = set.games || [];

    games.forEach((game, gameIndex) => {
      const thisGameNumber = game.gameNumber || gameIndex + 1;

      if (gameFilter !== 'all' && thisGameNumber !== gameFilter) {
        return;
      }

      game.scores.forEach((score, scoreIndex) => {
        if (score.pointWinner === 'playerOne') {
          currentMomentum += 1;
        } else if (score.pointWinner === 'playerTwo') {
          currentMomentum -= 1;
        }

        momentumData.push({
          index: momentumData.length,
          momentum: currentMomentum,
          scoreLabel: `${formatScoreValue(score.p1Score)}-${formatScoreValue(score.p2Score)}`,
          winner: score.pointWinner === 'playerOne' ? 'playerOne' : score.pointWinner === 'playerTwo' ? 'playerTwo' : 'none',
          game: thisGameNumber,
          isGamePoint: scoreIndex === (game.scores.length - 1)
        });
      });
    });

    return momentumData;
  };

  // Calculate momentum data for all sets combined
  const calculateAllSetsMomentum = () => {
    const allMomentumData: MomentumPoint[] = [];
    let currentMomentum = 0;

    matchData.sets.forEach((set, setIndex) => {
      const games = set.games || [];
      games.forEach((game, gameIndex) => {
        game.scores.forEach((score, scoreIndex) => {
          if (score.pointWinner === 'playerOne') {
            currentMomentum += 1;
          } else if (score.pointWinner === 'playerTwo') {
            currentMomentum -= 1;
          }

          allMomentumData.push({
            momentum: currentMomentum,
            index: allMomentumData.length,
            scoreLabel: `${formatScoreValue(score.p1Score)}-${formatScoreValue(score.p2Score)}`,
            winner: score.pointWinner === 'playerOne' ? 'playerOne' : score.pointWinner === 'playerTwo' ? 'playerTwo' : 'none',
            game: game.gameNumber || gameIndex + 1,
            isGamePoint: scoreIndex === (game.scores.length - 1)
          });
        });
      });
    });

    return allMomentumData;
  };

  const calculateTieBreakMomentum = (set?: Set) => {
    if (!set?.tieBreak?.scores) {
      return [];
    }

    const momentumData: MomentumPoint[] = [];
    let currentMomentum = 0;

    set.tieBreak.scores.forEach((score, index) => {
      if (score.winner === 'playerOne') {
        currentMomentum += 1;
      } else if (score.winner === 'playerTwo') {
        currentMomentum -= 1;
      }

      momentumData.push({
        index,
        momentum: currentMomentum,
        scoreLabel: `${formatScoreValue(score.p1Score)}-${formatScoreValue(score.p2Score)}`,
        winner: score.winner === 'playerOne' ? 'playerOne' : score.winner === 'playerTwo' ? 'playerTwo' : 'none',
        game: 1,
        isGamePoint: index === set.tieBreak!.scores.length - 1
      });
    });

    return momentumData;
  };

  // Get momentum data based on selection
  const momentumData = useMemo(() => {
    if (isTieBreakMatch) {
      return calculateTieBreakMomentum(matchData.sets[0]);
    }

    if (selectedSet === 'all') {
      return calculateAllSetsMomentum();
    } else {
      const set = matchData.sets[selectedSet - 1];
      return set ? calculateMomentum(set, selectedGame) : [];
    }
  }, [selectedSet, selectedGame, matchData.sets, isTieBreakMatch]);

  const availableGames = useMemo(() => {
    if (isTieBreakMatch || selectedSet === 'all') {
      return [];
    }
    const set = matchData.sets[selectedSet - 1];
    if (!set?.games) {
      return [];
    }
    return set.games.map((game, index) => game.gameNumber || index + 1);
  }, [matchData.sets, selectedSet, isTieBreakMatch]);

  const getPlayerName = (player: Player | string) => {
    if (typeof player === 'object' && player.firstName) {
      return `${player.firstName} ${player.lastName}`;
    }
    return player as string;
  };

  // Check if there's any data to display
  if (!matchData.sets || matchData.sets.length === 0) {
    return (
      <div className="p-6 bg-[var(--bg-primary)] min-h-screen transition-colors duration-300">
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-12 text-center border border-[var(--border-primary)] transition-colors duration-300">
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 transition-colors duration-300">No Momentum Data Available</h2>
          <p className="text-[var(--text-secondary)] mb-2 transition-colors duration-300">This match doesn't have any momentum data recorded yet.</p>
          <p className="text-sm text-[var(--text-tertiary)] transition-colors duration-300">Momentum data will appear here once the match begins and scoring is tracked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[var(--bg-primary)] min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 transition-colors duration-300">
          Match Momentum Analysis
        </h2>
        <p className="text-[var(--text-secondary)] transition-colors duration-300">
          Visual representation of player momentum throughout the match
        </p>
      </div>

      {/* Filters */}
      {!isTieBreakMatch && (
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
              Sets
            </span>
            <button
              onClick={() => setSelectedSet('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedSet === 'all'
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Sets
            </button>
            {matchData.sets.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedSet(index + 1)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedSet === index + 1
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Set {index + 1}
              </button>
            ))}
          </div>

          {selectedSet !== 'all' && availableGames.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-[var(--text-tertiary)]">
                Games
              </span>
              <button
                onClick={() => setSelectedGame('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedGame === 'all'
                    ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All Games
              </button>
              {availableGames.map((gameNumber) => (
                <button
                  key={gameNumber}
                  onClick={() => setSelectedGame(gameNumber)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedGame === gameNumber
                      ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Game {gameNumber}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isTieBreakMatch && (
        <div className="mb-6 text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg px-4 py-3 transition-colors duration-300">
          Tie-break format detected. Momentum reflects the tie-break points played.
        </div>
      )}

      {/* Momentum Chart */}
      <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] transition-colors duration-300">
              Game Momentum
            </h3>
            <p className="text-xs text-[var(--text-secondary)] transition-colors duration-300">
              Positive momentum favours {getPlayerName(matchData.p1)}, negative favours {getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2')}
            </p>
          </div>
          {momentumData.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>{getPlayerName(matchData.p1)} point</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
                <span>{getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2')} point</span>
              </div>
            </div>
          )}
        </div>

        {momentumData.length === 0 ? (
          <div className="text-center text-sm text-[var(--text-tertiary)] py-12 transition-colors duration-300">
            No momentum data recorded for the selected filters.
          </div>
        ) : (
          <MomentumChart momentumData={momentumData} />
        )}
      </div>

      {/* Momentum Explanation */}
      <div className="mt-6 bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 transition-colors duration-300">How to Read Momentum</h3>
        <div className="text-sm text-[var(--text-secondary)] space-y-2 transition-colors duration-300">
          <p>• <strong>Above center line:</strong> Player 1 has momentum advantage</p>
          <p>• <strong>Below center line:</strong> Player 2 has momentum advantage</p>
          <p>• <strong>Steep upward line:</strong> Player 1 winning consecutive points</p>
          <p>• <strong>Steep downward line:</strong> Player 2 winning consecutive points</p>
          <p>• <strong>Flat line:</strong> Players trading points evenly</p>
        </div>
      </div>
    </div>
  );
};

interface MomentumChartProps {
  momentumData: MomentumPoint[];
}

const MomentumChart: React.FC<MomentumChartProps> = ({ momentumData }) => {
  const leftMargin = 120;
  const rightMargin = 140;
  const topMargin = 60;
  const bottomMargin = 60;
  const pointGap = 60;
  const baseWidth = 600;

  const rangeValue = Math.max(
    6,
    Math.ceil(
      Math.max(
        ...momentumData.map((point) => Math.abs(point.momentum)),
        0
      )
    )
  );

  const chartHeight =
    topMargin +
    bottomMargin +
    (momentumData.length > 1 ? (momentumData.length - 1) * pointGap : 0);
  const chartWidth = leftMargin + baseWidth + rightMargin;
  const plotWidth = baseWidth;
  const centerX = leftMargin + plotWidth / 2;

  const getX = (momentum: number) =>
    centerX + (momentum / rangeValue) * (plotWidth / 2);
  const getY = (index: number) =>
    chartHeight - bottomMargin - index * pointGap;

  const pathD = generateMomentumPath(momentumData, getX, getY);
  const ticks = Array.from({ length: rangeValue * 2 + 1 }, (_, i) => i - rangeValue);
  const lastPoint = momentumData[momentumData.length - 1];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full"
      >
        {/* Momentum axis labels */}
        {ticks.map((tick) => {
          const x = getX(tick);
          return (
            <text
              key={`tick-label-${tick}`}
              x={x}
              y={topMargin - 20}
              textAnchor="middle"
              className="fill-[var(--text-tertiary)] text-xs"
            >
              {tick}
            </text>
          );
        })}

        {/* Vertical momentum grid lines */}
        {ticks.map((tick) => {
          const x = getX(tick);
          return (
            <line
              key={`tick-line-${tick}`}
              x1={x}
              y1={topMargin - 10}
              x2={x}
              y2={chartHeight - bottomMargin + 10}
              stroke="var(--border-primary)"
              strokeWidth={tick === 0 ? 2 : 1}
              strokeDasharray={tick === 0 ? undefined : '4 6'}
              opacity={tick === 0 ? 0.7 : 0.4}
            />
          );
        })}

        {/* Baseline for scores */}
        <line
          x1={leftMargin}
          y1={chartHeight - bottomMargin}
          x2={leftMargin}
          y2={topMargin}
          stroke="var(--border-primary)"
          strokeWidth={1.5}
        />

        {/* Momentum path */}
        <path
          d={pathD}
          fill="none"
          stroke="#f87171"
          strokeWidth={3}
        />

        {/* Points */}
        {momentumData.map((point, index) => {
          const x = getX(point.momentum);
          const y = getY(index);
          const fill =
            point.winner === 'playerOne'
              ? '#10B981'
              : point.winner === 'playerTwo'
                ? '#3B82F6'
                : '#9CA3AF';

          return (
            <g key={`point-${index}`}>
              <circle
                cx={x}
                cy={y}
                r={6}
                fill={fill}
                className="transition-all duration-150"
              />
            </g>
          );
        })}

        {/* GAME badge near last point */}
        {lastPoint && (
          <g>
            <rect
              x={getX(lastPoint.momentum) + 20}
              y={getY(momentumData.length - 1) - 16}
              width={68}
              height={28}
              rx={14}
              fill="#34d399"
            />
            <text
              x={getX(lastPoint.momentum) + 54}
              y={getY(momentumData.length - 1)}
              textAnchor="middle"
              className="fill-white font-semibold text-sm"
            >
              GAME
            </text>
          </g>
        )}

        {/* Score labels */}
        {momentumData.map((point, index) => {
          const y = getY(index) + 4;
          return (
            <text
              key={`score-label-${index}`}
              x={leftMargin - 20}
              y={y}
              textAnchor="end"
              className="fill-[var(--text-primary)] text-sm font-semibold"
            >
              {point.scoreLabel}
            </text>
          );
        })}

        {/* Game separators */}
        {momentumData.map((point, index) => {
          if (!point.isGamePoint || index === momentumData.length - 1) return null;
          const y = getY(index) - pointGap / 2;
          return (
            <line
              key={`game-separator-${index}`}
              x1={leftMargin - 10}
              y1={y}
              x2={chartWidth - rightMargin + 20}
              y2={y}
              stroke="var(--border-secondary)"
              strokeDasharray="6 8"
              opacity={0.5}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default MomentumTab;
