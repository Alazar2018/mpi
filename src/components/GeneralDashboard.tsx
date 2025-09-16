import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Calendar, Trophy, Target, Activity, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { CalendarService, type CalendarEvent } from '@/service/calendar.server';
import TodoSection from './TodoSection';
import { useCoachParentDashboard } from '@/hooks/useCoachParentDashboard';

interface GeneralDashboardProps {
  userRole: 'player' | 'coach' | 'parent';
  userName: string;
  dashboardData?: any;
}

const GeneralDashboard: React.FC<GeneralDashboardProps> = ({ userRole, userName, dashboardData }) => {
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState('All');
  const timeframes = ['All', '1W', '1M', '3M', '6M', '1Y'];
  
  // Calendar data state
  const [weeklyEvents, setWeeklyEvents] = useState<CalendarEvent[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<CalendarEvent[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  
  // Todo dashboard data for coach and parent roles
  const todoDashboardData = useCoachParentDashboard();

  // Fetch calendar data
  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setLoadingCalendar(true);
        
        // Get current week's events
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
        
        // Get upcoming classes (next 7 days)
        const upcomingStart = new Date(now);
        const upcomingEnd = new Date(now);
        upcomingEnd.setDate(now.getDate() + 7);
        
        try {
          const [weeklyResponse, upcomingResponse] = await Promise.all([
            CalendarService.getEvents({
              startDate: startOfWeek.toISOString(),
              endDate: endOfWeek.toISOString(),
              view: 'week'
            }),
            CalendarService.getUpcomingEvents(5)
          ]);
          
          if (weeklyResponse.success && weeklyResponse.data?.events) {
       
            setWeeklyEvents(weeklyResponse.data.events);
          } else {
           
          }
          
          if (upcomingResponse.success && upcomingResponse.data?.events) {
            
            setUpcomingClasses(upcomingResponse.data.events);
          } else {
            
          }
        } catch (error) {
         
          // Fallback to mock data
          setWeeklyEvents([
            { id: '1', title: 'Training Session', type: 'training', startTime: new Date().toISOString(), endTime: new Date().toISOString(), status: 'scheduled', location: 'Court 1', notes: '', color: '#3B82F6', isAllDay: false, participants: [], sourceType: '', sourceId: '', description: '' },
            { id: '2', title: 'Practice Match', type: 'practice', startTime: new Date().toISOString(), endTime: new Date().toISOString(), status: 'scheduled', location: 'Court 2', notes: '', color: '#10B981', isAllDay: false, participants: [], sourceType: '', sourceId: '', description: '' }
          ]);
          
          setUpcomingClasses([
            { id: '1', title: 'Advanced Training', type: 'training', startTime: new Date(Date.now() + 86400000).toISOString(), endTime: new Date(Date.now() + 86400000).toISOString(), status: 'scheduled', location: 'Court 1', notes: '', color: '#3B82F6', isAllDay: false, participants: [], sourceType: '', sourceId: '', description: '' },
            { id: '2', title: 'Tournament Prep', type: 'coaching', startTime: new Date(Date.now() + 172800000).toISOString(), endTime: new Date(Date.now() + 172800000).toISOString(), status: 'scheduled', location: 'Court 3', notes: '', color: '#8B5CF6', isAllDay: false, participants: [], sourceType: '', sourceId: '', description: '' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching calendar data:', error);
      } finally {
        setLoadingCalendar(false);
      }
    };
    
    fetchCalendarData();
  }, []);

  // Role-specific KPIs and content
  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'player':
        return {
          kpis: [
            {
              icon: <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
              value: dashboardData?.competitions || 0,
              label: 'Competitions',
              bgColor: 'bg-blue-100 dark:bg-blue-900/20',
              textColor: 'text-blue-600 dark:text-blue-400'
            },
            {
              icon: <Target className="w-6 h-6 text-green-600 dark:text-green-400" />,
              value: dashboardData?.won || 0,
              label: 'Won',
              bgColor: 'bg-green-100 dark:bg-green-900/20',
              textColor: 'text-green-600 dark:text-green-400'
            },
            {
              icon: <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
              value: dashboardData?.lost || 0,
              label: 'Lost',
              bgColor: 'bg-orange-100 dark:bg-orange-900/20',
              textColor: 'text-orange-600 dark:text-orange-400'
            }
          ],
          title: 'Player Overview',
          description: 'Track your tennis journey and performance metrics',
          weeklyData: [
            { day: 'Mon', sessions: 2 },
            { day: 'Tue', sessions: 1 },
            { day: 'Wed', sessions: 3 },
            { day: 'Thu', sessions: 2 },
            { day: 'Fri', sessions: 1 },
            { day: 'Sat', sessions: 2 },
            { day: 'Sun', sessions: 1 }
          ],
          todoItems: [
            'Practice serves for 30 minutes',
            'Review match footage from last week',
            'Schedule coaching session',
            'Update fitness routine'
          ]
        };

      case 'coach':
        return {
          kpis: [
            {
              icon: <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
              value: dashboardData?.totalPlayers || 0,
              label: 'Players',
              bgColor: 'bg-blue-100 dark:bg-blue-900/20',
              textColor: 'text-blue-600 dark:text-blue-400'
            },
            {
              icon: <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />,
              value: dashboardData?.classesToday || 0,
              label: 'Classes Today',
              bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
              textColor: 'text-yellow-600 dark:text-yellow-400'
            },
            {
              icon: <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />,
              value: todoDashboardData.pendingTodos || 0,
              label: 'Pending Tasks',
              bgColor: 'bg-green-100 dark:bg-green-900/20',
              textColor: 'text-green-600 dark:text-green-400'
            }
          ],
          title: 'Coach Dashboard',
          description: 'Manage your players and track coaching performance',
          weeklyData: [
            { day: 'Mon', sessions: 8 },
            { day: 'Tue', sessions: 6 },
            { day: 'Wed', sessions: 7 },
            { day: 'Thu', sessions: 9 },
            { day: 'Fri', sessions: 8 },
            { day: 'Sat', sessions: 10 },
            { day: 'Sun', sessions: 4 }
          ],
          todoItems: [
            'Review player progress reports',
            'Plan next week\'s training schedule',
            'Update player goals and objectives',
            'Schedule parent meetings'
          ]
        };

      case 'parent':
        return {
          kpis: [
            {
              icon: <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
              value: dashboardData?.childrenCount || 0,
              label: 'Children',
              bgColor: 'bg-purple-100 dark:bg-purple-900/20',
              textColor: 'text-purple-600 dark:text-purple-400'
            },
            {
              icon: <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />,
              value: dashboardData?.upcomingMatches || 0,
              label: 'Upcoming Matches',
              bgColor: 'bg-green-100 dark:bg-green-900/20',
              textColor: 'text-green-600 dark:text-green-400'
            },
            {
              icon: <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />,
              value: todoDashboardData.pendingTodos || 0,
              label: 'Pending Tasks',
              bgColor: 'bg-green-100 dark:bg-green-900/20',
              textColor: 'text-green-600 dark:text-green-400'
            }
          ],
          title: 'Parent Dashboard',
          description: 'Monitor your children\'s tennis development and progress',
          weeklyData: [
            { day: 'Mon', sessions: 3 },
            { day: 'Tue', sessions: 2 },
            { day: 'Wed', sessions: 4 },
            { day: 'Thu', sessions: 3 },
            { day: 'Fri', sessions: 2 },
            { day: 'Sat', sessions: 5 },
            { day: 'Sun', sessions: 2 }
          ],
          todoItems: [
            'Check children\'s practice schedule',
            'Review progress reports',
            'Schedule parent-coach meeting',
            'Update payment information'
          ]
        };

      default:
        return {
          kpis: [],
          title: 'Dashboard',
          description: 'Welcome to your dashboard',
          weeklyData: [],
          todoItems: []
        };
    }
  };

  const content = getRoleSpecificContent();

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Time Filters */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-4 sm:p-6 transition-colors duration-300">
        <div className="flex flex-wrap gap-2">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe}
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {content.kpis.map((kpi, index) => (
          <div key={index} className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-4 sm:p-6 transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className={`p-2 sm:p-3 ${kpi.bgColor} rounded-lg`}>
                {kpi.icon}
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">{kpi.value}</p>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">{kpi.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Activity with Calendar Data */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-4 sm:p-6 transition-colors duration-300">
                                   <div className="flex items-center gap-3 mb-4 sm:mb-6">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Weekly Activity
                      </h2>
                                             <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Track your schedule and upcoming events</p>
                    </div>
                  </div>
                                       {/* Week Summary */}
           <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-100 dark:border-blue-800 transition-colors duration-300">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                 <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
                   Week of {new Date().toLocaleDateString('en-US', { 
                     month: 'long', 
                     day: 'numeric', 
                     year: 'numeric' 
                   })} - {new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                     month: 'long', 
                     day: 'numeric', 
                     year: 'numeric' 
                   })}
                 </span>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-card)] rounded-full shadow-sm">
                 <span className="text-xs font-medium text-[var(--text-secondary)]">Total Events:</span>
                 <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{weeklyEvents.length}</span>
               </div>
             </div>
           </div>
        <div className="space-y-4">
          {loadingCalendar ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm sm:text-base text-gray-600">Loading weekly activity...</span>
            </div>
          ) : (
            <>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                  // Get the current week's start date (Sunday)
                  const now = new Date();
                  const startOfWeek = new Date(now);
                  startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                  
                  // Calculate the date for this specific day of the week
                  const dayDate = new Date(startOfWeek);
                  dayDate.setDate(startOfWeek.getDate() + index);
                  
                  // Filter events for this specific date
                  const dayEvents = weeklyEvents.filter(event => {
                    const eventDate = new Date(event.startTime);
                    // Compare dates (ignoring time and timezone)
                    const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
                    const dayDateOnly = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
                    return eventDateOnly.getTime() === dayDateOnly.getTime();
                  });
                  
                  const eventCount = dayEvents.length;
                  const height = Math.max(eventCount * 12, 20);
                  
                  return (
                                                              <div key={day} className="text-center relative group">
                       <div className="bg-gradient-to-b from-[var(--bg-secondary)] to-[var(--bg-tertiary)] dark:from-slate-700 dark:to-slate-600 rounded-lg sm:rounded-xl p-2 sm:p-3 mb-2 sm:mb-3 shadow-sm border border-[var(--border-primary)] group-hover:border-blue-300 transition-colors">
                         <div 
                           className={`w-full rounded-lg transition-all duration-500 ease-out shadow-md cursor-pointer group-hover:shadow-lg hover:scale-105 active:scale-95 ${
                             eventCount > 0 
                               ? 'bg-gradient-to-t from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                               : 'bg-[var(--bg-tertiary)] dark:bg-slate-600'
                           }`}
                           style={{ height: `${height}px` }}
                           onClick={() => {
                             try {
                               // Navigate to calendar with this specific date selected
                               const calendarUrl = `/admin/calendar?date=${dayDate.toISOString().split('T')[0]}`;
                               navigate(calendarUrl);
                             } catch (error) {
                               console.error('Navigation error:', error);
                               // Fallback: open in new tab
                               window.open(`/admin/calendar?date=${dayDate.toISOString().split('T')[0]}`, '_blank');
                             }
                           }}
                           title={`Click to view ${day} ${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} in calendar`}
                         ></div>
                       </div>
                       <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-blue-600 transition-colors">{day}</p>
                       <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{eventCount}</p>
                       <div className="flex items-center justify-center gap-1 mt-1">
                         <p className="text-xs text-[var(--text-secondary)] group-hover:text-blue-500 transition-colors">{dayDate.getDate()}</p>
                         <Calendar className="w-3 h-3 text-[var(--text-secondary)] group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
                       </div>
                       
                       {/* Hover Tooltip */}
                       {eventCount > 0 && (
                         <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                           <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg max-w-xs">
                             <div className="font-semibold mb-2 text-center text-blue-300">
                               {day} - {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                             </div>
                             <div className="space-y-2">
                               {dayEvents.slice(0, 3).map((event, eventIndex) => (
                                 <div key={eventIndex} className="flex items-start gap-2">
                                   <div 
                                     className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" 
                                     style={{ backgroundColor: event.color || '#3B82F6' }}
                                   ></div>
                                   <div className="flex-1 min-w-0">
                                     <div className="font-medium text-white truncate">{event.title}</div>
                                     <div className="text-gray-300 text-xs">
                                       {new Date(event.startTime).toLocaleTimeString('en-US', { 
                                         hour: '2-digit', 
                                         minute: '2-digit',
                                         hour12: true 
                                       })}
                                       {event.type && (
                                         <span className="ml-2 px-1.5 py-0.5 bg-gray-700 rounded text-xs">
                                           {event.type}
                                         </span>
                                       )}
                                     </div>
                                   </div>
              </div>
            ))}
                               {dayEvents.length > 3 && (
                                 <div className="text-center text-gray-300 text-xs pt-2 border-t border-gray-700">
                                   +{dayEvents.length - 3} more events
                                 </div>
                               )}
          </div>
                             <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
                         </div>
                       )}
                     </div>
                  );
                })}
              </div>
                             
            </>
          )}
        </div>
      </div>

      {/* Upcoming Classes - Show for all users */}
      <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-primary)] p-4 sm:p-6 transition-colors duration-300 w-full">
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-4">Upcoming Classes</h2>
        {loadingCalendar ? (
          <div className="flex items-center justify-center py-6 sm:py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm sm:text-base text-[var(--text-secondary)]">Loading upcoming classes...</span>
          </div>
        ) : upcomingClasses.length > 0 ? (
          <div className="space-y-3">
            {upcomingClasses.slice(0, 3).map((event) => {
              const eventDate = new Date(event.startTime);
              const timeString = eventDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              });
              const dateString = eventDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              });
              
              return (
                <div key={event.id} className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors duration-300 border border-[var(--border-secondary)]">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color }}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] text-sm sm:text-base truncate">{event.title}</p>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--text-secondary)]">
                      <Clock className="w-4 h-4" />
                      <span>{dateString} at {timeString}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--text-secondary)]">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full capitalize font-medium flex-shrink-0">
                    {event.type}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-[var(--text-secondary)]">
            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
            <p className="text-sm">No upcoming classes scheduled</p>
            <p className="text-xs text-[var(--text-tertiary)]">Check back later for new sessions</p>
          </div>
        )}
      </div>

      {/* Todo Section - Show for coaches and parents */}
      {(userRole === 'coach' || userRole === 'parent') && (
        <TodoSection userRole={userRole} />
      )}

      

      
    </div>
  );
};

export default GeneralDashboard;
