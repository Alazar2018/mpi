import { create } from 'zustand';



export interface EmailAddress {
  email: string;
  verified: boolean;
}

export interface NotificationPreference {
  emailNotification: {
    enabled: boolean;
  };
  pushNotification: {
    enabled: boolean;
  };
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string; // Add direct email field
  role: string;
  registrationStep?: string;
  nextStep?: string; // Add nextStep from login response
  marketplaceProfile?: Record<string, any>;
  avatar?: string;
  emailAddress?: EmailAddress; // Keep for backward compatibility
  isRegistrationComplete?: boolean;
  notificationPreference?: NotificationPreference;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface Session {
  sessionId: string;
  expiresAt: string;
  deviceInfo: {
    deviceId: string;
    platform: string;
    userAgent: string;
  };
}

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  session: Session | null;
  isHydrated: boolean; // Add hydration state
  get accessToken(): string | null;
  get role(): string | null; // Keep the getter for backward compatibility
  getRole: () => string | null; // Function version
  setUser: (user: User) => void;
  setTokens: (tokens: Tokens) => void;
  setToken: (accessToken: string, refreshToken: string) => void;
  setSession: (session: Session) => void;
  clearAuth: () => void;
  clearUser: () => void;
  // Debug function to get current state
  getState: () => AuthState;
  // Function to mark as hydrated
  setHydrated: (hydrated: boolean) => void;
  // Function to load from localStorage
  loadFromStorage: () => boolean;
  // Function to refresh user data from server
  refreshUser: () => Promise<void>;
  setAvatar: (avatar: string) => void;
}

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    user: null,
    tokens: null,
    session: null,
    isHydrated: false, // Initialize hydration state
    get accessToken() {
      return get().tokens?.accessToken || null;
    },
    get role() {
      return get().user?.role || null;
    },
    getRole: () => {
      const userRole = get().user?.role || null;
      return userRole;
    },
    setUser: (user: User) => {
     
      set({ user });
      
      // Manually save to localStorage
      localStorage.setItem('auth-user', JSON.stringify(user));
    },
    setAvatar: (avatar: string) => {
      const currentUser = get().user;
      if (currentUser) {
        const updatedUser = { ...currentUser, avatar };
        set({ user: updatedUser });
        localStorage.setItem('auth-user', JSON.stringify(updatedUser));
      }
    },
    setTokens: (tokens: Tokens) => {
      
      set({ tokens });
      
      // Manually save to localStorage
      localStorage.setItem('auth-tokens', JSON.stringify(tokens));
    },
    setToken: (accessToken: string, refreshToken: string) => {
      const tokens = { accessToken, refreshToken };
      set({ tokens });
      
      // Manually save to localStorage
      localStorage.setItem('auth-tokens', JSON.stringify(tokens));
    },
    setSession: (session: Session) => {
      set({ session });
      
      // Manually save to localStorage
      localStorage.setItem('auth-session', JSON.stringify(session));
    },
    clearAuth: () => {
      set({ user: null, tokens: null, session: null });
      
      // Clear localStorage
      localStorage.removeItem('auth-user');
      localStorage.removeItem('auth-tokens');
      localStorage.removeItem('auth-session');
    },
    clearUser: () => {
      set({ user: null });
      
      // Clear user from localStorage
      localStorage.removeItem('auth-user');
    },
    // Function to refresh user data from server
    refreshUser: async () => {
      try {
        // Import profile service dynamically to avoid circular dependencies
        const { fetchUserProfile } = await import('@/service/profile.server');
        const userProfile = await fetchUserProfile();
        
        if (userProfile && userProfile.avatar) {
          const currentUser = get().user;
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              avatar: userProfile.avatar
            };
            set({ user: updatedUser });
            localStorage.setItem('auth-user', JSON.stringify(updatedUser));
          }
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
    },
    // Debug function to get current state
    getState: () => get(),
    // Function to mark as hydrated
    setHydrated: (hydrated: boolean) => set({ isHydrated: hydrated }),
    // Function to load from localStorage
    loadFromStorage: () => {
      try {
        const userStr = localStorage.getItem('auth-user');
        const tokensStr = localStorage.getItem('auth-tokens');
        const sessionStr = localStorage.getItem('auth-session');
        
        if (userStr || tokensStr || sessionStr) {
          const user = userStr ? JSON.parse(userStr) : null;
          const tokens = tokensStr ? JSON.parse(tokensStr) : null;
          const session = sessionStr ? JSON.parse(sessionStr) : null;
          
          
          
          set({ user, tokens, session, isHydrated: true });
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error loading from localStorage:', error);
        return false;
      }
    },
  })
);
