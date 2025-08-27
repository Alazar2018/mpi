import axiosInstance from "@/config/axios.config";
import { useAuthStore } from "@/store/auth.store";

// Types for the profile API response
export interface MarketplaceProfile {
  desiredServices: string[];
  level: string;
  rank: string | null;
  zip: string;
  availability: Array<{
    day: number;
    startTime: number;
    endTime: number;
    _id: string;
  }>;
  sessionDuration: number;
  courtSurfaces: string[];
  playingStyle: string;
  languages: string[];
  experience: string;
  packagePreference: string[];
  maxBudgetPerSession: number;
  travelDistance: number;
  goals: string[];
  isActivelySearching: boolean;
  preferredCoachGender: string;
}

export interface PhoneNumber {
  countryCode: string;
  number: string;
}

export interface Address {
  streetAddress: string;
  streetAddress2: string;
  city: string;
  stateProvince: string;
  country: string;
  zipCode: string;
}

export interface EmailAddress {
  email: string;
  verified: boolean;
}

export interface NotificationPreference {
  emailNotification: {
    enabled: boolean;
    notificationType: string[];
    notificationFrequency: string;
  };
  pushNotification: {
    enabled: boolean;
    notificationType: string[];
    notificationFrequency: string;
  };
}

export interface CoachGoal {
  coach: string;
  goals: Array<{
    goal: string;
    term: string;
    description: string;
    measurement: string;
    achievementDate: string;
    actions: Array<{
      description: string;
      date: string;
      isDone: boolean;
      _id: string;
    }>;
    obstacles: Array<{
      description: string;
      isOvercome: boolean;
      _id: string;
    }>;
    addOn: string;
    _id: string;
    progress: any[];
  }>;
  _id: string;
}

export interface Periodization {
  startingDate: string;
  endingDate: string;
  status: string;
  physical: {
    preparation: {
      allocatedTime: number;
      timeType: string;
      generals: string[];
      specifics: string[];
      specificDescriptions: string[];
    } | null;
    competition: any | null;
    transition: any | null;
    _id: string;
  };
  technical: {
    preparation: any | null;
    competition: any | null;
    transition: any | null;
    _id: string;
  };
  psychological: {
    preparation: any | null;
    competition: any | null;
    transition: any | null;
    _id: string;
  };
  tactical: {
    preparation: {
      allocatedTime: number;
      timeType: string;
      generals: string[];
      specifics: string[];
      specificDescriptions: string[];
    } | null;
    competition: any | null;
    transition: any | null;
    _id: string;
  };
  nutrition: {
    preparation: any | null;
    competition: any | null;
    transition: any | null;
    _id: string;
  };
  recovery: {
    preparation: {
      allocatedTime: number;
      timeType: string;
      generals: string[];
      specifics: string[];
      specificDescriptions: string[];
    } | null;
    competition: any | null;
    transition: any | null;
    _id: string;
  };
  _id: string;
}

export interface InitialAssessment {
  competitiveStateAnxietyInventory: Record<string, number>;
  mindfulnessQuestionnaire: Record<string, number>;
}

export interface UserProfile {
  marketplaceProfile: MarketplaceProfile;
  passwordSetAt: string | null;
  lastLoginAt: string | null;
  lockUntil: string | null;
  deviceToken: string | null;
  _id: string;
  isRegistrationComplete: boolean;
  hasOtp: boolean;
  badge: number;
  firstName: string;
  lastName: string;
  emailAddress: EmailAddress;
  dateOfBirth: string;
  gender: string;
  phoneNumber: PhoneNumber;
  address: Address;
  isProfilePublic: boolean;
  notificationPreference: NotificationPreference;
  avatar: string;
  role: string;
  googleId: string;
  lastOnline: string;
  provider: string;
  __t: string;
  tennisRanking: string;
  parents: string[];
  coaches: string[];
  organization: string | null;
  loginStreak: number;
  coachGoals: CoachGoal[];
  lastLoginDate: string;
  periodizations: Periodization[];
  initialAssessment: InitialAssessment;
  updatedAt: string;
  emailVerified: boolean;
  loginAttempts: number;
  passwordSet: boolean;
  registrationStep: string;
  emailVerifiedAt: string;
  id: string;
}

export interface ProfileApiResponse {
  status: string;
  data: UserProfile;
  message?: string;
  user?: UserProfile; // For responses with user wrapper
}

/**
 * Fetch user profile data from the API with retry mechanism
 * 
 * Expected API response format:
 * - Direct UserProfile object: {id, firstName, emailAddress, marketplaceProfile, ...}
 * - Wrapped format: {status: "success", data: UserProfile, message?: string}
 * 
 * @param retryCount - Number of retries attempted (default: 0)
 * @returns Promise<UserProfile> - The user profile data
 */
export const fetchUserProfile = async (retryCount: number = 0): Promise<UserProfile> => {
  try {
    const authStore = useAuthStore.getState();
    
    if (!authStore.tokens?.accessToken) {
      throw new Error("No access token available");
    }

    
    const timestamp = new Date().getTime();
    const response = await axiosInstance.get<ProfileApiResponse>(`/api/v1/users/profile?t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'If-None-Match': `"${timestamp}"`, // Add ETag to prevent 304
        'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT' // Force fresh data
      },
      timeout: 10000 // 10 second timeout
    });
    
  
    
    // Handle 304 Not Modified response (cached data)
    // Check for 304 status, empty response data, or ETag headers that might indicate caching
    // Also check if the response looks like it might be a 304 response that wasn't properly handled
    if (response.status === 304 || 
        (response.status === 200 && !response.data) || 
        response.headers['etag'] || 
        response.headers['last-modified'] ||
        (response.status === 200 && response.data && typeof response.data === 'string' && (response.data as string).trim() === '') ||
        (response.status === 200 && response.data && Array.isArray(response.data) && (response.data as any[]).length === 0)) {
      
      // Make a fresh request with timestamp to ensure we get fresh data
      const timestamp = new Date().getTime();
      const freshResponse = await axiosInstance.get<ProfileApiResponse>(`/api/v1/users/profile?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-None-Match': `"${timestamp}"`, // Add ETag to prevent 304
          'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT' // Force fresh data
        },
        timeout: 10000 // 10 second timeout
      });
      
      
      // Handle direct UserProfile response from fresh request
      if (freshResponse.data && typeof freshResponse.data === 'object' && !('status' in freshResponse.data)) {
        const potentialProfile = freshResponse.data as any;
        if (potentialProfile.id || potentialProfile.emailAddress || potentialProfile.firstName || potentialProfile.marketplaceProfile) {
          return potentialProfile as UserProfile;
        }
      }
      
      // Handle wrapped response format from fresh request
      if (freshResponse.data && freshResponse.data.status === "success" && freshResponse.data.data) {
        return freshResponse.data.data;
      } else {
        throw new Error(freshResponse.data?.message || "Failed to fetch profile data from fresh request");
      }
    }
    
    // Handle direct UserProfile response (what the API actually returns)
    if (response.data && typeof response.data === 'object' && !('status' in response.data)) {
      // This is a direct response without the expected wrapper structure
      // Check if the response data looks like a UserProfile object
      const potentialProfile = response.data as any;
      if (potentialProfile.id || potentialProfile.emailAddress || potentialProfile.firstName || potentialProfile.marketplaceProfile) {
        return potentialProfile as UserProfile;
      } else {
        console.error("Response data doesn't match expected UserProfile structure:", response.data);
        throw new Error("Response data doesn't match expected profile structure");
      }
    }
    
    // Handle wrapped response format (if API ever returns it)
    if (response.data && response.data.status === "success" && response.data.data) {

      return response.data.data;
    } else if (response.data && response.data.status === "success" && !response.data.data) {
      console.error("API returned success but no data:", response.data);
      throw new Error("API returned success but no profile data");
    } else if (response.data && response.data.status !== "success") {
      console.error("API response indicates failure:", response.data);
      throw new Error(response.data.message || "Failed to fetch profile data");
    } else if (!response.data) {
      console.error("No response data received - this might be a 304 response");
      // If we get here and there's no data, it might be a 304 response that wasn't caught
      // Let's make a fresh request to be sure
      
      const freshTimestamp = new Date().getTime();
      const freshResponse = await axiosInstance.get<ProfileApiResponse>(`/api/v1/users/profile?t=${freshTimestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-None-Match': `"${freshTimestamp}"`, // Add ETag to prevent 304
          'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT' // Force fresh data
        },
        timeout: 10000
      });
      
      
      
      // Handle direct UserProfile response from fresh request
      if (freshResponse.data && typeof freshResponse.data === 'object' && !('status' in freshResponse.data)) {
        const potentialProfile = freshResponse.data as any;
        if (potentialProfile.id || potentialProfile.emailAddress || potentialProfile.firstName || potentialProfile.marketplaceProfile) {

          return potentialProfile as UserProfile;
        }
      }
      
      // Handle wrapped response format from fresh request
      if (freshResponse.data && freshResponse.data.status === "success" && freshResponse.data.data) {
        return freshResponse.data.data;
      } else {
        throw new Error(freshResponse.data?.message || "Failed to fetch profile data from fresh request");
      }
    } else {
      console.error("Unexpected response format:", response);
      throw new Error("Unexpected response format from profile API");
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    
    // Provide more specific error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('Network Error') || error.message.includes('timeout')) {
        // Retry network errors up to 2 times
        if (retryCount < 2) {
          
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return fetchUserProfile(retryCount + 1);
        }
        throw new Error("Network error: Unable to connect to the server after multiple attempts. Please check your internet connection.");
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error("Authentication error: Please log in again.");
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        throw new Error("Access denied: You don't have permission to view this profile.");
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        throw new Error("Profile not found: The requested profile could not be located.");
      } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
        // Retry server errors up to 2 times
        if (retryCount < 2) {
            
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
          return fetchUserProfile(retryCount + 1);
        }
        throw new Error("Server error: Please try again later.");
      }
    }
    
    throw error;
  }
};

/**
 * Update user profile data
 * 
 * Expected API response format:
 * - Direct UserProfile object: {id, firstName, emailAddress, marketplaceProfile, ...}
 * - Wrapped format: {status: "success", data: UserProfile, message?: string}
 * 
 * @param profileData - The profile data to update
 * @returns Promise<UserProfile> - The updated user profile data
 */
export const updateUserProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const authStore = useAuthStore.getState();
    
    if (!authStore.tokens?.accessToken) {
      throw new Error("No access token available");
    }

    const response = await axiosInstance.put<ProfileApiResponse>("/api/v1/users/profile", profileData);
    
    // Handle 304 Not Modified response (cached data)
    if (response.status === 304) {

      
      // Make a fresh request to get the updated data
      const freshResponse = await axiosInstance.get<ProfileApiResponse>("/api/v1/users/profile", {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      // Handle direct UserProfile response from fresh request
      if (freshResponse.data && typeof freshResponse.data === 'object' && !('status' in freshResponse.data)) {
        const potentialProfile = freshResponse.data as any;
        if (potentialProfile.id || potentialProfile.emailAddress || potentialProfile.firstName || potentialProfile.marketplaceProfile) {
          
          return potentialProfile as UserProfile;
        }
      }
      
      // Handle wrapped response format from fresh request
      if (freshResponse.data.status === "success" && freshResponse.data.data) {
        return freshResponse.data.data;
      } else {
        throw new Error(freshResponse.data.message || "Failed to fetch updated profile data");
      }
    }
    
    // Handle direct UserProfile response (what the API actually returns)
    if (response.data && typeof response.data === 'object' && !('status' in response.data)) {
      // This is a direct response without the expected wrapper structure
      
      const potentialProfile = response.data as any;
      if (potentialProfile.id || potentialProfile.emailAddress || potentialProfile.firstName || potentialProfile.marketplaceProfile) {
        
        return potentialProfile as UserProfile;
      } else {
        console.error("Update response data doesn't match expected UserProfile structure:", response.data);
        throw new Error("Update response data doesn't match expected profile structure");
      }
    }
    
    // Handle wrapped response format (if API ever returns it)
    if (response.data.status === "success" && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to update profile data");
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

/**
 * Helper function to convert day number to day name
 * @param day - Day number (1-7, where 1 is Monday)
 * @returns string - Day name
 */
export const getDayName = (day: number): string => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days[day - 1] || "Unknown";
};

/**
 * Helper function to convert time number to time string
 * @param time - Time in 24-hour format (0-23)
 * @returns string - Time string in 12-hour format
 */
export const getTimeString = (time: number): string => {
  const hour = time % 12 || 12;
  const ampm = time >= 12 ? "PM" : "AM";
  return `${hour}:00 ${ampm}`;
};

/**
 * Helper function to format availability for display
 * @param availability - Array of availability objects
 * @returns string - Formatted availability string
 */
export const formatAvailability = (availability: MarketplaceProfile["availability"]): string => {
  if (!availability || availability.length === 0) return "Not specified";
  
  return availability
    .map(avail => `${getDayName(avail.day)} ${getTimeString(avail.startTime)}-${getTimeString(avail.endTime)}`)
    .join(", ");
};

/**
 * Upload profile picture
 * @param file - The image file to upload
 * @returns Promise<UserProfile> - Updated user profile with new avatar
 */
export const uploadProfilePicture = async (file: File): Promise<UserProfile> => {
  try {
    const authStore = useAuthStore.getState();
    
    if (!authStore.tokens?.accessToken) {
      throw new Error("No access token available");
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('profilePic', file);

    const response = await axiosInstance.patch<ProfileApiResponse>(
      "/api/v1/users/profile/uploadProfilePic", 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    let updatedProfile: UserProfile;

    // Handle response with 'user' wrapper
    if (response.data && response.data.user) {
      
      updatedProfile = response.data.user as UserProfile;
    }
    // Handle direct UserProfile response
    else if (response.data && typeof response.data === 'object' && !('status' in response.data) && !('user' in response.data)) {
      const potentialProfile = response.data as any;
      if (potentialProfile.id || potentialProfile.emailAddress || potentialProfile.firstName || potentialProfile.marketplaceProfile) {
        
        updatedProfile = potentialProfile as UserProfile;
      } else {
        console.error("Upload response data doesn't match expected UserProfile structure:", response.data);
        throw new Error("Upload response data doesn't match expected profile structure");
      }
    }
    // Handle wrapped response format
    else if (response.data.status === "success" && response.data.data) {
      updatedProfile = response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to upload profile picture");
    }

    // Update the auth store with the new avatar if available
    if (updatedProfile && updatedProfile.avatar) {
      const currentUser = authStore.user;
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          avatar: updatedProfile.avatar
        };
        authStore.setUser(updatedUser);

      }
    }

    return updatedProfile;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw error;
  }
};

// Update Profile API
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  phoneNumber?: string;
  phoneNumberCountryCode?: string;
  streetAddress?: string;
  streetAddress2?: string;
  city?: string;
  stateProvince?: string;
  country?: string;
  zipCode?: string;
  isProfilePublic?: boolean;
  emailNotificationEnabled?: boolean;
  emailNotificationType?: string[];
  emailNotificationFrequency?: 'instant' | 'daily' | 'weekly' | 'monthly';
  pushNotificationEnabled?: boolean;
  pushNotificationType?: string[];
  pushNotificationFrequency?: 'instant' | 'daily' | 'weekly' | 'monthly';
}

export const updateProfile = async (profileData: UpdateProfileRequest): Promise<UserProfile> => {
  try {
    const authStore = useAuthStore.getState();
    
    if (!authStore.tokens?.accessToken) {
      throw new Error("No access token available");
    }

    const response = await axiosInstance.patch<any>(
      "/api/v1/users/profile",
      profileData
    );

    let updatedProfile: UserProfile;

    // Handle response with 'user' wrapper
    if (response.data && response.data.user) {
      updatedProfile = response.data.user as UserProfile;
    }
    // Handle direct UserProfile response
    else if (response.data && typeof response.data === 'object' && !('status' in response.data) && !('user' in response.data)) {
      const potentialProfile = response.data as any;
      if (potentialProfile.id || potentialProfile.emailAddress || potentialProfile.firstName || potentialProfile.marketplaceProfile) {
        updatedProfile = potentialProfile as UserProfile;
      } else {
        console.error("Update response data doesn't match expected UserProfile structure:", response.data);
        throw new Error("Update response data doesn't match expected profile structure");
      }
    }
    // Handle wrapped response format
    else if (response.data.status === "success" && response.data.data) {
      updatedProfile = response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to update profile");
    }

    // Update the auth store with any avatar changes if available
    if (updatedProfile && updatedProfile.avatar) {
      const currentUser = authStore.user;
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          avatar: updatedProfile.avatar
        };
        authStore.setUser(updatedUser);
      }
    }

    return updatedProfile;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// Goal Management APIs
export interface GoalAction {
  description: string;
  date: string;
  isDone: boolean;
}

export interface GoalObstacle {
  description: string;
  date: string;
  isOvercome: boolean;
}

export interface CreateGoalRequest {
  goal: 'technical' | 'tactical' | 'physical' | 'mental' | 'nutrition' | 'recovery';
  description: string;
  term: 'short' | 'medium' | 'long';
  measurement: string;
  achievementDate: string;
  actions: GoalAction[];
  obstacles: GoalObstacle[];
  addOn?: string;
}

export interface Goal {
  _id: string;
  goal: string;
  description: string;
  term: string;
  measurement: string;
  achievementDate: string;
  actions: GoalAction[];
  obstacles: GoalObstacle[];
  addOn?: string;
  progress: any[];
  isPersonalGoal?: boolean;
  coach?: {
    _id: string;
    firstName: string;
    lastName: string;
    emailAddress: { email: string };
    phoneNumber: { countryCode: string; number: string };
    avatar: string;
    lastOnline: string;
    id: string;
  };
}

// Add player goal
export const addPlayerGoal = async (playerId: string, goalData: CreateGoalRequest): Promise<Goal> => {
  try {
    const authStore = useAuthStore.getState();
    const token = authStore.tokens?.accessToken;
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axiosInstance.post<{ success: boolean; data: Goal; message: string }>(
      `/api/v1/users/playerGoal/${playerId}`,
      goalData
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to add goal');
    }
  } catch (error) {
    console.error("Error adding goal:", error);
    throw error;
  }
};

// Update player goal
export const updatePlayerGoal = async (playerId: string, goalId: string, goalData: Partial<CreateGoalRequest>): Promise<Goal> => {
  try {
    const authStore = useAuthStore.getState();
    const token = authStore.tokens?.accessToken;
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axiosInstance.patch<{ success: boolean; data: Goal; message: string }>(
      `/api/v1/users/playerGoal/${playerId}/${goalId}`,
      goalData
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to update goal');
    }
  } catch (error) {
    console.error("Error updating goal:", error);
    throw error;
  }
};

// Delete player goal
export const deletePlayerGoal = async (playerId: string, goalId: string): Promise<void> => {
  try {
    const authStore = useAuthStore.getState();
    const token = authStore.tokens?.accessToken;
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `/api/v1/users/playerGoal/${playerId}/${goalId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete goal');
    }
  } catch (error) {
    console.error("Error deleting goal:", error);
    throw error;
  }
};

// Get my goals
export const getMyGoals = async (): Promise<any> => {
  try {
    const authStore = useAuthStore.getState();
    const token = authStore.tokens?.accessToken;
    
    if (!token) {
      throw new Error("No authentication token found");
    }

        // Add cache-busting parameter to force fresh data
    const timestamp = Date.now();
    const response = await axiosInstance.get(`/api/v1/users/myGoals?t=${timestamp}`);


    // Handle 304 Not Modified response (cached data)
    if (response.status === 304) {
        // Return empty array for 304 responses, let the frontend handle caching
        return { goals: [] };
    }

    // Check if response has the expected structure
    if (response.data && response.data.goals) {
      return response.data;
    } else if (Array.isArray(response.data)) {
      // If response is directly an array of goals
      return { goals: response.data };
    } else {
      console.warn("Unexpected API response structure:", response.data);
      return { goals: [] };
    }
  } catch (error) {
    console.error("Error fetching goals:", error);
    throw error;
  }
};

// Change password
export const changePassword = async (passwordData: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const authStore = useAuthStore.getState();
    const token = authStore.tokens?.accessToken;
    
    if (!token) {
      throw new Error("No authentication token found");
    }

    // Validate that new password and confirm password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      throw new Error("New password and confirm password do not match");
    }

    const response = await axiosInstance.patch<{ success: boolean; message: string }>(
      `/api/v1/users/change-password`,
      {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      }
    );

    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to change password');
    }
  } catch (error) {
    console.error("Error changing password:", error);
    throw error;
  }
};
