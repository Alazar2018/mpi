import type { LoginPayload, LoginResponse, RegisterPayload } from "@/interface";
import { axiosInstance } from "@/config/axios.config";
import { API_CONFIG, buildApiUrl } from "@/config/api.config";
import axios from "axios";

export function refreshToken(data: {refreshToken: string}) {
  // Use plain axios instead of axiosInstance to avoid sending Authorization header
  // since the refresh endpoint doesn't require authorization
  return axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH), data, {
    headers: {
      "Content-Type": "application/json"
    },
    validateStatus: (status) => {
      return status >= 200 && status < 300 
    }
  })
    .then(response => {
      // Transform the API response to match AsyncResponse format
      const apiResponse = response.data;
      return {
        success: apiResponse.status === 'success',
        data: apiResponse,
        error: apiResponse.status === 'success' ? undefined : apiResponse.message,
        status: response.status
      };
    });
}

export function login(credentials: LoginPayload) {
  return axiosInstance.post<LoginResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, credentials)
    .then(response => {
      // Transform the API response to match AsyncResponse format
      const apiResponse = response.data;
      return {
        success: apiResponse.status === 'success',
        data: apiResponse,
        error: apiResponse.status === 'success' ? undefined : apiResponse.message,
        status: response.status
      };
    });
}

export function register(credentials: RegisterPayload) {
  return axiosInstance.post<LoginResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, credentials, {
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => {
      // Transform the API response to match AsyncResponse format
      const apiResponse = response.data;
     
      
      // Check if the response indicates success (status 201 or message contains "successful")
      const isSuccess: boolean = response.status === 201 || 
                       (typeof apiResponse.status === 'number' && apiResponse.status === 201) || 
                       (!!apiResponse.message && apiResponse.message.toLowerCase().includes('successful'));
      
      return {
        success: isSuccess,
        data: apiResponse,
        error: isSuccess ? undefined : apiResponse.message || 'Registration failed',
        status: response.status
      };
    });
}

export function getAccountCreationOtp(data: {email: string}) {
  return axiosInstance.post(API_CONFIG.ENDPOINTS.AUTH.GENERATE_OTP, data)
    .then(response => {
      // Transform the API response to match AsyncResponse format
      const apiResponse = response.data;
      return {
        success: apiResponse.status === 'success',
        data: apiResponse,
        error: apiResponse.status === 'success' ? undefined : apiResponse.message,
        status: response.status
      };
    });
}

export function verifyOTP(data: {email: string, otp: string}) {
  return axiosInstance.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_OTP, data)
    .then(response => {
      // Transform the API response to match AsyncResponse format
      const apiResponse = response.data;
      return {
        success: apiResponse.status === 'success',
        data: apiResponse,
        error: apiResponse.status === 'success' ? undefined : apiResponse.message,
        status: response.status
      };
    });
}

export function requestPasswordReset(data: {email: string}) {
  return axiosInstance.post(API_CONFIG.ENDPOINTS.AUTH.REQUEST_PASSWORD_RESET, data)
    .then(response => {
      // Transform the API response to match AsyncResponse format
      const apiResponse = response.data;
      return {
        success: apiResponse.status === 'success',
        data: apiResponse,
        error: apiResponse.status === 'success' ? undefined : apiResponse.message,
        status: response.status
      };
    });
}

export function verifyPasswordResetOTP(data: {email: string, otp: string}) {
  return axiosInstance.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_PASSWORD_RESET_OTP, data)
    .then(response => {
      // Transform the API response to match AsyncResponse format
      const apiResponse = response.data;
      return {
        success: apiResponse.status === 'success',
        data: apiResponse,
        error: apiResponse.status === 'success' ? undefined : apiResponse.message,
        status: response.status
      };
    });
}

export function resetPasswordWithOTP(data: {email: string, otp: string, newPassword: string, confirmPassword: string}) {
  return axiosInstance.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD_OTP, data)
    .then(response => {
      // Transform the API response to match AsyncResponse format
      const apiResponse = response.data;
      return {
        success: apiResponse.status === 'success',
        data: apiResponse,
        error: apiResponse.status === 'success' ? undefined : apiResponse.message,
        status: response.status
      };
    });
}

