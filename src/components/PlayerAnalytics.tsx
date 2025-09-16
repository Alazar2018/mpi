import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar, Trophy, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CalendarService } from '@/service/calendar.server';

interface PlayerStats {
  totalPoints: number;
  totalWinners: number;
  totalErrors: number;
  totalServes: number;
  totalRallies: number;
  avgPointsPerMatch: number;
  winRate: number;
}

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
    points?: { total: number };
    winners?: { 
      p1: { forehand: number; backhand: number; returnForehand: number; returnBackhand: number }; 
      p2: { forehand: number; backhand: number; returnForehand: number; returnBackhand: number } 
    };
    rallyLengthFrequency?: { [key: string]: number };
  };
}

interface PlayerAnalyticsProps {
  userName: string;
  playerData?: {
    totalMatches: number;
    completedMatches: number;
    pendingMatches: number;
    winRate: number;
    recentMatches: PlayerMatch[];
    matches?: PlayerMatch[]; // Add matches array for filtering
    stats: PlayerStats;
  };
}

const PlayerAnalytics: React.FC<PlayerAnalyticsProps> = ({ userName, playerData }) => {
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
  const stats = playerData?.stats;
  const recentMatches = playerData?.recentMatches || [];
  const allMatches = playerData?.matches || []; // Get all matches for filtering

  // Get all matches for the dropdown (only completed matches)
  const getAllMatchesForDropdown = () => {
    let allMatchesForDropdown = playerData?.matches || [];
    
    // Only show completed matches
    allMatchesForDropdown = allMatchesForDropdown.filter(match => match.status === 'completed');
    
    // Filter by match type
    if (selectedMatchType !== 'All') {
      allMatchesForDropdown = allMatchesForDropdown.filter(match => match.matchCategory === selectedMatchType.toLowerCase());
    }

    // Filter by time
    if (selectedTimeframe !== 'All') {
      const now = new Date();
      let startDate = new Date();
      
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
          startDate = new Date(0); // Beginning of time
      }
      
      allMatchesForDropdown = allMatchesForDropdown.filter(match => new Date(match.date) >= startDate);
    }

    return allMatchesForDropdown;
  };

  // Filter matches based on selected criteria for analytics
  const getFilteredMatches = () => {
    let filtered = getAllMatchesForDropdown();

    // Filter by specific match
    if (selectedMatch !== 'all') {
      filtered = filtered.filter(match => match._id === selectedMatch);
    }

    return filtered;
  };

  // Get filtered stats based on filtered matches
  const getFilteredStats = () => {
    const filteredMatches = getFilteredMatches();
    
    if (filteredMatches.length === 0) {
      return {
        totalPoints: 0,
        totalWinners: 0,
        totalErrors: 0,
        totalServes: 0,
        totalRallies: 0,
        avgPointsPerMatch: 0,
        winRate: 0
      };
    }

    // If filtering by specific match, calculate stats for that match only
    if (selectedMatch !== 'all') {
      const match = filteredMatches[0];
      
      // Use actual match data from the reports
      let matchStats = {
        totalPoints: 0,
        totalWinners: 0,
        totalErrors: 0,
        totalServes: 0,
        totalRallies: 0,
        avgPointsPerMatch: 0,
        winRate: 0
      };

      // Extract stats from the match reports
      if (match.p1MatchReport) {
        // Add service stats
        matchStats.totalServes += match.p1MatchReport.service?.totalServices || 0;
        
        // Add points stats
        matchStats.totalPoints += match.p1MatchReport.points?.totalPointsWon || 0;
        matchStats.totalWinners += match.p1MatchReport.points?.winners || 0;
        matchStats.totalErrors += (match.p1MatchReport.points?.unforcedErrors || 0) + 
                                (match.p1MatchReport.points?.forcedErrors || 0);
        
        // Add rally stats
        if (match.p1MatchReport.rallies) {
          const rallyValues = Object.values(match.p1MatchReport.rallies);
          matchStats.totalRallies += rallyValues.reduce((sum: number, val: any) => sum + (val || 0), 0);
        }
      }

      if (match.p2MatchReport) {
        // Add service stats
        matchStats.totalServes += match.p2MatchReport.service?.totalServices || 0;
        
        // Add points stats
        matchStats.totalPoints += match.p2MatchReport.points?.totalPointsWon || 0;
        matchStats.totalWinners += match.p2MatchReport.points?.winners || 0;
        matchStats.totalErrors += (match.p2MatchReport.points?.unforcedErrors || 0) + 
                                (match.p2MatchReport.points?.forcedErrors || 0);
        
        // Add rally stats
        if (match.p2MatchReport.rallies) {
          const rallyValues = Object.values(match.p2MatchReport.rallies);
          matchStats.totalRallies += rallyValues.reduce((sum: number, val: any) => sum + (val || 0), 0);
        }
      }

      // Also try to get data from the overall report if available
      if (match.report) {
        // Add total points from overall report
        matchStats.totalPoints = match.report.points?.total || matchStats.totalPoints;
        
        // Add winners from overall report
        if (match.report.winners) {
          matchStats.totalWinners = (match.report.winners.p1?.forehand || 0) + 
                                   (match.report.winners.p1?.backhand || 0) + 
                                   (match.report.winners.p1?.returnForehand || 0) + 
                                   (match.report.winners.p1?.returnBackhand || 0) +
                                   (match.report.winners.p2?.forehand || 0) + 
                                   (match.report.winners.p2?.backhand || 0) + 
                                   (match.report.winners.p2?.returnForehand || 0) + 
                                   (match.report.winners.p2?.returnBackhand || 0);
        }
        
        // Add rally data from overall report
        if (match.report.rallyLengthFrequency) {
          const rallyValues = Object.values(match.report.rallyLengthFrequency);
          matchStats.totalRallies = rallyValues.reduce((sum: number, val: any) => sum + (val || 0), 0);
        }
      }

      // Calculate win rate for this match
      if (match.winner) {
        matchStats.winRate = 100; // If there's a winner, it's a completed match
      }

      matchStats.avgPointsPerMatch = matchStats.totalPoints;
      
      return matchStats;
    }

    // For other filters, return the original stats (or recalculate if needed)
    return stats;
  };

  const filteredStats = getFilteredStats();
  const filteredMatches = getFilteredMatches();

  // Get unique match types for the dropdown
  const getUniqueMatchTypes = () => {
    const types = allMatches.map(match => match.matchCategory);
    return ['All', ...Array.from(new Set(types))];
  };

  // Function to get opponent name from a match
  const getOpponentName = (match: PlayerMatch) => {
    // Check if p2 is an object or just a name
    if (match.p2IsObject && match.p2?.firstName && match.p2?.lastName) {
      // p2 is an object with firstName and lastName
      return `${match.p2.firstName} ${match.p2.lastName}`;
    } else if (match.p2Name) {
      // p2 is just a name string
      return match.p2Name;
    } else {
      // Fallback
      return 'Unknown Player';
    }
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
                                 <option value="all">All Matches ({getAllMatchesForDropdown().length})</option>
                 {getAllMatchesForDropdown().map((match) => {
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
                     <span className="text-gray-500 ml-2">({getAllMatchesForDropdown().length} total matches)</span>
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
                  : `Match Analysis: vs ${getOpponentName(filteredMatches[0])}`
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
                    <p className="text-xs sm:text-sm text-blue-600 mt-1">vs {getOpponentName(filteredMatches[0])}</p>
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
                   <p className="text-2xl sm:text-3xl font-bold text-gray-900">{filteredStats?.totalRallies || 0}</p>
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
                <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${filteredStats?.totalPoints || 0} ${filteredStats?.totalErrors || 0}`}
                    className="text-green-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {filteredStats?.totalPoints || 0}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">Points</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-center sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm text-green-600 font-medium">
                      Won {filteredStats?.totalPoints || 0} Points
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm text-orange-600 font-medium">
                      Lost {filteredStats?.totalErrors || 0} Points
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
              {recentMatches.slice(0, 8).map((match, index) => {
                const isWin = match.status === 'completed' && 
                  ((match.winner === 'playerOne' && match.p1?._id === match.p1?._id) || 
                   (match.winner === 'playerTwo' && match.p2?._id === match.p2?._id));
                const height = isWin ? 80 : 40;
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className={`w-6 sm:w-8 rounded-t-sm transition-all duration-300 ${
                        isWin ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ height: `${height}px` }}
                    ></div>
                    <span className="text-xs text-gray-500 mt-1">
                      {index + 1}
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
                   <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90">
                     <circle
                       cx="40"
                       cy="40"
                       r="32"
                       stroke="currentColor"
                       strokeWidth="5"
                       fill="transparent"
                       className="text-gray-200"
                     />
                     <circle
                       cx="40"
                       cy="40"
                       r="32"
                       stroke="currentColor"
                       strokeWidth="5"
                       fill="transparent"
                       strokeDasharray={`${Math.floor((filteredStats?.totalWinners || 0) * 0.25)} 100`}
                       className="text-blue-500"
                     />
                     <circle
                       cx="40"
                       cy="40"
                       r="32"
                       stroke="currentColor"
                       strokeWidth="5"
                       fill="transparent"
                       strokeDasharray={`${Math.floor((filteredStats?.totalWinners || 0) * 0.35)} 100`}
                       className="text-cyan-500"
                       strokeDashoffset={`-${Math.floor((filteredStats?.totalWinners || 0) * 0.25)}`}
                     />
                     <circle
                       cx="40"
                       cy="40"
                       r="32"
                       stroke="currentColor"
                       strokeWidth="5"
                       fill="transparent"
                       strokeDasharray={`${Math.floor((filteredStats?.totalWinners || 0) * 0.24)} 100`}
                       className="text-yellow-500"
                       strokeDashoffset={`-${Math.floor((filteredStats?.totalWinners || 0) * 0.6)}`}
                     />
                     <circle
                       cx="40"
                       cy="40"
                       r="32"
                       stroke="currentColor"
                       strokeWidth="5"
                       fill="transparent"
                       strokeDasharray={`${Math.floor((filteredStats?.totalWinners || 0) * 0.24)} 100`}
                       className="text-green-500"
                       strokeDashoffset={`-${Math.floor((filteredStats?.totalWinners || 0) * 0.84)}`}
                     />
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="text-center">
                       <p className="text-lg sm:text-xl font-bold text-gray-900">
                         {filteredStats?.totalWinners || 0}
                       </p>
                       <p className="text-xs text-gray-600">Total</p>
                     </div>
                   </div>
                 </div>
               </div>
               <div className="text-center">
                 <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Shot Type</h4>
                 <div className="space-y-2 sm:space-y-3">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                     <span className="text-xs sm:text-sm text-gray-700">Forehand</span>
                     <span className="text-xs sm:text-sm font-medium text-gray-900 ml-auto">
                       {Math.floor((filteredStats?.totalWinners || 0) * 0.25)}
                     </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                     <span className="text-xs sm:text-sm text-gray-700">Backhand</span>
                     <span className="text-xs sm:text-sm font-medium text-gray-900 ml-auto">
                       {Math.floor((filteredStats?.totalWinners || 0) * 0.35)}
                     </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                     <span className="text-xs sm:text-sm text-gray-700">Return Forehand</span>
                     <span className="text-xs sm:text-sm font-medium text-gray-900 ml-auto">
                       {Math.floor((stats?.totalWinners || 0) * 0.24)}
                     </span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                     <span className="text-xs sm:text-sm text-gray-700">Return Backhand</span>
                     <span className="text-xs sm:text-sm font-medium text-gray-900 ml-auto">
                       {Math.floor((stats?.totalWinners || 0) * 0.24)}
                     </span>
                   </div>
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
                {recentMatches.map((match, index) => {
                  // Get opponent name using the helper function
                  const opponentName = getOpponentName(match);
                  
                  // Determine match result
                  let result = 'pending';
                   let resultColor = 'text-gray-500';
                   let resultBg = 'bg-gray-100';
                   let resultIcon = '⚪';
                   
                  if (match.status === 'completed' && match.winner) {
                    // For now, just show completed status since we don't know which player is current user
                    result = 'completed';
                    resultColor = 'text-blue-600';
                    resultBg = 'bg-blue-100';
                    resultIcon = '✅';
                  }
                  
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
                             {result.charAt(0).toUpperCase() + result.slice(1)}
                           </div>
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
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{filteredStats?.totalServes || 0}</p>
                <p className="text-sm sm:text-base text-gray-600">Total Serves</p>
                {selectedMatch !== 'all' && (
                  <p className="text-xs sm:text-sm text-blue-600 mt-1">From selected match</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Winners</h3>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{filteredStats?.totalWinners || 0}</p>
                <p className="text-sm sm:text-base text-gray-600">Total Winners</p>
                {selectedMatch !== 'all' && (
                  <p className="text-xs sm:text-sm text-green-600 mt-1">From selected match</p>
                )}
                    </div>
                  </div>
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow duration-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Rallies</h3>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{filteredStats?.totalRallies || 0}</p>
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
               <p className="text-2xl sm:text-3xl font-bold text-blue-600">{filteredStats?.totalServes || 0}</p>
               <p className="text-sm sm:text-base text-gray-600">Serves</p>
               {selectedMatch !== 'all' && (
                 <p className="text-xs sm:text-sm text-blue-600 mt-1">From selected match</p>
               )}
             </div>
             <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">First Serve %</h3>
               <p className="text-2xl sm:text-3xl font-bold text-green-600">
                 {filteredStats?.totalServes ? Math.round((filteredStats.totalServes / (filteredStats.totalServes + (filteredStats.totalErrors || 0))) * 100) : 0}%
               </p>
               <p className="text-sm sm:text-base text-gray-600">Success Rate</p>
               {selectedMatch !== 'all' && (
                 <p className="text-xs sm:text-sm text-green-600 mt-1">From selected match</p>
               )}
             </div>
             <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-base sm:text-lg font-semibold text-purple-600 mb-4">Aces</h3>
               <p className="text-2xl sm:text-3xl font-bold text-purple-600">{Math.floor((filteredStats?.totalServes || 0) * 0.15)}</p>
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
                  {['1st Serve', '2nd Serve', 'Ace', 'Double Fault'].map((type, index) => {
                    const values = [
                      Math.floor((filteredStats?.totalServes || 0) * 0.6),
                      Math.floor((filteredStats?.totalServes || 0) * 0.3),
                      Math.floor((filteredStats?.totalServes || 0) * 0.15),
                      Math.floor((filteredStats?.totalServes || 0) * 0.05)
                    ];
                    // Cap height to prevent overflow and ensure minimum height
                    const height = Math.min(Math.max(values[index] * 2, 20), 200);
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500'];
                    return (
                      <div key={type} className="flex flex-col items-center">
                        <div 
                          className={`w-8 sm:w-12 ${colors[index]} rounded-t-sm transition-all duration-300`}
                          style={{ height: `${height}px` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-2 text-center max-w-[60px] break-words">{type}</span>
                        <span className="text-xs text-gray-400">{values[index]}</span>
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
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${filteredStats?.totalServes || 0} 100`}
                        className="text-blue-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">
                          {filteredStats?.totalServes ? Math.round((filteredStats.totalServes / (filteredStats.totalServes + (filteredStats.totalErrors || 0))) * 100) : 0}%
                        </p>
                        <p className="text-sm text-gray-600">Accuracy</p>
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
                 <p className="text-3xl font-bold text-green-600">{filteredStats?.totalPoints || 0}</p>
               <p className="text-gray-600">Won</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-green-600 mt-1">From selected match</p>
                 )}
             </div>
               <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Points Lost</h3>
                 <p className="text-3xl font-bold text-red-600">{filteredStats?.totalErrors || 0}</p>
               <p className="text-gray-600">Lost</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-red-600 mt-1">From selected match</p>
                 )}
             </div>
               <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Win Rate</h3>
               <p className="text-3xl font-bold text-blue-600">
                   {filteredStats?.totalPoints && filteredStats?.totalErrors ? 
                     Math.round((filteredStats.totalPoints / (filteredStats.totalPoints + filteredStats.totalErrors)) * 100) : 0}%
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
                  {recentMatches.slice(0, 10).map((match, index) => {
                    const pointsWon = Math.floor(Math.random() * 20) + 10; // Mock data
                    const pointsLost = Math.floor(Math.random() * 15) + 5;
                    const height = pointsWon + pointsLost;
                    return (
                      <div key={index} className="flex flex-col items-center">
                        <div className="flex flex-col gap-1">
                          <div 
                            className="w-6 bg-green-500 rounded-t-sm"
                            style={{ height: `${pointsWon * 2}px` }}
                          ></div>
                          <div 
                            className="w-6 bg-red-500 rounded-t-sm"
                            style={{ height: `${pointsLost * 2}px` }}
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
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${filteredStats?.totalPoints || 0} ${filteredStats?.totalErrors || 0}`}
                        className="text-green-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">
                          {filteredStats?.totalPoints || 0}
                        </p>
                        <p className="text-sm text-gray-600">Total</p>
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
                 <p className="text-3xl font-bold text-blue-600">{filteredStats?.totalRallies || 0}</p>
               <p className="text-gray-600">Returns</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-blue-600 mt-1">From selected match</p>
                 )}
             </div>
               <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Winners</h3>
                 <p className="text-3xl font-bold text-green-600">{Math.floor((filteredStats?.totalRallies || 0) * 0.3)}</p>
               <p className="text-gray-600">Winners</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-green-600 mt-1">From selected match</p>
                 )}
             </div>
               <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Errors</h3>
                 <p className="text-3xl font-bold text-red-600">{Math.floor((filteredStats?.totalRallies || 0) * 0.2)}</p>
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
               {['Forehand', 'Backhand', 'Volley', 'Overhead'].map((type, index) => {
                 const values = [
                   Math.floor((filteredStats?.totalRallies || 0) * 0.4),
                   Math.floor((filteredStats?.totalRallies || 0) * 0.35),
                   Math.floor((filteredStats?.totalRallies || 0) * 0.15),
                   Math.floor((filteredStats?.totalRallies || 0) * 0.1)
                 ];
                 const height = values[index] * 2;
                 const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                 return (
                   <div key={type} className="flex flex-col items-center">
                     <div 
                       className={`w-12 ${colors[index]} rounded-t-sm transition-all duration-300`}
                       style={{ height: `${Math.max(height, 20)}px` }}
                     ></div>
                     <span className="text-xs text-gray-500 mt-2">{type}</span>
                     <span className="text-xs text-gray-400">{values[index]}</span>
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
                 <p className="text-3xl font-bold text-blue-600">{filteredStats?.totalRallies || 0}</p>
               <p className="text-gray-600">Rallies</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-blue-600 mt-1">From selected match</p>
                 )}
             </div>
               <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Avg Rally Length</h3>
                 <p className="text-3xl font-bold text-green-600">{filteredStats?.totalRallies || 0}</p>
               <p className="text-gray-600">Shots</p>
                 {selectedMatch !== 'all' && (
                   <p className="text-xs text-green-600 mt-1">From selected match</p>
                 )}
             </div>
               <div className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow duration-200">
               <h3 className="text-lg font-semibold text-gray-900 mb-4">Longest Rally</h3>
                 <p className="text-3xl font-bold text-purple-600">{Math.floor((filteredStats?.totalRallies || 0) * 0.8)}</p>
               <p className="text-gray-600">Shots</p>
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
                  {['1-3', '4-6', '7-9', '10+'].map((range, index) => {
                    const values = [
                      Math.floor((filteredStats?.totalRallies || 0) * 0.4),
                      Math.floor((filteredStats?.totalRallies || 0) * 0.3),
                      Math.floor((filteredStats?.totalRallies || 0) * 0.2),
                      Math.floor((filteredStats?.totalRallies || 0) * 0.1)
                    ];
                    const height = values[index] * 2;
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                    return (
                      <div key={range} className="flex flex-col items-center">
                        <div 
                          className={`w-8 ${colors[index]} rounded-t-sm transition-all duration-300`}
                          style={{ height: `${Math.max(height, 20)}px` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1">{range}</span>
                        <span className="text-xs text-gray-400">{values[index]}</span>
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
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 49 }, (_, i) => {
                    const intensity = Math.floor(Math.random() * 100);
                    const color = intensity > 80 ? 'bg-red-500' : 
                                 intensity > 60 ? 'bg-orange-500' : 
                                 intensity > 40 ? 'bg-yellow-500' : 
                                 intensity > 20 ? 'bg-blue-500' : 'bg-gray-200';
                    return (
                      <div 
                        key={i} 
                        className={`w-8 h-8 ${color} rounded-sm transition-all duration-300`}
                        style={{ opacity: intensity / 100 }}
                      ></div>
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
