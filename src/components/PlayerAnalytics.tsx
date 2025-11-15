import React, { useState, useEffect, useMemo } from 'react';
import { Users, TrendingUp, Calendar, Trophy, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CalendarService } from '@/service/calendar.server';
import { aggregateMatchesForPlayer, AggregatedPlayerStats } from '@/utils/playerAnalytics';

interface PlayerMatch {
  _id: string;
  date: string;
  p1?: { _id: string; firstName: string; lastName: string };
  p2?: { _id: string; firstName: string; lastName: string };
  p2Name?: string; // For cases where p2 is not an object
  p2IsObject?: boolean; // Flag to determine if p2 is an object or just a name
  winner?: string;
  status: string;
  matchCategory: string; // Added for match type filtering
  sets?: {
    p1Score: number;
    p2Score: number;
    p1SetReport?: {
      service: {
        aces: number;
        doubleFaults: number;
      };
    };
    p2SetReport?: {
      service: {
        aces: number;
        doubleFaults: number;
      };
    };
  }[];
  p1MatchReport?: {
    service?: { totalServices: number };
    points?: { totalPointsWon: number; winners: number; unforcedErrors: number; forcedErrors: number };
    rallies?: { [key: string]: number };
  };
  p2MatchReport?: {
    service?: { totalServices: number };
    points?: { totalPointsWon: number; winners: number; unforcedErrors: number; forcedErrors: number };
    rallies?: { [key: string]: number };
  };
  report?: {
    points?: {
      total?: number;
      p1?: { won?: number; wonPercentage?: number };
      p2?: { won?: number; wonPercentage?: number };
    };
    winners?: { 
      p1?: { forehand?: number; backhand?: number; returnForehand?: number; returnBackhand?: number }; 
      p2?: { forehand?: number; backhand?: number; returnForehand?: number; returnBackhand?: number } 
    };
    errorStats?: {
      p1?: {
        forced?: { forehand?: { total?: number }; backhand?: { total?: number } };
        unforced?: { forehand?: { total?: number }; backhand?: { total?: number } };
      };
      p2?: {
        forced?: { forehand?: { total?: number }; backhand?: { total?: number } };
        unforced?: { forehand?: { total?: number }; backhand?: { total?: number } };
      };
    };
    serves?: {
      p1?: {
        firstServesWon?: number;
        firstServesLost?: number;
        secondServesWon?: number;
        secondServesLost?: number;
      };
      p2?: {
        firstServesWon?: number;
        firstServesLost?: number;
        secondServesWon?: number;
        secondServesLost?: number;
      };
    };
    returnStats?: {
      p1?: {
        firstServeWon?: number;
        firstServeLost?: number;
        secondServeWon?: number;
        secondServeLost?: number;
      };
      p2?: {
        firstServeWon?: number;
        firstServeLost?: number;
        secondServeWon?: number;
        secondServeLost?: number;
      };
    };
    breakPoints?: {
      p1?: { total?: number; converted?: number; saved?: number };
      p2?: { total?: number; converted?: number; saved?: number };
    };
    gamePoints?: {
      p1?: { total?: number; converted?: number; saved?: number };
      p2?: { total?: number; converted?: number; saved?: number };
    };
    rallyLengthFrequency?: { [key: string]: number };
  };
}

interface PlayerAnalyticsProps {
  userName: string;
  playerId: string;
  playerData?: {
    totalMatches: number;
    completedMatches: number;
    pendingMatches: number;
    winRate: number;
    recentMatches: PlayerMatch[];
    matches?: PlayerMatch[]; // Add matches array for filtering
    stats: AggregatedPlayerStats;
    playerId?: string;
  };
}

const PlayerAnalytics: React.FC<PlayerAnalyticsProps> = ({ userName, playerId, playerData }) => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'Overview' | 'Serves' | 'Points' | 'Returns' | 'Rally'>('Overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('All');
  const [returnDisplayMode, setReturnDisplayMode] = useState<'points' | 'percentage'>('percentage');
  const [selectedMatch, setSelectedMatch] = useState<string>('all'); // Add selected match state
  const [selectedMatchType, setSelectedMatchType] = useState<string>('All'); // Add match type filter state
  const timeframes = ['All', '1W', '2W', '1M', '3M', '6M', '1Y']; // Updated timeframes to include 2W
  const [weeklyActivities, setWeeklyActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // Use real data if available, otherwise fall back to defaults
  const totalMatches = playerData?.totalMatches || 0;
  const winRate = playerData?.winRate || 0;
  const recentMatches = playerData?.recentMatches || [];
  const allMatches = playerData?.matches || []; // Get all matches for filtering

  const effectivePlayerId = playerId || playerData?.playerId || '';
  const matchesForDropdown = useMemo(() => {
    if (!playerData?.matches) return [];

    const completedMatches = playerData.matches.filter(
      (match) => match.status === 'completed',
    );

    const byType =
      selectedMatchType === 'All'
        ? completedMatches
        : completedMatches.filter(
            (match) =>
              (match.matchCategory || '').toLowerCase() ===
              selectedMatchType.toLowerCase(),
          );

    if (selectedTimeframe === 'All') {
      return byType;
    }

    const now = new Date();
    const startDate = new Date(now);

    switch (selectedTimeframe) {
      case '1W':
        startDate.setDate(now.getDate() - 7);
        break;
      case '2W':
        startDate.setDate(now.getDate() - 14);
        break;
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return byType;
    }

    return byType.filter((match) => new Date(match.date) >= startDate);
  }, [playerData?.matches, selectedMatchType, selectedTimeframe]);

  const filteredMatches = useMemo(() => {
    if (selectedMatch === 'all') {
      return matchesForDropdown;
    }

    return matchesForDropdown.filter((match) => match._id === selectedMatch);
  }, [matchesForDropdown, selectedMatch]);

  const selectedMatchDetails =
    selectedMatch !== 'all' ? filteredMatches[0] : undefined;

  const filteredStats: AggregatedPlayerStats = useMemo(
    () => aggregateMatchesForPlayer(filteredMatches, effectivePlayerId),
    [filteredMatches, effectivePlayerId],
  );

  useEffect(() => {
    if (
      selectedMatch !== 'all' &&
      !matchesForDropdown.some((match) => match._id === selectedMatch)
    ) {
      setSelectedMatch('all');
    }
  }, [matchesForDropdown, selectedMatch]);

  const totalPointsWon = filteredStats.totalPoints || 0;
  const totalPointsLost = filteredStats.pointsLost || 0;
  const totalPointsPlayed = totalPointsWon + totalPointsLost;

  const getProgressCircle = (value: number, total: number, radius: number) => {
    const circumference = 2 * Math.PI * radius;
    const ratio = total > 0 ? value / total : 0;
    return {
      circumference,
      ratio,
      dashArray: `${circumference} ${circumference}`,
      dashOffset: circumference * (1 - ratio),
    };
  };

  const pointsProgress = getProgressCircle(totalPointsWon, totalPointsPlayed, 44);
  const pointsProgressLarge = getProgressCircle(totalPointsWon, totalPointsPlayed, 56);

  const winnersBreakdown = filteredStats.winnersBreakdown || {
    forehand: 0,
    backhand: 0,
    returnForehand: 0,
    returnBackhand: 0,
  };
  const winnersTotal = filteredStats.totalWinners || 0;

  const winnerSegments = [
    { key: 'forehand', label: 'Forehand', color: 'text-blue-500', bg: 'bg-blue-500' },
    { key: 'backhand', label: 'Backhand', color: 'text-cyan-500', bg: 'bg-cyan-500' },
    { key: 'returnForehand', label: 'Return Forehand', color: 'text-yellow-500', bg: 'bg-yellow-500' },
    { key: 'returnBackhand', label: 'Return Backhand', color: 'text-green-500', bg: 'bg-green-500' },
  ] as const;

  const totalServePoints =
    filteredStats.firstServesWon +
    filteredStats.firstServesLost +
    filteredStats.secondServesWon +
    filteredStats.secondServesLost;
  const servePointsWon = filteredStats.firstServesWon + filteredStats.secondServesWon;
  const serveAccuracyProgress = getProgressCircle(servePointsWon, totalServePoints, 56);

  const returnStats = filteredStats.returnStats || {
    totalReturns: 0,
    firstServeWon: 0,
    firstServeLost: 0,
    secondServeWon: 0,
    secondServeLost: 0,
  };

  const totalFirstServePoints =
    filteredStats.firstServesWon + filteredStats.firstServesLost;
  const firstServeWinPercentage =
    totalFirstServePoints > 0
      ? Math.round((filteredStats.firstServesWon / totalFirstServePoints) * 100)
      : 0;
  const totalSecondServePoints =
    filteredStats.secondServesWon + filteredStats.secondServesLost;
  const secondServeWinPercentage =
    totalSecondServePoints > 0
      ? Math.round(
          (filteredStats.secondServesWon / totalSecondServePoints) * 100,
        )
      : 0;

  const totalReturnPoints =
    returnStats.firstServeWon +
    returnStats.firstServeLost +
    returnStats.secondServeWon +
    returnStats.secondServeLost;

  const totalReturnWinners =
    (winnersBreakdown.returnForehand || 0) +
    (winnersBreakdown.returnBackhand || 0);
  const totalReturnErrors =
    returnStats.firstServeLost + returnStats.secondServeLost;

  const serveDistributionData = [
    { key: 'firstWon', label: '1st Won', value: filteredStats.firstServesWon, color: 'bg-blue-600' },
    { key: 'firstLost', label: '1st Lost', value: filteredStats.firstServesLost, color: 'bg-blue-300' },
    { key: 'secondWon', label: '2nd Won', value: filteredStats.secondServesWon, color: 'bg-green-600' },
    { key: 'secondLost', label: '2nd Lost', value: filteredStats.secondServesLost, color: 'bg-green-300' },
    { key: 'aces', label: 'Aces', value: filteredStats.aces, color: 'bg-purple-500' },
    { key: 'doubleFaults', label: 'Double Faults', value: filteredStats.doubleFaults, color: 'bg-red-500' },
  ];

  const returnDistributionData = [
    { key: 'returnFirstWon', label: '1st Won', value: returnStats.firstServeWon, color: 'bg-blue-600' },
    { key: 'returnFirstLost', label: '1st Lost', value: returnStats.firstServeLost, color: 'bg-blue-300' },
    { key: 'returnSecondWon', label: '2nd Won', value: returnStats.secondServeWon, color: 'bg-green-600' },
    { key: 'returnSecondLost', label: '2nd Lost', value: returnStats.secondServeLost, color: 'bg-green-300' },
  ];

  const rallyBuckets = [
    { key: 'oneToFour', label: '1-4', color: 'bg-blue-500' },
    { key: 'fiveToEight', label: '5-8', color: 'bg-green-500' },
    { key: 'nineToTwelve', label: '9-12', color: 'bg-purple-500' },
    { key: 'thirteenToTwenty', label: '13-20', color: 'bg-orange-500' },
    { key: 'twentyOnePlus', label: '21+', color: 'bg-red-500' },
  ] as const;

  const rallyBucketAverages: Record<string, number> = {
    oneToFour: 3,
    fiveToEight: 6,
    nineToTwelve: 10,
    thirteenToTwenty: 16,
    twentyOnePlus: 24,
  };

  const rallyBucketColors: Record<string, string> = {
    oneToFour: '#3b82f6',
    fiveToEight: '#22c55e',
    nineToTwelve: '#a855f7',
    thirteenToTwenty: '#f97316',
    twentyOnePlus: '#ef4444',
  };

  const rallyBreakdown = filteredStats.ralliesBreakdown || {};

  const maxServeValue = useMemo(() => {
    const values = serveDistributionData.map((item) => item.value || 0);
    const maxValue = Math.max(...values, 1);
    return maxValue > 0 ? maxValue : 1;
  }, [serveDistributionData]);

  const maxReturnValue = useMemo(() => {
    const values = returnDistributionData.map((item) => item.value || 0);
    const maxValue = Math.max(...values, 1);
    return maxValue > 0 ? maxValue : 1;
  }, [returnDistributionData]);

  const maxRallyValue = useMemo(() => {
    const values = rallyBuckets.map((bucket) => rallyBreakdown[bucket.key] || 0);
    const maxValue = Math.max(...values, 1);
    return maxValue > 0 ? maxValue : 1;
  }, [rallyBuckets, rallyBreakdown]);

  const longestRallyBucket = useMemo(() => {
    const bucketsDescending = [...rallyBuckets].reverse();
    return (
      bucketsDescending.find((bucket) => (rallyBreakdown[bucket.key] || 0) > 0) ||
      null
    );
  }, [rallyBuckets, rallyBreakdown]);

  const longestRallyApprox = longestRallyBucket
    ? Math.round(rallyBucketAverages[longestRallyBucket.key] || 0)
    : 0;

  const recentMatchSummaries = useMemo(() => {
    return (recentMatches || []).slice(0, 10).map((match) => {
      const matchStats = aggregateMatchesForPlayer([match], effectivePlayerId);
      const totalPoints = matchStats.totalPoints + matchStats.pointsLost;
      const isWin = matchStats.matchesWon > 0;
      return {
        match,
        stats: matchStats,
        totalPoints,
        isWin,
      };
    });
  }, [recentMatches, effectivePlayerId]);

  const maxTotalPoints = useMemo(() => {
    if (recentMatchSummaries.length === 0) return 1;
    const totals = recentMatchSummaries.map((item) => item.totalPoints);
    const maxValue = Math.max(...totals);
    return maxValue > 0 ? maxValue : 1;
  }, [recentMatchSummaries]);

  const recentMatchesDetailed = useMemo(() => {
    return (recentMatches || []).map((match) => {
      const stats = aggregateMatchesForPlayer([match], effectivePlayerId);
      const isCompleted = match.status === 'completed';
      const isWin = stats.matchesWon > 0;
      let resultLabel = 'Pending';
      let resultColor = 'text-gray-500';
      let resultBg = 'bg-gray-100';
      let resultIcon = '⏳';

      if (isCompleted) {
        if (isWin) {
          resultLabel = 'Win';
          resultColor = 'text-green-600';
          resultBg = 'bg-green-100';
          resultIcon = '✅';
        } else {
          resultLabel = 'Loss';
          resultColor = 'text-red-600';
          resultBg = 'bg-red-100';
          resultIcon = '❌';
        }
      }

      return {
        match,
        stats,
        isCompleted,
        isWin,
        resultLabel,
        resultColor,
        resultBg,
        resultIcon,
      };
    });
  }, [recentMatches, effectivePlayerId]);

  // Get unique match types for the dropdown
  const getUniqueMatchTypes = () => {
    const types = allMatches.map(match => match.matchCategory);
    return ['All', ...Array.from(new Set(types))];
  };

  // Function to get opponent name from a match
  const getOpponentName = (match: PlayerMatch) => {
    if (!match) return 'Unknown Player';

    const isPlayerOne =
      effectivePlayerId &&
      match.p1 &&
      typeof match.p1 === 'object' &&
      match.p1._id === effectivePlayerId;
    const isPlayerTwo =
      effectivePlayerId &&
      match.p2 &&
      typeof match.p2 === 'object' &&
      match.p2._id === effectivePlayerId;

    if (isPlayerOne) {
      if (match.p2 && typeof match.p2 === 'object' && match.p2.firstName && match.p2.lastName) {
        return `${match.p2.firstName} ${match.p2.lastName}`;
      }
      if (typeof match.p2 === 'string') {
        return match.p2;
      }
      if (match.p2Name) {
        return match.p2Name;
      }
    } else if (isPlayerTwo) {
      if (match.p1 && typeof match.p1 === 'object' && match.p1.firstName && match.p1.lastName) {
        return `${match.p1.firstName} ${match.p1.lastName}`;
      }
      if (typeof match.p1 === 'string') {
        return match.p1;
      }
    }

    if (match.p2 && typeof match.p2 === 'object' && match.p2.firstName && match.p2.lastName) {
      return `${match.p2.firstName} ${match.p2.lastName}`;
    }

    if (match.p2Name) {
      return match.p2Name;
    }

    if (match.p1 && typeof match.p1 === 'object' && match.p1.firstName && match.p1.lastName) {
      return `${match.p1.firstName} ${match.p1.lastName}`;
    }

    return 'Unknown Player';
  };

    // Fetch weekly activities
  useEffect(() => {
    let isMounted = true;
    
    const fetchWeeklyActivities = async () => {
      // Don't fetch if already loading or if we already have data
      if (loadingActivities || weeklyActivities.length > 0) {
        return;
      }
      
      try {
        setLoadingActivities(true);
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        const response = await CalendarService.getEvents({
          startDate: startOfWeek.toISOString(),
          endDate: endOfWeek.toISOString(),
        });
        
        if (isMounted && response.success && response.data?.events) {
          console.log('Weekly activities fetched:', response.data.events);
          setWeeklyActivities(response.data.events || []);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch weekly activities:', error);
          // Log the error but don't show it to user since we have fallback data
          console.log('Calendar service error, but continuing with available data');
        }
      } finally {
        if (isMounted) {
          setLoadingActivities(false);
        }
      }
    };

    fetchWeeklyActivities();

    // Cleanup function to prevent setting state on unmounted component
    return () => {
      isMounted = false;
    };
  }, [loadingActivities, weeklyActivities.length]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-4 sm:p-6 transition-colors duration-300">
        <div className="flex flex-wrap gap-1">
          {['Overview', 'Serves', 'Points', 'Returns', 'Rally'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as 'Overview' | 'Serves' | 'Points' | 'Returns' | 'Rally')}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                selectedTab === tab 
                  ? 'bg-blue-600 text-white' 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-[var(--shadow-primary)] p-4 sm:p-6 border border-blue-100 dark:border-blue-800 transition-colors duration-300">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-2">Analytics Filters</h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Customize your analytics view</p>
          </div>
          
          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Match Type Filter */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Match Type
              </label>
              <select 
                value={selectedMatchType}
                onChange={(e) => setSelectedMatchType(e.target.value)}
                className="w-full bg-[var(--bg-card)] text-[var(--text-primary)] px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium border border-[var(--border-primary)] focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm"
              >
                {getUniqueMatchTypes().map((type) => (
                  <option key={type} value={type}>
                    {type === 'All' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
          </div>
          
            {/* Time Filter */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Time Period
              </label>
              <div className="flex flex-wrap gap-1 sm:gap-2">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                    className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  selectedTimeframe === timeframe
                        ? 'bg-green-600 text-white shadow-md transform scale-105' 
                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-700 border border-[var(--border-primary)]'
                }`}
              >
                {timeframe}
              </button>
            ))}
              </div>
            </div>
            
            {/* Specific Match Filter */}
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Specific Match
              </label>
              <select 
                value={selectedMatch}
                onChange={(e) => setSelectedMatch(e.target.value)}
                className="w-full bg-[var(--bg-card)] text-[var(--text-primary)] px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium border border-[var(--border-primary)] focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 shadow-sm"
              >
                                 <option value="all">All Matches ({matchesForDropdown.length})</option>
                 {matchesForDropdown.map((match) => {
                   const opponent = getOpponentName(match);
                   return (
                     <option key={match._id} value={match._id}>
                       vs {opponent}
                     </option>
                   );
                 })}
              </select>
            </div>
          </div>
          
          {/* Filter Summary */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                                     <p className="text-xs sm:text-sm font-medium text-gray-800">
                     Showing <span className="text-blue-600 font-bold">{filteredMatches.length}</span> completed matches
                     <span className="text-gray-500 ml-2">({matchesForDropdown.length} total matches)</span>
                   </p>
                  <p className="text-xs text-gray-500">
                    {selectedMatchType !== 'All' && `${selectedMatchType} • `}
                    {selectedTimeframe !== 'All' && `${selectedTimeframe} • `}
                    {selectedMatch !== 'all' && 'Specific Match'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedMatchType('All');
                  setSelectedTimeframe('All');
                  setSelectedMatch('all');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors self-start sm:self-auto"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Tab Content */}
      {selectedTab === 'Overview' && (
        <>
          {/* Dynamic Title */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                {selectedMatch === 'all' 
                  ? `${userName}'s Analytics Overview`
                  : `Match Analysis: vs ${selectedMatchDetails ? getOpponentName(selectedMatchDetails) : 'N/A'}`
                }
              </h2>
              <p className="text-sm sm:text-base text-gray-600">
                {selectedMatch === 'all' 
                  ? `Analyzing ${filteredMatches.length} completed matches`
                  : 'Detailed analysis of the selected match'
                }
                {selectedMatchType !== 'All' && ` • ${selectedMatchType} matches`}
                {selectedTimeframe !== 'All' && ` • ${selectedTimeframe} period`}
              </p>
            </div>
          </div>
          
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{filteredMatches.length}</p>
                  <p className="text-sm sm:text-base text-gray-600">
                    {selectedMatch === 'all' ? 'Filtered Matches' : 'Selected Match'}
                  </p>
                  {selectedMatch !== 'all' && (
                    <p className="text-xs sm:text-sm text-blue-600 mt-1">vs {selectedMatchDetails ? getOpponentName(selectedMatchDetails) : 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{filteredStats.totalRallies || 0}</p>
                   <p className="text-sm sm:text-base text-gray-600">Total Rallies</p>
                   {selectedMatch !== 'all' && (
                     <p className="text-xs sm:text-sm text-green-600 mt-1">From selected match</p>
                   )}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid - 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Points Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Points Distribution</h3>
              <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">Fullscreen</button>
            </div>
            <div className="text-center">
              <div className="relative inline-block">
                <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={pointsProgress.dashArray}
                    strokeDashoffset={pointsProgress.dashOffset}
                    strokeLinecap="round"
                    className="text-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
                      {totalPointsWon}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Points</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm text-green-600 font-medium">
                      Won {totalPointsWon} Points
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm text-orange-600 font-medium">
                      Lost {totalPointsLost} Points
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Trends Chart */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Performance Trends</h3>
              <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">Fullscreen</button>
            </div>
            <div className="h-48 sm:h-64 flex items-end justify-center gap-1 sm:gap-2">
              {recentMatchSummaries.slice(0, 8).map(({ match, stats, totalPoints, isWin }, index) => {
                const wonHeight = Math.max((stats.totalPoints / maxTotalPoints) * 120, 4);
                const lostHeight = Math.max((stats.pointsLost / maxTotalPoints) * 120, stats.pointsLost > 0 ? 2 : 0);
                return (
                  <div key={match._id || index} className="flex flex-col items-center">
                    <div className="flex flex-col-reverse items-center gap-1 transition-all duration-300">
                      {lostHeight > 0 && (
                        <div
                          className="w-6 sm:w-8 bg-orange-400 rounded-t-sm"
                          style={{ height: `${lostHeight}px` }}
                        ></div>
                      )}
                      <div
                        className={`w-6 sm:w-8 rounded-t-sm ${isWin ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ height: `${wonHeight}px` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">{index + 1}</span>
                    <span className="text-[10px] text-gray-400">
                      {stats.totalPoints}-{stats.pointsLost}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-center text-xs sm:text-sm text-gray-600">
              <span className="inline-flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Wins
              </span>
              <span className="inline-flex items-center gap-2 ml-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                Losses
              </span>
              <span className="inline-flex items-center gap-2 ml-4">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                Opponent Points
              </span>
            </div>
          </div>

                     {/* Winners Chart with Shot Type Breakdown */}
           <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-base sm:text-lg font-semibold text-gray-900">Winners</h3>
               <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">Fullscreen</button>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                 <div className="text-center">
                 <div className="relative inline-block mb-4">
                   <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90" viewBox="0 0 100 100">
                     <circle
                       cx="50"
                       cy="50"
                       r="40"
                       stroke="currentColor"
                       strokeWidth="5"
                       fill="transparent"
                       className="text-gray-200"
                     />
                     {(() => {
                       const radius = 40;
                       const circumference = 2 * Math.PI * radius;
                       let offsetTracker = 0;

                       return winnerSegments.map((segment) => {
                         const value = winnersBreakdown[segment.key] || 0;
                         const ratio = winnersTotal > 0 ? value / winnersTotal : 0;
                         const dashLength = circumference * ratio;
                         const dashOffset = circumference * (1 - offsetTracker - ratio);
                         offsetTracker += ratio;

                         if (ratio <= 0) {
                           return null;
                         }

                         return (
                           <circle
                             key={segment.key}
                             cx="50"
                             cy="50"
                             r={radius}
                             stroke="currentColor"
                             strokeWidth="5"
                             fill="transparent"
                             strokeDasharray={`${dashLength} ${circumference}`}
                             strokeDashoffset={dashOffset}
                             strokeLinecap="round"
                             className={segment.color}
                           />
                         );
                       });
                     })()}
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
                     <div>
                       <p className="text-lg sm:text-xl font-bold text-gray-900 leading-none">
                         {winnersTotal}
                       </p>
                       <p className="text-xs text-gray-600 mt-1">Total</p>
                     </div>
                   </div>
                 </div>
               </div>
               <div className="text-center">
                 <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Shot Type</h4>
                 <div className="space-y-2 sm:space-y-3">
                  {winnerSegments.map((segment) => (
                    <div key={segment.key} className="flex items-center gap-2">
                      <div className={`w-3 h-3 ${segment.bg} rounded-full`}></div>
                      <span className="text-xs sm:text-sm text-gray-700">{segment.label}</span>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 ml-auto">
                        {winnersBreakdown[segment.key] || 0}
                      </span>
                    </div>
                  ))}
                 </div>
               </div>
             </div>
           </div>

                     {/* Weekly Activity Chart */}
           <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-base sm:text-lg font-semibold text-gray-900">Weekly Activity</h3>
               <div className="flex gap-2">
                                   <button 
                    onClick={() => {
                      // Reset calendar service throttling
                      CalendarService.resetThrottling();
                      setWeeklyActivities([]);
                      setLoadingActivities(false);
                      // Force a fresh fetch by clearing the dependency
                      setTimeout(() => {
                        setLoadingActivities(false);
                      }, 100);
                    }}
                    className="text-gray-600 hover:text-gray-700 text-xs sm:text-sm font-medium px-2 py-1 rounded hover:bg-gray-100"
                  >
                    Refresh
                  </button>
                 <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">Fullscreen</button>
               </div>
             </div>
                           {loadingActivities ? (
                <div className="h-36 sm:h-48 flex items-center justify-center">
                  <div className="text-gray-500 text-sm">Loading activities...</div>
                </div>
              ) : weeklyActivities.length > 0 ? (
                <div className="h-36 sm:h-48 flex items-end justify-center gap-2 sm:gap-3">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                    // Count events for this day of the week
                    const dayEvents = weeklyActivities.filter(event => {
                      const eventDate = new Date(event.startTime || event.startDate || event.date);
                      return eventDate.getDay() === index;
                    });
                    const activityCount = dayEvents.length;
                    const height = Math.max(activityCount * 20, 20); // Minimum height of 20px
                    
                    return (
                      <div key={day} className="flex flex-col items-center group relative">
                        <div 
                          className={`w-6 sm:w-8 rounded-t-sm transition-all duration-300 cursor-pointer ${
                            activityCount > 0 ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-200'
                          }`}
                          style={{ height: `${height}px` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2">{day}</span>
                        <span className={`text-xs ${activityCount > 0 ? 'text-gray-600' : 'text-gray-400'}`}>
                          {activityCount}
                        </span>
                        
                        {/* Tooltip showing event details */}
                        {activityCount > 0 && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                            <div className="text-center">
                              <div className="font-semibold mb-1">{day}</div>
                              {dayEvents.slice(0, 3).map((event, idx) => (
                                <div key={idx} className="text-gray-300">
                                  • {event.title} ({event.type})
                                </div>
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="text-gray-400">+{dayEvents.length - 3} more</div>
                              )}
                            </div>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-36 sm:h-48 flex items-center justify-center">
                  <div className="text-gray-500 text-sm">No activities this week</div>
                </div>
              )}
                           <div className="mt-4 text-center text-xs sm:text-sm text-gray-600">
                {weeklyActivities.length > 0 
                  ? `${weeklyActivities.length} total activities this week`
                  : 'No activities scheduled this week'
                }
              </div>
            </div>
          </div>

          {/* Recent Matches */}
          {recentMatches.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
               <div className="flex items-center justify-between mb-4 sm:mb-6">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-100 rounded-lg">
                     <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                   </div>
                   <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Matches</h3>
                 </div>
                 <span className="text-xs sm:text-sm text-gray-500">{recentMatches.length} matches</span>
               </div>
              <div className="space-y-3">
                {recentMatchesDetailed.map(({ match, stats, resultLabel, resultColor, resultBg, resultIcon }, index) => {
                  const opponentName = getOpponentName(match);
                  return (
                     <div 
                       key={index} 
                       onClick={() => navigate(`/admin/matchs/detail/${match._id}`)}
                       className="group cursor-pointer p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 sm:gap-4">
                           <div className={`p-2 sm:p-3 ${resultBg} rounded-full text-base sm:text-lg`}>
                             {resultIcon}
                           </div>
                           <div className="min-w-0 flex-1">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="text-xs sm:text-sm text-gray-500">vs</span>
                               <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">{opponentName}</span>
                             </div>
                             <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                               <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                               <span>{new Date(match.date).toLocaleDateString('en-US', { 
                                 month: 'short', 
                                 day: 'numeric',
                                 year: 'numeric'
                               })}</span>
                             </div>
                           </div>
                         </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                          <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${resultColor} ${resultBg}`}>
                            {resultLabel}
                           </div>
                          <span className="text-xs sm:text-sm text-gray-500">
                            {stats.totalPoints}-{stats.pointsLost}
                          </span>
                           <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
              </div>
                    </div>
                  </div>
                  );
                })}
                </div>
               {recentMatches.length > 3 && (
                 <div className="mt-4 text-center">
                   <button 
                     onClick={() => navigate('/admin/matchs')}
                     className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium hover:underline"
                   >
                     View All Matches
                   </button>
                 </div>
               )}
            </div>
          )}

          {/* Additional Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Serving</h3>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{filteredStats.totalServes || 0}</p>
                <p className="text-sm sm:text-base text-gray-600">Total Serves</p>
                {selectedMatch !== 'all' && (
                  <p className="text-xs sm:text-sm text-blue-600 mt-1">From selected match</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Winners</h3>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{filteredStats.totalWinners || 0}</p>
                <p className="text-sm sm:text-base text-gray-600">Total Winners</p>
                {selectedMatch !== 'all' && (
                  <p className="text-xs sm:text-sm text-green-600 mt-1">From selected match</p>
                )}
                    </div>
                  </div>
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Rallies</h3>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{filteredStats.totalRallies || 0}</p>
                <p className="text-sm sm:text-base text-gray-600">Total Rallies</p>
                {selectedMatch !== 'all' && (
                  <p className="text-xs sm:text-sm text-purple-600 mt-1">From selected match</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Serves Tab Content */}
      {selectedTab === 'Serves' && (
        <div className="space-y-4 sm:space-y-6">
           {/* Serve Performance Overview */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
             <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Total Serves</h3>
               <p className="text-2xl sm:text-3xl font-bold text-blue-600">{filteredStats.totalServes || 0}</p>
               <p className="text-sm sm:text-base text-gray-600">Serves</p>
               {selectedMatch !== 'all' && (
                 <p className="text-xs sm:text-sm text-blue-600 mt-1">From selected match</p>
               )}
             </div>
             <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">First Serve %</h3>
               <p className="text-2xl sm:text-3xl font-bold text-green-600">
                 {firstServeWinPercentage}%
               </p>
               <p className="text-sm sm:text-base text-gray-600">Win Rate ({totalFirstServePoints || 0} points)</p>
               {selectedMatch !== 'all' && (
                 <p className="text-xs sm:text-sm text-green-600 mt-1">From selected match</p>
               )}
             </div>
             <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-base sm:text-lg font-semibold text-purple-600 mb-4">Aces</h3>
               <p className="text-2xl sm:text-3xl font-bold text-purple-600">{filteredStats.aces || 0}</p>
               <p className="text-sm sm:text-base text-gray-600">Aces</p>
               {selectedMatch !== 'all' && (
                 <p className="text-xs sm:text-sm text-purple-600 mt-1">From selected match</p>
               )}
             </div>
           </div>

                       {/* Serve Charts Grid - 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Serve Distribution Chart */}
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Serve Distribution</h3>
                  <button className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">Fullscreen</button>
                </div>
                <div className="h-48 sm:h-64 flex items-end justify-center gap-2 sm:gap-4">
                  {serveDistributionData.map(({ key, label, value, color }) => {
                    const height = Math.max((value / maxServeValue) * 200, value > 0 ? 8 : 2);
                    return (
                      <div key={key} className="flex flex-col items-center">
                        <div
                          className={`w-10 sm:w-12 ${color} rounded-t-sm transition-all duration-300`}
                          style={{ height: `${height}px` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2 text-center max-w-[70px] break-words">
                          {label}
                        </span>
                        <span className="text-xs text-gray-400">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Serve Accuracy Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Serve Accuracy</h3>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Fullscreen</button>
                </div>
                <div className="text-center">
                  <div className="relative inline-block">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 140 140">
                      <circle
                        cx="70"
                        cy="70"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="70"
                        cy="70"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={serveAccuracyProgress.dashArray}
                        strokeDashoffset={serveAccuracyProgress.dashOffset}
                        strokeLinecap="round"
                        className="text-blue-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
                      <div>
                        <p className="text-3xl font-bold text-gray-900 leading-none">
                          {totalServePoints > 0
                            ? Math.round((servePointsWon / totalServePoints) * 100)
                            : 0}%
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Accuracy</p>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Points Tab Content */}
      {selectedTab === 'Points' && (
        <div className="space-y-4 sm:space-y-6">
            {/* Points Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Points Won</h3>
                <p className="text-3xl font-bold text-green-600">{totalPointsWon}</p>
               <p className="text-gray-600">Won</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-green-600 mt-1">From selected match</p>
                 )}
             </div>
               <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Points Lost</h3>
                <p className="text-3xl font-bold text-red-600">{totalPointsLost}</p>
               <p className="text-gray-600">Lost</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-red-600 mt-1">From selected match</p>
                 )}
             </div>
               <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Win Rate</h3>
               <p className="text-3xl font-bold text-blue-600">
                  {totalPointsPlayed > 0
                    ? Math.round((totalPointsWon / totalPointsPlayed) * 100)
                    : 0}%
               </p>
               <p className="text-gray-600">Success Rate</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-blue-600 mt-1">From selected match</p>
                 )}
             </div>
           </div>

                       {/* Points Charts Grid - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Points Trend Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Points Trend</h3>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Fullscreen</button>
                </div>
                <div className="h-64 flex items-end justify-center gap-2">
                  {recentMatchSummaries.map(({ match, stats }, index) => {
                    const wonHeight = Math.max((stats.totalPoints / maxTotalPoints) * 200, stats.totalPoints > 0 ? 6 : 2);
                    const lostHeight = Math.max((stats.pointsLost / maxTotalPoints) * 200, stats.pointsLost > 0 ? 4 : 0);
                    return (
                      <div key={match._id || index} className="flex flex-col items-center">
                        <div className="flex flex-col-reverse gap-1">
                          {lostHeight > 0 && (
                            <div
                              className="w-6 bg-red-500 rounded-t-sm"
                              style={{ height: `${lostHeight}px` }}
                            ></div>
                          )}
                          <div
                            className="w-6 bg-green-500 rounded-t-sm"
                            style={{ height: `${wonHeight}px` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{index + 1}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Points Won
                  </span>
                  <span className="inline-flex items-center gap-2 ml-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    Points Lost
                  </span>
                </div>
              </div>

              {/* Points Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Points Distribution</h3>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Fullscreen</button>
                </div>
                <div className="text-center">
                  <div className="relative inline-block">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 140 140">
                      <circle
                        cx="70"
                        cy="70"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="70"
                        cy="70"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={pointsProgressLarge.dashArray}
                        strokeDashoffset={pointsProgressLarge.dashOffset}
                        strokeLinecap="round"
                        className="text-green-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
                      <div>
                        <p className="text-3xl font-bold text-gray-900 leading-none">
                          {totalPointsWon}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Total</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      )}

      {/* Returns Tab Content */}
      {selectedTab === 'Returns' && (
        <div className="space-y-4 sm:space-y-6">
            {/* Returns Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Returns</h3>
                <p className="text-3xl font-bold text-blue-600">{returnStats.totalReturns || 0}</p>
               <p className="text-gray-600">Returns</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-blue-600 mt-1">From selected match</p>
                 )}
             </div>
               <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Winners</h3>
                <p className="text-3xl font-bold text-green-600">{totalReturnWinners}</p>
               <p className="text-gray-600">Winners</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-green-600 mt-1">From selected match</p>
                 )}
             </div>
               <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Errors</h3>
                <p className="text-3xl font-bold text-red-600">{totalReturnErrors}</p>
               <p className="text-gray-600">Errors</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-red-600 mt-1">From selected match</p>
                 )}
             </div>
           </div>

           {/* Return Performance Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-gray-900">Return Performance</h3>
               <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Fullscreen</button>
             </div>
             <div className="h-64 flex items-end justify-center gap-4">
              {returnDistributionData.map(({ key, label, value, color }) => {
                const height = Math.max((value / maxReturnValue) * 200, value > 0 ? 8 : 2);
                return (
                  <div key={key} className="flex flex-col items-center">
                    <div
                      className={`w-12 ${color} rounded-t-sm transition-all duration-300`}
                      style={{ height: `${height}px` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">{label}</span>
                    <span className="text-xs text-gray-400">{value}</span>
                  </div>
                );
              })}
             </div>
          </div>
        </div>
      )}

      {/* Rally Tab Content */}
      {selectedTab === 'Rally' && (
        <div className="space-y-4 sm:space-y-6">
            {/* Rally Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                            <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Rallies</h3>
                <p className="text-3xl font-bold text-blue-600">{filteredStats.totalRallies || 0}</p>
               <p className="text-gray-600">Rallies</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-blue-600 mt-1">From selected match</p>
                 )}
             </div>
               <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Avg Rally Length</h3>
                <p className="text-3xl font-bold text-green-600">{filteredStats.averageRallyLength || 0}</p>
              <p className="text-gray-600">Shots (avg)</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-green-600 mt-1">From selected match</p>
                 )}
             </div>
               <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Longest Rally</h3>
                <p className="text-3xl font-bold text-purple-600">{longestRallyApprox}</p>
              <p className="text-gray-600">Estimated Shots</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-purple-600 mt-1">From selected match</p>
                 )}
             </div>
           </div>

                       {/* Rally Charts Grid - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rally Length Distribution */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Rally Length Distribution</h3>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Fullscreen</button>
                </div>
                <div className="h-64 flex items-end justify-center gap-2">
                  {rallyBuckets.map(({ key, label, color }) => {
                    const value = rallyBreakdown[key] || 0;
                    const height = Math.max((value / maxRallyValue) * 200, value > 0 ? 8 : 2);
                    return (
                      <div key={key} className="flex flex-col items-center">
                        <div
                          className={`w-10 ${color} rounded-t-sm transition-all duration-300`}
                          style={{ height: `${height}px` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1">{label}</span>
                        <span className="text-xs text-gray-400">{value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rally Heatmap */}
          <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Rally Heatmap</h3>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">Fullscreen</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                  {rallyBuckets.map((bucket) => {
                    const value = rallyBreakdown[bucket.key] || 0;
                    const ratio =
                      filteredStats.totalRallies > 0
                        ? value / filteredStats.totalRallies
                        : 0;
                    const backgroundColor = rallyBucketColors[bucket.key] || '#6366f1';
                    const opacity = ratio > 0 ? Math.min(0.25 + ratio * 0.75, 1) : 0.15;
                    return (
                      <div
                        key={bucket.key}
                        className="rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center text-white text-center transition-all duration-300"
                        style={{ backgroundColor, opacity }}
                      >
                        <span className="text-sm sm:text-base font-semibold">{bucket.label}</span>
                        <span className="text-xs sm:text-sm mt-1">
                          {value} rallies
                        </span>
                        <span className="text-[10px] sm:text-xs mt-1 text-white/80">
                          {(ratio * 100).toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-center text-sm text-gray-600">
                  Court position rally frequency
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerAnalytics;

