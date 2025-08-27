import axiosInstance from "@/config/axios.config";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  type: 'match' | 'training' | 'coaching' | 'tournament' | 'practice';
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  location: string;
  notes: string;
  opponentName?: string;
  coachName?: string;
  color: string;
  isAllDay: boolean;
  participants: string[];
  sourceType: string;
  sourceId: string;
}

export interface CalendarEventsResponse {
  success: boolean;
  data: {
    events: CalendarEvent[];
    totalCount: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
}

export interface UpcomingEventsResponse {
  success: boolean;
  data: {
    events: CalendarEvent[];
    totalUpcoming: number;
  };
}

export interface CalendarQueryParams {
  startDate: string;
  endDate: string;
  timezone?: string;
  view?: 'day' | 'week' | 'month' | 'year';
  limit?: number;
  childId?: string;
}

export class CalendarService {
  private static lastRequestTime = 0;
  private static requestCount = 0;
  private static readonly MAX_REQUESTS_PER_MINUTE = 60; // Allow more requests per minute
  
  // Cache for calendar data to prevent duplicate API calls
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if enough time has passed since the last request
   */
  private static canMakeRequest(): boolean {
    const now = Date.now();
    
    // Reset counter if more than 1 minute has passed
    if (now - this.lastRequestTime >= 60000) {
      this.requestCount = 0;
      this.lastRequestTime = now;
      return true;
    }
    
    // Check if we're within rate limits
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }
    
    // Allow request to proceed (don't enforce strict time intervals)
    this.requestCount++;
    return true;
  }

  /**
   * Fetch calendar events for a specified date range
   */
  static async getEvents(params: CalendarQueryParams, retryCount: number = 0): Promise<CalendarEventsResponse> {
    // Create cache key from parameters
    const cacheKey = `events_${params.startDate}_${params.endDate}_${params.view || 'default'}_${params.childId || 'all'}`;
    
    // Check cache first
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Rate limiting is handled in canMakeRequest, but we always proceed
    // This prevents blocking legitimate API calls

    const queryParams = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      ...(params.timezone && { timezone: params.timezone }),
      ...(params.view && { view: params.view }),
      ...(params.childId && { childId: params.childId }),
    });

    const url = `/api/v1/calendar/events?${queryParams.toString()}`;
    
    try {
      // Use a longer timeout specifically for calendar requests
      // This prevents the 30-second timeout that was causing dashboard errors
      const response = await axiosInstance.get<CalendarEventsResponse>(url, {
        timeout: 90000 // 90 seconds for calendar operations
      });
      
      // Cache the successful response
      this.setCachedData(cacheKey, response.data);
      
      
      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNABORTED') {
        console.error('Calendar API request timed out after 90 seconds');
        
        // Retry once if it's a timeout
        if (retryCount < 1) {
          return this.getEvents(params, retryCount + 1);
        }
        
        throw new Error('Calendar request timed out - the server is taking too long to respond. Please try again.');
      }
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  /**
   * Fetch upcoming events
   */
  static async getUpcomingEvents(limit: number = 5): Promise<UpcomingEventsResponse> {
    const url = `/api/v1/calendar/upcoming?limit=${limit}`;
    
    try {
      // Use a longer timeout specifically for calendar requests
      const response = await axiosInstance.get<UpcomingEventsResponse>(url, {
        timeout: 90000 // 90 seconds for calendar operations
      });
      
      
      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ECONNABORTED') {
        console.error('Calendar upcoming events request timed out after 90 seconds');
        throw new Error('Calendar upcoming events request timed out - the server is taking too long to respond. Please try again.');
      }
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  }

  /**
   * Reset throttling counters (useful for manual refresh)
   */
  static resetThrottling() {
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.cache.clear(); // Clear cache when resetting
  }

  /**
   * Clear cache manually (useful for forcing fresh data)
   */
  static clearCache() {
    this.cache.clear();
  }

  /**
   * Get cached data if available and not expired
   */
  private static getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached data with timestamp
   */
  private static setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Convert API event to local event format
   */
  static convertToLocalEvent(apiEvent: CalendarEvent) {
    return {
      id: apiEvent.id,
      title: apiEvent.title,
      date: apiEvent.startTime.split('T')[0],
      type: apiEvent.type,
      status: apiEvent.status === 'scheduled' ? 'confirmed' : apiEvent.status,
      time: new Date(apiEvent.startTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      endTime: new Date(apiEvent.endTime).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }),
      location: apiEvent.location,
      description: apiEvent.description,
      participants: apiEvent.participants,
      color: apiEvent.color,
      isAllDay: apiEvent.isAllDay,
      opponentName: apiEvent.opponentName,
      coachName: apiEvent.coachName,
      notes: apiEvent.notes,
      sourceType: apiEvent.sourceType,
      sourceId: apiEvent.sourceId,
    };
  }
}
