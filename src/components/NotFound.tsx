import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center transition-colors duration-300">
      <div className="text-center space-y-8 max-w-lg mx-auto px-4">
        {/* Simple 404 animation */}
        <div className="space-y-4">
          <div className="text-8xl">🎾</div>
          <div className="text-6xl font-bold text-red-500">404</div>
        </div>
        
        {/* Main Message */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Page Not Found
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            The page you're looking for doesn't exist.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleGoHome}
            type="primary"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Button>
          
          <Button
            onClick={handleGoBack}
            type="secondary"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
