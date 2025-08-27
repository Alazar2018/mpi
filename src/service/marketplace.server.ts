import { fetchUserProfile } from './profile.server';
import { useAuthStore } from '@/store/auth.store';

// API Base URL
const API_BASE_URL = 'https://ai.mpiglobal.org';

// Types based on the API specification
export interface PlayerData {
  desired_services?: string[];
  level?: string;
  rank?: number;
  zip?: string;
  availability?: number[][];
  session_duration?: number;
  court_surfaces?: string[];
  playing_style?: string;
  languages?: string[];
  experience?: string;
  package_preference?: string[];
}

export interface MatchRequest {
  player: PlayerData;
}

export interface MatchRecommendation {
  id: string;
}

export interface RecommendationRequest {
  question: string;
  id?: string;
}

export interface CoachProfile {
  id: string;
  name: string;
  image: string;
  rating: number;
  experience: string;
  targetGroup: string;
  specialization: string;
  description: string;
  badge?: string;
  location?: string;
  languages?: string[];
  court_surfaces?: string[];
  availability?: string[];
  pricing?: {
    hourly?: number;
    package?: number;
  };
}

export interface RecommendationResponse {
  player_profile: {
    "first name": string;
    "last name": string;
    experience_level: string;
    zip: string;
  };
  question_results: Array<{
    question: string;
    intent: string;
    videos: any[];
    experts: Array<{
      _id: string;
      name: string;
      type: string;
      credentials: string;
      bio: string;
      answered_questions: string[];
      specializations: string[];
      experience_years: number;
      rating: number;
      total_ratings: number;
      availability: {
        is_available: boolean;
        timezone: string;
      };
      categories: string[];
      languages: string[];
      status: string;
      is_featured: boolean;
      consultation_count: number;
      location: {
        city: string;
        country: string;
        state: string;
        zipcode: string;
      };
      similarity: number;
    }>;
  }>;
}

export interface MatchResponse {
  success: boolean;
  data?: {
    coaches?: CoachProfile[];
    match_score?: number;
    compatibility_factors?: string[];
  };
  message?: string;
}

// New interface for the actual /api/match response
export interface ProfileMatchResponse {
  coach: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    marketplaceProfile?: {
      rating?: number;
      yearsExperience?: number;
      specialties?: string[];
      styleDescription?: string;
      zip?: string;
      languages?: string[];
      courtSurfaces?: string[];
      availability?: Array<{
        day: number;
        startTime: number;
        endTime: number;
      }>;
      hourlyRate?: number;
      packageDeals?: Array<{
        sessions: number;
        price: number;
        description: string;
      }>;
    };
    address?: {
      city?: string;
      stateProvince?: string;
      country?: string;
    };
  };
  score: number;
  components: {
    services: number;
    skill_level: number;
    location: number;
    availability: number;
    certification: number;
    surface: number;
    language: number;
    experience: number;
    package: number;
  };
}

class MarketplaceService {
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'POST',
    data?: any
  ): Promise<T> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Origin': 'https://ai.mpiglobal.org',
        },
        mode: 'cors',
        credentials: 'omit',
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error(`CORS error: The API at ${API_BASE_URL} doesn't allow requests from this origin. This is a server-side configuration issue.`);
      }
      
      throw new Error(`Failed to fetch from marketplace API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get coach recommendations based on a specific question
   */
  async getRecommendations(question: string, userId?: string): Promise<RecommendationResponse> {
    // Get user ID from auth store if not provided
    if (!userId) {
      const authStore = useAuthStore.getState();
      userId = authStore.user?._id;
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    const payload: RecommendationRequest = {
      question,
      id: userId
    };

    return this.makeRequest<RecommendationResponse>('/api/get_recommendations', 'POST', payload);
  }

  /**
   * Match a player profile to the best coaches
   */
  async matchCoaches(playerData: PlayerData): Promise<CoachProfile[]> {
    // Get user ID from auth store
    const authStore = useAuthStore.getState();
    const userId = authStore.user?._id;
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    const payload: MatchRequest = { player: playerData };

    // The /api/match endpoint returns an array of ProfileMatchResponse objects
    const response = await this.makeRequest<ProfileMatchResponse[]>('/api/match', 'POST', payload);
    
    // Convert the response to our CoachProfile format
    return response.map(match => this.convertProfileMatchToCoachProfile(match));
  }

  /**
   * Match a user by ID to the best coaches
   */
  async matchUserById(userId?: string): Promise<MatchResponse> {
    // Get user ID from auth store if not provided
    if (!userId) {
      const authStore = useAuthStore.getState();
      userId = authStore.user?._id;
    }
    
    if (!userId) {
      throw new Error('User ID is required');
    }

    // Based on the Swagger spec, this endpoint expects an array of objects with id field
    const payload = [{ id: userId }];
    
    return this.makeRequest<MatchResponse>('/api/match_recommendations', 'POST', payload);
  }

  /**
   * Get marketplace recommendations for the current user
   * This combines profile data with the AI recommendation API
   */
    async getMarketplaceRecommendations(): Promise<CoachProfile[]> {
    try {
      // Get user ID from auth store first
      const authStore = useAuthStore.getState();
      const userId = authStore.user?._id;
      
      if (!userId) {
        throw new Error('User ID not found in auth store');
      }

      // First, get the current user's profile
      const userProfile = await fetchUserProfile();
      
      if (!userProfile) {
        throw new Error('User profile not found');
      }

             // Convert profile data to PlayerData format
       const playerData: PlayerData = {
         level: userProfile.marketplaceProfile?.level || 'Intermediate',
         experience: userProfile.marketplaceProfile?.experience || '1 year',
         playing_style: userProfile.marketplaceProfile?.playingStyle || 'Baseline',
         languages: userProfile.marketplaceProfile?.languages || ['English'],
         zip: userProfile.marketplaceProfile?.zip || userProfile.address?.zipCode,
         desired_services: ['coaching'],
         package_preference: userProfile.marketplaceProfile?.packagePreference || ['monthly'],
         session_duration: userProfile.marketplaceProfile?.sessionDuration || 60,
         court_surfaces: userProfile.marketplaceProfile?.courtSurfaces || ['hard'],
         availability: userProfile.marketplaceProfile?.availability?.map(avail => [avail.startTime, avail.endTime]) || [[9, 12], [14, 18]],
       };

                     // Get AI-powered coach recommendations
        const matchResponse = await this.matchCoaches(playerData);
        
        if (matchResponse && matchResponse.length > 0) {
          return matchResponse;
        }

       // Fallback: Get general recommendations
       const recommendationResponse = await this.getRecommendations(
         'Find me tennis coaches for my skill level and playing style'
       );

                      // Convert experts to CoachProfile format
        if (recommendationResponse.question_results && recommendationResponse.question_results.length > 0) {
          const experts = recommendationResponse.question_results[0]?.experts || [];
          if (experts.length > 0) {
            return experts.map(expert => this.convertExpertToCoachProfile(expert));
          }
        }

        // If no AI recommendations found, return empty array instead of fallback
        return [];
           } catch (error) {
        // Only return fallback data if there's a genuine API error
        // Don't return fallback for empty results
        if (error instanceof Error && error.message.includes('HTTP error')) {
          return this.getFallbackCoaches();
        }
        
        // For other errors, return empty array
        return [];
      }
  }

  /**
   * Get recommendations based on a specific question
   */
  async getRecommendationsByQuestion(question: string): Promise<CoachProfile[]> {
    try {
      const response = await this.getRecommendations(question);
      
      // Convert experts to CoachProfile format
      if (response.question_results && response.question_results.length > 0) {
        const experts = response.question_results[0]?.experts || [];
        const coachProfiles = experts.map(expert => this.convertExpertToCoachProfile(expert));
        return coachProfiles;
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Search coaches by specific criteria
   */
    async searchCoaches(criteria: {
    level?: string;
    specialization?: string;
    location?: string;
    availability?: string;
    maxPrice?: number;
  }): Promise<CoachProfile[]> {
    try {
      // Create a question based on search criteria
      const question = this.buildSearchQuestion(criteria);
      
      const response = await this.getRecommendations(question);
        
      // Convert experts to CoachProfile format
      if (response.question_results && response.question_results.length > 0) {
        const experts = response.question_results[0]?.experts || [];
        const coaches = experts.map(expert => this.convertExpertToCoachProfile(expert));
        // Filter results based on criteria
        return this.filterCoachesByCriteria(coaches, criteria);
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  private buildSearchQuestion(criteria: any): string {
    const parts: string[] = ['Find tennis coaches'];
    
    if (criteria.level) parts.push(`for ${criteria.level} level players`);
    if (criteria.specialization) parts.push(`specializing in ${criteria.specialization}`);
    if (criteria.location) parts.push(`near ${criteria.location}`);
    if (criteria.availability) parts.push(`available ${criteria.availability}`);
    if (criteria.maxPrice) parts.push(`with rates under $${criteria.maxPrice}/hour`);
    
    return parts.join(' ');
  }

     private filterCoachesByCriteria(coaches: CoachProfile[], criteria: any): CoachProfile[] {
     return coaches.filter(coach => {
       if (criteria.level && coach.targetGroup !== criteria.level) return false;
       if (criteria.specialization && !coach.specialization.toLowerCase().includes(criteria.specialization.toLowerCase())) return false;
       if (criteria.maxPrice && coach.pricing?.hourly && coach.pricing.hourly > criteria.maxPrice) return false;
       return true;
     });
   }

   /**
    * Get appropriate image for expert based on their type and gender
    */
   private getExpertImage(expert: RecommendationResponse['question_results'][0]['experts'][0]): string {
     // Use consistent images based on expert name for better UX
     const imageMap: Record<string, string> = {
       'Tanya Brooks': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop&crop=face',
       'Liam O\'Connor': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=face',
       'Ana Petrović': 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=200&fit=crop&crop=face'
     };
     
     return imageMap[expert.name] || 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop&crop=center';
   }

       /**
     * Convert API expert data to CoachProfile format
     */
    private convertExpertToCoachProfile(expert: RecommendationResponse['question_results'][0]['experts'][0]): CoachProfile {
      const coachProfile = {
        id: expert._id,
        name: expert.name,
        image: this.getExpertImage(expert),
        rating: expert.rating,
        experience: `${expert.experience_years} Years`,
        targetGroup: expert.type === 'coach' ? 'All Levels' : 'Professional',
        specialization: expert.specializations.join(', '),
        description: expert.bio,
        badge: expert.is_featured ? '⭐' : undefined,
        location: `${expert.location.city}, ${expert.location.state}`,
        languages: expert.languages,
        court_surfaces: ['Hard', 'Clay'],
        availability: expert.availability.is_available ? ['Available'] : ['Not Available'],
        pricing: {
          hourly: expert.type === 'coach' ? 60 + Math.floor(Math.random() * 40) : 80 + Math.floor(Math.random() * 60),
          package: undefined
        }
      };
      
      return coachProfile;
    }

    /**
     * Convert ProfileMatchResponse to CoachProfile format
     */
    private convertProfileMatchToCoachProfile(match: ProfileMatchResponse): CoachProfile {
      const coach = match.coach;
      const profile = coach.marketplaceProfile;
      
      const coachProfile = {
        id: coach._id,
        name: `${coach.firstName} ${coach.lastName}`,
        image: coach.avatar || 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop&crop=center',
        rating: profile?.rating || 4.0,
        experience: profile?.yearsExperience ? `${profile.yearsExperience} Years` : '5+ Years',
        targetGroup: profile?.specialties?.join(', ') || 'All Levels',
        specialization: profile?.styleDescription || 'Tennis Coaching',
        description: profile?.styleDescription || 'Professional tennis coach with experience in player development.',
        badge: match.score > 0.8 ? '⭐' : undefined,
        location: coach.address ? `${coach.address.city || 'Unknown'}, ${coach.address.stateProvince || 'Unknown'}` : 'Location not specified',
        languages: profile?.languages || ['English'],
        court_surfaces: profile?.courtSurfaces || ['Hard'],
        availability: profile?.availability ? profile.availability.map(avail => 
          `Day ${avail.day}: ${avail.startTime}:00-${avail.endTime}:00`
        ) : ['Contact for availability'],
        pricing: {
          hourly: profile?.hourlyRate || 75,
          package: profile?.packageDeals?.[0]?.price || undefined
        }
      };
      
      return coachProfile;
    }

   /**
    * Get fallback coach data for development/testing when API fails
    */
   private getFallbackCoaches(): CoachProfile[] {
     return [
       {
         id: 'fallback-1',
         name: 'Coach Saminas Gigar',
         image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop&crop=face',
         rating: 4.8,
         experience: '10+ Years',
         targetGroup: 'Adult',
         specialization: 'Tournament Coaching',
         description: 'Helping players improve their technique and mental game with personalized training plans designed for competitive play.',
         badge: 'B',
         location: 'New York, NY',
         languages: ['English', 'Spanish'],
         court_surfaces: ['Hard', 'Clay'],
         availability: ['Weekdays 9AM-12PM', 'Weekends 2PM-6PM'],
         pricing: { hourly: 75, package: 300 }
       },
       {
         id: 'fallback-2',
         name: 'Coach Elara Vance',
         image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop&crop=face',
         rating: 4.9,
         experience: '8 Years',
         targetGroup: 'Youth',
         specialization: 'Beginner Fundamentals',
         description: 'Specialized in teaching young players the basics of tennis with fun, engaging methods that build confidence and skills.',
         location: 'Los Angeles, CA',
         languages: ['English'],
         court_surfaces: ['Hard'],
         availability: ['Weekdays 3PM-7PM', 'Weekends 9AM-1PM'],
         pricing: { hourly: 60, package: 250 }
       },
       {
         id: 'fallback-3',
         name: 'Coach Jian Li',
         image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop&crop=face',
         rating: 4.7,
         experience: '12 Years',
         targetGroup: 'Seniors',
         specialization: 'Low-Impact Technique',
         description: 'Expert in adapting tennis techniques for senior players, focusing on fitness, flexibility, and injury prevention.',
         location: 'Miami, FL',
         languages: ['English', 'Mandarin'],
         court_surfaces: ['Clay', 'Hard'],
         availability: ['Weekdays 10AM-2PM', 'Weekends 4PM-8PM'],
         pricing: { hourly: 70, package: 280 }
       }
     ];
   }
 }

export const marketplaceService = new MarketplaceService();
export default marketplaceService;
