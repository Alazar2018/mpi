import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks, startOfDay, endOfDay, eachDayOfInterval, isSameWeek } from "date-fns";
import Button from "@/components/Button";
import icons from "@/utils/icons";

interface CalendarEvent {
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
    isAllDay?: boolean;
}

interface CalendarProps {
    events?: CalendarEvent[];
    onDateClick?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
    onNewEvent?: () => void;
    onViewChange?: (view: 'day' | 'week' | 'month' | 'year') => void;
    onDateChange?: (date: Date) => void;
    onMonthClick?: (month: number, year: number) => void; // New callback for month selection
    showHeader?: boolean;
    view?: 'day' | 'week' | 'month' | 'year';
    isLoading?: boolean;
}

export default function Calendar({
    events = [],
    onDateClick,
    onEventClick,
    onNewEvent,
    onViewChange,
    onDateChange,
    onMonthClick,
    showHeader = true,
    view = 'week',
    isLoading = false
}: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date()); // Use current date instead of hardcoded
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<'day' | 'week' | 'month' | 'year'>(view);
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // For year view navigation
    const [selectedYear, setSelectedYear] = useState<number | null>(null); // For year view navigation

    // Auto-navigate to a date with events when events are loaded
    useEffect(() => {
        if (events.length > 0 && currentDate) {
            // Find the first event date and navigate to that week
            const firstEventDate = parseISO(events[0].date);
            const weekStart = startOfWeek(firstEventDate, { weekStartsOn: 1 });
            
            if (!isSameWeek(currentDate, weekStart, { weekStartsOn: 1 })) {
                setCurrentDate(weekStart);
                setSelectedDate(weekStart);
            }
        }
    }, [events]);

    // Navigation functions for different views
    const prevPeriod = () => {
        let newDate: Date;
        switch (currentView) {
            case 'day':
                newDate = addDays(selectedDate, -1);
                setSelectedDate(newDate);
                break;
            case 'week':
                newDate = subWeeks(currentDate, 1);
                setCurrentDate(newDate);
                break;
            case 'month':
                newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
                setCurrentDate(newDate);
                break;
            case 'year':
                newDate = new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1);
                setCurrentDate(newDate);
                break;
            default:
                newDate = subWeeks(currentDate, 1);
                setCurrentDate(newDate);
        }
        onDateChange?.(newDate);
    };

    const nextPeriod = () => {
        let newDate: Date;
        switch (currentView) {
            case 'day':
                newDate = addDays(selectedDate, 1);
                setSelectedDate(newDate);
                break;
            case 'week':
                newDate = addWeeks(currentDate, 1);
                setCurrentDate(newDate);
                break;
            case 'month':
                newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                setCurrentDate(newDate);
                break;
            case 'year':
                newDate = new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1);
                setCurrentDate(newDate);
                break;
            default:
                newDate = addWeeks(currentDate, 1);
                setCurrentDate(newDate);
        }
        onDateChange?.(newDate);
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDate(today);
        setSelectedMonth(null);
        setSelectedYear(null);
        onDateChange?.(today);
    };

    const handleDateClick = (day: Date) => {
        setSelectedDate(day);
        // If we're in day view, also update currentDate to maintain consistency
        if (currentView === 'day') {
            setCurrentDate(day);
        }
        onDateClick?.(day);
    };

    const handleViewChange = (newView: 'day' | 'week' | 'month' | 'year') => {
        setCurrentView(newView);
        setSelectedMonth(null);
        setSelectedYear(null);
        
        // When switching to day view, ensure selectedDate is synchronized
        if (newView === 'day') {
            setSelectedDate(currentDate);
        }
        
        onViewChange?.(newView);
    };

    // Handle month selection in year view
    const handleMonthClick = (month: number) => {
        setSelectedMonth(month);
        const newDate = new Date(currentDate.getFullYear(), month, 1);
        setCurrentDate(newDate);
        onDateChange?.(newDate);
        onMonthClick?.(month, currentDate.getFullYear());
    };

    // Handle year selection
    const handleYearClick = (year: number) => {
        setSelectedYear(year);
        setCurrentDate(new Date(year, currentDate.getMonth(), 1));
        onDateChange?.(new Date(year, currentDate.getMonth(), 1));
    };

    // Get days for the current view
    const getViewDays = () => {
        switch (currentView) {
            case 'day':
                return [selectedDate];
            case 'week':
                const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
                return Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));
            case 'month':
                // For month view, show the entire month
                const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                const monthStartWeek = startOfWeek(monthStart, { weekStartsOn: 1 });
                const monthEndWeek = startOfWeek(monthEnd, { weekStartsOn: 1 });
                const totalDays = Math.ceil((monthEndWeek.getTime() - monthStartWeek.getTime()) / (1000 * 60 * 60 * 24));
                return Array.from({ length: totalDays }).map((_, i) => addDays(monthStartWeek, i));
            case 'year':
                // For year view, show the current month
                const yearStart = new Date(currentDate.getFullYear(), 0, 1);
                const yearEnd = new Date(currentDate.getFullYear(), 11, 31);
                const yearStartWeek = startOfWeek(yearStart, { weekStartsOn: 1 });
                const yearEndWeek = startOfWeek(yearEnd, { weekStartsOn: 1 });
                const yearTotalDays = Math.ceil((yearEndWeek.getTime() - yearStartWeek.getTime()) / (1000 * 60 * 60 * 24));
                return Array.from({ length: yearTotalDays }).map((_, i) => addDays(yearStartWeek, i));
            default:
                return [];
        }
    };

    const viewDays = getViewDays();

    // Time slots from 6 AM to 10 PM for better day coverage
    const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

    // Get events for a specific date (improved to show all events for the day)
    const getEventsForDate = (date: Date) => {
        const dayEvents = events.filter(event => {
            try {
                const eventDate = parseISO(event.date);
                return isSameDay(eventDate, date);
            } catch (error) {
                console.error('Error parsing event date:', event.date, error);
                return false;
            }
        });
        
        return dayEvents;
    };

    // Get events for a specific date and time (for time-slot view)
    const getEventsForDateTime = (date: Date, hour: number) => {
        return events.filter(event => {
            try {
                const eventDate = parseISO(event.date);
                if (!isSameDay(eventDate, date)) return false;
                
                // If event is all-day or has no time, don't show it in time slots (it's shown in All Day section)
                if (event.isAllDay || !event.time || event.time.trim() === '') {
                    return false; // All-day events are shown in the All Day section, not in time slots
                }
                
                // Parse the time - handle formats like "14:30", "2:30 PM", "14:30:00"
                const timeStr = event.time.trim();
                let eventHour: number;
                
                // Check if it's in 12-hour format with AM/PM
                if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
                    const [timePart, period] = timeStr.split(/\s*(am|pm)/i);
                    const [hours] = timePart.split(':').map(Number);
                    if (period.toLowerCase() === 'pm' && hours !== 12) {
                        eventHour = hours + 12;
                    } else if (period.toLowerCase() === 'am' && hours === 12) {
                        eventHour = 0;
                    } else {
                        eventHour = hours;
                    }
                } else {
                    // 24-hour format
                    const [hours] = timeStr.split(':').map(Number);
                    eventHour = hours;
                }
                
                // Match events to the hour slot
                return eventHour === hour;
            } catch (error) {
                console.error('Error parsing event time:', event.time, error);
                // If there's an error parsing, show it at the first time slot
                return hour === 6;
            }
        });
    };

    // Event type styling
    const getEventStyle = (type: string) => {
        switch(type) {
            case 'reminder': return 'bg-orange-400 text-white';
            case 'training': return 'bg-green-500 text-white';
            case 'class': return 'bg-purple-500 text-white';
            default: return 'bg-gray-500 text-white';
        }
    };

    const getEventTypeColor = (type: string) => {
        switch(type) {
            case 'reminder': return 'bg-orange-400';
            case 'training': return 'bg-green-500';
            case 'class': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-lg shadow-sm">
            {/* Header */}
            {showHeader && (
                <div className="flex justify-between items-center p-4 border-b border-[var(--border-primary)] dark:border-gray-600">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)] dark:text-white">Schedules</h2>
                    
                    <div className="flex items-center space-x-4">
                        <Button
                            type="neutral"
                            size="none"
                            onClick={goToToday}
                        >
                            Today
                        </Button>
                        
                        <div className="flex items-center space-x-2">
                            <Button
                                type="neutral"
                                size="none"
                                onClick={prevPeriod}
                            >
                                <i dangerouslySetInnerHTML={{ __html: icons.chevronLeft }} />
                            </Button>
                            
                            <span className="text-sm font-medium text-[var(--text-secondary)] dark:text-gray-300">
                                {currentView === 'day' 
                                    ? format(selectedDate, 'MMM d, yyyy')
                                    : currentView === 'week'
                                    ? `${format(viewDays[0], 'MMM d')} - ${format(viewDays[6], 'MMM d, yyyy')}`
                                    : currentView === 'month'
                                    ? format(currentDate, 'MMMM yyyy')
                                    : currentView === 'year'
                                    ? format(currentDate, 'yyyy')
                                    : `${format(viewDays[0], 'MMM d')} - ${format(viewDays[viewDays.length - 1], 'MMM d, yyyy')}`
                                }
                            </span>
                            
                            <Button
                                type="neutral"
                                size="none"
                                onClick={nextPeriod}
                            >
                                <i dangerouslySetInnerHTML={{ __html: icons.chevronRight }} />
                            </Button>
                        </div>

                        <div className="flex space-x-1">
                            {['Day', 'Week', 'Month', 'Year'].map((viewType) => (
                                <button
                                    key={viewType}
                                    onClick={() => handleViewChange(viewType.toLowerCase() as 'day' | 'week' | 'month' | 'year')}
                                    className={`px-3 py-1 text-sm rounded ${
                                        viewType.toLowerCase() === currentView
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-[var(--bg-secondary)] dark:bg-gray-700 text-[var(--text-secondary)] dark:text-gray-400 hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {viewType}
                                </button>
                            ))}
                        </div>

                        <Button 
                            type="action" 
                            size="none"
                            onClick={onNewEvent}
                        >
                            <i dangerouslySetInnerHTML={{ __html: icons.plus }} />
                            <span className="ml-2">New Event</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center p-8">
                    <div className="flex items-center space-x-2">
                        <i className="animate-spin" dangerouslySetInnerHTML={{ __html: icons.spinner }} />
                        <span className="text-[var(--text-secondary)] dark:text-gray-400">Loading calendar events...</span>
                    </div>
                </div>
            )}

            {/* Calendar Grid */}
            {!isLoading && (
                <div className="overflow-x-auto">
                    {currentView === 'month' && (
                        <div className="min-w-[800px]">
                            {/* Month Grid */}
                            <div className="grid grid-cols-7 gap-1 p-4">
                                {/* Day Headers */}
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                    <div key={day} className="p-2 text-center text-sm font-medium text-[var(--text-secondary)] dark:text-gray-400">
                                        {day}
                                    </div>
                                ))}
                                
                                {/* Month Days */}
                                {(() => {
                                    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                                    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                                    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                                    const endDate = startOfWeek(monthEnd, { weekStartsOn: 1 });
                                    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                                    
                                    return Array.from({ length: totalDays }).map((_, i) => {
                                        const day = addDays(startDate, i);
                                        const dayEvents = getEventsForDate(day);
                                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                                        const isToday = isSameDay(day, new Date());
                                        
                                        return (
                                            <div
                                                key={day.toString()}
                                                onClick={() => handleDateClick(day)}
                                                className={`min-h-[100px] p-2 border border-[var(--border-primary)] dark:border-gray-600 cursor-pointer hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700 ${
                                                    !isCurrentMonth ? 'bg-[var(--bg-secondary)] dark:bg-gray-700 text-[var(--text-tertiary)] dark:text-gray-500' : ''
                                                } ${isToday ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600' : ''}`}
                                            >
                                                <div className="text-sm font-medium mb-1 text-[var(--text-primary)] dark:text-white">
                                                    {format(day, 'd')}
                                                </div>
                                                <div className="space-y-1">
                                                    {dayEvents.slice(0, 3).map(event => (
                                                        <div
                                                            key={event.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onEventClick?.(event);
                                                            }}
                                                            className={`${getEventStyle(event.type)} p-1 rounded text-xs cursor-pointer truncate`}
                                                        >
                                                            {event.title}
                                                        </div>
                                                    ))}
                                                    {dayEvents.length > 3 && (
                                                        <div className="text-xs text-[var(--text-tertiary)] dark:text-gray-500">
                                                            +{dayEvents.length - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    )}
                    
                    {currentView === 'year' && (
                        <div className="min-w-[800px]">
                            {selectedMonth === null ? (
                                // Year Grid - Show all months
                                <div className="grid grid-cols-4 gap-4 p-4">
                                    {Array.from({ length: 12 }).map((_, month) => {
                                        const monthDate = new Date(currentDate.getFullYear(), month, 1);
                                        const monthEvents = events.filter(event => {
                                            const eventDate = parseISO(event.date);
                                            return eventDate.getFullYear() === currentDate.getFullYear() && 
                                                   eventDate.getMonth() === month;
                                        });
                                        
                                        return (
                                            <div
                                                key={month}
                                                onClick={() => handleMonthClick(month)}
                                                className="p-4 border border-[var(--border-primary)] dark:border-gray-600 rounded-lg cursor-pointer hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700 text-center"
                                            >
                                                <div className="text-lg font-semibold text-[var(--text-primary)] dark:text-white mb-2">
                                                    {format(monthDate, 'MMMM')}
                                                </div>
                                                <div className="text-sm text-[var(--text-secondary)] dark:text-gray-400">
                                                    {monthEvents.length} events
                                                </div>
                                                {monthEvents.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {monthEvents.slice(0, 2).map(event => (
                                                            <div
                                                                key={event.id}
                                                                className={`${getEventStyle(event.type)} p-1 rounded text-xs truncate`}
                                                            >
                                                                {event.title}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                // Show selected month
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <button
                                            onClick={() => setSelectedMonth(null)}
                                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                        >
                                            ← Back to Year View
                                        </button>
                                        <h3 className="text-lg font-semibold text-[var(--text-primary)] dark:text-white">
                                            {format(new Date(currentDate.getFullYear(), selectedMonth, 1), 'MMMM yyyy')}
                                        </h3>
                                    </div>
                                    
                                    {/* Month Grid */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {/* Day Headers */}
                                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                            <div key={day} className="p-2 text-center text-sm font-medium text-[var(--text-secondary)] dark:text-gray-400">
                                                {day}
                                            </div>
                                        ))}
                                        
                                        {/* Month Days */}
                                        {(() => {
                                            const monthStart = new Date(currentDate.getFullYear(), selectedMonth, 1);
                                            const monthEnd = new Date(currentDate.getFullYear(), selectedMonth + 1, 0);
                                            const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                                            const endDate = startOfWeek(monthEnd, { weekStartsOn: 1 });
                                            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                                            
                                            return Array.from({ length: totalDays }).map((_, i) => {
                                                const day = addDays(startDate, i);
                                                const dayEvents = getEventsForDate(day);
                                                const isCurrentMonth = day.getMonth() === selectedMonth;
                                                const isToday = isSameDay(day, new Date());
                                                
                                                return (
                                                    <div
                                                        key={day.toString()}
                                                        onClick={() => handleDateClick(day)}
                                                        className={`min-h-[100px] p-2 border border-[var(--border-primary)] dark:border-gray-600 cursor-pointer hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700 ${
                                                            !isCurrentMonth ? 'bg-[var(--bg-secondary)] dark:bg-gray-700 text-[var(--text-tertiary)] dark:text-gray-500' : ''
                                                        } ${isToday ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600' : ''}`}
                                                    >
                                                        <div className="text-sm font-medium mb-1 text-[var(--text-primary)] dark:text-white">
                                                            {format(day, 'd')}
                                                        </div>
                                                        <div className="space-y-1">
                                                            {dayEvents.slice(0, 3).map(event => (
                                                                <div
                                                                    key={event.id}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        onEventClick?.(event);
                                                                    }}
                                                                    className={`${getEventStyle(event.type)} p-1 rounded text-xs cursor-pointer truncate`}
                                                                >
                                                                    {event.title}
                                                                </div>
                                                            ))}
                                                            {dayEvents.length > 3 && (
                                                                <div className="text-xs text-[var(--text-tertiary)] dark:text-gray-500">
                                                                    +{dayEvents.length - 3} more
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Day View - Time-based Grid */}
                    {currentView === 'day' && (
                        <div className="min-w-[200px]">
                            {/* Day Header */}
                            <div className="p-4 border-b border-[var(--border-primary)] dark:border-gray-600 bg-[var(--bg-secondary)] dark:bg-gray-700">
                                <div className="text-center">
                                    <h3 className="text-xl font-semibold text-[var(--text-primary)] dark:text-white">
                                        {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                                    </h3>
                                    <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400 mt-1">
                                        {getEventsForDate(selectedDate).length} events today
                                    </p>
                                    {/* Event Type Summary */}
                                    {getEventsForDate(selectedDate).length > 0 && (
                                        <div className="flex justify-center mt-2 space-x-4 text-xs">
                                            {['reminder', 'training', 'class'].map(type => {
                                                const count = getEventsForDate(selectedDate).filter(e => e.type === type).length;
                                                if (count === 0) return null;
                                                return (
                                                    <div key={type} className="flex items-center space-x-1">
                                                        <div className={`w-2 h-2 rounded-full ${getEventTypeColor(type)}`}></div>
                                                        <span className="text-[var(--text-secondary)] dark:text-gray-400">{type}: {count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                
                                {/* All Day Events Section */}
                                {(() => {
                                    const allDayEvents = getEventsForDate(selectedDate).filter(event => event.isAllDay || !event.time || event.time.trim() === '');
                                    if (allDayEvents.length > 0) {
                                        return (
                                            <div className="mt-4 pt-4 border-t border-[var(--border-primary)] dark:border-gray-600">
                                                <h4 className="text-sm font-semibold text-[var(--text-primary)] dark:text-white mb-2">All Day Events</h4>
                                                <div className="space-y-2">
                                                    {allDayEvents.map(event => (
                                                        <div
                                                            key={event.id}
                                                            onClick={() => onEventClick?.(event)}
                                                            className={`${getEventStyle(event.type)} p-2 rounded cursor-pointer shadow-sm hover:shadow-md transition-all`}
                                                        >
                                                            <div className="font-semibold text-white text-sm">{event.title}</div>
                                                            {event.description && (
                                                                <div className="text-white text-xs opacity-90 mt-1">{event.description}</div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                <div className="flex justify-center mt-3 space-x-2">
                                    <button
                                        onClick={() => {
                                            const prevDay = addDays(selectedDate, -1);
                                            setSelectedDate(prevDay);
                                            setCurrentDate(prevDay);
                                            onDateChange?.(prevDay);
                                        }}
                                        className="px-3 py-1 text-sm bg-[var(--bg-secondary)] dark:bg-gray-600 hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-500 text-[var(--text-secondary)] dark:text-gray-400 rounded-md transition-colors"
                                    >
                                        ← Previous Day
                                    </button>
                                    <button
                                        onClick={() => {
                                            const today = new Date();
                                            setSelectedDate(today);
                                            setCurrentDate(today);
                                            onDateChange?.(today);
                                        }}
                                        className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => {
                                            const nextDay = addDays(selectedDate, 1);
                                            setSelectedDate(nextDay);
                                            setCurrentDate(nextDay);
                                            onDateChange?.(nextDay);
                                        }}
                                        className="px-3 py-1 text-sm bg-[var(--bg-secondary)] dark:bg-gray-600 hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-500 text-[var(--text-secondary)] dark:text-gray-400 rounded-md transition-colors"
                                    >
                                        Next Day →
                                    </button>
                                </div>
                                <div className="flex justify-center mt-2">
                                    <input
                                        type="date"
                                        value={format(selectedDate, 'yyyy-MM-dd')}
                                        onChange={(e) => {
                                            const newDate = new Date(e.target.value);
                                            setSelectedDate(newDate);
                                            setCurrentDate(newDate);
                                            onDateChange?.(newDate);
                                        }}
                                        className="px-3 py-1 text-sm border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-primary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Day Time Grid */}
                            <div className="overflow-x-auto">
                                <div className="min-w-[500px]">
                                    {/* Time Slots Grid */}
                                    <div className="grid grid-cols-1">
                                        {timeSlots.map(hour => (
                                            <div key={hour} className="contents">
                                                {/* Time Row */}
                                                <div className="grid grid-cols-[120px_1fr] border-b border-[var(--border-secondary)] dark:border-gray-700 min-h-[80px]">
                                                    {/* Time Label */}
                                                    <div className="p-2 border-r border-[var(--border-primary)] dark:border-gray-600 bg-[var(--bg-secondary)] dark:bg-gray-700 flex items-center justify-between">
                                                        <span className="text-xs font-medium text-[var(--text-secondary)] dark:text-gray-400">
                                                            {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                                        </span>
                                                        <button 
                                                            className="text-[var(--text-tertiary)] dark:text-gray-500 hover:text-[var(--text-secondary)] dark:hover:text-gray-400 p-1 rounded hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-600"
                                                            onClick={onNewEvent}
                                                            title="Add event at this time"
                                                        >
                                                            <i dangerouslySetInnerHTML={{ __html: icons.plus }} />
                                                        </button>
                                                    </div>

                                                    {/* Events for this time slot */}
                                                    <div className="p-2 relative">
                                                        {(() => {
                                                            const hourEvents = getEventsForDateTime(selectedDate, hour);
                                                            return hourEvents.length > 0 ? (
                                                                <div className="space-y-2">
                                                                    {hourEvents.map(event => (
                                                                        <div
                                                                            key={event.id}
                                                                            onClick={() => onEventClick?.(event)}
                                                                            className={`${getEventStyle(event.type)} p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-all duration-200`}
                                                                        >
                                                                            <div className="flex items-center justify-between">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <h4 className="font-semibold text-white text-sm truncate">
                                                                                        {event.title}
                                                                                    </h4>
                                                                                    {event.description && (
                                                                                        <p className="text-white text-xs opacity-90 mt-1 truncate">
                                                                                            {event.description}
                                                                                        </p>
                                                                                    )}
                                                                                    {event.location && (
                                                                                        <p className="text-white text-xs opacity-75 mt-1 truncate">
                                                                                            📍 {event.location}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                                <div className="ml-2 flex-shrink-0">
                                                                                    <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full text-white">
                                                                                        {event.type}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-4 text-gray-400 text-xs">
                                                                    No events
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Week View */}
                    {currentView === 'week' && (
                        <div className="min-w-[800px]">
                            {/* Day Headers */}
                            <div className="grid grid-cols-8 border-b border-[var(--border-primary)] dark:border-gray-600">
                                <div className="p-3 border-r border-[var(--border-primary)] dark:border-gray-600">
                                    <div className="text-xs font-medium text-[var(--text-secondary)] dark:text-gray-400 mb-1">All Day</div>
                                </div>
                                {viewDays.map(day => {
                                    const allDayEvents = getEventsForDate(day).filter(event => event.isAllDay || !event.time || event.time.trim() === '');
                                    return (
                                        <div key={day.toString()} className="p-3 text-center border-r border-[var(--border-primary)] dark:border-gray-600">
                                            <div className="text-sm font-medium text-[var(--text-secondary)] dark:text-gray-400">
                                                {format(day, 'EEEE')}
                                            </div>
                                            <div className="text-lg font-semibold text-[var(--text-primary)] dark:text-white">
                                                {format(day, 'd')}
                                            </div>
                                            {allDayEvents.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {allDayEvents.slice(0, 2).map(event => (
                                                        <div
                                                            key={event.id}
                                                            onClick={() => onEventClick?.(event)}
                                                            className={`${getEventStyle(event.type)} p-1 rounded text-xs cursor-pointer truncate`}
                                                            title={event.title}
                                                        >
                                                            {event.title}
                                                        </div>
                                                    ))}
                                                    {allDayEvents.length > 2 && (
                                                        <div className="text-xs text-[var(--text-tertiary)] dark:text-gray-500">
                                                            +{allDayEvents.length - 2}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>



                            {/* Time Slots for Week View */}
                            <div className="grid grid-cols-8">
                                {timeSlots.map(hour => (
                                    <div key={hour} className="contents">
                                        {/* Time Label */}
                                        <div className="p-2 border-r border-[var(--border-primary)] dark:border-gray-600 border-b border-[var(--border-secondary)] dark:border-gray-700 text-xs text-[var(--text-tertiary)] dark:text-gray-500 flex items-center justify-between bg-[var(--bg-secondary)] dark:bg-gray-700">
                                            <span>{hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}</span>
                                            <button 
                                                className="text-[var(--text-tertiary)] dark:text-gray-500 hover:text-[var(--text-secondary)] dark:hover:text-gray-400"
                                                onClick={onNewEvent}
                                            >
                                                <i dangerouslySetInnerHTML={{ __html: icons.plus }} />
                                            </button>
                                        </div>

                                        {/* Day Cells - Only show events with times */}
                                        {viewDays.map(day => {
                                            // Filter out all-day events and events without times (they're shown in the All Day section)
                                            const dayEvents = getEventsForDateTime(day, hour).filter(event => !event.isAllDay && event.time && event.time.trim() !== '');
                                            return (
                                                <div
                                                    key={`${day.toString()}-${hour}`}
                                                    className="p-1 border-r border-[var(--border-primary)] dark:border-gray-600 border-b border-[var(--border-secondary)] dark:border-gray-700 min-h-[60px] relative"
                                                >
                                                    {dayEvents.map(event => (
                                                        <div
                                                            key={event.id}
                                                            onClick={() => onEventClick?.(event)}
                                                            className={`${getEventStyle(event.type)} p-2 rounded text-xs cursor-pointer mb-1 shadow-sm hover:shadow-md transition-all`}
                                                        >
                                                            <div className="font-medium truncate">
                                                                {event.time && event.endTime 
                                                                    ? `${event.time} - ${event.endTime}`
                                                                    : event.time || ''
                                                                }
                                                            </div>
                                                            <div className="font-semibold truncate">
                                                                {event.title}
                                                            </div>
                                                            {event.participants && event.participants.length > 0 && (
                                                                <div className="text-xs opacity-90 truncate">
                                                                    {event.participants.join(', ')}
                                                                </div>
                                                            )}
                                                            {event.description && (
                                                                <div className="text-xs opacity-75 truncate">
                                                                    {event.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="p-4 border-t border-[var(--border-primary)] dark:border-gray-600">
                <div className="flex items-center space-x-6 text-sm">
                    <span className="font-medium text-[var(--text-secondary)] dark:text-gray-300">Legend:</span>
                    {[
                        { type: 'reminder', label: 'Reminder' },
                        { type: 'training', label: 'Training' },
                        { type: 'class', label: 'Class' }
                    ].map(({ type, label }) => (
                        <div key={type} className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getEventTypeColor(type)}`}></div>
                            <span className="text-gray-600">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}