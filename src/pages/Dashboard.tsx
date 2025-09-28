import React, { useState, useEffect } from 'react';
import { Sparkles, Users, Gamepad2, Calendar, ChevronDown, Eye } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface TodoItem {
  id: number;
  description: string;
  date: string;
  completed: boolean;
}

const Dashboard: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('All');
  const authStore = useAuthStore();
  const userRole = authStore.getRole();
  
  // Dynamic data state
  const [playersCount, setPlayersCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [todos] = useState<TodoItem[]>([
    {
      id: 1,
      description: "Read and analyze the project brief",
      date: "Oct 16 08:30 PM",
      completed: false
    },
    {
      id: 2,
      description: "Identify all relevant stakeholders",
      date: "Oct 16 08:30 PM",
      completed: false
    },
    {
      id: 3,
      description: "Schedule kick-off meeting with key parties",
      date: "Oct 18 10:00 AM",
      completed: true
    }
  ]);

  const timeframes = ['All', '1W', '1M', '3M', '6M', '1Y'];
  
  const weeklyData = [
    { day: 'Mon', sessions: 3, max: 4 },
    { day: 'Tue', sessions: 1, max: 4 },
    { day: 'Wed', sessions: 2, max: 4 },
    { day: 'Thu', sessions: 4, max: 4 },
    { day: 'Fri', sessions: 3, max: 4 },
    { day: 'Sat', sessions: 4, max: 4 },
    { day: 'Sun', sessions: 1, max: 4 }
  ];

  const totalSessions = weeklyData.reduce((sum, day) => sum + day.sessions, 0);

  // Fetch real data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch players count
        if (userRole === 'coach' || userRole === 'admin') {
          const { playersService } = await import('@/service/players.server');
          const playersResponse = await playersService.getPlayers(1, 100);
          setPlayersCount(playersResponse.players?.length || 0);
        } else if (userRole === 'parent') {
          const { childrenService } = await import('@/service/children.server');
          const childrenResponse = await childrenService.getChildren({ page: 1, limit: 100 });
          setPlayersCount(childrenResponse.children?.length || 0);
        }
        
        // Fetch matches count
        const { matchesService } = await import('@/service/matchs.server');
        const matchesResponse = await matchesService.getMatches({ limit: 100 });
        setMatchesCount(matchesResponse.matches?.length || 0);
        
        // For sessions, we can use matches as a proxy or fetch from calendar service
        setSessionsCount(Math.floor((matchesResponse.matches?.length || 0) * 1.5)); // Rough estimate
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userRole]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <h1 className="text-2xl font-bold text-gray-900">Hello Birhane!</h1>
              </div>
              <p className="text-gray-600">We hope you are having a fantastic day.</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                General Dashboard
              </button>
              {userRole !== 'player' && (
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2">
                  Select Player
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : userRole === 'parent' ? playersCount : playersCount}
                </p>
                <p className="text-gray-600">{userRole === 'parent' ? 'Children' : 'Players'}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Gamepad2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : matchesCount}
                </p>
                <p className="text-gray-600">Matches</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? '...' : sessionsCount}
                </p>
                <p className="text-gray-600">Sessions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeframe Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex gap-2">
            {timeframes.map((timeframe) => (
              <button
                key={timeframe}
                onClick={() => setSelectedTimeframe(timeframe)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTimeframe === timeframe
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {timeframe}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Sessions Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Weekly Sessions</h2>
              <p className="text-gray-600">0 Sessions / day</p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">Total {totalSessions} Session</p>
            </div>
          </div>
          
          <div className="flex items-end justify-between h-32">
            {weeklyData.map((day) => (
              <div key={day.day} className="flex flex-col items-center gap-2">
                <div className="relative w-12">
                  {/* Background bar (max capacity) */}
                  <div 
                    className="absolute bottom-0 w-full bg-gray-200 rounded-t"
                    style={{ height: `${(day.max / 4) * 100}%` }}
                  />
                  {/* Actual sessions bar */}
                  <div 
                    className="absolute bottom-0 w-full bg-blue-600 rounded-t transition-all duration-300"
                    style={{ height: `${(day.sessions / 4) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 font-medium">{day.day}</span>
              </div>
            ))}
          </div>
          
          {/* Y-axis labels */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>4</span>
            <span>3</span>
            <span>2</span>
            <span>1</span>
            <span>0</span>
          </div>
        </div>

        {/* Today's Todo List - Only for Coaches */}
        {userRole === 'coach' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Today's Todo List</h2>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {todos.map((todo) => (
                <div 
                  key={todo.id} 
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                    todo.completed ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                    {todo.id}
                  </div>
                  
                  <div className="flex-1">
                    <p className={`font-medium ${
                      todo.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                    }`}>
                      {todo.description}
                    </p>
                    <p className="text-sm text-gray-500">{todo.date}</p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      todo.completed 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}>
                      {todo.completed && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
