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
  pointWinner?: 'playerOne' | 'playerTwo';
  winner?: 'playerOne' | 'playerTwo';
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
      pointWinner?: 'playerOne' | 'playerTwo';
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
  tieBreakRule?: number;
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

  const tieBreakTarget = matchData.tieBreakRule ?? 7;

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

  const normalizeWinnerValue = (value?: string | null): 'playerOne' | 'playerTwo' | 'none' => {
    if (!value) return 'none';
    const normalized = value.toString().toLowerCase();
    if (normalized.includes('playerone') || normalized === 'p1' || normalized === 'player1') {
      return 'playerOne';
    }
    if (normalized.includes('playertwo') || normalized === 'p2' || normalized === 'player2') {
      return 'playerTwo';
    }
    return 'none';
  };

  const TENNIS_SCORE_MAP: Record<string, number> = {
    '0': 0,
    '00': 0,
    love: 0,
    '15': 1,
    '30': 2,
    '40': 3,
    ad: 4,
    adv: 4,
    advantage: 4,
    game: 5,
  };

  const parseScoreValue = (value: string | number | undefined): number => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }
    if (!value) {
      return 0;
    }
    const normalized = value.toString().trim().toLowerCase();
    if (normalized in TENNIS_SCORE_MAP) {
      return TENNIS_SCORE_MAP[normalized];
    }
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : 0;
  };

  const getStandardGameScoreLabel = (p1Points: number, p2Points: number): string => {
    const diff = p1Points - p2Points;
    if (p1Points >= 4 || p2Points >= 4) {
      if (Math.abs(diff) >= 2) {
        return 'Game';
      }
      if (diff === 1) {
        return 'Ad-40';
      }
      if (diff === -1) {
        return '40-Ad';
      }
      return 'Deuce';
    }

    const scoreDisplay = ['0', '15', '30', '40'];
    const p1Display = scoreDisplay[Math.min(p1Points, 3)] ?? '40';
    const p2Display = scoreDisplay[Math.min(p2Points, 3)] ?? '40';
    return `${p1Display}-${p2Display}`;
  };

  const getTieBreakScoreLabel = (p1Points: number, p2Points: number): string => `${p1Points}-${p2Points}`;

  const resolvePointOutcome = (
    score: {
      p1Score: string | number;
      p2Score: string | number;
      pointWinner?: string | null;
      winner?: string | null;
    },
    prevP1: number,
    prevP2: number
  ): {
    winner: 'playerOne' | 'playerTwo' | 'none';
    p1Value: number;
    p2Value: number;
    isValid: boolean;
  } => {
    const p1Value = parseScoreValue(score.p1Score);
    const p2Value = parseScoreValue(score.p2Score);

    let winner = normalizeWinnerValue(score.pointWinner);
    if (winner === 'none') {
      winner = normalizeWinnerValue(score.winner);
    }

    const hasChanged = p1Value !== prevP1 || p2Value !== prevP2;

    if (winner === 'none' && hasChanged) {
      if (p1Value > prevP1) {
        winner = 'playerOne';
      } else if (p2Value > prevP2) {
        winner = 'playerTwo';
      }
    }

    if (winner === 'none') {
      return {
        winner,
        p1Value,
        p2Value,
        isValid: false,
      };
    }

    return {
      winner,
      p1Value,
      p2Value,
      isValid: true,
    };
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

      let previousP1Score = 0;
      let previousP2Score = 0;
      let p1PointsCount = 0;
      let p2PointsCount = 0;
      let gameFinished = false;
      const normalizedGameWinner = normalizeWinnerValue(game.winner);

      game.scores.forEach((score, scoreIndex) => {
        if (gameFinished) {
          return;
        }

        const { winner, p1Value, p2Value, isValid } = resolvePointOutcome(
          score,
          previousP1Score,
          previousP2Score
        );

        if (!isValid) {
          return;
        }

        if (winner === 'playerOne') {
          currentMomentum += 1;
          p1PointsCount += 1;
        } else if (winner === 'playerTwo') {
          currentMomentum -= 1;
          p2PointsCount += 1;
        }

        let isWinningPoint =
          Math.abs(p1PointsCount - p2PointsCount) >= 2 && (p1PointsCount >= 4 || p2PointsCount >= 4);

        if (!isWinningPoint && winner !== 'none' && winner === normalizedGameWinner && scoreIndex === game.scores.length - 1) {
          isWinningPoint = true;
        }

        momentumData.push({
          index: momentumData.length,
          momentum: currentMomentum,
          scoreLabel: getStandardGameScoreLabel(p1PointsCount, p2PointsCount),
          winner,
          game: thisGameNumber,
          isGamePoint: isWinningPoint,
        });

        previousP1Score = p1Value;
        previousP2Score = p2Value;

        if (isWinningPoint) {
          gameFinished = true;
        }
      });
    });

    return momentumData;
  };

  // Calculate momentum data for all sets combined
  const calculateAllSetsMomentum = () => {
    const allMomentumData: MomentumPoint[] = [];
    let currentMomentum = 0;

    matchData.sets.forEach((set) => {
      const games = set.games || [];
      games.forEach((game, gameIndex) => {
        let previousP1Score = 0;
        let previousP2Score = 0;
        let p1PointsCount = 0;
        let p2PointsCount = 0;
        let gameFinished = false;
        const normalizedGameWinner = normalizeWinnerValue(game.winner);

        game.scores.forEach((score, scoreIndex) => {
          if (gameFinished) {
            return;
          }

          const { winner, p1Value, p2Value, isValid } = resolvePointOutcome(
            score,
            previousP1Score,
            previousP2Score
          );

          if (!isValid) {
            return;
          }

          if (winner === 'playerOne') {
            currentMomentum += 1;
            p1PointsCount += 1;
          } else if (winner === 'playerTwo') {
            currentMomentum -= 1;
            p2PointsCount += 1;
          }

          let isWinningPoint =
            Math.abs(p1PointsCount - p2PointsCount) >= 2 && (p1PointsCount >= 4 || p2PointsCount >= 4);

          if (!isWinningPoint && winner !== 'none' && winner === normalizedGameWinner && scoreIndex === game.scores.length - 1) {
            isWinningPoint = true;
          }

          allMomentumData.push({
            momentum: currentMomentum,
            index: allMomentumData.length,
            scoreLabel: getStandardGameScoreLabel(p1PointsCount, p2PointsCount),
            winner,
            game: game.gameNumber || gameIndex + 1,
            isGamePoint: isWinningPoint,
          });

          previousP1Score = p1Value;
          previousP2Score = p2Value;

          if (isWinningPoint) {
            gameFinished = true;
          }
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
    let previousP1Score = 0;
    let previousP2Score = 0;
    let p1PointsCount = 0;
    let p2PointsCount = 0;
    let tieBreakFinished = false;
    const winningThreshold = tieBreakTarget;

    set.tieBreak.scores.forEach((score, index) => {
      if (tieBreakFinished) {
        return;
      }

      const { winner, p1Value, p2Value, isValid } = resolvePointOutcome(
        score,
        previousP1Score,
        previousP2Score
      );

      if (!isValid) {
        return;
      }

      if (winner === 'playerOne') {
        currentMomentum += 1;
        p1PointsCount += 1;
      } else if (winner === 'playerTwo') {
        currentMomentum -= 1;
        p2PointsCount += 1;
      }

      const isWinningPoint =
        Math.abs(p1PointsCount - p2PointsCount) >= 2 && (p1PointsCount >= winningThreshold || p2PointsCount >= winningThreshold);

      momentumData.push({
        index,
        momentum: currentMomentum,
        scoreLabel: getTieBreakScoreLabel(p1PointsCount, p2PointsCount),
        winner,
        game: 1,
        isGamePoint: isWinningPoint,
      });

      previousP1Score = p1Value;
      previousP2Score = p2Value;

      if (isWinningPoint) {
        tieBreakFinished = true;
      }
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

  const playerOneName = getPlayerName(matchData.p1);
  const playerTwoName = getPlayerName(matchData.p2 || matchData.p2Name || 'Player 2');

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
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
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
            <div className="flex flex-wrap items-center gap-2">
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
              Positive momentum favours {playerOneName}, negative favours {playerTwoName}
            </p>
          </div>
          {momentumData.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>{playerOneName} point</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-sky-500"></span>
                <span>{playerTwoName} point</span>
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
          <p>
            • <strong>Above center line:</strong>{' '}
            <span className="font-semibold text-emerald-500">{playerOneName}</span>{' '}
            holds the momentum edge
          </p>
          <p>
            • <strong>Below center line:</strong>{' '}
            <span className="font-semibold text-sky-500">{playerTwoName}</span>{' '}
            holds the momentum edge
          </p>
          <p>
            • <strong>Steep upward line:</strong>{' '}
            <span className="font-semibold text-emerald-500">{playerOneName}</span> strings together consecutive points
          </p>
          <p>
            • <strong>Steep downward line:</strong>{' '}
            <span className="font-semibold text-sky-500">{playerTwoName}</span> strings together consecutive points
          </p>
          <p>• <strong>Flat line:</strong> Both players are trading points evenly</p>
        </div>
      </div>
    </div>
  );
};

export default MomentumTab;

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
        {ticks.map((tick) => (
          <text
            key={`tick-label-${tick}`}
            x={getX(tick)}
            y={topMargin - 16}
            textAnchor="middle"
            className="fill-[var(--text-tertiary)] text-xs"
          >
            {tick}
          </text>
        ))}

        {/* Vertical axis grid lines */}
        {ticks.map((tick) => (
          <line
            key={`tick-line-${tick}`}
            x1={getX(tick)}
            y1={topMargin - 6}
            x2={getX(tick)}
            y2={chartHeight - bottomMargin + 6}
            stroke="var(--border-primary)"
            strokeWidth={tick === 0 ? 2 : 1}
            strokeDasharray={tick === 0 ? undefined : '6 8'}
            opacity={tick === 0 ? 0.8 : 0.4}
          />
        ))}

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

        {/* Data points */}
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
              <circle cx={x} cy={y} r={6} fill={fill} className="transition-all duration-150" />
            </g>
          );
        })}

        {/* GAME badge near each game closing point */}
        {momentumData.map((point, index) => {
          if (!point.isGamePoint) return null;
          const badgeX = getX(point.momentum) + 24;
          const badgeY = getY(index) - 16;
          return (
            <g key={`game-badge-${index}`}>
              <rect x={badgeX} y={badgeY} width={68} height={28} rx={14} fill="#34d399" />
              <text
                x={badgeX + 34}
                y={badgeY + 18}
                textAnchor="middle"
                className="fill-white font-semibold text-sm"
              >
                GAME
              </text>
            </g>
          );
        })}

        {/* Score labels */}
        {momentumData.map((point, index) => (
          <text
            key={`score-label-${index}`}
            x={leftMargin - 40}
            y={getY(index) + 4}
            textAnchor="end"
            className="fill-[var(--text-primary)] text-sm font-semibold"
          >
            {point.scoreLabel}
          </text>
        ))}

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