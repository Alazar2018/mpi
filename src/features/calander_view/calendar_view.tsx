import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Calendar from "@/components/Calendar";
import DefaultPage from "@/components/DefaultPage";
import CreateEvent from "@/components/CreateEvent";
import EventDetailModal from "@/components/EventDetailModal";
import icons from "@utils/icons.ts";
import Button from "@components/Button.tsx";
import { CalendarService, type CalendarEvent as ApiCalendarEvent } from "@/service/calendar.server";
import { getMyChildren, type User } from "@/service/classSchedule.server";
import { useNotificationStore } from "@/store/notification.store";
import { useAuthStore } from "@/store/auth.store";
import NotificationTest from "@/components/NotificationTest";
import { debounce } from "@/utils/utils";
import { toast } from "react-toastify";

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

export default function Calendar_view() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<LocalCalendarEvent[]>([]);
    const [showEventForm, setShowEventForm] = useState(false);
    const [showEventDetail, setShowEventDetail] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedEvent, setSelectedEvent] = useState<LocalCalendarEvent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentView, setCurrentView] = useState<'day' | 'week' | 'month' | 'year'>('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [lastFetchParams, setLastFetchParams] = useState<string>(''); // Cache key for last fetch
    
    // Parent-specific state
    const [children, setChildren] = useState<User[]>([]);
    const [selectedChildId, setSelectedChildId] = useState<string>('');
    const [loadingChildren, setLoadingChildren] = useState(false);
    
    const notificationStore = useNotificationStore();
    const { user, getRole, isHydrated, loadFromStorage } = useAuthStore();
    
    // Get user role from auth store
    const userRole = (user?.role || 'player') as 'player' | 'coach' | 'admin' | 'parent';
    
    // Ensure auth store is hydrated
    useEffect(() => {
        if (!isHydrated) {
            loadFromStorage();
        }
    }, [isHydrated, loadFromStorage]);
    
    // Fetch children for parent users
    useEffect(() => {
        if (isHydrated && userRole === 'parent') {
            fetchChildren();
        }
    }, [isHydrated, userRole]);
    
    // Debug: Log the detected role
    useEffect(() => {
        console.log('Calendar View - User Role Debug:', {
            userRole,
            user: user ? { id: user._id, firstName: user.firstName, lastName: user.lastName, role: user.role } : null,
            authStoreState: useAuthStore.getState(),
            isHydrated,
            localStorage: {
                'auth-user': localStorage.getItem('auth-user'),
                'auth-tokens': localStorage.getItem('auth-tokens')
            }
        });
    }, [userRole, user, isHydrated]);
    
    // Refetch events when selected child changes (for parent users)
    useEffect(() => {
        if (userRole === 'parent' && selectedChildId) {
            fetchCalendarEvents();
        }
    }, [selectedChildId]);

    // Fetch children for parent users
    const fetchChildren = async () => {
        if (userRole !== 'parent') return;
        
        try {
            setLoadingChildren(true);
            const response = await getMyChildren(1, 50); // Get up to 50 children
            if (response.success) {
                setChildren(response.data);
                
                // Set first child as default if none selected
                if (response.data.length > 0 && !selectedChildId) {
                    setSelectedChildId(response.data[0]._id);
                }
            }
        } catch (error) {
            console.error('Error fetching children:', error);
            toast.error('Failed to fetch children data');
        } finally {
            setLoadingChildren(false);
        }
    };

    // Fetch calendar events from API with debouncing
    const fetchCalendarEvents = async () => {
        // Prevent multiple simultaneous requests
        if (isLoading) {
            console.log('Calendar fetch already in progress, skipping...');
            return;
        }

        // Create cache key for current request parameters
        const cacheKey = `${currentView}-${currentDate.toDateString()}-${selectedChildId}`;
        
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
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                ...(userRole === 'parent' && selectedChildId && { childId: selectedChildId })
            });

            if (response.success) {
                // Convert API events to local format
                const convertedEvents = response.data.events.map(apiEvent => {
                    const converted = CalendarService.convertToLocalEvent(apiEvent);
                    
                    // Map API event types to local event types
                    let localType: 'reminder' | 'training' | 'class';
                    
                    // Check sourceType first, then fall back to type
                    if (apiEvent.sourceType === 'reminder') {
                        localType = 'reminder';
                    } else if (apiEvent.sourceType === 'class') {
                        localType = 'class';
                    } else if (apiEvent.sourceType === 'match') {
                        localType = 'class';
                    } else {
                        // Handle the API service types properly
                        const apiType = converted.type;
                        if (apiType === 'coaching' || apiType === 'tournament' || apiType === 'practice') {
                            localType = 'training';
                        } else if (apiType === 'match') {
                            localType = 'class';
                        } else {
                            // Default fallback for unknown types
                            localType = 'training';
                        }
                    }
                    
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
                    title: 'Calendar Updated',
                    message: `Loaded ${response.data.totalCount} events from calendar`,
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
                    message: 'Failed to load calendar events from server',
                    type: 'error',
                    source: 'calendar'
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Debounced version of fetchCalendarEvents
    const debouncedFetchCalendarEvents = useCallback(
        debounce(() => {
            fetchCalendarEvents();
        }, 300),
        []
    );

    // Fetch upcoming events
    const fetchUpcomingEvents = async () => {
        try {
            const response = await CalendarService.getUpcomingEvents(5);
            if (response.success && response.data.events.length > 0) {
                notificationStore.addNotification({
                    title: 'Upcoming Events',
                    message: `You have ${response.data.totalUpcoming} upcoming events`,
                    type: 'info',
                    source: 'calendar'
                });
                
                // Also show a quick info toast for immediate feedback
                toast.info(`You have ${response.data.totalUpcoming} upcoming events`);
            }
        } catch (error) {
            console.error('Error fetching upcoming events:', error);
            toast.error('Failed to fetch upcoming events');
        }
    };

    // Listen for calendar refresh events from WebSocket
    useEffect(() => {
        const handleCalendarRefresh = (event: CustomEvent) => {
            console.log('Calendar refresh requested via WebSocket:', event.detail);
            debouncedFetchCalendarEvents();
        };

        window.addEventListener('calendar-refresh-requested', handleCalendarRefresh as EventListener);

        return () => {
            window.removeEventListener('calendar-refresh-requested', handleCalendarRefresh as EventListener);
        };
    }, [debouncedFetchCalendarEvents]);

    // Initial fetch and view change handling
    useEffect(() => {
        // Only fetch on initial load or when view changes significantly
        if (events.length === 0) {
            fetchCalendarEvents();
        }
        fetchUpcomingEvents();
    }, []); // Remove currentView dependency to prevent excessive requests

    // Handle view changes separately with debouncing
    useEffect(() => {
        if (events.length > 0) {
            debouncedFetchCalendarEvents();
        }
    }, [currentView, debouncedFetchCalendarEvents]);

    const handleEventClick = (event: LocalCalendarEvent) => {
        console.log('Event clicked:', event);
        console.log('Event type:', event.type);
        console.log('Event sourceType:', event.sourceType);
        console.log('Event sourceId:', event.sourceId);
        console.log('Event id:', event.id);
        
        // If it's a class event, navigate to the class detail page
        if (event.type === 'class' && event.sourceType === 'class') {
            const classId = event.sourceId || event.id;
            console.log('Navigating to class detail page with ID:', classId);
            console.log('Using sourceId:', event.sourceId, 'or fallback to id:', event.id);
            navigate(`/admin/class/${classId}`);
            return;
        }
        
        // For other event types, show the modal
        setSelectedEvent(event);
        setShowEventDetail(true);
    };

    const handleNewEvent = async (eventData: any) => {
        try {
            let newEvent: LocalCalendarEvent;
            
            if (eventData.type === 'class' && eventData.sourceType === 'class' && eventData.sourceId) {
                // This is a class event that was successfully created via the class service
                newEvent = {
                    id: eventData.sourceId, // Use the class ID as the event ID
                    title: `Class - ${eventData.levelPlan} ${eventData.sessionType}`,
                    type: 'class' as const,
                    status: 'pending',
                    date: eventData.date || selectedDate || new Date().toISOString().split('T')[0],
                    time: eventData.time,
                    endTime: eventData.endTime,
                    location: eventData.location || '',
                    description: eventData.goal || eventData.additionalInfo || '',
                    court: eventData.court || '',
                    duration: eventData.duration || '',
                    participants: eventData.selectedClassPlayers || [],
                    color: '#2563EB', // Blue for class events
                    isAllDay: false,
                    opponentName: null,
                    coachName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown Coach',
                    sourceType: 'class',
                    sourceId: eventData.sourceId
                };
                
                // Show success notification for class creation
                notificationStore.addNotification({
                    title: 'Class Created Successfully',
                    message: `"${newEvent.title}" has been created and added to your calendar`,
                    type: 'success',
                    source: 'calendar'
                });
                
                // Also show a quick success toast for immediate feedback
                toast.success(`Class "${newEvent.title}" created successfully!`);
            } else if (eventData.type === 'classScheduleRequest') {
                // Handle class schedule request events
                newEvent = {
                    id: eventData.sourceId || Date.now().toString(),
                    title: eventData.title || 'Class Schedule Request',
                    type: 'reminder' as const, // Map to reminder type for display
                    status: 'pending',
                    date: eventData.date || selectedDate || new Date().toISOString().split('T')[0],
                    time: eventData.time,
                    endTime: eventData.endTime,
                    location: '',
                    description: eventData.description || 'Class schedule request',
                    court: '',
                    duration: '',
                    participants: [],
                    color: '#8B5CF6', // Purple for class schedule requests
                    isAllDay: false,
                    opponentName: null,
                    coachName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown User',
                    sourceType: 'classScheduleRequest',
                    sourceId: eventData.sourceId
                };
                
                // Show success notification for class schedule request creation
                notificationStore.addNotification({
                    title: 'Class Schedule Request Created',
                    message: `"${newEvent.title}" has been created and added to your calendar`,
                    type: 'success',
                    source: 'calendar'
                });
                
                // Also show a quick success toast for immediate feedback
                toast.success(`Class schedule request "${newEvent.title}" created successfully!`);
            } else {
                // Handle other event types as before
                newEvent = {
            id: Date.now().toString(),
                    title: eventData.title || `${eventData.type.charAt(0).toUpperCase() + eventData.type.slice(1)} Event`,
                    type: eventData.type as 'reminder' | 'training' | 'class',
            status: 'pending',
                    date: eventData.date || selectedDate || new Date().toISOString().split('T')[0],
                    time: eventData.time,
                    endTime: eventData.endTime,
                    location: eventData.place || '',
                    description: eventData.description || eventData.objective || '',
                    court: eventData.court || '',
                    duration: eventData.duration || '',
                    participants: eventData.selectedPlayers || eventData.selectedClassPlayers || [],
                    color: eventData.type === 'reminder' ? '#F97316' : eventData.type === 'training' ? '#EAB308' : '#2563EB',
                    isAllDay: false,
                    opponentName: null,
                    coachName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown Coach',
                    sourceType: eventData.type,
                    sourceId: eventData.type === 'class' ? Date.now().toString() : undefined
                };
                
                // Show notification for other event types
        notificationStore.addNotification({
            title: 'Event Created',
            message: `"${newEvent.title}" has been added to your calendar`,
            type: 'success',
            source: 'calendar'
        });
                
                // Also show a quick success toast for immediate feedback
                toast.success(`Event "${newEvent.title}" created successfully!`);
            }

            setEvents([...events, newEvent]);
            setShowEventForm(false);
            
        } catch (error) {
            console.error('Error handling new event:', error);
            
            // Show error notification using toastify
            toast.error('Failed to create event. Please try again.');
        }
    };

    const openEventForm = (date?: string) => {
        if (date) {
            setSelectedDate(date);
        }
        setShowEventForm(true);
    };

    const closeEventForm = () => {
        setShowEventForm(false);
        setSelectedDate(""); // Clear selected date when closing form
    };

    const closeEventDetail = () => {
        setShowEventDetail(false);
        setSelectedEvent(null);
    };

    const handleDeleteEvent = (eventId: string) => {
        const eventToDelete = events.find(e => e.id === eventId);
        setEvents(events.filter(event => event.id !== eventId));
        setShowEventDetail(false);
        setSelectedEvent(null);
        
        if (eventToDelete) {
            notificationStore.addNotification({
                title: 'Event Deleted',
                message: `"${eventToDelete.title}" has been removed from your calendar`,
                type: 'warning',
                source: 'calendar'
            });
            
            // Also show a quick success toast for immediate feedback
            toast.success(`Event "${eventToDelete.title}" deleted successfully`);
        }
    };

    const handleEditEvent = (event: LocalCalendarEvent) => {
        // For now, just log the edit action
        console.log('Edit event:', event);
        notificationStore.addNotification({
            title: 'Event Edit',
            message: `Editing "${event.title}"`,
            type: 'info',
            source: 'calendar'
        });
        
        // Also show a quick info toast for immediate feedback
        toast.info(`Editing event "${event.title}"`);
        
        // You can implement edit functionality here
    };

    const getEventTypeColor = (type: string) => {
        switch(type) {
            case 'reminder': return 'bg-orange-400';
            case 'training': return 'bg-yellow-400';
            case 'class': return 'bg-blue-600';
            default: return 'bg-gray-500';
        }
    };

    const getEventTypeLabel = (type: string) => {
        switch(type) {
            case 'reminder': return 'Reminder';
            case 'training': return 'Training';
            case 'class': return 'Class';
            default: return 'Event';
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'confirmed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleViewChange = (view: 'day' | 'week' | 'month' | 'year') => {
        console.log('Calendar view changed:', { from: currentView, to: view });
        setCurrentView(view);
        setCurrentDate(new Date());
        
        // Fetch events for the new view
        fetchEventsForView(view);
    };

    const handleDateChange = (date: Date) => {
        setCurrentDate(date);
        
        // Fetch events for the new date range
        fetchEventsForView(currentView, date);
    };

    // Handle month selection in year view
    const handleMonthClick = (month: number, year: number) => {
        console.log('Month clicked in year view:', { month, year });
        
        // Fetch events for the selected month
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        fetchCalendarEventsForRange(startDate, endDate, 'month');
    };

    // Fetch events for specific view and date
    const fetchEventsForView = async (view: 'day' | 'week' | 'month' | 'year', date?: Date) => {
        const targetDate = date || currentDate;
        let startDate: Date;
        let endDate: Date;
        
        switch (view) {
            case 'day':
                startDate = new Date(targetDate);
                endDate = new Date(targetDate);
                break;
            case 'week':
                startDate = new Date(targetDate);
                startDate.setDate(startDate.getDate() - 3);
                endDate = new Date(targetDate);
                endDate.setDate(endDate.getDate() + 3);
                break;
            case 'month':
                startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
                endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
                break;
            case 'year':
                startDate = new Date(targetDate.getFullYear(), 0, 1);
                endDate = new Date(targetDate.getFullYear(), 11, 31);
                break;
            default:
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                endDate = new Date();
                endDate.setDate(endDate.getDate() + 30);
        }
        
        console.log(`Fetching events for ${view} view:`, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            view
        });
        
        // Update the fetch function to use these dates
        await fetchCalendarEventsForRange(startDate, endDate, view);
    };

    // Fetch calendar events for a specific date range
    const fetchCalendarEventsForRange = async (startDate: Date, endDate: Date, view: string) => {
        // Prevent multiple simultaneous requests
        if (isLoading) {
            console.log('Calendar fetch already in progress, skipping...');
            return;
        }

        try {
            setIsLoading(true);
            
            const response = await CalendarService.getEvents({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                view: view as 'day' | 'week' | 'month' | 'year',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });

            if (response.success) {
                // Convert API events to local format
                const convertedEvents = response.data.events.map(apiEvent => {
                    const converted = CalendarService.convertToLocalEvent(apiEvent);
                    
                    // Map API event types to local event types
                    let localType: 'reminder' | 'training' | 'class';
                    
                    // Check sourceType first, then fall back to type
                    if (apiEvent.sourceType === 'reminder') {
                        localType = 'reminder';
                    } else if (apiEvent.sourceType === 'class') {
                        localType = 'class';
                    } else if (apiEvent.sourceType === 'match') {
                        localType = 'class';
                    } else {
                        // Handle the API service types properly
                        const apiType = converted.type;
                        if (apiType === 'coaching' || apiType === 'tournament' || apiType === 'practice') {
                            localType = 'training';
                        } else if (apiType === 'match') {
                            localType = 'class';
                        } else {
                            // Default fallback for unknown types
                            localType = 'training';
                        }
                    }
                    
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
                
                notificationStore.addNotification({
                    title: 'Calendar Updated',
                    message: `Loaded ${response.data.totalCount} events for ${view} view`,
                    type: 'success',
                    source: 'calendar'
                });
                
                // Also show a quick success toast for immediate feedback
                toast.success(`Calendar updated with ${response.data.totalCount} events`);
            }
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            
            // Handle throttled requests gracefully
            if (error instanceof Error && error.message.includes('throttled')) {
                toast.warning('Too many requests. Please wait a moment before trying again.');
            } else {
                toast.error('Failed to load calendar events from server');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative">
            <DefaultPage title="My Calendar">
                <div className="space-y-6">
                    {/* Child Selector for Parent Users */}
                    {userRole === 'parent' && (
                        <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg p-4 border border-[var(--border-primary)] dark:border-gray-600">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)] dark:text-white mb-2">
                                        Select Child
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400">
                                        Choose a child to view their calendar events
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {loadingChildren ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                            <span className="text-sm text-[var(--text-secondary)] dark:text-gray-400">Loading children...</span>
                                        </div>
                                    ) : children.length > 0 ? (
                                        <>
                                            <select
                                                value={selectedChildId}
                                                onChange={(e) => setSelectedChildId(e.target.value)}
                                                className="px-4 py-2 border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-[var(--bg-primary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white"
                                            >
                                                {children.map(child => (
                                                    <option key={child._id} value={child._id}>
                                                        {child.firstName} {child.lastName}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedChildId && (
                                                <div className="text-sm text-[var(--text-secondary)] dark:text-gray-400">
                                                    Showing events for: {children.find(c => c._id === selectedChildId)?.firstName}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm text-[var(--text-secondary)] dark:text-gray-400">
                                                No children found
                                            </div>
                                            <button
                                                onClick={fetchChildren}
                                                className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                                            >
                                                Refresh
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <Calendar
                        events={events}
                        onEventClick={handleEventClick}
                        view={currentView}
                        onNewEvent={openEventForm}
                        onViewChange={handleViewChange}
                        onDateChange={handleDateChange}
                        onMonthClick={handleMonthClick}
                        isLoading={isLoading}
                    />
                    
                   
                </div>
            </DefaultPage>
            
            {/* Create Event Modal */}
                                            <CreateEvent
                                    isOpen={showEventForm}
                                    onClose={closeEventForm}
                                    onSubmit={handleNewEvent}
                                    selectedDate={selectedDate}
                                    userRole={userRole}
                                />

            {/* Event Detail Modal */}
            <EventDetailModal
                isOpen={showEventDetail}
                onClose={() => setShowEventDetail(false)}
                event={selectedEvent || {
                    id: '',
                    title: '',
                    date: '',
                    type: 'reminder',
                    time: '',
                    description: '',
                    participants: []
                }}
            />
        </div>
    );
}