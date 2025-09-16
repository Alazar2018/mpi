import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useDashboard } from '@/hooks/useDashboard';
import PlayerAnalytics from '../components/PlayerAnalytics';
import GeneralDashboard from '../components/GeneralDashboard';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Users, 
  Trophy, 
  Calendar, 
  Target,
  BookOpen,
  MessageSquare,
  Shield,
  UserCheck,
  Activity,
  Eye,
  Plus,
  Edit
} from 'lucide-react';

// Player Dashboard Component
const PlayerDashboard: React.FC = () => {
  const [dashboardType, setDashboardType] = useState<'general' | 'personal'>('general');
  const [playerData, setPlayerData] = useState<any>(null);
  const [loadingPlayerData, setLoadingPlayerData] = useState(false);
  const { dashboardData, loading, error } = useDashboard();
  const authStore = useAuthStore();
  const userName = authStore.user ? `${authStore.user.firstName} ${authStore.user.lastName}` : 'User';
  const userId = authStore.user?._id;

  // Function to fetch player's own match data
  const fetchPlayerData = async () => {
    if (!userId) return;
    
    try {
      setLoadingPlayerData(true);
      // Import matchesService dynamically to avoid circular dependencies
      const { matchesService } = await import('@/service/matchs.server');
      const matchesResponse = await matchesService.getMatches({ limit: 100 }); // Get all matches
      
      if (matchesResponse.matches) {
        // Filter matches for the current player
        const playerMatches = matchesResponse.matches.filter(match => {
          return (typeof match.p1 === 'object' && match.p1?._id === userId) || 
                 (typeof match.p2 === 'object' && match.p2?._id === userId);
        });

        

        // Transform the data for the dashboard
        const playerDashboardData = {
          matches: playerMatches,
          totalMatches: playerMatches.length,
          completedMatches: playerMatches.filter(m => m.status === 'completed').length,
          pendingMatches: playerMatches.filter(m => m.status === 'pending').length,
          winRate: calculatePlayerWinRate(playerMatches, userId),
          recentMatches: playerMatches.slice(0, 5), // Last 5 matches
          stats: aggregatePlayerStatsForSelf(playerMatches, userId)
        };

        
        setPlayerData(playerDashboardData);
      }
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoadingPlayerData(false);
    }
  };

  // Helper function to calculate player's own win rate
  const calculatePlayerWinRate = (matches: any[], playerId: string) => {
    const completedMatches = matches.filter(m => m.status === 'completed');
    if (completedMatches.length === 0) return 0;
    
    const wins = completedMatches.filter(m => m.winner === 'playerOne' && m.p1?._id === playerId || 
                                            m.winner === 'playerTwo' && m.p2?._id === playerId).length;
    
    return Math.round((wins / completedMatches.length) * 100);
  };

  // Helper function to aggregate player's own statistics
  const aggregatePlayerStatsForSelf = (matches: any[], playerId: string) => {
    const completedMatches = matches.filter(m => m.status === 'completed');
    let totalPoints = 0;
    let totalWinners = 0;
    let totalErrors = 0;
    let totalServes = 0;
    let totalRallies = 0;

    completedMatches.forEach(match => {
      const isPlayerOne = match.p1?._id === playerId;
      const matchReport = isPlayerOne ? match.p1MatchReport : match.p2MatchReport;
      const overallReport = match.report;
      
      if (matchReport) {
        // Extract data from individual player match report
        totalPoints += matchReport.points?.totalPointsWon || 0;
        totalWinners += matchReport.points?.winners || 0;
        totalErrors += (matchReport.points?.unforcedErrors || 0) + (matchReport.points?.forcedErrors || 0);
        totalServes += matchReport.service?.totalServices || 0;
        
        // Sum up rally lengths from the rallies object
        if (matchReport.rallies) {
          const rallyValues = Object.values(matchReport.rallies);
          totalRallies += rallyValues.reduce((sum: number, val: any) => sum + (val || 0), 0);
        }
      }
      
      // Also try to get data from the overall report if available
      if (overallReport && isPlayerOne) {
        // For player one, use p1 data from overall report
        totalPoints += overallReport.points?.p1?.won || 0;
        totalWinners += overallReport.winners?.p1?.forehand || 0;
        totalWinners += overallReport.winners?.p1?.backhand || 0;
        totalWinners += overallReport.winners?.p1?.returnForehand || 0;
        totalWinners += overallReport.winners?.p1?.returnBackhand || 0;
        
        // Sum up errors
        const p1Errors = overallReport.errorStats?.p1;
        if (p1Errors) {
          totalErrors += (p1Errors.forced?.forehand?.total || 0) + 
                        (p1Errors.forced?.backhand?.total || 0) +
                        (p1Errors.unforced?.forehand?.total || 0) + 
                        (p1Errors.unforced?.backhand?.total || 0);
        }
        
        // Sum up serves
        totalServes += overallReport.serves?.p1?.firstServesWon || 0;
        totalServes += overallReport.serves?.p1?.firstServesLost || 0;
        totalServes += overallReport.serves?.p1?.secondServesWon || 0;
        totalServes += overallReport.serves?.p1?.secondServesLost || 0;
        
        // Sum up rallies
        if (overallReport.rallyLengthFrequency) {
          const rallyValues = Object.values(overallReport.rallyLengthFrequency);
          totalRallies += rallyValues.reduce((sum: number, val: any) => sum + (val || 0), 0);
        }
      } else if (overallReport && !isPlayerOne) {
        // For player two, use p2 data from overall report
        totalPoints += overallReport.points?.p2?.won || 0;
        totalWinners += overallReport.winners?.p2?.forehand || 0;
        totalWinners += overallReport.winners?.p2?.backhand || 0;
        totalWinners += overallReport.winners?.p2?.returnForehand || 0;
        totalWinners += overallReport.winners?.p2?.returnBackhand || 0;
        
        // Sum up errors
        const p2Errors = overallReport.errorStats?.p2;
        if (p2Errors) {
          totalErrors += (p2Errors.forced?.forehand?.total || 0) + 
                        (p2Errors.forced?.backhand?.total || 0) +
                        (p2Errors.unforced?.forehand?.total || 0) + 
                        (p2Errors.unforced?.backhand?.total || 0);
        }
        
        // Sum up serves
        totalServes += overallReport.serves?.p2?.firstServesWon || 0;
        totalServes += overallReport.serves?.p2?.firstServesLost || 0;
        totalServes += overallReport.serves?.p2?.secondServesWon || 0;
        totalServes += overallReport.serves?.p2?.secondServesLost || 0;
        
        // Sum up rallies
        if (overallReport.rallyLengthFrequency) {
          const rallyValues = Object.values(overallReport.rallyLengthFrequency);
          totalRallies += rallyValues.reduce((sum: number, val: any) => sum + (val || 0), 0);
        }
      }
    });

    return {
      totalPoints,
      totalWinners,
      totalErrors,
      totalServes,
      totalRallies,
      avgPointsPerMatch: completedMatches.length > 0 ? Math.round(totalPoints / completedMatches.length) : 0,
      winRate: calculatePlayerWinRate(matches, playerId)
    };
  };

  // Fetch player data when switching to personal analytics
  React.useEffect(() => {
    if (dashboardType === 'personal' && userId) {
      fetchPlayerData();
    }
  }, [dashboardType, userId]);
  




  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-4 sm:p-6 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Player Dashboard</h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">Track your performance and progress</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1">
              <button 
                onClick={() => setDashboardType('general')}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  dashboardType === 'general' 
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[var(--shadow-primary)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                General Dashboard
              </button>
              <button 
                onClick={() => setDashboardType('personal')}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  dashboardType === 'personal' 
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[var(--shadow-primary)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                My Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

            {/* Personal Analytics - Use the new PlayerAnalytics component */}
            {dashboardType === 'personal' && (
              <>
                {loadingPlayerData ? (
                  <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-6 transition-colors duration-300">
                    <LoadingSpinner size="md" text="Loading your analytics..." />
                  </div>
                ) : (
                  <PlayerAnalytics userName={userName} playerData={playerData} />
                )}
              </>
            )}







      {/* Loading State */}
      {loading && (
        <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-6 transition-colors duration-300">
          <LoadingSpinner size="md" text="Loading dashboard data..." />
        </div>
      )}

      {/* Error State - Only show for actual errors, not access control */}
      {error && 
       error !== 'Access denied. Only coaches and administrators can view player data.' &&
       error !== 'Access denied. Only parents and administrators can view children data.' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-[var(--shadow-primary)] p-6 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-800/30 rounded-lg">
              <span className="text-red-600 dark:text-red-400 text-lg">⚠️</span>
            </div>
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium">Error loading dashboard</p>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* General Dashboard - Use the new GeneralDashboard component */}
      {!loading && !error && dashboardType === 'general' && (
        <GeneralDashboard 
          userRole={(authStore.getRole() as 'player' | 'coach' | 'parent') || 'player'} 
          userName={userName} 
          dashboardData={dashboardData}
        />
      )}























    </div>
  );
};


// Coach Dashboard Component
const CoachDashboard: React.FC = () => {
  const [dashboardType, setDashboardType] = useState<'general' | 'player'>('general');
  const [selectedPlayer, setSelectedPlayer] = useState('All Players');
  const [selectedPlayerData, setSelectedPlayerData] = useState<any>(null);


  const [players, setPlayers] = useState<Array<{ 
    id: string; 
    name: string; 
    level: string; 
    matches: number; 
    winRate: number; 
    email: string; 
    lastOnline: string;
    avatar?: string;
    goals: number;
    completedGoals: number;
    progress: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalPlayers: 0, classesToday: 0, avgWinRate: 0, matchesThisMonth: 0 });
  const [error, setError] = useState<string | null>(null);
  const authStore = useAuthStore();
  const userRole = authStore.getRole();
  const userName = authStore.user ? `${authStore.user.firstName} ${authStore.user.lastName}` : 'Coach';
  


  React.useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Only fetch players list for coaches and admins
        if (userRole !== 'coach' && userRole !== 'admin') {
          // For players, don't show error, just don't fetch player list
          setPlayers([]);
          setStats({ totalPlayers: 0, classesToday: 0, avgWinRate: 0, matchesThisMonth: 0 });
          return;
        }

        // Import playersService dynamically to avoid circular dependencies
        const { playersService } = await import('@/service/players.server');
        const response = await playersService.getPlayers(1, 50);
        
        if (response.players) {
          const playersWithStats = response.players.map(player => {
            // Calculate goals statistics from coachGoals
            const totalGoals = player.coachGoals?.reduce((total, coachGoal) => 
              total + (coachGoal.goals?.length || 0), 0) || 0;
            
            const completedGoals = player.coachGoals?.reduce((total, coachGoal) => {
              const completed = coachGoal.goals?.filter(goal => 
                goal.progress?.some((prog: any) => prog.isDone === true)
              ).length || 0;
              return total + completed;
            }, 0) || 0;
            
            return {
              id: player._id,
              name: `${player.firstName} ${player.lastName}`,
              level: 'Intermediate', // Default level - you can add this field to your player model
              matches: 0, // Will be calculated from matches service
              winRate: 0, // Will be calculated from matches service
              email: player.emailAddress.email,
              lastOnline: player.lastOnline,
              avatar: player.avatar,
              goals: totalGoals,
              completedGoals: completedGoals,
              progress: Math.floor(Math.random() * 40) + 60 // Mock progress for now
            };
          });
          
          setPlayers(playersWithStats);
          setStats({
            totalPlayers: playersWithStats.length,
            classesToday: Math.floor(Math.random() * 20) + 5, // Mock for now
            avgWinRate: Math.floor(Math.random() * 30) + 60, // Mock for now
            matchesThisMonth: Math.floor(Math.random() * 100) + 50 // Mock for now
          });
        }
      } catch (error) {
        console.error('Error fetching players:', error);
        setError('Failed to load player data. Please try again.');
        // Set empty data on error
        setPlayers([]);
        setStats({ totalPlayers: 0, classesToday: 0, avgWinRate: 0, matchesThisMonth: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [userRole]);

  // Function to fetch detailed player data
  const fetchPlayerDetails = async (playerId: string) => {
    if (playerId === 'All Players') {
      setSelectedPlayerData(null);
      setDashboardType('general');
      return;
    }

    try {
      setLoading(true);
      // Import matchesService dynamically to avoid circular dependencies
      const { matchesService } = await import('@/service/matchs.server');
      const matchesResponse = await matchesService.getMatches({ limit: 100 }); // Get all matches
      
      if (matchesResponse.matches) {
        // Filter matches for the selected player
        const playerMatches = matchesResponse.matches.filter(match => {
          return (typeof match.p1 === 'object' && match.p1?._id === playerId) || 
                 (typeof match.p2 === 'object' && match.p2?._id === playerId);
        });

       

        // Transform the data for the dashboard
        const playerDashboardData = {
          matches: playerMatches,
          totalMatches: playerMatches.length,
            completedMatches: playerMatches.filter(m => m.status === 'completed').length,
            pendingMatches: playerMatches.filter(m => m.status === 'pending').length,
            winRate: calculateWinRate(playerMatches, playerId),
            recentMatches: playerMatches.slice(0, 5), // Last 5 matches
            stats: aggregatePlayerStats(playerMatches, playerId)
          };

         
          setSelectedPlayerData(playerDashboardData);
          setDashboardType('player');
        }
      } catch (error) {
        console.error('Error fetching player details:', error);
        setError('Failed to load player details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Helper function to calculate win rate
    const calculateWinRate = (matches: any[], playerId: string) => {
      const completedMatches = matches.filter(m => m.status === 'completed');
      if (completedMatches.length === 0) return 0;
      
      const wins = completedMatches.filter(m => m.winner === 'playerOne' && m.p1?._id === playerId || 
                                              m.winner === 'playerTwo' && m.p2?._id === playerId).length;
      
      return Math.round((wins / completedMatches.length) * 100);
    };

    // Helper function to aggregate player statistics
    const aggregatePlayerStats = (matches: any[], playerId: string) => {
      const completedMatches = matches.filter(m => m.status === 'completed');
     
      
      let totalPoints = 0;
      let totalWinners = 0;
      let totalErrors = 0;
      let totalServes = 0;
      let totalRallies = 0;

      completedMatches.forEach(match => {
        const isPlayerOne = match.p1?._id === playerId;
        const matchReport = isPlayerOne ? match.p1MatchReport : match.p2MatchReport;
        const overallReport = match.report;
        
       
        
        if (matchReport) {
          // Extract data from individual player match report
          totalPoints += matchReport.points?.totalPointsWon || 0;
          totalWinners += matchReport.points?.winners || 0;
          totalErrors += (matchReport.points?.unforcedErrors || 0) + (matchReport.points?.forcedErrors || 0);
          totalServes += matchReport.service?.totalServices || 0;
          
          // Sum up rally lengths from the rallies object
          if (matchReport.rallies) {
            const rallyValues = Object.values(matchReport.rallies);
            totalRallies += rallyValues.reduce((sum: number, val: any) => sum + (val || 0), 0);
          }
        }
        
        // Also try to get data from the overall report if available
        if (overallReport && isPlayerOne) {
          // For player one, use p1 data from overall report
          totalPoints += overallReport.points?.p1?.won || 0;
          totalWinners += overallReport.winners?.p1?.forehand || 0;
          totalWinners += overallReport.winners?.p1?.backhand || 0;
          totalWinners += overallReport.winners?.p1?.returnForehand || 0;
          totalWinners += overallReport.winners?.p1?.returnBackhand || 0;
          
          // Sum up errors
          const p1Errors = overallReport.errorStats?.p1;
          if (p1Errors) {
            totalErrors += (p1Errors.forced?.forehand?.total || 0) + 
                          (p1Errors.forced?.backhand?.total || 0) +
                          (p1Errors.unforced?.forehand?.total || 0) + 
                          (p1Errors.unforced?.backhand?.total || 0);
          }
          
          // Sum up serves
          totalServes += overallReport.serves?.p1?.firstServesWon || 0;
          totalServes += overallReport.serves?.p1?.firstServesLost || 0;
          totalServes += overallReport.serves?.p1?.secondServesWon || 0;
          totalServes += overallReport.serves?.p1?.secondServesLost || 0;
          
          // Sum up rallies
          if (overallReport.rallyLengthFrequency) {
            const rallyValues = Object.values(overallReport.rallyLengthFrequency);
            totalRallies += rallyValues.reduce((sum: number, val: any) => sum + (val || 0), 0);
          }
        } else if (overallReport && !isPlayerOne) {
          // For player two, use p2 data from overall report
          totalPoints += overallReport.points?.p2?.won || 0;
          totalWinners += overallReport.winners?.p2?.forehand || 0;
          totalWinners += overallReport.winners?.p2?.backhand || 0;
          totalWinners += overallReport.winners?.p2?.returnForehand || 0;
          totalWinners += overallReport.winners?.p2?.returnBackhand || 0;
          
          // Sum up errors
          const p2Errors = overallReport.errorStats?.p2;
          if (p2Errors) {
            totalErrors += (p2Errors.forced?.forehand?.total || 0) + 
                          (p2Errors.forced?.backhand?.total || 0) +
                          (p2Errors.unforced?.forehand?.total || 0) + 
                          (p2Errors.unforced?.backhand?.total || 0);
          }
          
          // Sum up serves
          totalServes += overallReport.serves?.p2?.firstServesWon || 0;
          totalServes += overallReport.serves?.p2?.firstServesLost || 0;
          totalServes += overallReport.serves?.p2?.secondServesWon || 0;
          totalServes += overallReport.serves?.p2?.secondServesLost || 0;
          
          // Sum up rallies
          if (overallReport.rallyLengthFrequency) {
            const rallyValues = Object.values(overallReport.rallyLengthFrequency);
            totalRallies += rallyValues.reduce((sum: number, val: any) => sum + (val || 0), 0);
          }
        }
      });

      const stats = {
        totalPoints,
        totalWinners,
        totalErrors,
        totalServes,
        totalRallies,
        avgPointsPerMatch: completedMatches.length > 0 ? Math.round(totalPoints / completedMatches.length) : 0,
        winRate: calculateWinRate(matches, playerId)
      };
      
      
      return stats;
    };

  const upcomingClasses = [
    { id: 1, name: 'Advanced Serving', time: '9:00 AM', players: 8, maxPlayers: 12 },
    { id: 2, name: 'Beginner Basics', time: '3:00 PM', players: 6, maxPlayers: 10 },
    { id: 3, name: 'Match Strategy', time: '5:00 PM', players: 10, maxPlayers: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-4 sm:p-6 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Coach Dashboard</h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">Manage your players and classes</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1">
              <button 
                onClick={() => {
                  setDashboardType('general');
                  setSelectedPlayer('All Players');
                  setSelectedPlayerData(null);
                }}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  dashboardType === 'general' 
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[var(--shadow-primary)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                General Dashboard
              </button>
              <button 
                onClick={() => {
                  if (selectedPlayer !== 'All Players') {
                    setDashboardType('player');
                  }
                }}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  dashboardType === 'player' 
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[var(--shadow-primary)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Player Specific
              </button>
            </div>
            <select 
              value={selectedPlayer}
              onChange={(e) => {
                setSelectedPlayer(e.target.value);
                fetchPlayerDetails(e.target.value);
              }}
              className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border-0 transition-colors duration-300"
            >
              <option value="All Players">All Players</option>
              {players.map(player => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

             {/* Quick Stats */}
      {/* General Dashboard - Coach Overview */}
      {/* General Dashboard - Use the new GeneralDashboard component */}
      {!loading && !error && dashboardType === 'general' && (
        <GeneralDashboard 
          userRole="coach" 
          userName={userName} 
          dashboardData={stats}
        />
      )}

      {/* Player-Specific Dashboard */}
      {!loading && !error && dashboardType === 'player' && selectedPlayerData && (
        <div className="space-y-6">
          {/* Player Header */}
          <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-6 transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">Player Analytics</h2>
              <button 
                onClick={() => {
                  setDashboardType('general');
                  setSelectedPlayer('All Players');
                  setSelectedPlayerData(null);
                }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                ← Back to General Dashboard
              </button>
            </div>
            
            {(() => {
              const player = players.find(p => p.id === selectedPlayer);
              if (!player) return <div>Player not found</div>;
              
              return (
                <div className="space-y-6">
                  {/* Player Info */}
                  <div className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-lg transition-colors duration-300">
                    {player.avatar ? (
                      <img src={player.avatar} alt={player.name} className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-2xl">
                          {player.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-[var(--text-primary)]">{player.name}</h3>
                      <p className="text-[var(--text-secondary)]">{player.email}</p>
                      <p className="text-sm text-[var(--text-tertiary)]">Last online: {new Date(player.lastOnline).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Player Goals Summary */}
              <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-6 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Player Goals Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{player.goals}</p>
                        <p className="text-blue-800 dark:text-blue-200">Total Goals</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{player.completedGoals}</p>
                        <p className="text-green-800 dark:text-green-200">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {player.goals > 0 ? Math.round((player.completedGoals / player.goals) * 100) : 0}%
                      </p>
                        <p className="text-purple-800 dark:text-purple-200">Progress</p>
                    </div>
                  </div>
                  </div>

                  {/* Use PlayerAnalytics Component */}
                  <PlayerAnalytics userName={player.name} playerData={selectedPlayerData} />

                </div>
              );
            })()}
          </div>
        </div>
      )}


      {/* Upcoming Classes */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-6 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Upcoming Classes</h2>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Schedule Class
          </button>
        </div>
        <div className="space-y-4">
          {upcomingClasses.map((classItem) => (
            <div key={classItem.id} className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{classItem.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{classItem.time} • {classItem.players}/{classItem.maxPlayers} players</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-[var(--text-secondary)] hover:text-blue-600 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 text-[var(--text-secondary)] hover:text-green-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

     
      
    </div>
  );
};

// Parent Dashboard Component
const ParentDashboard: React.FC = () => {
  const [dashboardType, setDashboardType] = useState<'general' | 'child'>('general');
  const [selectedChild, setSelectedChild] = useState('All Children');
  const [selectedChildData, setSelectedChildData] = useState<any>(null);
  const [children, setChildren] = useState<Array<{ 
    id: string; 
    name: string; 
    age: number; 
    level: string; 
    progress: number; 
    email: string; 
    lastOnline: string;
    avatar?: string;
    goals: number;
    completedGoals: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sessionsThisMonth: 0, matchesWon: 0, avgPerformance: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState<Array<{ id: string; name: string; date: string; time: string; location: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const authStore = useAuthStore();
  const userRole = authStore.getRole();
  const userName = authStore.user ? `${authStore.user.firstName} ${authStore.user.lastName}` : 'Parent';

  React.useEffect(() => {
    const fetchChildren = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user has permission to access children data
        if (userRole !== 'parent' && userRole !== 'admin') {
          setError('Access denied. Only parents and administrators can view children data.');
          setChildren([] as Array<{ 
            id: string; 
            name: string; 
            age: number; 
            level: string; 
            progress: number; 
            email: string; 
            lastOnline: string;
            avatar?: string;
            goals: number;
            completedGoals: number;
          }>);
          setStats({ sessionsThisMonth: 0, matchesWon: 0, avgPerformance: 0 });
          setUpcomingEvents([]);
          return;
        }

        // For parents, we should fetch their actual children
        // For now, we'll use the players API to get sample data
        if (userRole === 'parent') {
          // Try to fetch real player data for parents
          try {
            const { playersService } = await import('@/service/players.server');
            const response = await playersService.getPlayers(1, 10);
            
            if (response.players) {
              const childrenData = response.players.slice(0, 3).map((player) => {
                // Calculate goals statistics
                const totalGoals = player.coachGoals?.reduce((total, coachGoal) => 
                  total + (coachGoal.goals?.length || 0), 0) || 0;
                
                const completedGoals = player.coachGoals?.reduce((total, coachGoal) => {
                  const completed = coachGoal.goals?.filter(goal => 
                    goal.progress?.some((prog: any) => prog.isDone === true)
                  ).length || 0;
                  return total + completed;
                }, 0) || 0;
                
                return {
                  id: player._id,
                  name: `${player.firstName} ${player.lastName}`,
                  age: Math.floor(Math.random() * 10) + 8, // Mock age for now
                  level: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
                  progress: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
                  email: player.emailAddress.email,
                  lastOnline: player.lastOnline,
                  avatar: player.avatar,
                  goals: totalGoals,
                  completedGoals: completedGoals
                };
              });
              
              setChildren(childrenData);
              setStats({
                sessionsThisMonth: Math.floor(Math.random() * 20) + 5,
                matchesWon: Math.floor(Math.random() * 30) + 10,
                avgPerformance: Math.floor(Math.random() * 30) + 70
              });
              
              setUpcomingEvents([
                { id: '1', name: 'Tennis Tournament', date: 'Dec 15', time: '9:00 AM', location: 'City Courts' },
                { id: '2', name: 'Parent-Child Match', date: 'Dec 20', time: '2:00 PM', location: 'Academy' },
                { id: '3', name: 'Progress Review', date: 'Dec 25', time: '10:00 AM', location: 'Academy' },
              ]);
            }
          } catch (error) {
          
            // Fallback to mock data
            const mockChildren = [
              { id: '1', name: 'Emma Wilson', age: 12, level: 'Intermediate', progress: 75, email: 'emma@example.com', lastOnline: new Date().toISOString(), avatar: undefined, goals: 5, completedGoals: 3 },
              { id: '2', name: 'Lucas Wilson', age: 14, level: 'Advanced', progress: 88, email: 'lucas@example.com', lastOnline: new Date().toISOString(), avatar: undefined, goals: 8, completedGoals: 6 },
            ];
            
            setChildren(mockChildren);
            setStats({
              sessionsThisMonth: 8,
              matchesWon: 12,
              avgPerformance: 85
            });
            
            setUpcomingEvents([
              { id: '1', name: 'Tennis Tournament', date: 'Dec 15', time: '9:00 AM', location: 'City Courts' },
              { id: '2', name: 'Parent-Child Match', date: 'Dec 20', time: '2:00 PM', location: 'Academy' },
              { id: '3', name: 'Progress Review', date: 'Dec 25', time: '10:00 AM', location: 'Academy' },
            ]);
          }
        } else if (userRole === 'admin') {
          // Admins can see a sample of children data
          const { playersService } = await import('@/service/players.server');
          const response = await playersService.getPlayers(1, 10);
          
          if (response.players) {
            const childrenData = response.players.slice(0, 5).map((player) => {
              // Calculate goals statistics
              const totalGoals = player.coachGoals?.reduce((total, coachGoal) => 
                total + (coachGoal.goals?.length || 0), 0) || 0;
              
              const completedGoals = player.coachGoals?.reduce((total, coachGoal) => {
                const completed = coachGoal.goals?.filter(goal => 
                  goal.progress?.some((prog: any) => prog.isDone === true)
                ).length || 0;
                return total + completed;
              }, 0) || 0;
              
              return {
                id: player._id,
                name: `${player.firstName} ${player.lastName}`,
                age: Math.floor(Math.random() * 10) + 8, // Mock age for now
                level: ['Beginner', 'Intermediate', 'Advanced'][Math.floor(Math.random() * 3)],
                progress: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
                email: player.emailAddress.email,
                lastOnline: player.lastOnline,
                avatar: player.avatar,
                goals: totalGoals,
                completedGoals: completedGoals
              };
            });
            
            setChildren(childrenData);
            setStats({
              sessionsThisMonth: Math.floor(Math.random() * 20) + 5,
              matchesWon: Math.floor(Math.random() * 30) + 10,
              avgPerformance: Math.floor(Math.random() * 30) + 70
            });
            
            setUpcomingEvents([
              { id: '1', name: 'Tennis Tournament', date: 'Dec 15', time: '9:00 AM', location: 'City Courts' },
              { id: '2', name: 'Parent-Child Match', date: 'Dec 20', time: '2:00 PM', location: 'Academy' },
              { id: '3', name: 'Progress Review', date: 'Dec 25', time: '10:00 AM', location: 'Academy' },
            ]);
          }
        }
      } catch (error) {
        console.error('Error fetching children:', error);
        setError('Failed to load children data. Please try again.');
        setChildren([] as Array<{ 
          id: string; 
          name: string; 
          age: number; 
          level: string; 
          progress: number; 
          email: string; 
          lastOnline: string;
          avatar?: string;
          goals: number;
          completedGoals: number;
        }>);
        setStats({ sessionsThisMonth: 0, matchesWon: 0, avgPerformance: 0 });
        setUpcomingEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [userRole]);

  // Function to fetch detailed child data
  const fetchChildDetails = async (childId: string) => {
    if (childId === 'All Children') {
      setSelectedChildData(null);
      setDashboardType('general');
      return;
    }

    try {
      setLoading(true);
      // Import matchesService dynamically to avoid circular dependencies
      const { matchesService } = await import('@/service/matchs.server');
      const matchesResponse = await matchesService.getMatches({ limit: 100 }); // Get all matches
      
      if (matchesResponse.matches) {
        // Filter matches for the selected child
        const childMatches = matchesResponse.matches.filter(match => {
          return (typeof match.p1 === 'object' && match.p1?._id === childId) || 
                 (typeof match.p2 === 'object' && match.p2?._id === childId);
        });

        // Transform the data for the dashboard
        const childDashboardData = {
          matches: childMatches,
          totalMatches: childMatches.length,
          completedMatches: childMatches.filter(m => m.status === 'completed').length,
          pendingMatches: childMatches.filter(m => m.status === 'pending').length,
          winRate: calculateChildWinRate(childMatches, childId),
          recentMatches: childMatches.slice(0, 5), // Last 5 matches
          stats: aggregateChildStats(childMatches, childId)
        };

        setSelectedChildData(childDashboardData);
        setDashboardType('child');
      }
    } catch (error) {
      console.error('Error fetching child details:', error);
      setError('Failed to load child details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate child's win rate
  const calculateChildWinRate = (matches: any[], childId: string) => {
    const completedMatches = matches.filter(m => m.status === 'completed');
    if (completedMatches.length === 0) return 0;
    
    const wins = completedMatches.filter(m => m.winner === 'playerOne' && m.p1?._id === childId || 
                                            m.winner === 'playerTwo' && m.p2?._id === childId).length;
    
    return Math.round((wins / completedMatches.length) * 100);
  };

  // Helper function to aggregate child statistics
  const aggregateChildStats = (matches: any[], childId: string) => {
    const completedMatches = matches.filter(m => m.status === 'completed');
    
    let totalPoints = 0;
    let totalWinners = 0;
    let totalErrors = 0;
    let totalServes = 0;
    let totalRallies = 0;

    completedMatches.forEach(match => {
      const isPlayerOne = match.p1?._id === childId;
      const matchReport = isPlayerOne ? match.p1MatchReport : match.p2MatchReport;
      const overallReport = match.report;
      
      if (matchReport) {
        // Extract data from individual player match report
        totalPoints += matchReport.points?.totalPointsWon || 0;
        totalWinners += matchReport.points?.winners || 0;
        totalErrors += (matchReport.points?.unforcedErrors || 0) + (matchReport.points?.forcedErrors || 0);
        totalServes += matchReport.service?.totalServices || 0;
        
        // Sum up rally lengths from the rallies object
        if (matchReport.rallies) {
          const rallyValues = Object.values(matchReport.rallies);
          totalRallies += rallyValues.reduce((sum: number, val: any) => sum + (val || 0), 0);
        }
      }
      
      // Also try to get data from the overall report if available
      if (overallReport && isPlayerOne) {
        // For player one, use p1 data from overall report
        totalPoints += overallReport.points?.p1?.won || 0;
        totalWinners += overallReport.winners?.p1?.forehand || 0;
        totalWinners += overallReport.winners?.p1?.backhand || 0;
        totalWinners += overallReport.winners?.p1?.returnForehand || 0;
        totalWinners += overallReport.winners?.p1?.returnBackhand || 0;
        
        // Sum up errors
        const p1Errors = overallReport.errorStats?.p1;
        if (p1Errors) {
          totalErrors += (p1Errors.forced?.forehand?.total || 0) + 
                        (p1Errors.forced?.backhand?.total || 0) +
                        (p1Errors.unforced?.forehand?.total || 0) + 
                        (p1Errors.unforced?.backhand?.total || 0);
        }
        
        // Sum up serves
        totalServes += overallReport.serves?.p1?.firstServesWon || 0;
        totalServes += overallReport.serves?.p1?.firstServesLost || 0;
        totalServes += overallReport.serves?.p1?.secondServesWon || 0;
        totalServes += overallReport.serves?.p1?.secondServesLost || 0;
        
        // Sum up rallies
        if (overallReport.rallyLengthFrequency) {
          const rallyValues = Object.values(overallReport.rallyLengthFrequency);
          totalRallies += rallyValues.reduce((sum: number, val: any) => sum + (val || 0), 0);
        }
      } else if (overallReport && !isPlayerOne) {
        // For player two, use p2 data from overall report
        totalPoints += overallReport.points?.p2?.won || 0;
        totalWinners += overallReport.winners?.p2?.forehand || 0;
        totalWinners += overallReport.winners?.p2?.backhand || 0;
        totalWinners += overallReport.winners?.p2?.returnForehand || 0;
        totalWinners += overallReport.winners?.p2?.returnBackhand || 0;
        
        // Sum up errors
        const p2Errors = overallReport.errorStats?.p2;
        if (p2Errors) {
          totalErrors += (p2Errors.forced?.forehand?.total || 0) + 
                        (p2Errors.forced?.backhand?.total || 0) +
                        (p2Errors.unforced?.forehand?.total || 0) + 
                        (p2Errors.unforced?.backhand?.total || 0);
        }
        
        // Sum up serves
        totalServes += overallReport.serves?.p2?.firstServesWon || 0;
        totalServes += overallReport.serves?.p2?.firstServesLost || 0;
        totalServes += overallReport.serves?.p2?.secondServesWon || 0;
        totalServes += overallReport.serves?.p2?.secondServesLost || 0;
        
        // Sum up rallies
        if (overallReport.rallyLengthFrequency) {
          const rallyValues = Object.values(overallReport.rallyLengthFrequency);
          totalRallies += rallyValues.reduce((sum: number, val: any) => sum + (val || 0), 0);
        }
      }
    });

    return {
      totalPoints,
      totalWinners,
      totalErrors,
      totalServes,
      totalRallies,
      avgPointsPerMatch: completedMatches.length > 0 ? Math.round(totalPoints / completedMatches.length) : 0,
      winRate: calculateChildWinRate(matches, childId)
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-4 sm:p-6 transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Parent Dashboard</h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">Monitor your children's progress and activities</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1">
              <button 
                onClick={() => {
                  setDashboardType('general');
                  setSelectedChild('All Children');
                  setSelectedChildData(null);
                }}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  dashboardType === 'general' 
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[var(--shadow-primary)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                General Dashboard
              </button>
              <button 
                onClick={() => {
                  if (selectedChild !== 'All Children') {
                    setDashboardType('child');
                  }
                }}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  dashboardType === 'child' 
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-[var(--shadow-primary)]' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Child Specific
              </button>
            </div>
            <select 
              value={selectedChild}
              onChange={(e) => {
                setSelectedChild(e.target.value);
                if (e.target.value !== 'All Children') {
                  setDashboardType('child');
                  fetchChildDetails(e.target.value);
                } else {
                  setSelectedChildData(null);
                }
              }}
              className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border-0 transition-colors duration-300"
            >
              <option value="All Children">All Children</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* General Dashboard - Use the new GeneralDashboard component */}
      {!loading && !error && dashboardType === 'general' && (
        <GeneralDashboard 
          userRole="parent" 
          userName={userName} 
          dashboardData={{ childrenCount: children.length, upcomingMatches: upcomingEvents.length, avgProgress: stats.avgPerformance }}
        />
      )}

      {/* Children Overview - Show when not in general mode */}
      {!loading && !error && dashboardType !== 'general' && (
        <>
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <LoadingSpinner size="md" text="Loading children data..." />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-red-600 text-lg">🚫</span>
                </div>
                <div>
                  <p className="text-red-800 font-medium">Access Denied</p>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {children.map((child) => (
                <div key={child.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {child.avatar ? (
                      <img src={child.avatar} alt={child.name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-2xl">
                          {child.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{child.name}</h3>
                      <p className="text-gray-600">{child.age} years old • {child.level}</p>
                      <p className="text-xs text-gray-500">{child.email}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {/* Goals Information */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-lg font-bold text-blue-600">{child.goals}</p>
                        <p className="text-xs text-blue-800">Goals</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-lg font-bold text-green-600">{child.completedGoals}</p>
                        <p className="text-xs text-green-800">Completed</p>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <p className="text-lg font-bold text-purple-600">
                          {child.goals > 0 ? Math.round((child.completedGoals / child.goals) * 100) : 0}%
                        </p>
                        <p className="text-xs text-purple-800">Success</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{child.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${child.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                        View Progress
                      </button>
                      <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                        Schedule Session
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

        {/* Child-Specific Dashboard */}
        {dashboardType === 'child' && selectedChildData && (
          <div className="space-y-6">
            {/* Child Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Child Analytics</h2>
                <button 
                  onClick={() => {
                    setDashboardType('general');
                    setSelectedChild('All Children');
                    setSelectedChildData(null);
                  }}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ← Back to General Dashboard
                </button>
              </div>
              
              {(() => {
                const child = children.find(c => c.id === selectedChild);
                if (!child) return <div>Child not found</div>;
                
                return (
                  <div className="space-y-6">
                    {/* Child Info */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      {child.avatar ? (
                        <img src={child.avatar} alt={child.name} className="w-20 h-20 rounded-full object-cover" />
                      ) : (
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-2xl">
                            {child.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{child.name}</h3>
                        <p className="text-gray-600">{child.age} years old • {child.level}</p>
                        <p className="text-sm text-gray-500">{child.email}</p>
                      </div>
                    </div>

                    {/* Goals Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-blue-600">{child.goals}</p>
                        <p className="text-blue-800">Total Goals</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-600">{child.completedGoals}</p>
                        <p className="text-green-800">Completed Goals</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-purple-600">
                          {child.goals > 0 ? Math.round((child.completedGoals / child.goals) * 100) : 0}%
                        </p>
                        <p className="text-purple-800">Success Rate</p>
                      </div>
                    </div>

                    {/* Goals Progress */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Goals Progress</h4>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${child.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {child.completedGoals} of {child.goals} goals completed
                      </p>
                    </div>

                                      {/* Performance Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-green-600">{stats.sessionsThisMonth}</p>
                      <p className="text-green-800">Sessions This Month</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-blue-600">{stats.matchesWon}</p>
                      <p className="text-blue-800">Matches Won</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-purple-600">{stats.avgPerformance}%</p>
                      <p className="text-purple-800">Avg Performance</p>
                    </div>
                  </div>

                  {/* Match Statistics - Only show if we have child-specific data */}
                  {selectedChildData && selectedChildData.stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-blue-600">{selectedChildData.stats.totalMatches || 0}</p>
                        <p className="text-blue-800">Total Matches</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-green-600">{selectedChildData.stats.won || 0}</p>
                        <p className="text-green-800">Wins</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-red-600">{selectedChildData.stats.lost || 0}</p>
                        <p className="text-red-800">Losses</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <p className="text-3xl font-bold text-purple-600">{selectedChildData.stats.winRate || 0}%</p>
                        <p className="text-purple-800">Win Rate</p>
                      </div>
                    </div>
                  )}

                  {/* Recent Matches - Only show if we have child-specific data */}
                  {selectedChildData && selectedChildData.recentMatches && selectedChildData.recentMatches.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Matches</h4>
                      <div className="space-y-3">
                        {selectedChildData.recentMatches.slice(0, 5).map((match: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                match.result === 'won' ? 'bg-green-500' : 
                                match.result === 'lost' ? 'bg-red-500' : 'bg-gray-400'
                              }`}></div>
                              <div>
                                <p className="font-medium text-gray-900">vs {match.opponent}</p>
                                <p className="text-sm text-gray-600">{new Date(match.date).toLocaleDateString()} • {match.score}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{match.score}</p>
                              <p className="text-sm text-gray-600 capitalize">{match.result}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Matches - Only show if we have child-specific data */}
                  {selectedChildData && selectedChildData.upcomingMatches && selectedChildData.upcomingMatches.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Matches</h4>
                      <div className="space-y-3">
                        {selectedChildData.upcomingMatches.slice(0, 3).map((match: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              <div>
                                <p className="font-medium text-gray-900">vs {match.opponent}</p>
                                <p className="text-sm text-gray-600">{new Date(match.date).toLocaleDateString()} • {match.score}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">{match.score}</p>
                              <p className="text-sm text-blue-600">Scheduled</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Use PlayerAnalytics Component for Child */}
                  <PlayerAnalytics userName={child.name} playerData={selectedChildData} />
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Quick Stats */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-6 transition-colors duration-300">
           <div className="flex items-center gap-3">
             <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
               <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
             </div>
             <div>
               <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.sessionsThisMonth}</p>
               <p className="text-[var(--text-secondary)]">Sessions This Month</p>
             </div>
           </div>
         </div>
         <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-6 transition-colors duration-300">
           <div className="flex items-center gap-3">
             <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
               <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />
             </div>
             <div>
               <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.matchesWon}</p>
               <p className="text-[var(--text-secondary)]">Matches Won</p>
             </div>
           </div>
         </div>
         <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-6 transition-colors duration-300">
           <div className="flex items-center gap-3">
             <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
               <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
             </div>
             <div>
               <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.avgPerformance}%</p>
               <p className="text-[var(--text-secondary)]">Average Performance</p>
             </div>
           </div>
         </div>
       </div>

      {/* Upcoming Events */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-6 transition-colors duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Upcoming Events</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        </div>
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-lg transition-colors duration-300">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{event.name}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{event.date} at {event.time} • {event.location}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-[var(--text-secondary)] hover:text-blue-600 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 text-[var(--text-secondary)] hover:text-green-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Communication Center */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-6 transition-colors duration-300">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">Communication Center</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-3 mb-3">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-[var(--text-primary)]">Messages</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Stay connected with coaches and other parents</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              View Messages
            </button>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg transition-colors duration-300">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-[var(--text-primary)]">Progress Reports</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-3">Get detailed reports on your children's development</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              View Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Admin Component
const Admin: React.FC = () => {
  const authStore = useAuthStore();
  const userRole = authStore.getRole();

  // Determine the dashboard to show based on user's actual role
  const renderDashboard = () => {
    switch (userRole) {
      case 'player':
        return <PlayerDashboard />;
      case 'coach':
        return <CoachDashboard />;
      case 'parent':
        return <ParentDashboard />;
      case 'admin':
        // Admins can see a comprehensive view or default to coach view
        return <CoachDashboard />;
      default:
        return <PlayerDashboard />;
    }
  };

  // Get role display information
  const getRoleDisplayInfo = (role: string | null) => {
    switch (role) {
      case 'player':
        return { name: 'Player', icon: UserCheck, description: 'View your performance dashboard' };
      case 'coach':
        return { name: 'Coach', icon: Shield, description: 'Manage players and classes' };
      case 'parent':
        return { name: 'Parent', icon: Users, description: 'Monitor children\'s progress' };
      case 'admin':
        return { name: 'Admin', icon: Shield, description: 'Administrative dashboard' };
      default:
        return { name: 'Player', icon: UserCheck, description: 'View your performance dashboard' };
    }
  };

  const roleInfo = getRoleDisplayInfo(userRole);

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] transition-colors duration-300">
      {/* Personal Welcome Greeting - Above Dashboard */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-4 sm:p-6 mb-4 sm:mb-6 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <span className="text-yellow-500 text-xl sm:text-2xl">⭐</span>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">
                Hello {authStore.user ? `${authStore.user.firstName} ${authStore.user.lastName}` : 'User'}! We hope you are having a fantastic day.
              </h2>
              <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-1">{roleInfo.description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific Dashboard */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default Admin;
