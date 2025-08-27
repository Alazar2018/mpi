import axios from "axios";
import { API_CONFIG, buildApiUrl } from "./api.config";
import { useAuthStore } from "@/store/auth.store";
import { isTokenExpired, isRefreshTokenExpired } from "@/utils/jwt";

// Create axios instance with base configuration
export const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  // Removed withCredentials to fix CORS issues
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

// Process failed requests queue
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Handle logout when refresh token fails
const handleLogout = () => {
  const authStore = useAuthStore.getState();
  
  // Clear auth store
  authStore.clearAuth();
  
  // Clear localStorage
  localStorage.clear();
  
  // Clear cookies
  document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Clear any other auth-related cookies
  document.cookie = 'accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Redirect to login page
  window.location.href = "/login";
};

// Response interceptor to handle 401 errors and token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Skip intercepting auth endpoints (login, register, refresh, etc.)
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                          error.config?.url?.includes('/auth/refresh') || 
                          error.config?.url?.includes('/auth/register') ||
                          error.config?.url?.includes('/auth/generateotp') ||
                          error.config?.url?.includes('/auth/verifyOTP') ||
                          error.config?.url?.includes('/auth/request-password-reset') ||
                          error.config?.url?.includes('/auth/verify-password-reset-otp') ||
                          error.config?.url?.includes('/auth/reset-password-otp');
    
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;
    
    // Only attempt refresh if:
    // 1. It's a 401 error (token expired)
    // 2. We haven't already retried
    // 3. We have a refresh token in the store
    // 4. The current access token is actually expired
    // 5. We have a user logged in
    if (error.response?.status === 401 && !originalRequest._retry) {
      const authStore = useAuthStore.getState();
      
      // Don't attempt refresh if no user is logged in
      if (!authStore.user) {
        return Promise.reject(error);
      }
      
      const accessToken = authStore.tokens?.accessToken;
      const refreshToken = authStore.tokens?.refreshToken;
      
      // Check if we have a refresh token
      if (!refreshToken) {
        handleLogout();
        return Promise.reject(error);
      }
      
      // Check if the refresh token itself is expired
      if (isRefreshTokenExpired(refreshToken)) {
        console.error("Refresh token is expired, logging out user");
        handleLogout();
        return Promise.reject(error);
      }
      
      // Check if the current access token is actually expired
      if (accessToken && !isTokenExpired(accessToken)) {
        return Promise.reject(error);
      }
      
      // If already refreshing, add to queue
      if (isRefreshing) {
        console.log("Token refresh already in progress, queuing request...");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }
      
      try {
        isRefreshing = true;
        originalRequest._retry = true;
        
        console.log("Attempting to refresh access token...");
        
        const refreshResponse = await axios.post( // Use plain axios to avoid circular dependency
          buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH),
          { refreshToken }, // Use the refreshToken from auth store
          { headers: { "Content-Type": "application/json" }, timeout: API_CONFIG.TIMEOUT }
        );

        if (refreshResponse.status !== 200) { 
          throw new Error("Refresh token failed with status: " + refreshResponse.status); 
        }

        // Transform the response to match our expected format
        const apiResponse = refreshResponse.data;
        
        if (apiResponse.status !== 200 || !apiResponse.data?.tokens) {
          throw new Error("Invalid refresh token response: " + (apiResponse.message || 'Unknown error'));
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = apiResponse.data.tokens;
        if (!newAccessToken || !newRefreshToken) { 
          throw new Error("Couldn't get new tokens from response"); 
        }
        
        // Update the auth store with new tokens
        authStore.setToken(newAccessToken, newRefreshToken);
        
        // Update user information if provided
        if (apiResponse.data.user) {
          authStore.setUser(apiResponse.data.user);
        }
        
        // Update session information if provided
        if (apiResponse.data.session) {
          authStore.setSession(apiResponse.data.session);
        }
        
        // Update refresh token cookie for future use
        document.cookie = `refreshToken=${newRefreshToken}; path=/; max-age=${60 * 60 * 24 * 30}`; // 30 days
        
        console.log("Token refresh successful, retrying original request...");
        
        // Process queue with success
        processQueue(null, newAccessToken);
        
        // Update the original request headers with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Retry the original request with new token
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        
        // Process queue with error
        processQueue(refreshError, null);
        
        handleLogout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Request interceptor to automatically add Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    // Don't add Authorization header for auth endpoints (login, refresh, register, etc.)
    const isAuthEndpoint = config.url?.includes('/auth/login') || 
                          config.url?.includes('/auth/refresh') || 
                          config.url?.includes('/auth/register') ||
                          config.url?.includes('/auth/generateotp') ||
                          config.url?.includes('/auth/verifyOTP') ||
                          config.url?.includes('/auth/request-password-reset') ||
                          config.url?.includes('/auth/verify-password-reset-otp') ||
                          config.url?.includes('/auth/reset-password-otp');
    
    if (!isAuthEndpoint) {
      const authStore = useAuthStore.getState();
      
      // Don't add Authorization header if no user is logged in
      if (!authStore.user) {
        
        return config;
      }
      
      const accessToken = authStore.tokens?.accessToken;
      
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
