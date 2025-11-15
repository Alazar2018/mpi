import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useDashboard } from '@/hooks/useDashboard';
import PlayerAnalytics from '@/components/PlayerAnalytics';
import GeneralDashboard from '@/components/GeneralDashboard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { aggregateMatchesForPlayer } from '@/utils/playerAnalytics';
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
        const aggregatedStats = aggregateMatchesForPlayer(playerMatches, userId);

        const playerDashboardData = {
          matches: playerMatches,
          totalMatches: playerMatches.length,
          completedMatches: playerMatches.filter(m => m.status === 'completed').length,
          pendingMatches: playerMatches.filter(m => m.status === 'pending').length,
          winRate: aggregatedStats.winRate,
          recentMatches: playerMatches.slice(0, 5), // Last 5 matches
          stats: aggregatedStats,
          playerId: userId
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
                  <PlayerAnalytics 
                    userName={userName} 
                    playerId={userId || ''} 
                    playerData={playerData} 
                  />
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
              progress: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
            };
          });
          
          setPlayers(playersWithStats);
          setStats({
            totalPlayers: playersWithStats.length,
            classesToday: 0,
            avgWinRate: 0,
            matchesThisMonth: 0
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

    // Helper function to aggregate player statistics - Use aggregateMatchesForPlayer for consistency
    const aggregatePlayerStats = (matches: any[], playerId: string) => {
      const aggregatedStats = aggregateMatchesForPlayer(matches, playerId);
      
      return {
        totalPoints: aggregatedStats.totalPoints,
        totalWinners: aggregatedStats.totalWinners,
        totalErrors: aggregatedStats.totalErrors,
        totalServes: aggregatedStats.totalServes,
        totalRallies: aggregatedStats.totalRallies,
        avgPointsPerMatch: aggregatedStats.avgPointsPerMatch,
        winRate: aggregatedStats.winRate
      };
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
                  <PlayerAnalytics userName={player.name} playerId={selectedPlayer} playerData={selectedPlayerData} />

                </div>
              );
            })()}
          </div>
        </div>
      )}
      
     
      
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

        // For parents, fetch their actual children using the children service
        if (userRole === 'parent') {
          try {
            const { childrenService } = await import('@/service/children.server');
            const response = await childrenService.getChildren({ page: 1, limit: 10 });
            
            if (response.children) {
              const childrenData = response.children.map((child) => {
                // Calculate goals statistics from coachGoals
                const totalGoals = child.coachGoals?.reduce((total, coachGoal) => 
                  total + (coachGoal.goals?.length || 0), 0) || 0;
                
                const completedGoals = child.coachGoals?.reduce((total, coachGoal) => {
                  const completed = coachGoal.goals?.filter(goal => 
                    goal.progress?.some((prog: any) => prog.isDone === true)
                  ).length || 0;
                  return total + completed;
                }, 0) || 0;
                
                return {
                  id: child._id,
                  name: `${child.firstName} ${child.lastName}`,
                  age: (child as any).dateOfBirth ? Math.floor((new Date().getTime() - new Date((child as any).dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
                  level: 'Intermediate',
                  progress: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
                  email: child.emailAddress?.email || 'No email',
                  lastOnline: child.lastOnline,
                  avatar: child.avatar,
                  goals: totalGoals,
                  completedGoals: completedGoals
                };
              });
              
              setChildren(childrenData);
              setStats({
                sessionsThisMonth: 0,
                matchesWon: 0,
                avgPerformance: 0
              });
              
              setUpcomingEvents([]);
            } else {
              // No children found
              setChildren([]);
              setStats({ sessionsThisMonth: 0, matchesWon: 0, avgPerformance: 0 });
              setUpcomingEvents([]);
            }
          } catch (error) {
            console.error('Error fetching children:', error);
            setError('Failed to load children data. Please try again.');
            setChildren([]);
            setStats({ sessionsThisMonth: 0, matchesWon: 0, avgPerformance: 0 });
            setUpcomingEvents([]);
          }
        } else if (userRole === 'admin') {
          // Admins can see children data using the children service
          try {
            const { childrenService } = await import('@/service/children.server');
            const response = await childrenService.getChildren({ page: 1, limit: 10 });
            
            if (response.children) {
              const childrenData = response.children.map((child) => {
                // Calculate goals statistics from coachGoals
                const totalGoals = child.coachGoals?.reduce((total, coachGoal) => 
                total + (coachGoal.goals?.length || 0), 0) || 0;
              
                const completedGoals = child.coachGoals?.reduce((total, coachGoal) => {
                const completed = coachGoal.goals?.filter(goal => 
                  goal.progress?.some((prog: any) => prog.isDone === true)
                ).length || 0;
                return total + completed;
              }, 0) || 0;
              
              return {
                  id: child._id,
                  name: `${child.firstName} ${child.lastName}`,
                  age: (child as any).dateOfBirth ? Math.floor((new Date().getTime() - new Date((child as any).dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
                  level: 'Intermediate',
                progress: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
                  email: child.emailAddress?.email || 'No email',
                  lastOnline: child.lastOnline,
                  avatar: child.avatar,
                goals: totalGoals,
                completedGoals: completedGoals
              };
            });
            
            setChildren(childrenData);
            setStats({
              sessionsThisMonth: 0,
              matchesWon: 0,
              avgPerformance: 0
            });
            
            setUpcomingEvents([]);
            } else {
              // No children found
              setChildren([]);
              setStats({ sessionsThisMonth: 0, matchesWon: 0, avgPerformance: 0 });
              setUpcomingEvents([]);
            }
          } catch (error) {
            console.error('Error fetching children for admin:', error);
            setError('Failed to load children data. Please try again.');
            setChildren([]);
            setStats({ sessionsThisMonth: 0, matchesWon: 0, avgPerformance: 0 });
            setUpcomingEvents([]);
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

  // Helper function to aggregate child statistics - Use aggregateMatchesForPlayer for consistency
  const aggregateChildStats = (matches: any[], childId: string) => {
    const aggregatedStats = aggregateMatchesForPlayer(matches, childId);
    
    return {
      totalPoints: aggregatedStats.totalPoints,
      totalWinners: aggregatedStats.totalWinners,
      totalErrors: aggregatedStats.totalErrors,
      totalServes: aggregatedStats.totalServes,
      totalRallies: aggregatedStats.totalRallies,
      avgPointsPerMatch: aggregatedStats.avgPointsPerMatch,
      winRate: aggregatedStats.winRate
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
                  <PlayerAnalytics userName={child.name} playerId={selectedChild} playerData={selectedChildData} />
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
