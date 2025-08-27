import React from 'react';
import DefaultPage from '@/components/DefaultPage';
import Marketplace from '@/components/Marketplace';

export default function FindCoach() {
  return (
    <DefaultPage>
      <div className="w-full">
        {/* Header */}
        <div className="px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[var(--text-primary)] dark:text-white">Find Coach</h1>
              <p className="text-xl text-[var(--text-secondary)] dark:text-gray-300 mt-1">Discover and connect with tennis coaches</p>
            </div>
          </div>
        </div>
        
        {/* Marketplace Component - Full Width */}
        <div className="w-full">
          <Marketplace />
        </div>
      </div>
    </DefaultPage>
  );
}
