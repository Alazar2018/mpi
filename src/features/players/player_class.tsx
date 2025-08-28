import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@/components/Button";
import icons from "@/utils/icons";
import Calendar from "@/components/Calendar";
import { CalendarService, type CalendarEvent as ApiCalendarEvent } from "@/service/calendar.server";
import { useNotificationStore } from "@/store/notification.store";
import { useAuthStore } from "@/store/auth.store";

interface LocalCalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'reminder' | 'training' | 'class';
  status?: 'pending' | 'confirmed';
  time?: string;
  endTime?: string;
  court?: string;
  location?: string;
  duration?: string;
  player?: string;
  participants?: string[];
  description?: string;
  color?: string;
  isAllDay?: boolean;
  opponentName?: string | null;
  coachName?: string;
  sourceType?: string;
  sourceId?: string;
}

export default function PlayerClass() {
  const [events, setEvents] = useState<LocalCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lastFetchParams, setLastFetchParams] = useState<string>('');
  
  const navigate = useNavigate();
  const notificationStore = useNotificationStore();
  const { user, getRole, isHydrated, loadFromStorage } = useAuthStore();
  
  // Get user role from auth store
  const userRole = (user?.role || 'player') as 'player' | 'coach' | 'admin';
  
  // Ensure auth store is hydrated
  useEffect(() => {
    if (!isHydrated) {
      loadFromStorage();
    }
  }, [isHydrated, loadFromStorage]);

  // Fetch calendar events from API
  const fetchCalendarEvents = async () => {
    // Prevent multiple simultaneous requests
    if (isLoading) {
      console.log('Calendar fetch already in progress, skipping...');
      return;
    }

    // Create cache key for current request parameters
    const cacheKey = `${currentView}-${currentDate.toDateString()}`;
    
    // Check if we already have data for these parameters
    if (lastFetchParams === cacheKey && events.length > 0) {
      console.log('Using cached calendar data, skipping fetch...', {
        cacheKey,
        lastFetchParams,
        eventsCount: events.length
      });
      return;
    }

    try {
      setIsLoading(true);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // 7 days ago
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 days from now
      
      const response = await CalendarService.getEvents({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        view: currentView,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });

      if (response.success) {
        // Convert API events to local format and filter for class events only
        const convertedEvents = response.data.events
          .filter(apiEvent => {
            // Only show class events (purple labels in calendar)
            return apiEvent.sourceType === 'class';
          })
          .map(apiEvent => {
            const converted = CalendarService.convertToLocalEvent(apiEvent);
            
            // Since we're only filtering for class events, all events will be class type
            const localType: 'reminder' | 'training' | 'class' = 'class';
            
            // Map API status to local status
            let localStatus: 'pending' | 'confirmed' | undefined;
            switch (converted.status) {
              case 'scheduled':
                localStatus = 'confirmed';
                break;
              case 'ongoing':
              case 'completed':
              case 'cancelled':
                localStatus = 'pending';
                break;
              default:
                localStatus = 'pending';
            }
            
            const finalEvent = {
              ...converted,
              type: localType,
              status: localStatus
            } as LocalCalendarEvent;
            
            return finalEvent;
          });
        
        setEvents(convertedEvents);
        setLastFetchParams(cacheKey); // Update cache key
        
        notificationStore.addNotification({
          title: 'Class Schedule Updated',
          message: `Loaded ${convertedEvents.length} class events from calendar`,
          type: 'success',
          source: 'calendar'
        });
      }
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      
      // Handle throttled requests gracefully
      if (error instanceof Error && error.message.includes('throttled')) {
        notificationStore.addNotification({
          title: 'Request Throttled',
          message: 'Too many requests. Please wait a moment before trying again.',
          type: 'warning',
          source: 'calendar'
        });
      } else {
        notificationStore.addNotification({
          title: 'Calendar Error',
          message: 'Failed to load class schedule from server',
          type: 'error',
          source: 'calendar'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch events when component mounts or when view/date changes
  useEffect(() => {
    fetchCalendarEvents();
  }, [currentView, currentDate]);

  // Handle calendar view change
  const handleViewChange = (view: 'day' | 'week' | 'month' | 'year') => {
    setCurrentView(view);
  };

  // Handle date navigation
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  // Handle event click - navigate to class detail page
  const handleEventClick = (event: LocalCalendarEvent) => {
    console.log('Class event clicked:', event);
    // Navigate to the class detail page using the event ID
    if (event.sourceId) {
      navigate(`/admin/class/${event.sourceId}`);
    } else {
      // Fallback: try to use the event ID itself
      navigate(`/admin/class/${event.id}`);
    }
  };

  // Handle class card click - navigate to class detail page
  const handleClassCardClick = (event: LocalCalendarEvent) => {
    console.log('Class card clicked:', event);
    // Navigate to the class detail page using the event ID
    if (event.sourceId) {
      navigate(`/admin/class/${event.sourceId}`);
    } else {
      // Fallback: try to use the event ID itself
      navigate(`/admin/class/${event.id}`);
    }
  };

  // Filter events for the current view
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      switch (currentView) {
        case 'day':
          return eventDate.toDateString() === startOfDay.toDateString();
        case 'week':
          const endOfWeek = new Date(startOfDay);
          endOfWeek.setDate(startOfDay.getDate() + 7);
          return eventDate >= startOfDay && eventDate < endOfWeek;
        case 'month':
          return eventDate.getMonth() === startOfDay.getMonth() && 
                 eventDate.getFullYear() === startOfDay.getFullYear();
        case 'year':
          return eventDate.getFullYear() === startOfDay.getFullYear();
        default:
          return true;
      }
    });
  }, [events, currentView, currentDate]);

  // Get upcoming classes (next 7 days)
  const upcomingClasses = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8); // Show max 8 upcoming classes
  }, [events]);

  if (isLoading && events.length === 0) {
    return (
      <div className="space-y-6">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
          <h4 className="text-xl font-semibold text-gray-600 mb-2">Loading Class Schedule</h4>
            <p className="text-gray-500">Please wait while we fetch your class schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">     
      {/* Main Content - Calendar and Sidebar */}
      <div className="flex gap-6">
        {/* Calendar View - Smaller */}
        <div className="flex-1 bg-[var(--bg-card)] rounded-3xl shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] overflow-hidden transition-colors duration-300">
          <Calendar
            events={filteredEvents}
            view={currentView}
            onViewChange={handleViewChange}
            onDateChange={handleDateChange}
            onEventClick={handleEventClick}
            isLoading={isLoading}
          />
        </div>

        {/* Sidebar - Upcoming Classes */}
        <div className="w-80 bg-[var(--bg-card)] rounded-3xl shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] p-6 transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-[var(--text-primary)]">Upcoming Classes</h4>
            <span className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-2 py-1 rounded-full border border-[var(--border-primary)]">
              {upcomingClasses.length}
            </span>
          </div>

          {upcomingClasses.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[var(--text-tertiary)] text-4xl mb-3">📅</div>
              <p className="text-[var(--text-secondary)] text-sm">No upcoming classes in the next 7 days</p>
                  </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {upcomingClasses.map((event) => (
                <div 
                  key={event.id} 
                  className="p-4 border border-[var(--border-primary)] rounded-lg hover:border-[var(--border-secondary)] hover:shadow-[var(--shadow-secondary)] transition-all cursor-pointer bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]"
                  onClick={() => handleClassCardClick(event)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]">
                      Class
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
            </div>

                  <h5 className="font-medium text-[var(--text-primary)] mb-2 text-sm leading-tight">
                              {event.title}
                  </h5>
                  
                  {event.time && (
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-1">
                      <span>🕐</span>
                      <span>{event.time}</span>
                      {event.duration && <span>• {event.duration}</span>}
                            </div>
                  )}
                  
                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <span>📍</span>
                      <span className="truncate">{event.location}</span>
                          </div>
                        )}
                </div>
              ))}
            </div>
          )}

          {/* View All Classes Button */}
          {events.length > upcomingClasses.length && (
            <div className="mt-4 pt-4 border-t border-[var(--border-secondary)]">
              <Button 
                onClick={() => setCurrentView('month')}
                className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)]"
                type="neutral"
              >
                View All Classes
              </Button>
        </div>
          )}
                </div>
              </div>

      {/* No Events State - Only show if no events at all */}
      {!isLoading && events.length === 0 && (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-3xl shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
          <div className="text-[var(--text-tertiary)] text-6xl mb-4">📚</div>
          <h4 className="text-xl font-semibold text-[var(--text-secondary)] mb-2">No Classes Scheduled</h4>
          <p className="text-[var(--text-secondary)] mb-4">
            You don't have any classes scheduled at the moment. Only class events (purple labels) are shown here.
          </p>
                        <Button onClick={() => fetchCalendarEvents()} className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
            Refresh Schedule
                </Button>
              </div>
      )}
    </div>
  );
}
