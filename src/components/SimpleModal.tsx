import React from 'react';

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function SimpleModal({ isOpen, onClose, title, children, size = 'md' }: SimpleModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        className={`bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-secondary)] w-full border border-[var(--border-primary)] ${sizeClasses[size]} transform transition-all duration-300 animate-scale-in`}
        style={{
          animationDelay: '100ms'
        }}
      >
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-[var(--bg-primary)] p-6 border-b border-[var(--border-primary)] transition-colors duration-300">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--bg-secondary)] rounded-full">
                <svg className="w-6 h-6 text-[var(--text-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-full transition-all duration-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 bg-[var(--bg-card)] transition-colors duration-300">
          {children}
        </div>
      </div>
    </div>
  );
}
