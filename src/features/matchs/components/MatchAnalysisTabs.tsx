import React, { useState } from 'react';
import SetsTab from './SetsTab';
import MomentumTab from './MomentumTab';
import ReportTab from './ReportTab';

interface Player {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  avatar: string;
}

interface MatchData {
  _id: string;
  p1: Player;
  p1IsObject: boolean;
  p2IsObject: boolean;
  p2Name: string;
  matchCreator: any;
  matchType: string;
  matchCategory: string;
  status: string;
  winner: string;
  totalGameTime: number;
  tieBreakRule: number;
  indoor: boolean;
  courtSurface: string;
  note: string;
  date: string;
  isDraft: boolean;
  resumedCount: number;
  p1Status: string;
  p2Status: string;
  sets: any[];
  lastSavedAt: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  p1MatchReport: any;
  p2MatchReport: any;
  report: any;
  trackingLevel: string;
}

interface MatchAnalysisTabsProps {
  matchData: MatchData;
}

const MatchAnalysisTabs: React.FC<MatchAnalysisTabsProps> = ({ matchData }) => {
  const [activeTab, setActiveTab] = useState<'sets' | 'momentum' | 'report'>('sets');

  const tabs = [
    { id: 'sets', label: 'Sets', icon: '🎾' },
    { id: 'momentum', label: 'Momentum', icon: '📈' },
    { id: 'report', label: 'Report', icon: '📊' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'sets':
        return <SetsTab matchData={matchData} />;
      case 'momentum':
        return <MomentumTab matchData={matchData} />;
      case 'report':
        return <ReportTab matchData={matchData} />;
      default:
        return <SetsTab matchData={matchData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Match Analysis</h1>
              <p className="text-sm text-gray-600">
                {matchData.p1.firstName} {matchData.p1.lastName} vs {matchData.p2Name}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Status</div>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                matchData.status === 'completed' 
                  ? 'bg-green-100 text-green-800'
                  : matchData.status === 'in_progress'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {matchData.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default MatchAnalysisTabs;
