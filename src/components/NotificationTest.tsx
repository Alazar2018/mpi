import React, { useState } from 'react';
import { axiosInstance } from '@/config/axios.config';

const NotificationTest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testRefreshToken = async () => {
    setIsLoading(true);
    setTestResult('Testing refresh token mechanism...');
    
    try {
      // Make a test API call that might trigger token refresh
      const response = await axiosInstance.get('/api/test-endpoint');
      setTestResult(`Test successful: ${response.status}`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setTestResult('Got 401 - token refresh should be triggered automatically');
      } else {
        setTestResult(`Test failed: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testMultipleRequests = async () => {
    setIsLoading(true);
    setTestResult('Testing multiple simultaneous requests...');
    
    try {
      // Make multiple API calls simultaneously to test queue mechanism
      const promises = Array.from({ length: 5 }, (_, i) => 
        axiosInstance.get(`/api/test-endpoint-${i}`)
      );
      
      const responses = await Promise.all(promises);
      setTestResult(`All ${responses.length} requests completed successfully`);
    } catch (error: any) {
      setTestResult(`Multiple requests test failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Refresh Token Test</h3>
      
      <div className="space-y-3">
        <button
          onClick={testRefreshToken}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Single Request'}
        </button>
        
        <button
          onClick={testMultipleRequests}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          {isLoading ? 'Testing...' : 'Test Multiple Requests'}
        </button>
      </div>
      
      {testResult && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm">{testResult}</p>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-600">
        <p>• Check browser console for refresh token logs</p>
        <p>• This will test the automatic token refresh mechanism</p>
        <p>• Multiple requests will test the request queuing system</p>
      </div>
    </div>
  );
};

export default NotificationTest;
