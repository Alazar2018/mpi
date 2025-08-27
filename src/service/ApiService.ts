import axios from "axios";
import { responseHandler } from "./ApiResponseHandler";
import type { AsyncResponse } from "@/interface";
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
// import { useAuthStore } from "@/store/auth.store"; 

export const backendApi = import.meta.env?.v_API_URL

export default class ApiService {

  api: AxiosInstance

  constructor(baseURL?: string) {
    if (baseURL){
      this.api = axios.create({
        //timeout: 3000,
        baseURL,
        validateStatus: (status: number) => {
          return status < 300 && status >= 200;
        },
      })
    } else {
      this.api = axios.create({
        //timeout: 3000,
        baseURL: backendApi,
        validateStatus: (status: number) => {
          return status < 300 && status >= 200;
        },
      })
    }
    
    // Set up axios interceptors for authentication
    this.setupInterceptors();
  }

  async get<T>(url: string, config: AxiosRequestConfig = {}): Promise<AsyncResponse<T>> {
    return await responseHandler<T>(
      this.api({
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        url,
        method: "get",
      })
    );
  }

  async post<T, D = any>(url: string, data: D, config: AxiosRequestConfig = {}) {
    return await responseHandler<T>(
      this.api({
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        data,
        url,
        method: "post",
      })
    );
  }

  async put<T>(url: string, data: T, config: AxiosRequestConfig = {}) {
    return await responseHandler(
      this.api({
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        data,
        url,
        method: "put",
      })
    );
  }

  async patch<T>(url: string, data: T, config: AxiosRequestConfig = {}) {
    return await responseHandler(
      this.api({
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        data,
        url,
        method: "patch",
      })
    );
  }

  async delete<T>(url: string, config: AxiosRequestConfig = {}) {
    return await responseHandler(
      this.api({
        ...config,
        headers: {
          ...(config?.headers || {}),
        },
        url,
        method: "delete",
      })
    );
  }

  /**
   * Set up axios interceptors for automatic authentication and error handling
   */
  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        // Get tokens from localStorage
        const tokens = localStorage.getItem('tokens');
        if (tokens) {
          try {
            const parsedTokens = JSON.parse(tokens);
            if (parsedTokens?.accessToken) {
              config.headers.Authorization = `Bearer ${parsedTokens.accessToken}`;
            }
          } catch (error) {
            console.error('Error parsing tokens:', error);
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling auth errors
    this.api.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          console.log('Authentication failed, redirecting to login...');
          
          // Clear invalid tokens
          localStorage.removeItem('tokens');
          
          // You can add redirect logic here
          // window.location.href = '/login';
          
          // Or emit a custom event for the app to handle
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        
        if (error.response?.status === 403) {
          console.log('Access forbidden - insufficient permissions');
          // Handle forbidden access
        }
        
        if (error.response?.status >= 500) {
          console.log('Server error occurred');
          // Handle server errors
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Manually refresh authentication headers (useful after login)
   */
  refreshAuthHeaders() {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      try {
        const parsedTokens = JSON.parse(tokens);
        if (parsedTokens?.accessToken) {
          this.api.defaults.headers.common.Authorization = `Bearer ${parsedTokens.accessToken}`;
        }
      } catch (error) {
        console.error('Error parsing tokens:', error);
      }
    }
    return this;
  }

  /**
   * Legacy method - kept for backward compatibility
   * @deprecated Use interceptors instead
   */
  addAuthenticationHeader() {
    let tokens = localStorage.getItem('tokens');
    if (tokens) {
      try {
        const parsedTokens = JSON.parse(tokens);
        if (parsedTokens?.accessToken) {
          this.api.defaults.headers.common.Authorization = `Bearer ${parsedTokens.accessToken}`;
        }
      } catch (error) {
        console.error('Error parsing tokens:', error);
        // Clear invalid tokens
        localStorage.removeItem('tokens');
      }
    }
    return this;
  }
}
