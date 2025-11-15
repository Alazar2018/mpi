interface RallyAveragesMap {
  [key: string]: number;
}

const RALLY_BUCKET_AVERAGES: RallyAveragesMap = {
  oneToFour: 2.5,
  fiveToEight: 6.5,
  nineToTwelve: 10.5,
  thirteenToTwenty: 16.5,
  twentyOnePlus: 24,
};

export interface AggregatedPlayerStats {
  totalPoints: number;
  pointsLost: number;
  totalWinners: number;
  winnersBreakdown: Record<string, number>;
  totalErrors: number;
  forcedErrors: number;
  unforcedErrors: number;
  totalServes: number;
  aces: number;
  doubleFaults: number;
  firstServesWon: number;
  firstServesLost: number;
  secondServesWon: number;
  secondServesLost: number;
  totalRallies: number;
  ralliesBreakdown: Record<string, number>;
  avgPointsPerMatch: number;
  winRate: number;
  matchesPlayed: number;
  matchesWon: number;
  averageRallyLength: number;
  returnStats: {
    totalReturns: number;
    firstServeWon: number;
    firstServeLost: number;
    secondServeWon: number;
    secondServeLost: number;
  };
  breakPoints: {
    total: number;
    converted: number;
    saved: number;
  };
  gamePoints: {
    total: number;
    converted: number;
    saved: number;
  };
}

const createEmptyStats = (): AggregatedPlayerStats => ({
  totalPoints: 0,
  pointsLost: 0,
  totalWinners: 0,
  winnersBreakdown: {
    forehand: 0,
    backhand: 0,
    returnForehand: 0,
    returnBackhand: 0,
  },
  totalErrors: 0,
  forcedErrors: 0,
  unforcedErrors: 0,
  totalServes: 0,
  aces: 0,
  doubleFaults: 0,
  firstServesWon: 0,
  firstServesLost: 0,
  secondServesWon: 0,
  secondServesLost: 0,
  totalRallies: 0,
  ralliesBreakdown: {},
  avgPointsPerMatch: 0,
  winRate: 0,
  matchesPlayed: 0,
  matchesWon: 0,
  averageRallyLength: 0,
  returnStats: {
    totalReturns: 0,
    firstServeWon: 0,
    firstServeLost: 0,
    secondServeWon: 0,
    secondServeLost: 0,
  },
  breakPoints: {
    total: 0,
    converted: 0,
    saved: 0,
  },
  gamePoints: {
    total: 0,
    converted: 0,
    saved: 0,
  },
});

const isObjectPlayer = (player: any): player is { _id: string } =>
  player && typeof player === 'object' && typeof player._id === 'string';

export const aggregateMatchesForPlayer = (
  matches: any[] = [],
  playerId?: string,
): AggregatedPlayerStats => {
  if (!playerId) {
    return createEmptyStats();
  }

  const stats = createEmptyStats();
  let totalRallyShots = 0;

  matches.forEach((match) => {
    if (!match) {
      return;
    }

    const playerOneId = isObjectPlayer(match.p1) ? match.p1._id : undefined;
    const playerTwoId = isObjectPlayer(match.p2) ? match.p2._id : undefined;

    const isPlayerOne = playerOneId === playerId;
    const isPlayerTwo = playerTwoId === playerId;

    if (!isPlayerOne && !isPlayerTwo) {
      return;
    }

    // Read data ONLY from p1MatchReport, p2MatchReport, and report (not from sets)
    const playerReport = isPlayerOne ? match.p1MatchReport : match.p2MatchReport;
    const opponentReport = isPlayerOne ? match.p2MatchReport : match.p1MatchReport;
    const overallReport = match.report;

    const matchCompleted = match.status === 'completed';
    if (matchCompleted) {
      stats.matchesPlayed += 1;
      const playerWon =
        (isPlayerOne && match.winner === 'playerOne') ||
        (isPlayerTwo && match.winner === 'playerTwo');
      if (playerWon) {
        stats.matchesWon += 1;
      }
    }

    // Points: Use report.points first, then fallback to playerReport
    const playerPointsWon = isPlayerOne
      ? (overallReport?.points?.p1?.won ?? playerReport?.points?.totalPointsWon ?? 0)
      : (overallReport?.points?.p2?.won ?? playerReport?.points?.totalPointsWon ?? 0);
    stats.totalPoints += playerPointsWon;

    const opponentPointsWon = isPlayerOne
      ? (overallReport?.points?.p2?.won ?? opponentReport?.points?.totalPointsWon ?? 0)
      : (overallReport?.points?.p1?.won ?? opponentReport?.points?.totalPointsWon ?? 0);
    stats.pointsLost += opponentPointsWon;

    // Errors: Use report.errorStats first, then fallback to playerReport
    const errorStats = isPlayerOne
      ? overallReport?.errorStats?.p1
      : overallReport?.errorStats?.p2;

    if (errorStats) {
      const forced =
        (errorStats.forced?.forehand?.total || 0) +
        (errorStats.forced?.backhand?.total || 0);
      const unforced =
        (errorStats.unforced?.forehand?.total || 0) +
        (errorStats.unforced?.backhand?.total || 0);

      stats.forcedErrors += forced;
      stats.unforcedErrors += unforced;
    } else if (playerReport?.points) {
      stats.forcedErrors += playerReport.points.forcedErrors || 0;
      stats.unforcedErrors += playerReport.points.unforcedErrors || 0;
    }

    // Service: Use playerReport.service first, then report.serves
    if (playerReport?.service) {
      stats.totalServes += playerReport.service.totalServices || 0;
      stats.aces += playerReport.service.aces || 0;
      stats.doubleFaults += playerReport.service.doubleFaults || 0;
    }

    const serveStats = isPlayerOne
      ? overallReport?.serves?.p1
      : overallReport?.serves?.p2;

    if (serveStats) {
      stats.firstServesWon += serveStats.firstServesWon || 0;
      stats.firstServesLost += serveStats.firstServesLost || 0;
      stats.secondServesWon += serveStats.secondServesWon || 0;
      stats.secondServesLost += serveStats.secondServesLost || 0;
    }

    // Winners: Use report.winners first, then fallback to playerReport
    const winnersData = isPlayerOne
      ? overallReport?.winners?.p1
      : overallReport?.winners?.p2;

    if (winnersData) {
      const forehand = winnersData.forehand || 0;
      const backhand = winnersData.backhand || 0;
      const returnForehand = winnersData.returnForehand || 0;
      const returnBackhand = winnersData.returnBackhand || 0;

      stats.winnersBreakdown.forehand += forehand;
      stats.winnersBreakdown.backhand += backhand;
      stats.winnersBreakdown.returnForehand += returnForehand;
      stats.winnersBreakdown.returnBackhand += returnBackhand;

      const totalBreakdown =
        forehand + backhand + returnForehand + returnBackhand;

      if (totalBreakdown > 0) {
        stats.totalWinners += totalBreakdown;
      } else {
        stats.totalWinners += playerReport?.points?.winners || 0;
      }
    } else if (playerReport?.points?.winners !== undefined) {
      stats.totalWinners += playerReport.points.winners;
    }

    // Rallies: Use playerReport.rallies first, then report.rallyLengthFrequency
    const playerRallies = playerReport?.rallies;
    const rallyFrequency = overallReport?.rallyLengthFrequency;

    // Prefer playerReport.rallies, but use report.rallyLengthFrequency if playerReport doesn't have rallies
    const rallySource = playerRallies || rallyFrequency;

    if (rallySource) {
      Object.entries(rallySource).forEach(([key, value]) => {
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return;
        }

        stats.ralliesBreakdown[key] =
          (stats.ralliesBreakdown[key] || 0) + value;
        stats.totalRallies += value;

        const bucketAverage = RALLY_BUCKET_AVERAGES[key] || 0;
        totalRallyShots += value * bucketAverage;
      });
    }

    // Returns: Use report.returnStats
    const returnStats = isPlayerOne
      ? overallReport?.returnStats?.p1
      : overallReport?.returnStats?.p2;

    if (returnStats) {
      const firstServeWon = returnStats.firstServeWon || 0;
      const firstServeLost = returnStats.firstServeLost || 0;
      const secondServeWon = returnStats.secondServeWon || 0;
      const secondServeLost = returnStats.secondServeLost || 0;

      stats.returnStats.firstServeWon += firstServeWon;
      stats.returnStats.firstServeLost += firstServeLost;
      stats.returnStats.secondServeWon += secondServeWon;
      stats.returnStats.secondServeLost += secondServeLost;
      stats.returnStats.totalReturns +=
        firstServeWon + firstServeLost + secondServeWon + secondServeLost;
    }

    // Break Points: Use report.breakPoints
    const breakPoints = isPlayerOne
      ? overallReport?.breakPoints?.p1
      : overallReport?.breakPoints?.p2;

    if (breakPoints) {
      stats.breakPoints.total += breakPoints.total || 0;
      stats.breakPoints.converted += breakPoints.converted || 0;
      stats.breakPoints.saved += breakPoints.saved || 0;
    }

    // Game Points: Use report.gamePoints
    const gamePoints = isPlayerOne
      ? overallReport?.gamePoints?.p1
      : overallReport?.gamePoints?.p2;

    if (gamePoints) {
      stats.gamePoints.total += gamePoints.total || 0;
      stats.gamePoints.converted += gamePoints.converted || 0;
      stats.gamePoints.saved += gamePoints.saved || 0;
    }
  });

  if (stats.matchesPlayed > 0) {
    stats.avgPointsPerMatch = Math.round(stats.totalPoints / stats.matchesPlayed);
    stats.winRate = Math.round((stats.matchesWon / stats.matchesPlayed) * 100);
  }

  if (stats.totalRallies > 0 && totalRallyShots > 0) {
    stats.averageRallyLength = Number(
      (totalRallyShots / stats.totalRallies).toFixed(1),
    );
  }

  stats.totalErrors = stats.forcedErrors + stats.unforcedErrors;

  return stats;
};


