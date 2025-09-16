import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export const AuthLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center transition-colors duration-300">
      <div className="text-center space-y-6">
        {/* Tennis-themed loading animation */}
        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-4">
            <div className="animate-bounce text-6xl">🎾</div>
          </div>
          <div className="absolute inset-0 w-20 h-20 mx-auto">
            <div className="animate-ping w-full h-full bg-blue-200 rounded-full opacity-20"></div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Verifying Access
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Checking your authentication status...
          </p>
        </div>
        
        {/* Loading spinner */}
        <LoadingSpinner size="md" text="" />
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
