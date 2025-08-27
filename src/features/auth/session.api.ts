import { axiosInstance } from "@/config/axios.config";
import { API_CONFIG, buildApiUrl } from "@/config/api.config";

export function getSessions() {
  console.log('Making sessions request to:', API_CONFIG.ENDPOINTS.AUTH.SESSIONS);
  return axiosInstance.get(API_CONFIG.ENDPOINTS.AUTH.SESSIONS)
    .then(response => {
      console.log('Raw API response:', response);
      console.log('Response data:', response.data);
      
      // Return the response directly without transformation
      return response;
    })
    .catch(error => {
      console.error('Error fetching sessions:', error);
      throw error;
    });
}

export function terminateSession(sessionId: string) {
  return axiosInstance.delete(`${API_CONFIG.ENDPOINTS.AUTH.SESSIONS}/${sessionId}`)
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

export function refreshSession(sessionId: string) {
  return axiosInstance.patch(`${API_CONFIG.ENDPOINTS.AUTH.SESSIONS}/${sessionId}/refresh`)
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
