import React, { useState, useMemo } from 'react';

interface Player {
  _id: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

interface Score {
  p1Score: string;
  p2Score: string;
  pointWinner: string;
  server: string;
}

interface Game {
  gameNumber: number;
  scores: Score[];
  winner: string;
  server: string;
}

interface Set {
  _id: string;
  p1TotalScore: number;
  p2TotalScore: number;
  winner: string;
  games: Game[];
}

interface MatchData {
  _id: string;
  p1: Player | string;
  p2: Player | string;
  p1IsObject: boolean;
  p2IsObject: boolean;
  p1Name?: string;
  p2Name?: string;
  sets: Set[];
  status: string;
  winner?: string;
  report?: any;
  totalGameTime?: number;
  courtSurface?: string;
  matchType?: string;
  matchCategory?: string;
}

interface MomentumTabProps {
  matchData: MatchData;
}

const MomentumTab: React.FC<MomentumTabProps> = ({ matchData }) => {
  const [selectedSet, setSelectedSet] = useState<'all' | number>('all');

  // Calculate momentum data for a specific set
  const calculateMomentum = (set: Set) => {
    const momentumData: { point: number; momentum: number; game: number }[] = [];
    let currentMomentum = 0;
    let pointCount = 0;

    set.games.forEach((game, gameIndex) => {
      game.scores.forEach((score) => {
        if (score.pointWinner === 'playerOne') {
          currentMomentum += 1;
        } else if (score.pointWinner === 'playerTwo') {
          currentMomentum -= 1;
        }
        
        pointCount++;
        momentumData.push({
          point: pointCount,
          momentum: currentMomentum,
          game: gameIndex + 1
        });
      });
    });

    return momentumData;
  };

  // Calculate momentum data for all sets combined
  const calculateAllSetsMomentum = () => {
    const allMomentumData: { point: number; momentum: number; set: number; game: number }[] = [];
    let currentMomentum = 0;
    let pointCount = 0;

    matchData.sets.forEach((set, setIndex) => {
      set.games.forEach((game, gameIndex) => {
        game.scores.forEach((score) => {
          if (score.pointWinner === 'playerOne') {
            currentMomentum += 1;
          } else if (score.pointWinner === 'playerTwo') {
            currentMomentum -= 1;
          }
          
          pointCount++;
          allMomentumData.push({
            point: pointCount,
            momentum: currentMomentum,
            set: setIndex + 1,
            game: gameIndex + 1
          });
        });
      });
    });

    return allMomentumData;
  };

  // Get momentum data based on selection
  const momentumData = useMemo(() => {
    if (selectedSet === 'all') {
      return calculateAllSetsMomentum();
    } else {
      const set = matchData.sets[selectedSet - 1];
      return set ? calculateMomentum(set) : [];
    }
  }, [selectedSet, matchData.sets]);

  // Generate SVG path for momentum line
  const generateMomentumPath = (data: any[]) => {
    if (data.length === 0) return '';
    
    const maxMomentum = Math.max(...data.map(d => d.momentum));
    const minMomentum = Math.min(...data.map(d => d.momentum));
    const range = maxMomentum - minMomentum || 1;
    
    return data.map((point, index) => {
      const x = 100 + (index / (data.length - 1)) * 1200;
      const y = 100 + ((maxMomentum - point.momentum) / range) * 300;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Generate SVG path for area fill
  const generateAreaPath = (data: any[]) => {
    if (data.length === 0) return '';
    
    const maxMomentum = Math.max(...data.map(d => d.momentum));
    const minMomentum = Math.min(...data.map(d => d.momentum));
    const range = maxMomentum - minMomentum || 1;
    
    const topPath = data.map((point, index) => {
      const x = 100 + (index / (data.length - 1)) * 1200;
      const y = 100 + ((maxMomentum - point.momentum) / range) * 300;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    const bottomPath = data.map((point, index) => {
      const x = 100 + ((data.length - 1 - index) / (data.length - 1)) * 1200;
      const y = 400;
      return `L ${x} ${y}`;
    }).join(' ');
    
    return `${topPath} ${bottomPath} Z`;
  };

  const getPlayerName = (player: Player | string) => {
    if (typeof player === 'object' && player.firstName) {
      return `${player.firstName} ${player.lastName}`;
    }
    return player as string;
  };

  // Check if there's any data to display
  if (!matchData.sets || matchData.sets.length === 0) {
    return (
      <div className="p-6 bg-[var(--bg-primary)] min-h-screen transition-colors duration-300">
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-12 text-center border border-[var(--border-primary)] transition-colors duration-300">
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 transition-colors duration-300">No Momentum Data Available</h2>
          <p className="text-[var(--text-secondary)] mb-2 transition-colors duration-300">This match doesn't have any momentum data recorded yet.</p>
          <p className="text-sm text-[var(--text-tertiary)] transition-colors duration-300">Momentum data will appear here once the match begins and scoring is tracked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[var(--bg-primary)] min-h-screen transition-colors duration-300">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 transition-colors duration-300">Match Momentum Analysis</h2>
        <p className="text-[var(--text-secondary)] transition-colors duration-300">Visual representation of player momentum throughout the match</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setSelectedSet('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedSet === 'all'
              ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
          }`}
        >
          All Set
        </button>
        {matchData.sets.map((_, index) => (
          <button
            key={index}
            onClick={() => setSelectedSet(index + 1)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedSet === index + 1
                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Set {index + 1}
          </button>
        ))}
      </div>

      {/* Momentum Charts */}
      <div className="space-y-6">
        {/* Player 1 Momentum */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 text-center transition-colors duration-300">
            {getPlayerName(matchData.p1)} Momentum
          </h3>
          <div className="flex justify-center items-center w-full">
            <div className="relative w-full max-w-6xl">
              <svg 
                width="100%" 
                height="500" 
                viewBox="0 0 1400 500" 
                className="w-full h-auto"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Grid lines */}
                <line x1="100" y1="100" x2="100" y2="400" stroke="var(--border-primary)" strokeWidth="1" />
                <line x1="100" y1="400" x2="1300" y2="400" stroke="var(--border-primary)" strokeWidth="1" />
                
                {/* Center line */}
                <line x1="100" y1="250" x2="1300" y2="250" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="5,5" />
                
                {/* Area fill */}
                <path
                  d={generateAreaPath(momentumData)}
                  fill="url(#momentumGradient)"
                  opacity="0.3"
                />
                
                {/* Momentum line */}
                <path
                  d={generateMomentumPath(momentumData)}
                  stroke="#8b5cf6"
                  strokeWidth="4"
                  fill="none"
                />
                
                {/* Data points */}
                {momentumData.map((point, index) => {
                  const x = 100 + (index / (momentumData.length - 1)) * 1200;
                  const y = 100 + ((Math.max(...momentumData.map(d => d.momentum)) - point.momentum) / 
                    (Math.max(...momentumData.map(d => d.momentum)) - Math.min(...momentumData.map(d => d.momentum)) || 1)) * 300;
                  
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#8b5cf6"
                      className="hover:r-6 transition-all cursor-pointer"
                    />
                  );
                })}
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="momentumGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Legend */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-6 text-sm text-[var(--text-secondary)] transition-colors duration-300">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-500 rounded-full mr-2"></div>
                    <span>Momentum Line</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-purple-200 rounded-full mr-2"></div>
                    <span>Momentum Area</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Player 2 Momentum */}
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 text-center transition-colors duration-300">
            {getPlayerName(matchData.p2)} Momentum
          </h3>
          <div className="flex justify-center items-center w-full">
            <div className="relative w-full max-w-6xl">
              <svg 
                width="100%" 
                height="500" 
                viewBox="0 0 1400 500" 
                className="w-full h-auto"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Grid lines */}
                <line x1="100" y1="100" x2="100" y2="400" stroke="var(--border-primary)" strokeWidth="1" />
                <line x1="100" y1="400" x2="1300" y2="400" stroke="var(--border-primary)" strokeWidth="1" />
                
                {/* Center line */}
                <line x1="100" y1="250" x2="1300" y2="250" stroke="var(--border-secondary)" strokeWidth="1" strokeDasharray="5,5" />
                
                {/* Area fill */}
                <path
                  d={generateAreaPath(momentumData)}
                  fill="url(#momentumGradient2)"
                  opacity="0.3"
                />
                
                {/* Momentum line */}
                <path
                  d={generateMomentumPath(momentumData)}
                  stroke="#3b82f6"
                  strokeWidth="4"
                  fill="none"
                />
                
                {/* Data points */}
                {momentumData.map((point, index) => {
                  const x = 100 + (index / (momentumData.length - 1)) * 1200;
                  const y = 100 + ((Math.max(...momentumData.map(d => d.momentum)) - point.momentum) / 
                    (Math.max(...momentumData.map(d => d.momentum)) - Math.min(...momentumData.map(d => d.momentum)) || 1)) * 300;
                  
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="5"
                      fill="#3b82f6"
                      className="hover:r-6 transition-all cursor-pointer"
                    />
                  );
                })}
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="momentumGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Legend */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-6 text-sm text-[var(--text-secondary)] transition-colors duration-300">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
                    <span>Momentum Line</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-200 rounded-full mr-2"></div>
                    <span>Momentum Area</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Momentum Explanation */}
      <div className="mt-6 bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] p-6 border border-[var(--border-primary)] transition-colors duration-300">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 transition-colors duration-300">How to Read Momentum</h3>
        <div className="text-sm text-[var(--text-secondary)] space-y-2 transition-colors duration-300">
          <p>• <strong>Above center line:</strong> Player 1 has momentum advantage</p>
          <p>• <strong>Below center line:</strong> Player 2 has momentum advantage</p>
          <p>• <strong>Steep upward line:</strong> Player 1 winning consecutive points</p>
          <p>• <strong>Steep downward line:</strong> Player 2 winning consecutive points</p>
          <p>• <strong>Flat line:</strong> Players trading points evenly</p>
        </div>
      </div>
    </div>
  );
};

export default MomentumTab;
