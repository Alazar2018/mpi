import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useApiRequest } from "@/hooks/useApiRequest";
import { getMatchById, saveMatchProgress, submitMatchResult } from "./api/matchs.api";
import type { Match, SaveMatchProgressRequest, SubmitMatchResultRequest } from "@/service/matchs.server";
import { 
  getMatchRules, 
  isMatchComplete as isMatchCompleteUtil, 
  isSetComplete,
  shouldStartTiebreak,
  getMatchWinner,
  getMatchFormatDisplayName,
  getMatchProgressDescription,
  getSetProgressDescription,
  convertLegacyMatchType,
  getTiebreakRuleForSet,
  type MatchFormat,
  type ScoringVariation,
  type MatchRules
} from "@/utils/matchFormatUtils";

interface Player {
  name: string;
  image: string;
  usdta: number;
  sets: number;
  games: number;
  points: number;
  isServing: boolean;
}

interface MatchState {
  bestOf: 1 | 3 | 5; // Legacy field - kept for backward compatibility
  currentSet: number;
  sets: { player1: number; player2: number }[];
  games: { 
    player1: number; 
    player2: number;
    scores: PointScore[]; // Array of point scores within each game
  }[];
  isTieBreak: boolean;
  isDeuce: boolean;
  hasAdvantage: 1 | 2 | null;
  level: 1 | 2 | 3;
  server: 1 | 2 | null; // Track who is serving (null until selected)
  // Enhanced format fields
  matchFormat?: MatchFormat;
  scoringVariation?: ScoringVariation;
  customTiebreakRules?: Record<string, number>;
  noAdScoring?: boolean;
  tieBreakRule?: number;
}



// Level 3 interfaces
interface CourtZone {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  player: 1 | 2;
  type: 'W' | 'B' | 'T' | 'O'; // Wide, Back, Top, Outfield
}



interface ShotPlacement {
  type: 'net' | 'long' | 'wide';
  label: string;
}

interface ShotType {
  type: 'forehand' | 'backhand' | 'volley' | 'forehandSlice' | 'backhandSlice' | 'overhead' | 'forehandDropShot' | 'backhandDropShot';
  label: string;
}

interface RallyLength {
  type: 'oneToFour' | 'fiveToEight' | 'nineToTwelve' | 'thirteenToTwenty' | 'twentyOnePlus';
  label: string;
}

// Point tracking interfaces for API submission
interface PointScore {
  p1Score: string;
  p2Score: string;
  pointWinner: "playerOne" | "playerTwo"; // Add pointWinner property
  isSecondService: boolean;
  p1Reaction: string | null;
  p2Reaction: string | null;
  missedShot: string | null;
  placement: string | null;
  missedShotWay: string | null;
  betweenPointDuration: number | null;
  type: string | null;
  rallies: string | null;
    servePlacement: string | null; // ✅ Backend expects camelCase
  courtPosition: string | null; // ✅ Backend expects this for Level 3 tracking
}

// Tiebreak score interface for API submission


interface GameScore {
  gameNumber: number;
  scores: PointScore[];
  changeoverDuration?: number;
  server: string;
}



// Confetti component for winners modal
const Confetti = () => {
  const confettiPieces = [
    { id: 1, color: '#FF6B6B', shape: 'circle', x: 10, y: 20, size: 8, delay: 0 },
    { id: 2, color: '#4ECDC4', shape: 'square', x: 85, y: 15, size: 6, delay: 0.2 },
    { id: 3, color: '#45B7D1', shape: 'triangle', x: 25, y: 60, size: 10, delay: 0.4 },
    { id: 4, color: '#96CEB4', shape: 'star', x: 70, y: 45, size: 12, delay: 0.6 },
    { id: 5, color: '#FFEAA7', shape: 'hexagon', x: 15, y: 80, size: 7, delay: 0.8 },
    { id: 6, color: '#DDA0DD', shape: 'rectangle', x: 80, y: 75, size: 9, delay: 1.0 },
    { id: 7, color: '#FFB347', shape: 'circle', x: 45, y: 25, size: 6, delay: 1.2 },
    { id: 8, color: '#87CEEB', shape: 'square', x: 60, y: 55, size: 8, delay: 1.4 },
    { id: 9, color: '#98FB98', shape: 'triangle', x: 30, y: 70, size: 9, delay: 1.6 },
    { id: 10, color: '#F0E68C', shape: 'star', x: 75, y: 30, size: 11, delay: 1.8 },
    { id: 11, color: '#E6E6FA', shape: 'hexagon', x: 20, y: 40, size: 7, delay: 2.0 },
    { id: 12, color: '#FFA07A', shape: 'rectangle', x: 65, y: 85, size: 8, delay: 2.2 },
    { id: 13, color: '#20B2AA', shape: 'circle', x: 40, y: 90, size: 6, delay: 2.4 },
    { id: 14, color: '#FF69B4', shape: 'square', x: 90, y: 60, size: 9, delay: 2.6 },
    { id: 15, color: '#32CD32', shape: 'triangle', x: 10, y: 50, size: 10, delay: 2.8 },
    { id: 16, color: '#FFD700', shape: 'star', x: 55, y: 15, size: 12, delay: 3.0 },
    { id: 17, color: '#9370DB', shape: 'hexagon', x: 85, y: 90, size: 7, delay: 3.2 },
    { id: 18, color: '#FFA07A', shape: 'rectangle', x: 25, y: 85, size: 8, delay: 3.4 },
    { id: 19, color: '#00CED1', shape: 'circle', x: 70, y: 10, size: 6, delay: 3.6 },
    { id: 20, color: '#FF8C00', shape: 'square', x: 15, y: 30, size: 9, delay: 3.8 }
  ];

  const renderShape = (piece: any) => {
    const style = {
      position: 'absolute' as const,
      left: `${piece.x}%`,
      top: `${piece.y}%`,
      width: `${piece.size}px`,
      height: `${piece.size}px`,
      backgroundColor: piece.color,
      animation: `confetti-fall 3s ease-in-out ${piece.delay}s infinite`,
      transform: 'rotate(0deg)',
      zIndex: 10
    };

    switch (piece.shape) {
      case 'circle':
        return <div style={{ ...style, borderRadius: '50%' }} />;
      case 'square':
        return <div style={style} />;
      case 'triangle':
        return (
          <div style={{
            ...style,
            width: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderLeft: `${piece.size/2}px solid transparent`,
            borderRight: `${piece.size/2}px solid transparent`,
            borderBottom: `${piece.size}px solid ${piece.color}`
          }} />
        );
      case 'star':
        return (
          <div style={{
            ...style,
            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
          }} />
        );
      case 'hexagon':
        return (
          <div style={{
            ...style,
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }} />
        );
      case 'rectangle':
        return <div style={{ ...style, borderRadius: '2px' }} />;
      default:
        return <div style={style} />;
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes confetti-fall {
            0% {
              transform: translateY(-100px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}
      </style>
      {confettiPieces.map(piece => renderShape(piece))}
    </>
  );
};

// Winners Modal Component
const WinnersModal = ({ 
  isOpen, 
  winner, 
  onClose, 
  matchData,
  onDone
}: { 
  isOpen: boolean; 
  winner: 1 | 2; 
  onClose: () => void; 
  matchData: { player1: Player; player2: Player; match: MatchState; courtRotation: number; }
  onDone: () => void;
}) => {
  if (!isOpen) return null;

  const winnerPlayer = winner === 1 ? matchData.player1 : matchData.player2;
  const loserPlayer = winner === 1 ? matchData.player2 : matchData.player1;

  // Calculate match completion status using enhanced format rules
  const isMatchComplete = () => {
    const matchFormat = matchData.match.matchFormat || convertLegacyMatchType(matchData.match.bestOf === 1 ? 'one' : matchData.match.bestOf === 3 ? 'three' : 'five');
    const rules = getMatchRules(
      matchFormat,
      matchData.match.scoringVariation,
      matchData.match.customTiebreakRules,
      matchData.match.noAdScoring
    );
    
    return isMatchCompleteUtil(matchData.match.sets, rules);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
      <div className="relative bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-[var(--border-primary)]">
        {/* Confetti overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <Confetti />
        </div>

        {/* Top Section - Trophy & Confetti */}
        <div className="bg-[#D4FF5A] p-8 text-center relative">
          <div className="relative z-10">
            {/* Trophy Icon */}
            <div className="w-40 h-40 mx-auto mb-4 relative">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Trophy base */}
                <rect x="30" y="60" width="40" height="8" fill="#4C6BFF" rx="4" />
                {/* Trophy body */}
                <rect x="35" y="30" width="30" height="30" fill="#4C6BFF" rx="8" />
                {/* Trophy handles */}
                <path d="M35 40 Q25 35 25 45 Q25 55 35 50" stroke="#4C6BFF" strokeWidth="3" fill="none" />
                <path d="M65 40 Q75 35 75 45 Q75 55 65 50" stroke="#4C6BFF" strokeWidth="3" fill="none" />
                {/* Star on top */}
                <polygon 
                  points="50,15 52,20 57,20 53,24 55,29 50,26 45,29 47,24 43,20 48,20" 
                  fill="#FFD700" 
                />
                {/* Number 1 */}
                <text x="50" y="55" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">1</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Middle Section - Congratulations Message */}
        <div className="bg-[#4C6BFF] p-8 text-center text-white relative">
          <div className="relative z-10">
            <h3 className="text-sm font-medium uppercase tracking-wider mb-2 opacity-90">
              CONGRATULATIONS!
            </h3>
            <h2 className="text-4xl font-bold">
              {winnerPlayer.name} Has Won!
            </h2>
          </div>
        </div>

        {/* Scoreboard Section */}
        <div className="bg-[var(--bg-card)] p-8">
          {/* Match Progress Indicator */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-blue-800">Match Progress</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isMatchComplete() 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isMatchComplete() ? 'Complete' : 'In Progress'}
              </span>
            </div>
            <div className="text-sm text-blue-700">
              {(() => {
                const matchFormat = matchData.match.matchFormat || convertLegacyMatchType(matchData.match.bestOf === 1 ? 'one' : matchData.match.bestOf === 3 ? 'three' : 'five');
                const rules = getMatchRules(
                  matchFormat,
                  matchData.match.scoringVariation,
                  matchData.match.customTiebreakRules,
                  matchData.match.noAdScoring
                );
                
                const p1Sets = matchData.match.sets.filter(set => set.player1 > set.player2).length;
                const p2Sets = matchData.match.sets.filter(set => set.player2 > set.player1).length;
                const totalSets = matchData.match.sets.length;
                
                return (
                  <div className="space-y-1">
                    <div>{getMatchProgressDescription(matchData.match.sets, rules)}</div>
                    <div className="flex items-center space-x-4">
                      <span>P1 Sets: {p1Sets}/{rules.setsToWin}</span>
                      <span>P2 Sets: {p2Sets}/{rules.setsToWin}</span>
                      <span>Total Sets: {totalSets}</span>
                    </div>
                    {!isMatchComplete() && (
                      <div className="text-yellow-600 font-medium">
                        ⚠️ Match cannot be submitted until a player wins {rules.setsToWin} sets
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="grid grid-cols-4 gap-4 text-center">
              {/* Headers */}
              <div className="text-sm font-medium text-gray-600">Player</div>
              <div className="text-sm font-medium text-gray-600">Sets</div>
              <div className="text-sm font-medium text-gray-600">Games</div>
              <div className="text-sm font-medium text-gray-600">Points</div>
              
              {/* Winner Row */}
              <div className={`p-3 rounded-lg font-medium ${
                winner === 1 ? 'bg-[#D4FF5A]' : 'bg-[#EEF0FF]'
              } text-gray-800`}>
                {winnerPlayer.name.split(' ')[0]} {winnerPlayer.name.split(' ')[1]?.charAt(0) || '.'}
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {matchData.match.sets.reduce((sum, set) => sum + (winner === 1 ? set.player1 : set.player2), 0)}
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {matchData.match.games[matchData.match.currentSet]?.[winner === 1 ? 'player1' : 'player2'] || 0}
              </div>
              <div className="text-2xl font-bold text-gray-800">
                0
              </div>
              
              {/* Loser Row */}
              <div className={`p-3 rounded-lg font-medium ${
                winner === 2 ? 'bg-[#D4FF5A]' : 'bg-[#EEF0FF]'
              } text-gray-800`}>
                {loserPlayer.name.split(' ')[0]} {loserPlayer.name.split(' ')[1]?.charAt(0) || '.'}
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {matchData.match.sets.reduce((sum, set) => sum + (winner === 2 ? set.player1 : set.player2), 0)}
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {matchData.match.games[matchData.match.currentSet]?.[winner === 2 ? 'player1' : 'player2'] || 0}
              </div>
              <div className="text-2xl font-bold text-gray-800">
                0
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Done Button */}
        <div className="bg-[#4C6BFF] p-6 text-center">
          <button
            onClick={onDone}
            className="bg-[var(--bg-primary)] text-[#4C6BFF] px-8 py-3 rounded-xl font-bold text-lg hover:bg-[var(--bg-secondary)] transition-colors shadow-lg border border-[var(--border-primary)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const MatchTracker: React.FC = () => {
  const navigate = useNavigate();
  const { matchId } = useParams();
  
  // Fetch match data
  const matchReq = useApiRequest({
    cacheKey: "match_" + matchId,
    freshDuration: 1000 * 60 * 5,
    staleWhileRevalidate: true,
  });

  // Get selected tracking level from URL query parameter
  const [searchParams] = useSearchParams();
  const selectedLevel = searchParams.get('level');
  
  const matchData = matchReq.response as Match;
  
  useEffect(() => {
    if (!matchId) return;
    
    // Clear any previous state when matchId changes
    console.log('🔄 Match ID changed, clearing previous state...');
    setMatch(prev => ({
      ...prev,
      currentSet: 0,
      sets: Array.from({ length: 3 }, () => ({ player1: 0, player2: 0 })),
      games: [{ player1: 0, player2: 0, scores: [] }],
      isTieBreak: false,
      isDeuce: false,
      hasAdvantage: null,
      server: tempServer || 1
    }));
    
    setPlayer1(prev => ({ ...prev, sets: 0, games: 0, points: 0, isServing: tempServer === 2 ? false : true }));
    setPlayer2(prev => ({ ...prev, sets: 0, games: 0, points: 0, isServing: tempServer === 2 ? true : false }));
    setGameHistory([]);
    setRedoHistory([]);
    
    matchReq.send(
      () => getMatchById(matchId),
      (res) => {
        if (res.success && res.data) {
          // Match data fetched successfully
          console.log('Match data loaded:', res.data);
        }
      }
    );
  }, [matchId]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      // Clear localStorage when component unmounts to prevent stale data
      if (matchId) {
        console.log('🧹 Component unmounting, cleaning up localStorage...');
        // Only clear if this is not a saved match
        const currentMatchData = matchReq.response;
        if (currentMatchData && (currentMatchData as any).status !== 'saved') {
          localStorage.removeItem(`tennisMatchState_${matchId}`);
        }
      }
    };
  }, [matchId]);

  // Update player names and match settings when match data is loaded
  useEffect(() => {
    if (matchData) {
      // Update player 1
      setPlayer1(prev => ({
        ...prev,
        name: matchData.p1IsObject && typeof matchData.p1 !== 'string' && matchData.p1
          ? `${matchData.p1?.firstName} ${matchData.p1?.lastName}`
          : matchData?.p1Name || "Player 1",
        image: typeof matchData?.p1 !== 'string' && matchData.p1?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        usdta: 19,
        // Don't reset scores for saved matches - they will be restored by resumeMatchWithExistingData
        sets: (matchData as any).status === 'saved' ? prev.sets : 0,
        games: (matchData as any).status === 'saved' ? prev.games : 0,
        points: (matchData as any).status === 'saved' ? prev.points : 0,
        // Don't override server selection if user has already chosen
        isServing: (matchData as any).status === 'saved' ? prev.isServing : (tempServer === 2 ? false : true)
      }));

      // Update player 2
      setPlayer2(prev => ({
        ...prev,
        name: matchData.p2IsObject && typeof matchData.p2 !== 'string' && matchData.p2
          ? `${matchData.p2?.firstName} ${matchData.p2?.lastName}`
          : matchData?.p2Name || "Player 2",
        image: typeof matchData?.p2 !== 'string' && matchData.p2?.avatar || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        usdta: 19,
        // Don't reset scores for saved matches - they will be restored by resumeMatchWithExistingData
        sets: (matchData as any).status === 'saved' ? prev.sets : 0,
        games: (matchData as any).status === 'saved' ? prev.games : 0,
        points: (matchData as any).status === 'saved' ? prev.points : 0,
        // Don't override server selection if user has already chosen
        isServing: (matchData as any).status === 'saved' ? prev.isServing : (tempServer === 2 ? true : false)
      }));

      // Update match settings with enhanced format support
      const matchFormat = matchData.matchFormat || (matchData.matchType ? convertLegacyMatchType(matchData.matchType) : 'bestOfThree');
      const rules = getMatchRules(
        matchFormat,
        matchData.scoringVariation,
        matchData.customTiebreakRules,
        matchData.noAdScoring
      );
      
      setMatch(prev => ({
        ...prev,
        bestOf: matchData.matchType === 'one' ? 1 : matchData.matchType === 'three' ? 3 : matchData.matchType === 'five' ? 5 : 3,
        matchFormat: matchFormat,
        scoringVariation: matchData.scoringVariation,
        customTiebreakRules: matchData.customTiebreakRules,
        noAdScoring: matchData.noAdScoring,
        tieBreakRule: matchData.tieBreakRule || rules.tiebreakRule,
        // Don't reset sets for saved matches - they will be restored by resumeMatchWithExistingData
        sets: (matchData as any).status === 'saved' ? prev.sets : Array.from({ length: rules.maxSets }, () => ({ player1: 0, player2: 0 }))
      }));

      // Check if this is a saved match and set appropriate state
      if ((matchData as any).status === 'saved') {
        // For saved matches, don't show the serving modal or start match button
        setShowServingModal(false);
        setMatchReadyToStart(false);
        
        // Show toast indicating saved match loaded
        toast.success('Saved match loaded! Click "Resume Match" to continue.', {
          duration: 5000,
          icon: '📂',
        });
      } else if ((matchData as any).status === 'pending' || (matchData as any).status === 'confirmed') {
        // For new matches, clear any previous localStorage data and ensure fresh start
        console.log('🆕 New match detected, clearing previous state...');
        
        // Clear localStorage for this match
        localStorage.removeItem(`tennisMatchState_${matchId}`);
        
        // Reset all match state to initial values
        const matchFormat = matchData.matchFormat || (matchData.matchType ? convertLegacyMatchType(matchData.matchType) : 'bestOfThree');
        const rules = getMatchRules(
          matchFormat,
          matchData.scoringVariation,
          matchData.customTiebreakRules,
          matchData.noAdScoring
        );
        
        setMatch(prev => ({
          ...prev,
          currentSet: 0,
          sets: Array.from({ length: rules.maxSets }, () => ({ player1: 0, player2: 0 })),
          games: [{ player1: 0, player2: 0, scores: [] }],
          isTieBreak: false,
          isDeuce: false,
          hasAdvantage: null,
          server: tempServer || 1
        }));
        
        // Reset player scores
        setPlayer1(prev => ({ ...prev, sets: 0, games: 0, points: 0, isServing: tempServer === 2 ? false : true }));
        setPlayer2(prev => ({ ...prev, sets: 0, games: 0, points: 0, isServing: tempServer === 2 ? true : false }));
        
        // Reset game history
        setGameHistory([]);
        setRedoHistory([]);
        
        // Show the serving modal for new match
        setShowServingModal(true);
        setMatchReadyToStart(false);
        
        toast.success('New match started! Select server to begin.', {
          duration: 3000,
          icon: '🎾',
        });
      } else {
        // For other statuses (completed, cancelled, etc.), don't show any modal
        setShowServingModal(false);
        setMatchReadyToStart(false);
      }
    }
  }, [matchData]);
  
  const [player1, setPlayer1] = useState<Player>({
    name: "Player 1",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    usdta: 19,
    sets: 0,
    games: 0,
    points: 0,
    isServing: true
  });

  const [player2, setPlayer2] = useState<Player>({
    name: "Player 2",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    usdta: 19,
    sets: 0,
    games: 0,
    points: 0,
    isServing: false
  });

  const [match, setMatch] = useState<MatchState>({
    bestOf: 3, // Default value, will be updated when matchData loads
    currentSet: 0,
    sets: Array.from({ length: 3 }, () => ({ player1: 0, player2: 0 })), // Default length, will be updated when matchData loads
    games: [{ player1: 0, player2: 0, scores: [] }],
    isTieBreak: false,
    isDeuce: false,
    hasAdvantage: null,
    level: (selectedLevel ? parseInt(selectedLevel) : 1) as 1 | 2 | 3,
    server: null as 1 | 2 | null, // Will be set when user selects server
    // Enhanced format fields with defaults
    matchFormat: 'bestOfThree',
    scoringVariation: 'standard',
    customTiebreakRules: undefined,
    noAdScoring: false,
    tieBreakRule: 7
  });

  const [gameHistory, setGameHistory] = useState<any[]>([]);
  const [redoHistory, setRedoHistory] = useState<any[]>([]);

  // Point tracking state
  const [currentPointData, setCurrentPointData] = useState<PointScore | null>(null);
  const [pointHistory, setPointHistory] = useState<PointScore[]>([]);
  const [currentGameScores, setCurrentGameScores] = useState<PointScore[]>([]);
  const [isSecondService, setIsSecondService] = useState(false);
  const [pointStartTime, setPointStartTime] = useState<number>(Date.now());
  const [lastPointEndTime, setLastPointEndTime] = useState<number>(Date.now());

  const pointToScore = (points: number) => {
    switch (points) {
      case 0: return "0";
      case 1: return "15";
      case 2: return "30";
      case 3: return "40";
      default: return "AD";
    }
  };

  // Get score display considering no-ad scoring
  const getScoreDisplay = (points: number, isNoAd: boolean) => {
    if (isNoAd) {
      // No-ad scoring: just show the point number
      return points.toString();
    } else {
      // Standard scoring
      return pointToScore(points);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Point tracking helper functions
  const startNewPoint = () => {
    console.log('🎯 [startNewPoint] Starting new point:', {
      isSecondService,
      pointStartTime: Date.now()
    });
    
    setPointStartTime(Date.now());
    const currentScore = getCurrentGameScore();
    setCurrentPointData({
      p1Score: currentScore.p1Score,
      p2Score: currentScore.p2Score,
      pointWinner: "playerOne" as "playerOne" | "playerTwo" , // Default, will be set when point is won
      isSecondService: isSecondService,
      p1Reaction: null,
      p2Reaction: null,
      missedShot: null,
      placement: null,
      missedShotWay: null,
      betweenPointDuration: 0,
      type: null,
      rallies: null,
      servePlacement: null,
      courtPosition: null // Set to null for Level 1
    });
    
    console.log('🎯 [startNewPoint] New point data initialized');
  };

  const endPoint = (winner: 1 | 2, pointType: string, additionalData?: Partial<PointScore>) => {
    const pointEndTime = Date.now();
    const betweenPointDuration = Math.floor((pointEndTime - lastPointEndTime) / 1000);
    
    console.log('🎯 [endPoint] Starting point end process:', {
      winner,
      pointType,
      betweenPointDuration,
      currentPointData: currentPointData ? 'exists' : 'null',
      additionalData
    });
    
    if (currentPointData) {
      // Calculate the score after this point is won
      const newP1Points = winner === 1 ? player1.points + 1 : player1.points;
      const newP2Points = winner === 2 ? player2.points + 1 : player2.points;
      
      // Get the score state after this point
      const scoreAfterPoint = getCurrentGameScoreAfterPoint(newP1Points, newP2Points);
      
      const completedPoint: PointScore = {
        ...currentPointData,
        p1Score: scoreAfterPoint.p1Score,
        p2Score: scoreAfterPoint.p2Score,
        type: pointType,
        betweenPointDuration,
        ...additionalData
      };

      // For Level 1, set default reactions and skip reaction modal
      if (match.level === 1) {
        completedPoint.pointWinner = winner === 1 ? "playerOne" : "playerTwo";
        completedPoint.p1Reaction = null;
        completedPoint.p2Reaction = null;   
        completedPoint.missedShot = null;
        completedPoint.placement = null;
        completedPoint.missedShotWay = null;
        completedPoint.servePlacement = null;
        completedPoint.courtPosition = null;
        completedPoint.rallies = null;
        completedPoint.type = null;
        completedPoint.betweenPointDuration = null;
        completedPoint.isSecondService = false; // Simplify for Level 1
      }

      console.log('🎯 [endPoint] Completed point data:', completedPoint);
      console.log('🎯 [endPoint] Court position check:', {
        courtPosition: completedPoint.courtPosition,
        hasCourtPosition: 'courtPosition' in completedPoint,
        additionalData: additionalData
      });
      
      // CRITICAL: Verify courtPosition is present for Level 3
      if (match.level === 3 && !completedPoint.courtPosition) {
        console.error('❌ [endPoint] CRITICAL ERROR: Level 3 point missing courtPosition!', {
          matchLevel: match.level,
          completedPoint,
          additionalData
        });
      }

      // Add to current game scores
      setCurrentGameScores(prev => {
        const newScores = [...prev, completedPoint];
        console.log('🎯 [endPoint] Updated currentGameScores:', {
          previousLength: prev.length,
          newLength: newScores.length,
          newScore: completedPoint,
          allScores: newScores
        });
        return newScores;
      });
      
      // Add to point history
      setPointHistory(prev => {
        const newHistory = [...prev, completedPoint];
        console.log('🎯 [endPoint] Updated pointHistory:', {
          previousLength: prev.length,
          newLength: newHistory.length,
          newScore: completedPoint
        });
        return newHistory;
      });
      
      // Update last point end time
      setLastPointEndTime(pointEndTime);
      
      // For Level 1, keep currentPointData for multiple points per game
      // For other levels, reset current point data
      if (match.level !== 1) {
      setCurrentPointData(null);
      }
      
      // Toggle second service if it was first service
      if (!isSecondService) {
        setIsSecondService(true);
        console.log('🎯 [endPoint] Toggled to second service');
      } else {
        setIsSecondService(false);
        console.log('🎯 [endPoint] Toggled to first service');
      }
      
      console.log('🎯 [endPoint] Point end process completed successfully');
    } else {
      console.error('❌ [endPoint] No currentPointData available!');
    }
  };

  // Convert points to tennis score (0, 15, 30, 40, AD)
  const convertPointsToScore = (points: number): string => {
    switch (points) {
      case 0: return "0";
      case 1: return "15";
      case 2: return "30";
      case 3: return "40";
      default: return "AD";
    }
  };

  // Get current tennis score for both players in the current game
  const getCurrentGameScore = (): { p1Score: string; p2Score: string } => {
    const p1Points = player1.points;
    const p2Points = player2.points;
    
    // If either player has 4+ points and leads by 2, game is over
    if ((p1Points >= 4 && p1Points > p2Points + 1) || (p2Points >= 4 && p2Points > p1Points + 1)) {
      return { p1Score: "0", p2Score: "0" }; // Game over, scores reset
    }
    
    // Handle deuce and advantage
    if (p1Points >= 3 && p2Points >= 3) {
      if (p1Points === p2Points) {
        return { p1Score: "40", p2Score: "40" }; // Deuce
      } else if (p1Points > p2Points) {
        return { p1Score: "AD", p2Score: "40" }; // Player 1 advantage
      } else {
        return { p1Score: "40", p2Score: "AD" }; // Player 2 advantage
      }
    }
    
    // Normal scoring
    return {
      p1Score: convertPointsToScore(p1Points),
      p2Score: convertPointsToScore(p2Points)
    };
  };

  // Get tennis score after a specific point is won
  const getCurrentGameScoreAfterPoint = (p1Points: number, p2Points: number): { p1Score: string; p2Score: string } => {
    // If either player has 4+ points and leads by 2, game is over
    if ((p1Points >= 4 && p1Points > p2Points + 1) || (p2Points >= 4 && p2Points > p1Points + 1)) {
      return { p1Score: "0", p2Score: "0" }; // Game over, scores reset
    }
    
    // Handle deuce and advantage
    if (p1Points >= 3 && p2Points >= 3) {
      if (p1Points === p2Points) {
        return { p1Score: "40", p2Score: "40" }; // Deuce
      } else if (p1Points > p2Points) {
        return { p1Score: "AD", p2Score: "40" }; // Player 1 advantage
      } else {
        return { p1Score: "40", p2Score: "AD" }; // Player 2 advantage
      }
    }
    
    // Normal scoring
    return {
      p1Score: convertPointsToScore(p1Points),
      p2Score: convertPointsToScore(p2Points)
    };
  };

  // Helper function to map zone types to court positions (backend values)
  const zoneTypeToCourtPosition = (zoneType: 'W' | 'B' | 'T' | 'O'): string => {
    switch (zoneType) {
      case 'W': return 'leftCourt'; // Wide zones
      case 'B': return 'middleCourt'; // Back zones  
      case 'T': return 'rightCourt'; // Top zones
      case 'O': return 'out'; // Outfield zones
      default: return 'leftCourt';  // Default to leftCourt
    }
  };

  // Enhanced point tracking for different levels using actual user selections
  const trackPointWithLevel = (winner: 1 | 2, pointType: string, level: 1 | 2 | 3) => {
    console.log('🎯 [trackPointWithLevel] Starting point tracking:', {
      winner,
      pointType,
      level,
      isSecondService,
      selectedRallyLength,
      player1Reaction,
      player2Reaction,
      selectedShotPlacement,
      selectedShotType,
      selectedServePlacement,
      selectedCourtZone
    });

    // Get current point scores for this specific point
    const currentP1Points = player1.points;
    const currentP2Points = player2.points;
    
    // Calculate the score after this point is won
    const newP1Points = winner === 1 ? currentP1Points + 1 : currentP1Points;
    const newP2Points = winner === 2 ? currentP2Points + 1 : currentP2Points;
    
    // Get the score state after this point
    const scoreAfterPoint = getCurrentGameScoreAfterPoint(newP1Points, newP2Points);

    const baseData = {
      p1Score: scoreAfterPoint.p1Score,
      p2Score: scoreAfterPoint.p2Score,
      isSecondService: isSecondService,
      betweenPointDuration: Math.max(1, Math.floor((Date.now() - lastPointEndTime) / 1000)),
      rallies: level === 3 ? (selectedRallyLength || "oneToFour") : null // Only for Level 3
    };

    // Use actual user selections instead of dummy data
    const pointData = {
      pointWinner: winner === 1 ? "playerOne" : "playerTwo",
      p1Reaction: player1Reaction || null,
      p2Reaction: player2Reaction || null,
      missedShot: selectedShotPlacement || null,
      placement: selectedShotPlacement || null,
      missedShotWay: selectedShotType || null,
      type: pointType || null,
      servePlacement: selectedServePlacement || null, // Use selected serve placement from zone click
      courtPosition: level === 3 ? 
                   (selectedCourtZone ? zoneTypeToCourtPosition(selectedCourtZone.type) : "leftCourt") : 
                   null // Always provide court position for Level 3, null for other levels
    };

    console.log('🎯 [trackPointWithLevel] Prepared point data:', {
      baseData,
      pointData,
      combinedData: { ...baseData, ...pointData },
      courtPosition: pointData.courtPosition,
      selectedCourtZone: selectedCourtZone,
      zoneType: selectedCourtZone?.type,
      level,
      finalCourtPosition: pointData.courtPosition,
      levelCheck: level === 3 ? 'LEVEL 3 DETECTED' : `Level ${level}`,
      courtPositionLogic: level === 3 ? 
        (selectedCourtZone ? `Zone clicked: ${selectedCourtZone.type} -> ${zoneTypeToCourtPosition(selectedCourtZone.type)}` : 'No zone -> Default leftCourt') : 
        'Not Level 3 -> undefined'
    });

    // Create the completed point data directly instead of relying on currentPointData
    const completedPoint: PointScore = {
        ...baseData,
        ...pointData,
        pointWinner: winner === 1 ? "playerOne" : "playerTwo" as "playerOne" | "playerTwo"
    };

    // Add to current game scores
    setCurrentGameScores(prev => {
      const newScores = [...prev, completedPoint];
      console.log('🎯 [trackPointWithLevel] Updated currentGameScores:', {
        previousLength: prev.length,
        newLength: newScores.length,
        newScore: completedPoint,
        allScores: newScores
      });
      return newScores;
    });
    
    // Add to point history
    setPointHistory(prev => {
      const newHistory = [...prev, completedPoint];
      console.log('🎯 [trackPointWithLevel] Updated pointHistory:', {
        previousLength: prev.length,
        newLength: newHistory.length,
        newScore: completedPoint
      });
      return newHistory;
    });
    
    // Update last point end time
    setLastPointEndTime(Date.now());
    
    // Toggle second service if it was first service
    if (!isSecondService) {
      setIsSecondService(true);
      console.log('🎯 [trackPointWithLevel] Toggled to second service');
    } else {
      setIsSecondService(false);
      console.log('🎯 [trackPointWithLevel] Toggled to first service');
    }
    
    console.log('🎯 [trackPointWithLevel] Point tracking completed successfully');
  };




  // All possible point outcomes for reference
  const allPointOutcomes = [
    { type: 'ace', label: 'Ace', icon: '🎯' },
    { type: 'fault', label: 'Fault', icon: '❌' },
    { type: 'p1Winner', label: 'Player 1 Winner', icon: '🏆' },
    { type: 'p2Winner', label: 'Player 2 Winner', icon: '🏆' },
    { type: 'p1UnforcedError', label: 'Player 1 Unforced Error', icon: '❌' },
    { type: 'p2UnforcedError', label: 'Player 2 Unforced Error', icon: '❌' },
    { type: 'p1ForcedError', label: 'Player 1 Forced Error', icon: '⏱️' },
    { type: 'p2ForcedError', label: 'Player 2 Forced Error', icon: '⏱️' },
    { type: 'doubleFault', label: 'Double Fault', icon: '⚠️' },
    { type: 'returnWinner', label: 'Return Winner', icon: '🔥' },
    { type: 'returnError', label: 'Return Error', icon: '❌' },
    { type: 'forcedError', label: 'Forced Error', icon: '⏱️' },
    { type: 'forcedReturnError', label: 'Forced Return Error', icon: '⏱️' }
  ];

  // Function to get contextually relevant point outcomes based on who is serving and winner
  const getContextualPointOutcomes = (winner: 1 | 2) => {
    if (player1.isServing) {
      if (winner === 1) {
        // Player 1 is serving and wins - show serving-related wins
        return allPointOutcomes.filter(outcome => 
          ['ace', 'p1Winner', 'p2UnforcedError', 'p2ForcedError'].includes(outcome.type)
        );
      } else {
        // Player 1 is serving but Player 2 wins - show return-related wins
        return allPointOutcomes.filter(outcome => 
          ['returnWinner', 'p1UnforcedError', 'p1ForcedError'].includes(outcome.type)
        );
      }
    } else if (player2.isServing) {
      if (winner === 2) {
        // Player 2 is serving and wins - show serving-related wins
        return allPointOutcomes.filter(outcome => 
          ['ace', 'p2Winner', 'p1UnforcedError', 'p1ForcedError'].includes(outcome.type)
        );
      } else {
        // Player 2 is serving but Player 1 wins - show return-related wins
        return allPointOutcomes.filter(outcome => 
          ['returnWinner', 'p2UnforcedError', 'p2ForcedError'].includes(outcome.type)
        );
      }
    } else {
      // Fallback if neither player is marked as serving
      return allPointOutcomes;
    }
  };

  // Get current contextual point outcomes - will be updated when winner is determined
  const [pointOutcomes, setPointOutcomes] = useState(() => 
    getContextualPointOutcomes(1) // Default to Player 1 winning
  );

  // Check if match is complete using enhanced format rules
  const isMatchComplete = () => {
    const rules = getMatchRules(
      match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
      match.scoringVariation,
      match.customTiebreakRules,
      match.noAdScoring
    );
    
    return isMatchCompleteUtil(match.sets, rules);
  };
  
  const playerReactions = [
    { type: 'negativeResponse', label: 'Negative Response', icon: '😠' },
    { type: 'positiveResponse', label: 'Positive Response', icon: '😊' },
    { type: 'negativeSelfTalk', label: 'Negative Self Talk', icon: '😞' },
    { type: 'positiveSelfTalk', label: 'Positive Self Talk', icon: '💪' },
    { type: 'noResponse', label: 'No Response', icon: '😐' }
  ];



  const shotPlacements: ShotPlacement[] = [
    { type: 'net', label: 'Net' },
    { type: 'long', label: 'Long' },
    { type: 'wide', label: 'Wide' }
  ];



  const shotTypes: ShotType[] = [
    { type: 'forehand', label: 'Forehand' },
    { type: 'backhand', label: 'Backhand' },
            { type: 'volley', label: 'Volley' },
    { type: 'forehandSlice', label: 'Forehand Slice' },
    { type: 'backhandSlice', label: 'Backhand Slice' },
    { type: 'overhead', label: 'Overhead' },
    { type: 'forehandDropShot', label: 'Forehand Drop Shot' },
    
    { type: 'backhandDropShot', label: 'Backhand Drop Shot' }
  ];

  const rallyLengths: RallyLength[] = [
    { type: 'oneToFour', label: '1-4' },
    { type: 'fiveToEight', label: '5-8' },
    { type: 'nineToTwelve', label: '9-12' },
    { type: 'thirteenToTwenty', label: '13-20' },
    { type: 'twentyOnePlus', label: '21+' }
  ];



  // Court zones for Level 3 (6 zones per side, vertical stacked layout: W|B|T|T|B|W)
  const courtZones: CourtZone[] = [
    // Player 1 zones (left side) - 6 vertical zones stacked: W|B|T|T|B|W
    { id: 'p1_w1', label: 'Wide 1', x: 310, y: 40, width: 240, height: 86, player: 1, type: 'W' },
    { id: 'p1_b1', label: 'Back 1', x: 310, y: 126, width: 240, height: 86, player: 1, type: 'B' },
    { id: 'p1_t1', label: 'Top 1', x: 310, y: 212, width: 240, height: 86, player: 1, type: 'T' },
    { id: 'p1_t2', label: 'Top 2', x: 310, y: 298, width: 240, height: 86, player: 1, type: 'T' },
    { id: 'p1_b2', label: 'Back 2', x: 310, y: 384, width: 240, height: 86, player: 1, type: 'B' },
    { id: 'p1_w2', label: 'Wide 2', x: 310, y: 470, width: 240, height: 86, player: 1, type: 'W' },
    
    // Player 2 zones (right side) - 6 vertical zones stacked: W|B|T|T|B|W
    { id: 'p2_w1', label: 'Wide 1', x: 630, y: 40, width: 240, height: 86, player: 2, type: 'W' },
    { id: 'p2_b1', label: 'Back 1', x: 630, y: 126, width: 240, height: 86, player: 2, type: 'B' },
    { id: 'p2_t1', label: 'Top 1', x: 630, y: 212, width: 240, height: 86, player: 2, type: 'T' },
    { id: 'p2_t2', label: 'Top 2', x: 630, y: 298, width: 240, height: 86, player: 2, type: 'T' },
    { id: 'p2_b2', label: 'Back 2', x: 630, y: 384, width: 240, height: 86, player: 2, type: 'B' },
    { id: 'p2_w2', label: 'Wide 2', x: 630, y: 470, width: 240, height: 86, player: 2, type: 'W' }
    
    // Note: Outfield zones are now handled directly in the SVG for better visual coverage
  ];

  const checkGameWinner = (p1Points: number, p2Points: number) => {
    if (match.isTieBreak) {
      // Get the correct tiebreak rule for current set
      const rules = getMatchRules(
        match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
        match.scoringVariation,
        match.customTiebreakRules,
        match.noAdScoring
      );
      const tiebreakRule = getTiebreakRuleForSet(match.currentSet + 1, rules, match.matchFormat || 'bestOfThree');
      
      const winner = (p1Points >= tiebreakRule && p1Points - p2Points >= 2) ? 1 : 
             (p2Points >= tiebreakRule && p2Points - p1Points >= 2) ? 2 : null;
      return winner;
    }
    
    // Check for game win based on no-ad scoring rules
    const rules = getMatchRules(
      match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
      match.scoringVariation,
      match.customTiebreakRules,
      match.noAdScoring
    );
    
    if (rules.noAdScoring) {
      // No-ad scoring: first to 4 points wins (no advantage)
      if (p1Points >= 4 && p1Points > p2Points) {
        return 1;
      }
      if (p2Points >= 4 && p2Points > p1Points) {
        return 2;
      }
    } else {
      // Standard scoring: 4+ points with 2+ point lead
      if (p1Points >= 4 && p1Points - p2Points >= 2) {
        return 1;
      }
      if (p2Points >= 4 && p2Points - p1Points >= 2) {
        return 2;
      }
    }
    
    return null;
  };

  const checkSetWinner = (p1Games: number, p2Games: number) => {
    if (match.isTieBreak) {
      const winner = (p1Games >= 7 && p1Games - p2Games >= 2) ? 1 : 
             (p2Games >= 7 && p2Games - p1Games >= 2) ? 2 : null;
      return winner;
    }
    
    const winner = (p1Games >= 6 && p1Games - p2Games >= 2) ? 1 : 
           (p2Games >= 6 && p2Games - p1Games >= 2) ? 2 : null;
    return winner;
  };

  const checkMatchWinner = (p1Sets: number, p2Sets: number) => {
    const rules = getMatchRules(
      match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
      match.scoringVariation,
      match.customTiebreakRules,
      match.noAdScoring
    );
    
    return p1Sets >= rules.setsToWin ? 1 : p2Sets >= rules.setsToWin ? 2 : null;
  };

  const switchServer = () => {
    setPlayer1(prev => ({ ...prev, isServing: !prev.isServing }));
    setPlayer2(prev => ({ ...prev, isServing: !prev.isServing }));
    // Update match.server state
    setMatch(prev => ({ ...prev, server: prev.server === 1 ? 2 : 1 }));
  };

  const selectServer = (playerNumber: 1 | 2) => {
    if (playerNumber === 1) {
      setPlayer1(prev => ({ ...prev, isServing: true }));
      setPlayer2(prev => ({ ...prev, isServing: false }));
    } else {
      setPlayer1(prev => ({ ...prev, isServing: false }));
            setPlayer2(prev => ({ ...prev, isServing: true }));
    }
    setMatch(prev => ({ 
      ...prev, 
      server: playerNumber,
      games: [{ player1: 0, player2: 0, scores: [] }], // Ensure games array is initialized
      currentSet: 0,
      sets: [{ player1: 0, player2: 0 }]
    }));
    setShowServingModal(false);
    setTempServer(null);
    setMatchReadyToStart(true); // Show Start Match button
    setIsGameRunning(false); // Match hasn't started yet
    // For Level 3, initialize point as active
    if (match.level === 3) {
      setIsPointActive(true);
    }
    
    // Show success toast
    const serverName = playerNumber === 1 ? player1.name : player2.name;
    toast.success(`${serverName} selected as server! 🎾`, {
      duration: 3000,
      icon: '🎯',
    });
    
    // Save state after selecting server
    setTimeout(() => saveMatchState(), 100);
  };
  const [servingPosition, setServingPosition] = useState<'up' | 'down'>('up');
  const [courtRotation, setCourtRotation] = useState<0 | 1>(0); // 0 = normal, 1 = rotated
  const [showServingModal, setShowServingModal] = useState(true);
  const [tempServer, setTempServer] = useState<1 | 2 | null>(null);
  const [matchReadyToStart, setMatchReadyToStart] = useState(false);
  const [gameTime, setGameTime] = useState(0);
  const [inBetweenTime, setInBetweenTime] = useState(0);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPointActive, setIsPointActive] = useState(false);
  const [player1InBetweenTime, setPlayer1InBetweenTime] = useState(0);
  const [player2InBetweenTime, setPlayer2InBetweenTime] = useState(0);
  const [showPointOutcomeModal, setShowPointOutcomeModal] = useState(false);
  const [lastPointWinner, setLastPointWinner] = useState<1 | 2 | null>(null);
  const [selectedPointOutcome, setSelectedPointOutcome] = useState<string | null>(null);
  const [player1Reaction, setPlayer1Reaction] = useState<string | null>(null);
  const [player2Reaction, setPlayer2Reaction] = useState<string | null>(null);
  
  // Level 3 state
  const [faultCount, setFaultCount] = useState(0); // 0, 1, 2
  const [showLevel3Modal, setShowLevel3Modal] = useState(false);
  const [level3ModalType, setLevel3ModalType] = useState<'point_outcome' | 'shot_details' | 'reaction' | 'return_error_choice' | 'ball_in_court' | null>(null);
  const [selectedCourtZone, setSelectedCourtZone] = useState<CourtZone | null>(null);
  const [selectedShotPlacement, setSelectedShotPlacement] = useState<string | null>(null);
  const [selectedShotType, setSelectedShotType] = useState<string | null>(null);
  const [selectedRallyLength, setSelectedRallyLength] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [selectedBallOutcome, setSelectedBallOutcome] = useState<string | null>(null);
  const [selectedShotWay, setSelectedShotWay] = useState<string | null>(null);
  const [selectedMissedShot, setSelectedMissedShot] = useState<string | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(null);
  const [isForcedError, setIsForcedError] = useState<boolean | null>(null);
  const [selectedServePlacement, setSelectedServePlacement] = useState<string | null>(null); // Track serve placement: W->wide, B->body, T->t

  
  // Note-taking state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [notes, setNotes] = useState<Array<{id: string, content: string, timestamp: string}>>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Winners modal state
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [matchWinner, setMatchWinner] = useState<1 | 2 | null>(null);

  // Info modal state
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Update point outcomes when serving player changes
  useEffect(() => {
    // Only update if we have a last point winner (meaning we're in a point outcome selection)
    if (lastPointWinner) {
      const contextualOutcomes = getContextualPointOutcomes(lastPointWinner);
      setPointOutcomes(contextualOutcomes);
    }
  }, [player1.isServing, player2.isServing, lastPointWinner]);

  // Save match state to localStorage
  const saveMatchState = () => {
    
    const matchState = {
      player1,
      player2,
      match,
      servingPosition,
      courtRotation,
      showServingModal: false,
      matchReadyToStart: false,
      gameTime,
      inBetweenTime,
      player1InBetweenTime,
      player2InBetweenTime,
      isGameRunning,
      isPointActive,
      notes,
      showPointOutcomeModal: false,
      lastPointWinner: null,
      selectedPointOutcome: null,
      player1Reaction: null,
      player2Reaction: null,
      showWinnersModal: false,
      matchWinner: null,
      showInfoModal: false,
      gameHistory,
      redoHistory
    };
    localStorage.setItem('tennisMatchState', JSON.stringify(matchState));
    
    // Show auto-save toast (only for important saves, not every point)
  
  };

  // Save match progress to API
  const saveMatchProgressToAPI = async () => {
    if (!matchId || !matchData) return;

    // Save current game scores to game history before saving
    if (currentGameScores.length > 0) {
      const currentGameScore: GameScore = {
        gameNumber: match.games[match.currentSet]?.player1 + match.games[match.currentSet]?.player2 + 1,
        scores: currentGameScores,
        server: match.server === 1 ? "playerOne" : match.server === 2 ? "playerTwo" : "playerOne"
      };
      
      setGameHistory(prev => [...prev, currentGameScore]);
      setCurrentGameScores([]);
      
      // Start new point for next game
      startNewPoint();
    }

    // Show loading toast
    const loadingToast = toast.loading('Saving match progress...', {
      duration: Infinity,
    });

    try {
      const trackingLevel = `level${match.level}` as "level1" | "level2" | "level3";
      
              // Convert match state to API format with actual point data (SAVE PROGRESS)
        const apiData: SaveMatchProgressRequest = {
          trackingLevel,
          sets: match.sets.map((set, setIndex) => {
            // Get games for this set from game history
            const setGames = gameHistory.filter(game => {
              // Calculate which set this game belongs to based on game numbers
              const totalGamesBeforeSet = setIndex === 0 ? 0 : 
                match.sets.slice(0, setIndex).reduce((sum, s) => sum + s.player1 + s.player2, 0);
              return game.gameNumber > totalGamesBeforeSet && 
                     game.gameNumber <= totalGamesBeforeSet + set.player1 + set.player2;
            });

            return {
              p1TotalScore: set.player1,
              p2TotalScore: set.player2,
              games: setGames.length > 0 ? setGames.map(game => ({
                ...game,
                scores: (() => {
                  // For Level 1, duplicate the last point and only send essential data
                  if (match.level === 1) {
                    const mappedScores = game.scores.map((score: any) => ({
                      p1Score: score.p1Score,
                      p2Score: score.p2Score,
                      pointWinner: score.pointWinner,
                      isSecondService: score.isSecondService
                    }));
                    
                                      // Duplicate the last point if there are scores
                  if (mappedScores.length > 0) {
                    const lastScore = mappedScores[mappedScores.length - 1];
                    mappedScores.push({ ...lastScore });
                    console.log('🎯 [saveMatchProgressToAPI] Duplicated last point for Level 1:', lastScore);
                  }
                  
                  return mappedScores;
                } else {
                  // For Level 2 & 3, send all data and duplicate last point
                  const mappedScores = game.scores.map((score: any) => score);
                  
                  // Duplicate the last point if there are scores
                  if (mappedScores.length > 0) {
                    const lastScore = mappedScores[mappedScores.length - 1];
                    mappedScores.push({ ...lastScore });
                    console.log('🎯 [saveMatchProgressToAPI] Duplicated last point for Level 2/3:', lastScore);
                  }
                    
                    return mappedScores;
                  }
                })()
              })) : []
            };
          })
        };

      const response = await saveMatchProgress(matchId, apiData);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (response.success) {
        toast.success('Match progress saved successfully! 🎾', {
          duration: 4000,
          icon: '💾',
        });
        console.log('Match progress saved successfully');
      } else {
        toast.error(`Failed to save match progress: ${response.error || 'Unknown error'}`, {
          duration: 5000,
        });
        console.error('Failed to save match progress:', response.error);
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      toast.error('Error saving match progress. Please try again.', {
        duration: 5000,
      });
      console.error('Error saving match progress:', error);
    }
  };

  // Submit final match result to API
  const submitMatchResultToAPI = async () => {
    console.log('🎯 [submitMatchResultToAPI] Starting API submission...');
    
    // Check if match is complete before allowing submission
    if (!isMatchComplete()) {
      const rules = getMatchRules(
        match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
        match.scoringVariation,
        match.customTiebreakRules,
        match.noAdScoring
      );
      
      const p1Sets = match.sets.filter(set => set.player1 > set.player2).length;
      const p2Sets = match.sets.filter(set => set.player2 > set.player1).length;
      
      toast.error(`Cannot submit incomplete match! Need ${rules.setsToWin} sets to win. P1: ${p1Sets}, P2: ${p2Sets}`, {
        duration: 5000,
        icon: '⚠️',
      });
      
      console.warn('⚠️ [submitMatchResultToAPI] Attempted to submit incomplete match:', {
        matchFormat: match.matchFormat,
        rules,
        p1Sets,
        p2Sets
      });
      return;
    }
    
    console.log('🎯 [submitMatchResultToAPI] Current state:', {
      matchId,
      matchData: matchData ? 'exists' : 'null',
      currentGameScoresLength: currentGameScores.length,
      currentGameScores,
      gameHistoryLength: gameHistory.length,
      gameHistory,
      matchLevel: match.level,
      gameTime
    });
    
    if (!matchId || !matchData) {
      console.error('❌ [submitMatchResultToAPI] Missing matchId or matchData');
      return;
    }

    // Save current game scores to game history before submitting
    if (currentGameScores.length > 0) {
      const finalGameScore: GameScore = {
        gameNumber: match.games[match.currentSet]?.player1 + match.games[match.currentSet]?.player2 + 1,
        scores: currentGameScores,
        server: match.server === 1 ? "playerOne" : match.server === 2 ? "playerTwo" : "playerOne"
      };
      
      console.log('🎯 [submitMatchResultToAPI] Saving final game score:', finalGameScore);
      
      setGameHistory(prev => {
        const newHistory = [...prev, finalGameScore];
        console.log('🎯 [submitMatchResultToAPI] Updated gameHistory:', {
          previousLength: prev.length,
          newLength: newHistory.length,
          finalGameScore
        });
        return newHistory;
      });
      setCurrentGameScores([]);
      console.log('🎯 [submitMatchResultToAPI] Reset currentGameScores');
      
      // Wait a moment for state update to complete before proceeding
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      console.warn('⚠️ [submitMatchResultToAPI] No currentGameScores to save');
    }

    // Show loading toast
    const loadingToast = toast.loading('Submitting match result...', {
      duration: Infinity,
    });

    try {
      const trackingLevel = `level${match.level}` as "level1" | "level2" | "level3";
      
      // Convert match state to API format with actual point data
      console.log('🎯 [submitMatchResultToAPI] Preparing API data...');
      
      // Helper function to convert rally formats
      const convertRallyFormat = (rally: string): string => {
        switch (rally) {
          case '1-4':
            return 'oneToFour';
          case '5-8':
            return 'fiveToEight';
          case '9-12':
            return 'nineToTwelve';
          case '13-20':
            return 'thirteenToTwenty';
          case '21+':
            return 'twentyOnePlus';
          // Already correct formats
          case 'oneToFour':
          case 'fiveToEight':
          case 'nineToTwelve':
          case 'thirteenToTwenty':
          case 'twentyOnePlus':
            return rally;
          default:
            return 'oneToFour'; // Default fallback
        }
      };

      // Helper function to convert point types
      const convertPointType = (type: string): string => {
        switch (type) {
          // Direct mappings for correct types
          case 'ace':
          case 'fault':
          case 'p1Winner':
          case 'p2Winner':
          case 'p1UnforcedError':
          case 'p2UnforcedError':
          case 'p1ForcedError':
          case 'p2ForcedError':
          case 'doubleFault':
          case 'returnWinner':
          case 'returnError':
          case 'forcedError':
          case 'forcedReturnError':
            return type;
          
          // Convert old/incorrect formats
          case 'return_winner':
            return 'returnWinner';
          case 'return_error':
            return 'returnError';
          case 'forced_error':
            return 'forcedError';
          case 'forced_return_error':
            return 'forcedReturnError';
          case 'double_fault':
            return 'doubleFault';
          case 'winner':
            return 'p1Winner'; // Default to p1Winner for generic 'winner'
          case 'service_winner':
            return 'ace'; // Convert service_winner to ace
          case 'return_unforced_error':
            return 'p2UnforcedError'; // Assuming return error by opponent
          case 'return_forcing_shot':
            return 'returnWinner';
          case 'in_play_neutral':
            return 'p1Winner'; // Default fallback
          
          default:
            return 'ace'; // Safe fallback
        }
      };
      
      const apiData: SubmitMatchResultRequest = {
        trackingLevel,
        totalGameTime: gameTime, // Total game time in seconds
        sets: match.sets.map((set, setIndex) => {
                    // For 1-set matches, use all games from gameHistory
          // For multi-set matches, filter games based on set boundaries
          let setGames;
          if (match.sets.length === 1) {
            // Single set match - use all games from gameHistory, but filter to only include actual game objects
            setGames = gameHistory.filter(game => 
              game && 
              typeof game === 'object' && 
              'gameNumber' in game && 
              'scores' in game && 
              'server' in game
            );
          } else {
            // Multi-set match - filter games based on set boundaries
            const totalGamesBeforeSet = setIndex === 0 ? 0 : 
              match.sets.slice(0, setIndex).reduce((sum, s) => sum + s.player1 + s.player2, 0);
            setGames = gameHistory.filter(game => {
              return game && 
                     typeof game === 'object' && 
                     'gameNumber' in game && 
                     'scores' in game && 
                     'server' in game &&
                     game.gameNumber > totalGamesBeforeSet && 
                   game.gameNumber <= totalGamesBeforeSet + set.player1 + set.player2;
          });
          }

          console.log(`🎯 [submitMatchResultToAPI] Set ${setIndex} processing:`, {
            set,
            setGamesLength: setGames.length,
            setGames,
            totalGamesBeforeSet: setIndex === 0 ? 0 : 
              match.sets.slice(0, setIndex).reduce((sum, s) => sum + s.player1 + s.player2, 0)
          });

                      return {
              p1TotalScore: set.player1,
              p2TotalScore: set.player2,
            games: setGames.length > 0 ? setGames.map(game => ({
              ...game,
              scores: (() => {
                // For Level 1, duplicate the last point and only send essential data
                if (match.level === 1) {
                  const mappedScores = game.scores.map((score: any) => ({
                    p1Score: score.p1Score,
                    p2Score: score.p2Score,
                    pointWinner: score.pointWinner,
                    isSecondService: score.isSecondService
                  }));
                  
                  // Duplicate the last point if there are scores
                  if (mappedScores.length > 0) {
                    const lastScore = mappedScores[mappedScores.length - 1];
                    mappedScores.push({ ...lastScore });
                    console.log('🎯 [submitMatchResultToAPI] Duplicated last point for Level 1:', lastScore);
                  }
                  
                  return mappedScores;
                } else {
                  // For Level 2 & 3, send all data and duplicate last point
                  const mappedScores = game.scores.map((score: any) => ({
                ...score,
                type: convertPointType(score.type),
                rallies: match.level === 3 ? convertRallyFormat(score.rallies) : score.rallies
                  }));
                  
                  // Duplicate the last point if there are scores
                  if (mappedScores.length > 0) {
                    const lastScore = mappedScores[mappedScores.length - 1];
                    mappedScores.push({ ...lastScore });
                    console.log('🎯 [submitMatchResultToAPI] Duplicated last point for Level 2/3:', lastScore);
                  }
                  
                  return mappedScores;
                }
              })()
            })) : []
            };
        })
      };

      console.log('🎯 [submitMatchResultToAPI] Final API data prepared:', apiData);

      const response = await submitMatchResult(matchId, apiData);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      if (response.success) {
        toast.success('Match result submitted successfully! 🏆', {
          duration: 4000,
          icon: '🎯',
        });
        console.log('Match result submitted successfully');
        // Navigate back to matches list
        navigate('/admin/matchs');
      } else {
        toast.error(`Failed to submit match result: ${response.error || 'Unknown error'}`, {
          duration: 5000,
        });
        console.error('Failed to submit match result:', response.error);
      }
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      toast.error('Error submitting match result. Please try again.', {
        duration: 5000,
      });
      console.error('Error submitting match result:', error);
    }
  };

  // Load match state from localStorage
  const loadMatchState = () => {
    const savedState = localStorage.getItem('tennisMatchState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setPlayer1(parsedState.player1);
        setPlayer2(parsedState.player2);
        // Ensure games array is properly initialized
        const matchData = parsedState.match;
        if (!matchData.games || matchData.games.length === 0) {
          matchData.games = [{ player1: 0, player2: 0 }];
        }
        if (!matchData.sets || matchData.sets.length === 0) {
          matchData.sets = [{ player1: 0, player2: 0 }];
        }
        if (matchData.currentSet === undefined) {
          matchData.currentSet = 0;
        }
        
        setMatch(matchData);
        setServingPosition(parsedState.servingPosition);
        setCourtRotation(parsedState.courtRotation || 0);
        setGameHistory(parsedState.gameHistory || []);
        setRedoHistory(parsedState.redoHistory || []);
        setShowServingModal(false);
        setMatchReadyToStart(false);
        // Reset game time to 0 for new games - don't load previous time
        setGameTime(0);
        setInBetweenTime(parsedState.inBetweenTime || 0);
        setPlayer1InBetweenTime(parsedState.player1InBetweenTime || 0);
        setPlayer2InBetweenTime(parsedState.player2InBetweenTime || 0);
        // Don't auto-start the game when loading state - user must explicitly start
        setIsGameRunning(false);
        setIsPointActive(parsedState.isPointActive || false);
        
        // Show match loaded toast
        toast.success('Previous match state loaded! 📂', {
          duration: 3000,
          icon: '📂',
        });
        setNotes(parsedState.notes && parsedState.notes.length > 0 ? parsedState.notes : []);
        setShowPointOutcomeModal(false);
        setLastPointWinner(null);
        setSelectedPointOutcome(null);
        setPlayer1Reaction(null);
        setPlayer2Reaction(null);
        setShowWinnersModal(false);
        setMatchWinner(null);
        setShowInfoModal(false);
        return true;
      } catch (error) {
        console.error('Error loading match state:', error);
        localStorage.removeItem('tennisMatchState');
      }
    }
    return false;
  };

  // Load state on component mount
  useEffect(() => {
    const hasLoadedState = loadMatchState();
    
    // Check if level was selected in match_details via URL parameter
    const levelFromUrl = searchParams.get('level');
    console.log('🎯 [Debug] Level from URL:', levelFromUrl);
    
    if (levelFromUrl) {
      const level = parseInt(levelFromUrl);
      console.log('🎯 [Debug] Parsed level:', level);
      if (level === 1 || level === 2 || level === 3) {
        console.log('🎯 [Debug] Setting match level to:', level);
        setMatch(prev => ({ ...prev, level }));
      }
    }
    
    // Clear any previous session storage for net state
    sessionStorage.removeItem('ballInCourtChoice');
    sessionStorage.removeItem('cameFromModal');
    
    // Reset selections
    setSelectedOutcome(null);
    setSelectedRallyLength(null);
    setCourtRotation(0);
    setInBetweenTime(0);
    setGameTime(0); // Always reset game time to 0 on component mount
    setIsPointActive(false);
    setShowInfoModal(false);
    // Note: player1InBetweenTime and player2InBetweenTime are NOT reset to keep records
    // Note: notes are NOT reset to keep existing notes
    
    if (!hasLoadedState) {
      setShowServingModal(true);
    } else if (match.server === null) {
      // If state was loaded but no server was set, show serving modal
      setShowServingModal(true);
    }
  }, [searchParams]);



  // Timer effect for game time
  useEffect(() => {
    let interval: number;
    
    if (isGameRunning) {
      interval = setInterval(() => {
        setGameTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isGameRunning]);

  // Timer effect for in-between time (Level 3 only)
  useEffect(() => {
    let interval: number;
    
    if (match.level === 3 && !isPointActive && isGameRunning) {
      interval = setInterval(() => {
        setInBetweenTime(prev => prev + 1);
        // Track in-between time for the current server
        if (player1.isServing) {
          setPlayer1InBetweenTime(prev => prev + 1);
        } else {
          setPlayer2InBetweenTime(prev => prev + 1);
        }
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [match.level, isPointActive, player1.isServing, player2.isServing, isGameRunning]);

  // Cleanup effect for modals
  useEffect(() => {
    return () => {
      // Close all modals when component unmounts
      setShowInfoModal(false);
      setShowWinnersModal(false);
      setShowServingModal(false);
      setShowPointOutcomeModal(false);
    };
  }, []);

  // Monitor level changes
  useEffect(() => {
    console.log('🎯 [Debug] Match level changed to:', match.level);
  }, [match.level]);




  // Level 3 court zone click handler
  // NEW LOGIC: All zones are clickable. When server clicks their own field, opponent wins.
  // When server clicks opponent's field, server wins. This tracks serve placement and shot placement.
  const handleCourtZoneClick = (zone: CourtZone) => {
    setSelectedCourtZone(zone);
    
    // Check if we're in "ball in court" mode
    const hasChosenBallInCourt = sessionStorage.getItem('ballInCourtChoice') === 'true';
    
    if (hasChosenBallInCourt) {
      // In ball in court mode - show ball in court modal
      setLevel3ModalType('ball_in_court');
      setShowLevel3Modal(true);
      
      // Set the winner based on which side was clicked
      // Green side (Player 1) clicked means Blue (Player 2) wins
      // Blue side (Player 2) clicked means Green (Player 1) wins
      const winner = zone.player === 1 ? 2 : 1;
      setLastPointWinner(winner);
      
      // Set ball placement based on zone type (W/B/T)
      setSelectedShotPlacement(zone.type === 'W' ? 'wide' : zone.type === 'B' ? 'long' : 'short');
      
      // Set default selections
      setSelectedOutcome('winner');
      setSelectedRallyLength('1-4');
      
      // Set flag that user came from modal
      sessionStorage.setItem('cameFromModal', 'true');
    } else {
      // Normal mode - determine winner based on who is serving and which field was clicked
      const currentServer = player1.isServing ? 1 : 2;
      const isServerClickingOwnField = currentServer === zone.player;
      
      console.log('🎯 [Court Click] Debug info:', {
        courtRotation,
        matchServer: match.server,
        currentServer,
        zonePlayer: zone.player,
        isServerClickingOwnField,
        player1Serving: player1.isServing,
        player2Serving: player2.isServing
      });
      
      if (isServerClickingOwnField) {
        // Server clicked their own field - opponent wins the point
        const opponent = currentServer === 1 ? 2 : 1;
        setLastPointWinner(opponent);
        console.log('🎯 [Court Click] Server clicked own field, opponent wins:', opponent);
        
        // Set serve placement based on zone type (W/B/T) for first serve
        if (faultCount === 0) {
          let placement = 't';
          if (zone.type === 'W') placement = 'wide';
          else if (zone.type === 'B') placement = 'body';
          setSelectedServePlacement(placement);
        }
      } else {
        // Server clicked opponent's field - don't set winner yet, let user choose outcome
        // The winner will be determined based on the selected outcome (ace, return winner, return error)
        console.log('🎯 [Court Click] Server clicked opponent field - winner will be determined by outcome selection');
        
        // Set serve placement based on zone type (W/B/T) for first serve
        if (faultCount === 0) {
          let placement = 't';
          if (zone.type === 'W') placement = 'wide';
          else if (zone.type === 'B') placement = 'body';
          setSelectedServePlacement(placement);
        }
      }
      
      // Set flag that user came from modal
      sessionStorage.setItem('cameFromModal', 'true');
    
      // Show Level 3 modal based on context
      if (faultCount === 2) {
        // Double fault - show point outcome modal
        setLevel3ModalType('point_outcome');
        setShowLevel3Modal(true);
      } else {
        // Show point outcome modal for all other cases
        setLevel3ModalType('point_outcome');
        setShowLevel3Modal(true);
      }
    }
  };

  // Level 3 net click handler
  const handleNetClick = (player: 1 | 2) => {
    // Check if we're in "ball in court" mode
    const hasChosenBallInCourt = sessionStorage.getItem('ballInCourtChoice') === 'true';
    
    if (hasChosenBallInCourt) {
      // In ball in court mode - show ball in court modal
      setLevel3ModalType('ball_in_court');
      setShowLevel3Modal(true);
      
      // Set the winner based on which net was clicked
      // Green net (Player 1) clicked means Blue (Player 2) wins
      // Blue net (Player 2) clicked means Green (Player 1) wins
      const winner = player === 1 ? 2 : 1;
      setLastPointWinner(winner);
      
      // Set default selections
      setSelectedOutcome('winner');
      setSelectedRallyLength('1-4');
      
      // Set flag that user came from modal
      sessionStorage.setItem('cameFromModal', 'true');
    }
  };

  // Level 3 fault button handler
  const handleFaultClick = () => {
    if (faultCount === 0) {
      setFaultCount(1);
      // Keep serve placement for first fault (first serve)
    } else if (faultCount === 1) {
      setFaultCount(2);
      // Clear serve placement for second fault (second serve)
      setSelectedServePlacement(null);
      
      // Double fault - the non-serving player gets the point
      const nonServingPlayer = player1.isServing ? 2 : 1;
      
      // Reset fault count
      setFaultCount(0);
      
      // Set flag that user came from modal
      sessionStorage.setItem('cameFromModal', 'true');
      
      // Show player reaction modal for double fault - point will be added after modal closes
      setLastPointWinner(nonServingPlayer);
      setLevel3ModalType('reaction');
      setDefaultReactions();
      setShowLevel3Modal(true);
    }
  };

  // Set default reactions for easier completion
  const setDefaultReactions = () => {
    // For Level 1, reactions are not needed
    if (match.level === 1) {
      return;
    }
    setPlayer1Reaction('noResponse');
    setPlayer2Reaction('noResponse');
  };

  // Level 3 modal handlers
  const handleLevel3PointOutcome = (outcome: string) => {
    if (outcome === 'ace') {
      // Ace - server wins the point
      const winner = player1.isServing ? 1 : 2;
      
      // For Level 1, add point directly without reaction modal
      if (match.level === 1) {
        endPoint(winner, 'ace');
        return;
      }
      
      // For Level 2+, show reaction modal
      sessionStorage.setItem('cameFromModal', 'true');
      setLevel3ModalType('reaction');
              setLastPointWinner(winner);
      setSelectedOutcome('ace'); // Set the outcome type for proper recording
      setDefaultReactions();
      setShowLevel3Modal(true);
      } else if (outcome === 'ball_in_court') {
        // Set session storage to indicate ball in court choice and modal origin
        sessionStorage.setItem('ballInCourtChoice', 'true');
        
        // Debug: Check what flags are set before and after
        console.log('🎯 [Debug] Ball In Court selected - before setting flags:', {
          cameFromOutfield: sessionStorage.getItem('cameFromOutfield'),
          cameFromModal: sessionStorage.getItem('cameFromModal'),
          ballInCourtChoice: sessionStorage.getItem('ballInCourtChoice')
        });
        
        // Only set cameFromModal if we didn't come from outfield
        if (sessionStorage.getItem('cameFromOutfield') !== 'true') {
        sessionStorage.setItem('cameFromModal', 'true');
        }
        
        // Debug: Check what flags are set after
        console.log('🎯 [Debug] Ball In Court selected - after setting flags:', {
          cameFromOutfield: sessionStorage.getItem('cameFromOutfield'),
          cameFromModal: sessionStorage.getItem('cameFromModal'),
          ballInCourtChoice: sessionStorage.getItem('ballInCourtChoice')
        });
        
        // Set default values for easier completion
        setSelectedOutcome('ball_in_court');
        setSelectedRallyLength('oneToFour');
        setSelectedShotWay('forehand');
        setSelectedMissedShot('wide');
        setSelectedPlacement('downTheLine');
        
        setShowLevel3Modal(false);
        setLevel3ModalType(null);
      } else if (outcome === 'return_error') {
      // Ask for forced/unforced error
      sessionStorage.setItem('cameFromModal', 'true');
      setShowLevel3Modal(true);
      setLevel3ModalType('return_error_choice');
    } else if (outcome === 'returnWinner') {
      // Return Winner - opponent (non-serving player) wins the point
      const opponent = player1.isServing ? 2 : 1;
      
      // For Level 1, add point directly without modals
      if (match.level === 1) {
        endPoint(opponent, 'returnWinner');
        return;
      }
      
      // For Level 2+, show shot details modal
      setLastPointWinner(opponent);
      setSelectedOutcome('returnWinner'); // Set the outcome type for proper recording
      console.log('🎯 [Point Outcome] Return Winner selected, opponent wins:', opponent);
      
      // Show shot details modal - point will be added when modal is completed
      sessionStorage.setItem('cameFromModal', 'true');
      setShowLevel3Modal(true);
      setLevel3ModalType('shot_details');
    } else if (outcome === 'double_fault') {
      // For Level 1, add point directly without reaction modal
      if (match.level === 1) {
        const winner = player1.isServing ? 2 : 1; // Opponent wins on double fault
        endPoint(winner, 'double_fault');
        return;
      }
      
      // For Level 2+, show player reaction modal
      sessionStorage.setItem('cameFromModal', 'true');
      setShowLevel3Modal(true);
      setLevel3ModalType('reaction');
      setSelectedOutcome('double_fault'); // Set the outcome type for proper recording
      setDefaultReactions();
    }
  };

  const handleReturnErrorChoice = (choice: 'forced' | 'unforced') => {
    if (choice === 'forced') {
      // Forced error - server gets the point (same as unforced)
      const winner = player1.isServing ? 1 : 2;
      
      // For Level 1, add point directly without reaction modal
      if (match.level === 1) {
        endPoint(winner, 'forced_error');
        return;
      }
      
      // For Level 2+, show reaction modal
      sessionStorage.setItem('cameFromModal', 'true');
      setLevel3ModalType('reaction');
      setLastPointWinner(winner);
      setSelectedOutcome('forced_error'); // Set the outcome type for proper recording
      setDefaultReactions();
      setShowLevel3Modal(true);
    } else {
      // Unforced error - server gets the point
      const winner = player1.isServing ? 1 : 2;
      
      // For Level 1, add point directly without reaction modal
      if (match.level === 1) {
        endPoint(winner, 'unforced_error');
        return;
      }
      
      // For Level 2+, show reaction modal
      sessionStorage.setItem('cameFromModal', 'true');
      setLevel3ModalType('reaction');
      setLastPointWinner(winner);
      setSelectedOutcome('unforced_error'); // Set the outcome type for proper recording
      setDefaultReactions();
      setShowLevel3Modal(true);
    }
  };

  const handleCourtSideClick = (side: 'player1' | 'player2') => {
    if (side === 'player1') {
      // Green court clicked - Green player (Player 1) wins
      
      // For Level 1, add point directly without reaction modal
      if (match.level === 1) {
        endPoint(1, 'p1Winner');
        return;
      }
      
      // For Level 2+, show reaction modal
      setLevel3ModalType('reaction');
      setLastPointWinner(1);
      setDefaultReactions();
      setShowLevel3Modal(true);
    } else if (side === 'player2') {
      // Blue court clicked - Blue player (Player 2) wins
      
      // For Level 1, add point directly without reaction modal
      if (match.level === 1) {
        endPoint(2, 'p2Winner');
        return;
      }
      
      // For Level 2+, show reaction modal
      setLevel3ModalType('reaction');
      setLastPointWinner(2);
      setDefaultReactions();
      setShowLevel3Modal(true);
    }
    
    // Set flag that user came from modal
    sessionStorage.setItem('cameFromModal', 'true');
  };

  const handleForcedErrorSelection = (isForced: boolean) => {
    setIsForcedError(isForced);
    
    // For Level 1, add point directly without modals
    if (match.level === 1) {
      const winner = player1.isServing ? 1 : 2; // Server wins on forced error
      endPoint(winner, isForced ? 'forced_error' : 'unforced_error');
      return;
    }
    
    // For Level 2+, show shot details modal
    sessionStorage.setItem('cameFromModal', 'true');
    setLevel3ModalType('shot_details');
  };

  // Start point function for Level 3
  const handleStartPoint = () => {
    setIsPointActive(true);
    // Reset serve placement for new point
    setSelectedServePlacement(null);
    // The in-between timer will automatically stop when isPointActive becomes true
  };

  // Note-taking functions
  const addNote = () => {
    if (currentNote.trim()) {
      const newNote = {
        id: Date.now().toString(),
        content: currentNote.trim(),
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      };
      setNotes(prev => [newNote, ...prev]);
      setCurrentNote('');
      setEditingNoteId(null);
      
      // Show success toast
      toast.success('Note added successfully! 📝', {
        duration: 3000,
        icon: '✏️',
      });
    }
  };

  const handleNoteInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentNote(e.target.value);
    // If user starts typing and there's no editing happening, prepare to create a new note
    if (e.target.value.trim() && !editingNoteId) {
      // This will trigger the creation of a new note when they click Add
    }
  };

  const editNote = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      setCurrentNote(note.content);
      setEditingNoteId(id);
    }
  };

  const updateNote = () => {
    if (editingNoteId && currentNote.trim()) {
      setNotes(prev => prev.map(note => 
        note.id === editingNoteId 
          ? { ...note, content: currentNote.trim() }
          : note
      ));
      setCurrentNote('');
      setEditingNoteId(null);
      
      // Show success toast
      toast.success('Note updated successfully! ✏️', {
        duration: 3000,
        icon: '📝',
      });
    }
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    
    // Show success toast
    toast.success('Note deleted successfully! 🗑️', {
      duration: 3000,
      icon: '✅',
    });
  };

  const openNoteModal = () => {
    // If no notes exist, start with an empty state
    if (notes.length === 0) {
      // Don't add dummy notes - let users create real ones
      console.log('No notes exist yet - starting fresh');
    }
    setShowNoteModal(true);
  };

  const addPoint = (player: 1 | 2) => {
    // Don't allow points to be scored if match hasn't started
    if (!isGameRunning) {
      return;
    }
    
    // Ensure server is selected before allowing points
    if (match.server === null) {
      toast.error('Please select a server first! 🎾', {
        duration: 3000,
        icon: '⚠️',
      });
      return;
    }
    
    // For Level 3, allow points to be added when called from completePointWithReactions
    if (match.level === 3) {
      console.log('🎯 [Debug] Level 3 - proceeding with point addition');
      // Continue to add the point instead of returning early
    }
    
    // For Level 2, show point outcome modal
    if (match.level === 2) {
      setLastPointWinner(player);
      // Update point outcomes based on who won and who is serving
      const contextualOutcomes = getContextualPointOutcomes(player);
      setPointOutcomes(contextualOutcomes);
      setShowPointOutcomeModal(true);
      return; // Don't add point yet, wait for modal completion
    }

    // Level 1: Add point immediately
    
     // Toggle serving position for the same server
    setServingPosition(prev => prev === 'up' ? 'down' : 'up');

    // Save current state for undo
    setGameHistory(prev => [...prev, {
      player1: { ...player1 },
      player2: { ...player2 },
      match: { ...match },
      servingPosition,
      courtRotation
    }]);
    
    // Clear redo history when new move is made
    setRedoHistory([]);

    // Update points
    if (player === 1) {
      setPlayer1(prev => {
        const newPoints = prev.points + 1;
        console.log('🎯 [Debug] Updating Player 1 points:', prev.points, '->', newPoints);
        return { ...prev, points: newPoints };
      });
      // For Level 1, use endPoint directly; for Level 2, use trackPointWithLevel
      const level = match.level;
      if (level === 1) {
        endPoint(1, selectedPointOutcome || "p1Winner");
      } else if (level === (2 as 1 | 2 | 3)) {
        trackPointWithLevel(1, selectedPointOutcome || "p1Winner", 2);
      } else if (level === 3) {
        trackPointWithLevel(1, selectedPointOutcome || "p1Winner", 3);
      }
    } else {
      setPlayer2(prev => {
        const newPoints = prev.points + 1;
        console.log('🎯 [Debug] Updating Player 2 points:', prev.points, '->', newPoints);
        return { ...prev, points: newPoints };
      });
      // For Level 1, use endPoint directly; for Level 2, use trackPointWithLevel
      const level = match.level;
      if (level === 1) {
        endPoint(2, selectedPointOutcome || "p2Winner");
      } else if (level === (2 as 1 | 2 | 3)) {
        trackPointWithLevel(2, selectedPointOutcome || "p2Winner", 2);
      } else if (level === 3) {
        trackPointWithLevel(2, selectedPointOutcome || "p2Winner", 3);
      }
    }

    // Check for game winner after state updates
    setTimeout(() => {
      // Calculate the new point totals correctly
      const p1Total = (player === 1 ? player1.points + 1 : player1.points);
      const p2Total = (player === 2 ? player2.points + 1 : player2.points);
      
      console.log('🎯 [Debug] Checking game winner with points:', { p1Total, p2Total });
      
      const gameWinner = checkGameWinner(p1Total, p2Total);
      
      if (gameWinner) {
        // Use helper function for game win logic
        handleGameWin(gameWinner);
        // Save state after game completion
        setTimeout(() => saveMatchState(), 100);
      } else {
        // Use helper function for deuce/advantage logic
        handleDeuceAdvantage(p1Total, p2Total);
        // Save state after point
        setTimeout(() => saveMatchState(), 100);
      }
      
      // For Level 3, start in-between timer after point
      if (match.level === 3) {
        setIsPointActive(false);
        setInBetweenTime(0);
      }
    }, 0);
  };

  const handleUndo = () => {
    if (gameHistory.length === 0) return;
    
    const lastState = gameHistory[gameHistory.length - 1];
    const currentState = {
      player1: { ...player1 },
      player2: { ...player2 },
      match: { ...match },
      servingPosition,
      courtRotation
    };
    
    // Add current state to redo history
    setRedoHistory(prev => [...prev, currentState]);
    
    // Restore previous state
    setPlayer1(lastState.player1);
    setPlayer2(lastState.player2);
    setMatch(lastState.match);
    setServingPosition(lastState.servingPosition);
    setCourtRotation(lastState.courtRotation || 0);
    setGameHistory(prev => prev.slice(0, -1));
    
    // Show undo toast
    toast.success('Action undone! ↩️', {
      duration: 2000,
      icon: '↩️',
    });
    
    // Save state after undo
    setTimeout(() => saveMatchState(), 100);
  };

  // Helper function to handle game win logic
  const handleGameWin = (gameWinner: 1 | 2) => {
        console.log('🎯 handleGameWin called with winner:', gameWinner);
        console.log('🎯 Current match state:', { currentSet: match.currentSet, games: match.games });
        
        // Ensure we have enough games entries
        const newGames = [...match.games];
        if (newGames.length <= match.currentSet) {
          console.log('🎯 Adding new games entry for set:', match.currentSet);
          newGames.push({ player1: 0, player2: 0, scores: [] });
        }
        
        // Safety check: ensure currentGames exists
        if (!newGames[match.currentSet]) {
          console.log('🎯 Creating missing games entry for set:', match.currentSet);
          newGames[match.currentSet] = { player1: 0, player2: 0, scores: [] };
        }
        
        // Update games for current set
        const currentGames = newGames[match.currentSet];
        console.log('🎯 Current games for set:', match.currentSet, currentGames);
        
        newGames[match.currentSet] = {
          player1: gameWinner === 1 ? currentGames.player1 + 1 : currentGames.player1,
          player2: gameWinner === 2 ? currentGames.player2 + 1 : currentGames.player2,
          scores: []
        };

        // Save current game scores to game history
        console.log('🎯 [handleGameWin] Checking currentGameScores:', {
          currentGameScoresLength: currentGameScores.length,
          currentGameScores: currentGameScores,
          gameWinner,
          currentSet: match.currentSet
        });
        
        if (currentGameScores.length > 0) {
          const gameScore: GameScore = {
            gameNumber: newGames[match.currentSet].player1 + newGames[match.currentSet].player2,
            scores: currentGameScores,
            server: match.server === 1 ? "playerOne" : match.server === 2 ? "playerTwo" : "playerOne"
          };
          
          console.log('🎯 [handleGameWin] Creating gameScore for game history:', gameScore);
          
          setGameHistory(prev => {
            const newHistory = [...prev, gameScore];
            console.log('🎯 [handleGameWin] Updated gameHistory:', {
              previousLength: prev.length,
              newLength: newHistory.length,
              newGameScore: gameScore,
              allGameScores: newHistory
            });
            return newHistory;
          });
          
          // Reset current game scores for next game
          setCurrentGameScores([]);
          console.log('🎯 [handleGameWin] Reset currentGameScores to empty array');
          
          // Reset player points to 0 for the new game
          setPlayer1(prev => ({ ...prev, points: 0 }));
          setPlayer2(prev => ({ ...prev, points: 0 }));
          console.log('🎯 [handleGameWin] Reset player points to 0 for new game');
          
          // Start new point for next game
          startNewPoint();
        } else {
          console.warn('⚠️ [handleGameWin] No currentGameScores to save! This might indicate a problem with point tracking.');
        }

       

        // Check for set winner
        const setWinner = checkSetWinner(newGames[match.currentSet].player1, 
                                        newGames[match.currentSet].player2);
        
        console.log('🎯 Set win check:', {
          p1Games: newGames[match.currentSet].player1,
          p2Games: newGames[match.currentSet].player2,
          setWinner: setWinner,
          currentSet: match.currentSet
        });

        if (setWinner) {
          // FIRST: Reset games to 0-0 for both players in the current set
          const resetGames = [...newGames];
          resetGames[match.currentSet] = { player1: 0, player2: 0, scores: [] };
          
          // Ensure we have a games entry for the next set if we're moving to it
          if (match.currentSet + 1 < match.bestOf) {
            resetGames[match.currentSet + 1] = { player1: 0, player2: 0, scores: [] };
          }
          
          // SECOND: Update sets
          const newSets = [...match.sets];
          newSets[match.currentSet] = {
            player1: setWinner === 1 ? 1 : 0,
            player2: setWinner === 2 ? 1 : 0
          };

          // THIRD: Update match state with reset games AND new sets
          setMatch(prev => ({
            ...prev,
            sets: newSets,
            games: resetGames,  // Use the reset games (0-0)
            isDeuce: false,
            hasAdvantage: null
          }));

          // FOURTH: Update player set counts and reset points
          const newP1Sets = newSets.reduce((sum, set) => sum + set.player1, 0);
          const newP2Sets = newSets.reduce((sum, set) => sum + set.player2, 0);
          
          console.log('🎯 Updating player set counts:', {
            p1Sets: newP1Sets,
            p2Sets: newP2Sets,
            newSets: newSets
          });
          
          setPlayer1(prev => ({ 
            ...prev, 
            sets: newP1Sets,
            points: 0 
          }));
          setPlayer2(prev => ({ 
            ...prev, 
            sets: newP2Sets,
            points: 0 
          }));

          // Show set won toast and winner modal
          const setWinnerName = setWinner === 1 ? player1.name : player2.name;
          toast.success(`${setWinnerName} wins the set! 🎾`, {
            duration: 4000,
            icon: '🏅',
          });
          
          // Show winner modal for set win
          setMatchWinner(setWinner);
          setShowWinnersModal(true);

          // Check for match winner AFTER updating the state
          const totalSetsP1 = newSets.reduce((sum, set) => sum + set.player1, 0);
          const totalSetsP2 = newSets.reduce((sum, set) => sum + set.player2, 0);
          const matchWinner = checkMatchWinner(totalSetsP1, totalSetsP2);

          if (matchWinner) {
            // Show match won toast
            const matchWinnerName = matchWinner === 1 ? player1.name : player2.name;
            toast.success(`${matchWinnerName} wins the match! 🏆`, {
              duration: 5000,
              icon: '🎉',
            });
            
            // Save the final state before showing winner modal
            setTimeout(() => {
              // Save current game scores to game history before ending
              if (currentGameScores.length > 0) {
                const finalGameScore: GameScore = {
                  gameNumber: match.games[match.currentSet]?.player1 + match.games[match.currentSet]?.player2 + 1,
                  scores: currentGameScores,
                  server: match.server === 1 ? "playerOne" : match.server === 2 ? "playerTwo" : "playerOne"
                };
                
                setGameHistory(prev => [...prev, finalGameScore]);
                setCurrentGameScores([]);
              }
              
              setMatchWinner(matchWinner);
              setShowWinnersModal(true);
              setIsGameRunning(false);
            }, 100);
            return;
          }

          // If no match winner, continue with new set creation
          
          // Start new set if not match over
          
          // Create a new games array that includes all previous sets plus the new one
          const updatedGames = [...resetGames]; // Start with the reset games from previous sets
          updatedGames[match.currentSet + 1] = { player1: 0, player2: 0, scores: [] }; // Add new set
          
          // FIFTH: Update match state with new set and extended games
          setMatch(prev => {
            const newState = {
              ...prev,
              currentSet: prev.currentSet + 1,
              games: updatedGames,  // This will include all sets
              isTieBreak: false,
              isDeuce: false,
              hasAdvantage: null
            };
            return newState;
          });
          
          // SIXTH: Reset points to 0 for the new set
          setPlayer1(prev => ({ ...prev, points: 0 }));
          setPlayer2(prev => ({ ...prev, points: 0 }));
        } else {
          // Check for tiebreak based on format rules
          const rules = getMatchRules(
            match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
            match.scoringVariation,
            match.customTiebreakRules,
            match.noAdScoring
          );
          
          const shouldStartTiebreakNow = shouldStartTiebreak(
            newGames[match.currentSet].player1,
            newGames[match.currentSet].player2,
            rules
          );
          
          if (shouldStartTiebreakNow) {
            setMatch(prev => ({ ...prev, isTieBreak: true }));
          }

          // Always update games state when no set winner
          setMatch(prev => ({ ...prev, games: newGames }));
          
          console.log('🎯 Games updated (no set winner):', {
            newGames: newGames,
            currentSet: match.currentSet,
            p1Games: newGames[match.currentSet]?.player1 || 0,
            p2Games: newGames[match.currentSet]?.player2 || 0
          });
          
          // Save state after updating games
          setTimeout(() => saveMatchState(), 100);
        }

    // Reset points, deuce, advantage and switch server after game
        setPlayer1(prev => ({ ...prev, points: 0 }));
        setPlayer2(prev => ({ ...prev, points: 0 }));
    setMatch(prev => ({ ...prev, isDeuce: false, hasAdvantage: null }));
        switchServer();
        
        // Rotate court on every odd game (1, 3, 5, 7, etc.)
        const totalGames = newGames[match.currentSet].player1 + newGames[match.currentSet].player2;
        if (totalGames % 2 === 1) { // Odd game number
          setCourtRotation(prev => {
            const newRotation = prev === 0 ? 1 : 0;
            return newRotation;
          });
        }
  };

  // Helper function to handle deuce/advantage logic
  const handleDeuceAdvantage = (p1Total: number, p2Total: number) => {
        // Check for deuce/advantage in regular game (not tiebreak)
        if (!match.isTieBreak) {
          const rules = getMatchRules(
            match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
            match.scoringVariation,
            match.customTiebreakRules,
            match.noAdScoring
          );
          
          if (rules.noAdScoring) {
            // No-ad scoring: no deuce/advantage, first to 4 points wins
            setMatch(prev => ({ ...prev, isDeuce: false, hasAdvantage: null }));
          } else {
            // Standard scoring with deuce/advantage
            // Both players at 40 (3 points) - set to deuce
            if (p1Total >= 3 && p2Total >= 3 && p1Total === p2Total) {
              setMatch(prev => ({ ...prev, isDeuce: true, hasAdvantage: null }));
            } 
            // One player has 4+ points - check for advantage or game win
            else if (p1Total >= 4 || p2Total >= 4) {
              // If both players are at 40+ and scores are equal, return to deuce
              if (p1Total === p2Total) {
                setMatch(prev => ({
                  ...prev,
                  isDeuce: true,
                  hasAdvantage: null
                }));
              } 
              // One player has advantage (1 point lead)
              else if (Math.abs(p1Total - p2Total) === 1) {
                const advantagePlayer = p1Total > p2Total ? 1 : 2;
                setMatch(prev => ({
                  ...prev,
                  isDeuce: false,
                  hasAdvantage: advantagePlayer
                }));
              }
            }
          }
        }
  };

  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    
    const nextState = redoHistory[redoHistory.length - 1];
    const currentState = {
      player1: { ...player1 },
      player2: { ...player2 },
      match: { ...match },
      servingPosition,
      courtRotation
    };
    
    // Add current state back to game history
    setGameHistory(prev => [...prev, currentState]);
    
    // Restore next state
    setPlayer1(nextState.player1);
    setPlayer2(nextState.player2);
    setMatch(nextState.match);
    setServingPosition(nextState.servingPosition);
    setCourtRotation(nextState.courtRotation || 0);
    setRedoHistory(prev => prev.slice(0, -1));
    
    // Show redo toast
    toast.success('Action redone! ↪️', {
      duration: 2000,
      icon: '↪️',
    });
    
    // Save state after redo
    setTimeout(() => saveMatchState(), 100);
  };

  const handlePointOutcomeComplete = () => {
    if (!lastPointWinner || !selectedPointOutcome || !player1Reaction || !player2Reaction) {
      return; // Don't proceed if not all selections are made
    }

    console.log('🎯 [handlePointOutcomeComplete] Starting point completion...');
    console.log('🎯 [handlePointOutcomeComplete] Current state:', {
      lastPointWinner,
      selectedPointOutcome,
      player1Reaction,
      player2Reaction,
      currentPointData: currentPointData ? 'exists' : 'null'
    });

    // Ensure we have point data initialized - if not, start a new point
    if (!currentPointData) {
      console.log('🎯 [handlePointOutcomeComplete] No currentPointData, starting new point...');
      startNewPoint();
    }

    // Now add the point and continue with normal game logic
    setServingPosition(prev => prev === 'up' ? 'down' : 'up');

    // Save current state for undo
    setGameHistory(prev => [...prev, {
      player1: { ...player1 },
      player2: { ...player2 },
      match: { ...match },
      servingPosition,
      courtRotation
    }]);
    
    // Clear redo history when new move is made
    setRedoHistory([]);

    // Update points
    if (lastPointWinner === 1) {
      setPlayer1(prev => ({ ...prev, points: prev.points + 1 }));
              // Track point for API submission
        trackPointWithLevel(1, selectedPointOutcome || "p1Winner", match.level);
    } else {
      setPlayer2(prev => ({ ...prev, points: prev.points + 1 }));
        // Track point for API submission
        trackPointWithLevel(2, selectedPointOutcome || "p2Winner", match.level);
    }

    // Reset modal state
    setShowPointOutcomeModal(false);
    setLastPointWinner(null);
    setSelectedPointOutcome(null);
    setPlayer1Reaction(null);
    setPlayer2Reaction(null);

    // Continue with game logic after a short delay
    setTimeout(() => {
      // Calculate the new point totals correctly
      const p1Total = (lastPointWinner === 1 ? player1.points + 1 : player1.points);
      const p2Total = (lastPointWinner === 2 ? player2.points + 1 : player2.points);
      
      const gameWinner = checkGameWinner(p1Total, p2Total);
      
      if (gameWinner) {
        // Use helper function for game win logic
        handleGameWin(gameWinner);
        // Save state after game completion
        setTimeout(() => saveMatchState(), 100);
      } else {
        // Use helper function for deuce/advantage logic
        handleDeuceAdvantage(p1Total, p2Total);
        // Save state after point
        setTimeout(() => saveMatchState(), 100);
      }
      
      // For Level 3, start in-between timer after point
      if (match.level === 3) {
        setIsPointActive(false);
        setInBetweenTime(0);
      }
      
      // Start new point for next point tracking
      console.log('🎯 [handlePointOutcomeComplete] Starting new point for next point...');
      startNewPoint();
    }, 0);
  };

  // Resume match with existing data function
  const resumeMatchWithExistingData = () => {
    if (!matchData) return;

    console.log('🔄 Resuming match with data:', matchData);

    // First, try to load any existing state from localStorage
    const savedState = localStorage.getItem(`tennisMatchState_${matchId}`);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        console.log('💾 Found saved state in localStorage:', parsedState);
        
        // Restore the saved state
        setMatch(parsedState.match);
        setPlayer1(parsedState.player1);
        setPlayer2(parsedState.player2);
        
        // Don't auto-start the game - user must explicitly start
        setMatchReadyToStart(true);
        setIsGameRunning(false);
        setIsPaused(false);
        
        // Initialize point tracking for API submission
        startNewPoint();
        setLastPointEndTime(Date.now());
        
        toast.success('Previous match state restored! 🎾', {
          duration: 4000,
          icon: '💾',
        });
        
        return; // Exit early if we restored from localStorage
      } catch (error) {
        console.error('Error parsing saved state:', error);
        // Continue with API data restoration if localStorage fails
      }
    }

    try {
      // Extract existing match state from API data
      const existingSets = matchData.sets || [];
      console.log('📊 Existing sets from API:', existingSets);
      
      // Convert API data to component state format
      const convertedSets = existingSets.map(set => ({
        player1: (set as any).p1TotalScore || 0,
        player2: (set as any).p2TotalScore || 0
      }));
      console.log('🔄 Converted sets for component:', convertedSets);
      
      // Log the actual set scores from API
      existingSets.forEach((set, index) => {
        console.log(`🎯 Set ${index + 1}: P1=${(set as any).p1TotalScore}, P2=${(set as any).p2TotalScore}, Winner=${(set as any).winner}`);
      });

      // Get games from the last set if available
      const lastSet = existingSets[existingSets.length - 1];
      const existingGames = lastSet ? (lastSet as any).games || [] : [];
      console.log('🎮 Existing games from API:', existingGames);
      
      // Create a games array with entries for all sets
      // Each set needs a games entry, even if it's just 0-0
      const convertedGames = Array.from({ length: existingSets.length }, (_, index) => {
        if (index === existingSets.length - 1) {
          // For the current set, use the actual game data if available
          if (existingGames.length > 0) {
            return {
              player1: (existingGames[existingGames.length - 1] as any)?.p1Score || 0,
              player2: (existingGames[existingGames.length - 1] as any)?.p2Score || 0,
              scores: [] // Include empty scores array for current set
            };
          }
        }
        // For completed sets, use 0-0 (games are already counted in set scores)
        return { player1: 0, player2: 0, scores: [] };
      });
      
      console.log('🔄 Converted games for component:', convertedGames);

      // Determine current set and server
      const currentSetIndex = existingSets.length > 0 ? existingSets.length - 1 : 0;
      const lastGame = existingGames[existingGames.length - 1];
      const server = lastGame?.server === 'playerOne' ? 1 : 2;

      // Update match state with existing data
      setMatch(prev => ({
        ...prev,
        sets: convertedSets,
        games: convertedGames as any, // Type assertion for test data population
        currentSet: currentSetIndex,
        server: server
      }));

      // Calculate total scores from all sets
      const totalP1Sets = convertedSets.reduce((sum, set) => sum + set.player1, 0);
      const totalP2Sets = convertedSets.reduce((sum, set) => sum + set.player2, 0);
      
      console.log('📊 Calculated total scores - P1 Sets:', totalP1Sets, 'P2 Sets:', totalP2Sets);

      // Update player scores with the restored data
      setPlayer1(prev => ({
        ...prev,
        sets: totalP1Sets,
        games: convertedGames.reduce((sum, game) => sum + game.player1, 0),
        points: convertedGames[0]?.player1 || 0
      }));

      setPlayer2(prev => ({
        ...prev,
        sets: totalP2Sets,
        games: convertedGames.reduce((sum, game) => sum + game.player2, 0),
        points: convertedGames[0]?.player2 || 0
      }));

      // Set server positions
      if (server === 1) {
        setPlayer1(prev => ({ ...prev, isServing: true }));
        setPlayer2(prev => ({ ...prev, isServing: false }));
      } else {
        setPlayer2(prev => ({ ...prev, isServing: true }));
        setPlayer1(prev => ({ ...prev, isServing: false }));
      }

      // Set match as ready to continue
      setMatchReadyToStart(false);
      setIsGameRunning(true);
      setIsPaused(false);

      // Show resume success toast
      toast.success('Match resumed successfully! 🎾', {
        duration: 4000,
        icon: '🔄',
      });

      // Log the final restored state
      console.log('✅ Final restored state:', {
        sets: convertedSets,
        games: convertedGames,
        currentSet: currentSetIndex,
        server: server,
        player1: { 
          sets: totalP1Sets, 
          games: convertedGames.reduce((sum, game) => sum + game.player1, 0), 
          points: convertedGames[0]?.player1 || 0 
        },
        player2: { 
          sets: totalP2Sets, 
          games: convertedGames.reduce((sum, game) => sum + game.player2, 0), 
          points: convertedGames[0]?.player2 || 0 
        }
      });
      
      // Also log the current match state to verify
      console.log('🎾 Current match state after restoration:', {
        match: match,
        player1: player1,
        player2: player2
      });

      // Save the resumed state
      setTimeout(() => saveMatchState(), 100);

    } catch (error) {
      console.error('Error resuming match:', error);
      toast.error('Failed to resume match. Starting fresh...', {
        duration: 4000,
        icon: '❌',
      });
    }
  };

  // Pause/Resume match function
  const togglePause = () => {
    if (isPaused) {
        // Resuming the match
      setIsPaused(false);
      setIsGameRunning(true);
        toast.success('Match resumed! ▶️', {
          duration: 3000,
          icon: '▶️',
        });
    } else {
      // Pausing the match
      setIsPaused(true);
      setIsGameRunning(false);
      toast.success('Match paused! ⏸️', {
        duration: 3000,
        icon: '⏸️',
      });
    }
  };

  // Debug function to show current match state
  const debugCurrentState = () => {
    console.log('🔍 Current Match State:', {
      match: match,
      player1: player1,
      player2: player2,
      isGameRunning,
      matchReadyToStart,
      showServingModal
    });
  };



  // Function to complete point after reactions are captured
  const completePointWithReactions = () => {
    if (!lastPointWinner) {
      console.error('No winner set for point completion');
      return;
    }

    // For Level 1, complete point directly without complex processing
    if (match.level === 1) {
      endPoint(lastPointWinner, selectedOutcome || 'p1Winner');
      return;
    }

    // Debug: Check session storage values right before point completion
    console.log('🎯 [Debug] RIGHT BEFORE point completion - session storage:', {
      cameFromOutfield: sessionStorage.getItem('cameFromOutfield'),
      cameFromModal: sessionStorage.getItem('cameFromModal'),
      ballInCourtChoice: sessionStorage.getItem('ballInCourtChoice')
    });

    console.log('🎯 [Debug] Starting point completion:', {
      lastPointWinner,
      selectedOutcome,
      selectedBallOutcome,
      selectedCourtZone,
      cameFromOutfield: sessionStorage.getItem('cameFromOutfield'),
      cameFromModal: sessionStorage.getItem('cameFromModal')
    });

    // Debug: Check session storage values throughout the function
    const debugSessionStorage = () => {
      console.log('🎯 [Debug] Session storage check:', {
        cameFromOutfield: sessionStorage.getItem('cameFromOutfield'),
        cameFromModal: sessionStorage.getItem('cameFromModal'),
        ballInCourtChoice: sessionStorage.getItem('ballInCourtChoice')
      });
    };

    debugSessionStorage();

    // Award the point to the winner
    let newP1Points = player1.points;
    let newP2Points = player2.points;
    
    if (lastPointWinner === 1) {
      newP1Points = player1.points + 1;
      addPoint(1);
      console.log('🎯 [Debug] Added point to Player 1, new score:', newP1Points);
    } else {
      newP2Points = player2.points + 1;
      addPoint(2);
      console.log('🎯 [Debug] Added point to Player 2, new score:', newP2Points);
    }

    // Use the actual selected values from the Ball In Court modal
    let pointType = selectedOutcome || 'winner';
    let courtPosition = 'leftCourt'; // Default, but should be set based on actual zone clicked
    let missedShotWay = selectedShotWay || 'forehand';
    let missedShot = selectedMissedShot || 'wide';
    let placement = selectedPlacement || 'downTheLine';
    let rallies = match.level === 3 ? (selectedRallyLength || 'oneToFour') : null;
    
          // If this came from outfield (Ball In Court flow), we should have proper data
      if (sessionStorage.getItem('cameFromOutfield') === 'true') {
        console.log('🎯 [Debug] Processing outfield point with data:', {
          selectedOutcome,
          selectedBallOutcome,
          selectedCourtZone,
          selectedRallyLength,
          selectedShotWay,
          selectedMissedShot,
          selectedPlacement,
          cameFromOutfield: sessionStorage.getItem('cameFromOutfield'),
          cameFromModal: sessionStorage.getItem('cameFromModal')
        });
      
      // For outfield clicks, we should have selectedOutcome and selectedRallyLength
      // The type should be what was selected in the Ball In Court modal
      pointType = selectedOutcome || 'winner';
      rallies = match.level === 3 ? (selectedRallyLength || 'oneToFour') : null;
      missedShotWay = selectedShotWay || 'forehand';
      missedShot = selectedMissedShot || 'wide';
      placement = selectedPlacement || 'downTheLine';
      
      // Use the selected ball outcome to determine court position
      console.log('🎯 [Debug] About to determine court position:', {
        selectedCourtZone,
        selectedCourtZoneType: selectedCourtZone?.type,
        isOutfield: selectedCourtZone?.type === 'O'
      });
      
      if (selectedCourtZone && selectedCourtZone.type === 'O') {
        // Outfield zone clicked = ball went out of bounds
        courtPosition = 'out';
        console.log('🎯 [Debug] Outfield zone detected - setting courtPosition to "out"', {
          selectedCourtZone,
          courtPosition
        });
      } else if (selectedBallOutcome === 'out') {
        courtPosition = 'out'; // Ball went out of bounds
      } else if (selectedBallOutcome === 'net') {
        courtPosition = 'net'; // Ball hit the net
      } else {
        // Ball was in - use the selected court zone to determine position
        if (selectedCourtZone) {
          // Regular court zone - map to backend values
          switch (selectedCourtZone.type) {
            case 'W': // Wide zones
              courtPosition = 'leftCourt'; // Left side of court
              break;
            case 'B': // Back zones  
              courtPosition = 'middleCourt'; // Middle of court
              break;
            case 'T': // Top zones
              courtPosition = 'rightCourt'; // Right side of court
              break;
            default:
              courtPosition = 'middleCourt'; // Default to middle
          }
        }
      }
      
      console.log('🎯 [Debug] Outfield point processed:', {
        pointType,
        courtPosition,
        rallies,
        missedShotWay,
        missedShot,
        placement
      });
    } else {
      debugSessionStorage(); // Debug session storage when outfield detection fails
      console.log('🎯 [Debug] NOT processing outfield point - cameFromOutfield is not true');
    }
    
    // If this came from a specific outcome modal (ace, return_error, etc.), use that
    // Only process if we didn't already process outfield data
    if (sessionStorage.getItem('cameFromModal') === 'true' && !sessionStorage.getItem('cameFromOutfield')) {
      debugSessionStorage(); // Debug session storage when modal outcome logic runs
      console.log('🎯 [Debug] Processing modal outcome point:', { selectedOutcome });
      // For direct outcomes like ace, return_error, etc.
      pointType = selectedOutcome || 'ace';
      // These outcomes don't have shot details, so use defaults
    }

    // Check if this is a game-winning point
    // For game-winning points, we want to record the score when the game was won (e.g., 40-30)
    // rather than the new score (0-0) which represents the start of the next game
    const isGameWinningPoint = (newP1Points >= 4 && newP1Points > newP2Points + 1) || 
                              (newP2Points >= 4 && newP2Points > newP1Points + 1);
    
    let finalP1Score, finalP2Score;
    
    if (isGameWinningPoint) {
      // Use the previous score for game-winning points (the score when the game was won)
      const previousP1Points = Math.max(0, newP1Points - 1);
      const previousP2Points = Math.max(0, newP2Points - 1);
      
      finalP1Score = pointToScore(previousP1Points);
      finalP2Score = pointToScore(previousP2Points);
      
      console.log('🎯 [Game Win] Using previous score for final point:', { 
        previousScore: `${finalP1Score}-${finalP2Score}`, 
        newScore: `${pointToScore(newP1Points)}-${pointToScore(newP2Points)}`,
        isGameWinningPoint,
        previousPoints: `${previousP1Points}-${previousP2Points}`,
        newPoints: `${newP1Points}-${newP2Points}`
      });
    } else {
      // Use the new score for regular points
      finalP1Score = pointToScore(newP1Points);
      finalP2Score = pointToScore(newP2Points);
    }
    
    // Create the completed point data
    const completedPoint: PointScore = {
      p1Score: finalP1Score,
      p2Score: finalP2Score,
      pointWinner: lastPointWinner === 1 ? "playerOne" : "playerTwo",
      isSecondService: isSecondService,
      type: pointType,
      servePlacement: selectedServePlacement || 't',
      courtPosition: courtPosition,
      rallies: rallies,
      missedShotWay: missedShotWay,
      missedShot: missedShot,
      placement: placement,
      betweenPointDuration: Math.floor((Date.now() - lastPointEndTime) / 1000),
      p1Reaction: player1Reaction || 'noResponse',
      p2Reaction: player2Reaction || 'noResponse'
    };

    console.log('🎯 [Debug] Created completed point with scores:', {
      newP1Points,
      newP2Points,
      p1Score: finalP1Score,
      p2Score: finalP2Score,
      isGameWinningPoint,
      completedPoint
    });

    console.log('🎯 [Debug] Final court position determination:', {
      selectedCourtZone,
      selectedCourtZoneType: selectedCourtZone?.type,
      isOutfield: selectedCourtZone?.type === 'O',
      finalCourtPosition: courtPosition,
      cameFromOutfield: sessionStorage.getItem('cameFromOutfield')
    });

    // Add to current game scores
    setCurrentGameScores(prev => [...prev, completedPoint]);
    
    // Update point history
    setPointHistory(prev => [...prev, completedPoint]);
    
    // Update last point end time
    setLastPointEndTime(Date.now());
    
    // Reset second service flag
    setIsSecondService(false);

    console.log('🎯 [Debug] Point completed with reactions:', completedPoint);
    
   

    // Clear session storage flags to reset court to normal state
    sessionStorage.removeItem('ballInCourtChoice');
    sessionStorage.removeItem('cameFromOutfield');
    sessionStorage.removeItem('cameFromModal');

    // Close the modal
    setShowLevel3Modal(false);
    
    // Reset modal state
    setLevel3ModalType(null);
    setLastPointWinner(null);
    setSelectedOutcome(null);
    setSelectedBallOutcome(null);
    setSelectedRallyLength(null);
    setSelectedShotWay(null);
    setSelectedMissedShot(null);
    setSelectedPlacement(null);
    setPlayer1Reaction(null);
    setPlayer2Reaction(null);
  };

  // Court rotation helper function
  const getCourtColors = () => {
    if (courtRotation === 0) {
      // Normal rotation: Player 1 (Green) on left, Player 2 (Blue) on right
      return {
        leftCourt: '#D4FF5A',    // Green
        rightCourt: '#4C6BFF',   // Blue
        leftZones: ['#D4FF5A', '#9ACD32', '#6B8E23', '#6B8E23', '#9ACD32', '#D4FF5A'],
        rightZones: ['#4C6BFF', '#2F3FB0', '#1E2D86', '#1E2D86', '#2F3FB0', '#4C6BFF']
      };
    } else {
      // Rotated: Player 2 (Blue) on left, Player 1 (Green) on right
      return {
        leftCourt: '#4C6BFF',    // Blue
        rightCourt: '#D4FF5A',   // Green
        leftZones: ['#4C6BFF', '#2F3FB0', '#1E2D86', '#1E2D86', '#2F3FB0', '#4C6BFF'],
        rightZones: ['#D4FF5A', '#9ACD32', '#6B8E23', '#6B8E23', '#9ACD32', '#D4FF5A']
      };
    }
  };

  // SVG for serving player (large version for court)
  const ServingPlayerIcon = ({ flip = false }: { flip?: boolean }) => (
    <svg 
      width="80" 
      height="100" 
      viewBox="0 0 80 100" 
      transform={flip ? "scale(-1,1)" : undefined}
      style={{ overflow: 'visible' }}
    >
      {/* Tennis player body */}
      <circle cx="40" cy="20" r="12" fill="#fff" />
      <path d="M40 32 L40 70" stroke="#fff" strokeWidth="4" />
      {/* Arms in serving position */}
      <path d="M40 45 L15 30" stroke="#fff" strokeWidth="4" />
      <path d="M40 45 L65 25" stroke="#fff" strokeWidth="4" />
      {/* Legs */}
      <path d="M40 70 L30 90" stroke="#fff" strokeWidth="4" />
      <path d="M40 70 L50 90" stroke="#fff" strokeWidth="4" />
      {/* Racket */}
      <path d="M65 25 L85 5" stroke="#ccc" strokeWidth="5" />
      <circle cx="85" cy="5" r="15" fill="none" stroke="#ccc" strokeWidth="3" />
      {/* Animation for serving motion */}
      <animateTransform
        attributeName="transform"
        type="rotate"
        values={flip ? "0 40 45; -20 40 45; 0 40 45" : "0 40 45; 20 40 45; 0 40 45"}
        dur="1.5s"
        repeatCount="indefinite"
        additive={flip ? "sum" : undefined}
      />
    </svg>
  );

  // Small serving icon for modal
  const SmallServingIcon = ({ color = "#2563eb" }: { color?: string }) => (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tennis player head */}
      <circle cx="14" cy="6" r="3" fill={color} />
      {/* Tennis player body */}
      <path d="M14 9 L14 17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Arms in serving position */}
      <path d="M14 11 L10 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11 L22 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Legs */}
      <path d="M14 17 L11 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M14 17 L17 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Racket */}
      <path d="M22 6 L25 3" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <circle cx="25" cy="3" r="3.5" fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );

  return (
    <>
    {/* Serving Selection Modal */}
{showServingModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent backdrop-blur-sm">
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 md:p-10 shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden backdrop-blur-md">
      {/* Modal Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Select First Server
        </h2>
        <p className="text-gray-600 text-sm md:text-base">
          Choose which player will serve first in this match
        </p>
      </div>
      
      {/* Players Selection */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-8">
                 {/* Player 1 Option */}
         <div 
           className={`flex flex-col items-center transition-all duration-300 cursor-pointer ${tempServer === 1 ? 'scale-105' : 'scale-100 opacity-90 hover:scale-102'}`}
           onClick={() => {
             selectServer(1);
           }}
         >
          <div className="relative">
            <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-[5px] transition-all duration-300 ${tempServer === 1 ? 'border-[#D4FF5A] shadow-xl ring-4 ring-[#D4FF5A]/30' : 'border-gray-300 hover:border-gray-400'}`}>
              <img src={player1.image} alt={player1.name} className="w-full h-full object-cover" />
            </div>
            {tempServer === 1 && (
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-[#D4FF5A] text-gray-900 font-bold px-4 py-1 rounded-full text-xs shadow-md whitespace-nowrap">
                Serving First
              </div>
            )}
          </div>
          <div className={`mt-4 px-4 py-2 rounded-full font-medium flex items-center justify-center space-x-2 transition-colors ${tempServer === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
            <SmallServingIcon color={tempServer === 1 ? "#2563eb" : "#6b7280"} />
            <span className="text-sm md:text-base">{player1.name}</span>
          </div>
        </div>

        {/* Tennis Ball Divider */}
        <div className="relative my-4 md:my-0">
          <div className="w-16 h-16 bg-[#FFEE58] rounded-full flex items-center justify-center shadow-lg">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-inner">
              <div className="w-8 h-8 bg-[#FFEE58] rounded-full shadow-inner"></div>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-1 bg-gray-200 rounded-full -z-10 hidden md:block"></div>
        </div>

                 {/* Player 2 Option */}
         <div 
           className={`flex flex-col items-center transition-all duration-300 cursor-pointer ${tempServer === 2 ? 'scale-105' : 'scale-100 opacity-90 hover:scale-102'}`}
           onClick={() => {
             selectServer(2);
           }}
         >
          <div className="relative">
            <div className={`w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-[5px] transition-all duration-300 ${tempServer === 2 ? 'border-[#4C6BFF] shadow-xl ring-4 ring-[#4C6BFF]/30' : 'border-gray-300 hover:border-gray-400'}`}>
              <img src={player2.image} alt={player2.name} className="w-full h-full object-cover" />
            </div>
            {tempServer === 2 && (
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 bg-[#4C6BFF] text-white font-bold px-4 py-1 rounded-full text-xs shadow-md whitespace-nowrap">
                Serving First
              </div>
            )}
          </div>
          <div className={`mt-4 px-4 py-2 rounded-full font-medium flex items-center justify-center space-x-2 transition-colors ${tempServer === 2 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
            <SmallServingIcon color={tempServer === 2 ? "#2563eb" : "#6b7280"} />
            <span className="text-sm md:text-base">{player2.name}</span>
          </div>
        </div>
      </div>

     

             {/* Instructions and Close Button */}
       <div className="text-center">
         <p className="text-gray-600 text-sm mb-4">Click on a player to select them as the first server. The modal will close automatically, then click "Start Match" in the scoreboard below.</p>
         <button 
           onClick={() => {
             setShowServingModal(false);
             setTempServer(null);
           }}
           className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 text-sm"
         >
           Cancel Selection
         </button>
       </div>
    </div>
  </div>
)}

    {/* Winners Modal */}
    {showWinnersModal && matchWinner && (
      <WinnersModal
        isOpen={showWinnersModal}
        winner={matchWinner}
        onClose={() => setShowWinnersModal(false)}
        matchData={{
          player1,
          player2,
          match,
          courtRotation
        }}
        onDone={() => {
          setShowWinnersModal(false);
          // You can add additional logic here when the modal is closed
        }}
      />
)}

    <div className="min-h-screen bg-[#1B2B5B] text-white p-4 md:p-6 flex flex-col gap-4 md:gap-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-[#D4FF5A] to-[#4C6BFF] rounded-xl overflow-hidden shadow-lg border-2 border-white">
        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-[#D4FF5A] flex-1 w-full md:w-auto">
          <img src={player1.image} alt={player1.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-md" />
          <div className="text-black">
            <h2 className="font-bold text-sm md:text-lg">{player1.name}</h2>
            <span className="text-xs md:text-sm font-semibold">USDTA: {player1.usdta}</span>
          </div>
        </div>
        
        <div className="bg-[#1B2B5B] text-white px-2 py-1 md:px-4 md:py-2 rounded-full my-1 md:mx-2 shadow-md border border-white z-10">
          <span className="font-bold text-sm md:text-base">VS</span>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 bg-[#4C6BFF] flex-1 w-full md:w-auto justify-end">
          <div className="text-white text-right">
            <h2 className="font-bold text-sm md:text-lg">{player2.name}</h2>
            <span className="text-xs md:text-sm font-semibold">USDTA: {player2.usdta}</span>
          </div>
          <img src={player2.image} alt={player2.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-md" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center py-3 md:py-4 bg-[#1E293B] rounded-xl shadow-lg px-4">
        <div className="flex gap-3 md:gap-4">
          <button 
            className="p-1.5 md:p-2 bg-[var(--bg-primary)] rounded-lg shadow-md hover:shadow-lg border border-[var(--border-primary)] transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleUndo}
            disabled={gameHistory.length === 0}
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          
          <button 
            className="p-1.5 md:p-2 bg-[var(--bg-primary)] rounded-lg shadow-md hover:shadow-lg border border-[var(--border-primary)] transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleRedo}
            disabled={redoHistory.length === 0}
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
          
          <button 
            onClick={openNoteModal}
            className="p-1.5 md:p-2 bg-[var(--bg-primary)] rounded-lg shadow-md hover:shadow-lg border border-[var(--border-primary)] transition-all duration-200 hover:scale-105"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Save Progress Button */}
          <button 
            onClick={saveMatchProgressToAPI}
            className="p-1.5 md:p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            title="Save Match Progress"
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>

          {/* Submit Result Button */}
          <button 
            onClick={submitMatchResultToAPI}
            disabled={!isMatchComplete()}
            className={`p-1.5 md:p-2 rounded-lg shadow-md transition-all duration-200 ${
              isMatchComplete() 
                ? 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg hover:scale-105' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
            title={isMatchComplete() ? "Submit Match Result" : "Match not complete - cannot submit yet"}
          >
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {/* Match Status Indicator */}
          {!isMatchComplete() && (
            <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 text-center">
              {(() => {
                const rules = getMatchRules(
                  match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
                  match.scoringVariation,
                  match.customTiebreakRules,
                  match.noAdScoring
                );
                const p1Sets = match.sets.filter(set => set.player1 > set.player2).length;
                const p2Sets = match.sets.filter(set => set.player2 > set.player1).length;
                return `Need ${rules.setsToWin} sets to win. P1: ${p1Sets}, P2: ${p2Sets}`;
              })()}
            </div>
          )}
        </div>
        
        <button 
          onClick={() => {
            setShowInfoModal(true);
            // Show info modal opened toast
            toast.success('Match info displayed! ℹ️', {
              duration: 2000,
              icon: 'ℹ️',
            });
          }}
          className="p-1.5 md:p-2 bg-[var(--bg-primary)] rounded-lg shadow-md hover:shadow-lg border border-[var(--border-primary)] transition-all duration-200 hover:scale-105"
          title="Match Information"
        >
          <div className="w-4 h-4 md:w-5 md:h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            i
          </div>
        </button>
      </div>

      {/* Court */} 
      <div className="bg-[#1E2D86] p-4 md:p-6 rounded-2xl flex justify-center overflow-auto">
        <div className="relative w-full max-w-4xl">
          <svg
            width="100%"
            viewBox="0 0 1100 600"
            preserveAspectRatio="xMidYMid meet"
            xmlns="http://www.w3.org/2000/svg"
            className="h-auto max-h-[60vh]"
          >
            <rect x="0" y="0" width="1100" height="600" rx="12" fill="#1E2D86" />
            
            {/* 🟠 Outfield Zones - Areas outside the main court (SENT TO BACK) */}
            {/* Only show when Ball In Court modal is open */}
            {sessionStorage.getItem('ballInCourtChoice') === 'true' && (
              <>
                {/* 🟠 Outfield - Left - Full width coverage */}
                <rect
                  x="0"
                  y="0"
                  width="600"
                  height="640"
                  fill={getCourtColors().leftCourt}
                  opacity="0.3"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  style={{ cursor: isGameRunning ? "pointer" : "not-allowed" }}
                  onClick={() => {
                    // Set flag that modal came from outfield click
                    sessionStorage.setItem('cameFromOutfield', 'true');
                    
                    // Set the court position for this outfield zone
                    setSelectedCourtZone({ id: 'left_outfield', x: 0, y: 0, width: 600, height: 640, type: 'O', label: 'Left Outfield', player: courtRotation === 0 ? 1 : 2 });
                    
                    // Set default values for easier completion
                    setSelectedOutcome('ball_in_court');
                    setSelectedRallyLength('oneToFour');
                    setSelectedShotWay('forehand');
                    setSelectedMissedShot('wide');
                    setSelectedPlacement('downTheLine');
                    
                    // Show the Ball In Court modal
                    setLevel3ModalType('ball_in_court');
                    setShowLevel3Modal(true);
                    
                    console.log('Left outfield clicked - showing Ball In Court modal for user to decide winner');
                    
                    // Debug: Verify session storage was set
                    console.log('🎯 [Debug] After left outfield click - session storage:', {
                      cameFromOutfield: sessionStorage.getItem('cameFromOutfield'),
                      cameFromModal: sessionStorage.getItem('cameFromModal'),
                      ballInCourtChoice: sessionStorage.getItem('ballInCourtChoice')
                    });
                  }}
                />
                
                {/* 🔵 Outfield - Right - Full width coverage */}
                <rect
                  x="600"
                  y="0"
                  width="650"
                  height="640"
                  fill={getCourtColors().rightCourt}
                  opacity="0.3"
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  style={{ cursor: isGameRunning ? "pointer" : "not-allowed" }}
                  onClick={() => {
                    // Set flag that modal came from outfield click
                    sessionStorage.setItem('cameFromOutfield', 'true');
                    
                    // Set flag that modal came from outfield click
                    sessionStorage.setItem('cameFromOutfield', 'true');
                    console.log('🎯 [Debug] Set cameFromOutfield to true in right outfield click');
                    
                    // Set the court position for this outfield zone
                    setSelectedCourtZone({ id: 'right_outfield', x: 600, y: 0, width: 650, height: 640, type: 'O', label: 'Right Outfield', player: courtRotation === 0 ? 2 : 1 });
                    
                    // Set default values for easier completion
                    setSelectedOutcome('ball_in_court');
                    setSelectedRallyLength('oneToFour');
                    setSelectedShotWay('forehand');
                    setSelectedMissedShot('wide');
                    setSelectedPlacement('downTheLine');
                    
                    // Show the Ball In Court modal
                    setLevel3ModalType('ball_in_court');
                    setShowLevel3Modal(true);
                    
                    console.log('Right outfield clicked - showing Ball In Court modal for user to decide winner');
                    
                    // Debug: Verify session storage was set and preserved
                    console.log('🎯 [Debug] After right outfield click - session storage:', {
                      cameFromOutfield: sessionStorage.getItem('cameFromOutfield'),
                      cameFromModal: sessionStorage.getItem('cameFromModal'),
                      ballInCourtChoice: sessionStorage.getItem('ballInCourtChoice')
                    });
                  }}
                />
                
                {/* Outfield Labels */}
                <text x="300" y="320" transform="rotate(-90, 300, 320)" fontSize="16" fill="white" textAnchor="middle" opacity="0.7">
                  {courtRotation === 0 ? 'P1' : 'P2'} Outfield
                </text>
                <text x="925" y="320" transform="rotate(90, 925, 320)" fontSize="16" fill="white" textAnchor="middle" opacity="0.7">
                  {courtRotation === 0 ? 'P2' : 'P1'} Outfield
                </text>
              </>
            )}
            
            <rect x="70" y="40" width="960" height="520" fill="none" stroke="white" strokeWidth="6" rx="8" />
            
            {/* Court Layout - Same for all levels */}
            <rect x="70" y="40" width="480" height="520" fill={getCourtColors().leftCourt} />
            <rect x="550" y="40" width="480" height="520" fill={getCourtColors().rightCourt} />
                <line x1="550" y1="40" x2="550" y2="560" stroke="white" strokeWidth="4" />
            <line x1="70" y1="213" x2="310" y2="213" stroke="white" strokeDasharray="10,10" strokeWidth="2" />
            <line x1="70" y1="385" x2="310" y2="385" stroke="white" strokeDasharray="10,10" strokeWidth="2" />
                <line x1="790" y1="213" x2="1030" y2="213" stroke="white" strokeDasharray="10,10" strokeWidth="2" />
                <line x1="790" y1="385" x2="1030" y2="385" stroke="white" strokeDasharray="10,10" strokeWidth="2" />

            {/* Level 3 Scoring Zones - Only replace the scoring area */}
            {match.level === 3 ? (
              <>
                {/* Player 1 zones (left side) - 6 vertical zones stacked: W|B|T|T|B|W */}
                <rect x="310" y="40" width="240" height="86" fill={getCourtColors().leftZones[0]} />
                <rect x="310" y="126" width="240" height="86" fill={getCourtColors().leftZones[1]} />
                <rect x="310" y="212" width="240" height="86" fill={getCourtColors().leftZones[2]} />
                <rect x="310" y="298" width="240" height="86" fill={getCourtColors().leftZones[3]} />
                <rect x="310" y="384" width="240" height="86" fill={getCourtColors().leftZones[4]} />
                <rect x="310" y="470" width="240" height="86" fill={getCourtColors().leftZones[5]} />
                
                {/* Zone division lines - aligned with service box lines */}
                <line x1="310" y1="126" x2="550" y2="126" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="310" y1="212" x2="550" y2="212" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="310" y1="298" x2="550" y2="298" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="310" y1="384" x2="550" y2="384" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                <line x1="310" y1="470" x2="550" y2="470" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                
                {/* Net design based on user choice and modal state */}
                {(() => {
                  // Check if user has chosen "ball in court" and came from modal
                  const hasChosenBallInCourt = sessionStorage.getItem('ballInCourtChoice') === 'true';
                  const cameFromModal = sessionStorage.getItem('cameFromModal') === 'true';
                  
                  if (hasChosenBallInCourt && cameFromModal) {
                    // Show two nets with court colors and mesh design - RESPECT COURT ROTATION
                    return (
                      <>
                        {/* Left net - color depends on court rotation */}
                        <rect 
                          x="550" y="40" width="50" height="520" 
                          fill={courtRotation === 0 ? "#D4FF5A" : "#4C6BFF"} 
                          style={{ cursor: isGameRunning ? "pointer" : "not-allowed" }}
                          onClick={() => isGameRunning && handleNetClick(courtRotation === 0 ? 1 : 2)}
                        />
                        {/* Mesh pattern for left net */}
                        <g stroke={courtRotation === 0 ? "#9ACD32" : "#2F3FB0"} strokeWidth="1" opacity="0.6">
                          {/* Vertical mesh lines */}
                          <line x1="555" y1="40" x2="555" y2="560" />
                          <line x1="560" y1="40" x2="560" y2="560" />
                          <line x1="565" y1="40" x2="565" y2="560" />
                          <line x1="570" y1="40" x2="570" y2="560" />
                          <line x1="575" y1="40" x2="575" y2="560" />
                          <line x1="580" y1="40" x2="580" y2="560" />
                          <line x1="585" y1="40" x2="585" y2="560" />
                          <line x1="590" y1="40" x2="590" y2="560" />
                          <line x1="595" y1="40" x2="595" y2="560" />
                          {/* Horizontal mesh lines */}
                          <line x1="550" y1="60" x2="600" y2="60" />
                          <line x1="550" y1="80" x2="600" y2="80" />
                          <line x1="550" y1="100" x2="600" y2="100" />
                          <line x1="550" y1="120" x2="600" y2="120" />
                          <line x1="550" y1="140" x2="600" y2="140" />
                          <line x1="550" y1="160" x2="600" y2="160" />
                          <line x1="550" y1="180" x2="600" y2="180" />
                          <line x1="550" y1="200" x2="600" y2="200" />
                          <line x1="550" y1="220" x2="600" y2="220" />
                          <line x1="550" y1="240" x2="600" y2="240" />
                          <line x1="550" y1="260" x2="600" y2="260" />
                          <line x1="550" y1="280" x2="600" y2="280" />
                          <line x1="550" y1="300" x2="600" y2="300" />
                          <line x1="550" y1="320" x2="600" y2="320" />
                          <line x1="550" y1="340" x2="600" y2="340" />
                          <line x1="550" y1="360" x2="600" y2="360" />
                          <line x1="550" y1="380" x2="600" y2="380" />
                          <line x1="550" y1="400" x2="600" y2="400" />
                          <line x1="550" y1="420" x2="600" y2="420" />
                          <line x1="550" y1="440" x2="600" y2="440" />
                          <line x1="550" y1="460" x2="600" y2="460" />
                          <line x1="550" y1="480" x2="600" y2="480" />
                          <line x1="550" y1="500" x2="600" y2="500" />
                          <line x1="550" y1="520" x2="600" y2="520" />
                        </g>
                        <text x="575" y="300" textAnchor="middle" fontSize="20" fontWeight="bold" fill={courtRotation === 0 ? "#86909C" : "white"} transform="rotate(-90, 575, 300)">
                          {courtRotation === 0 ? player1.name : player2.name}
                        </text>
                        
                        {/* Right net - color depends on court rotation */}
                        <rect 
                          x="599" y="40" width="70" height="520" 
                          fill={courtRotation === 0 ? "#4C6BFF" : "#D4FF5A"} 
                          style={{ cursor: isGameRunning ? "pointer" : "not-allowed" }}
                          onClick={() => isGameRunning && handleNetClick(courtRotation === 0 ? 2 : 1)}
                        />
                        {/* Mesh pattern for right net */}
                        <g stroke={courtRotation === 0 ? "#2F3FB0" : "#9ACD32"} strokeWidth="1" opacity="0.6">
                          {/* Vertical mesh lines */}
                          <line x1="604" y1="40" x2="604" y2="560" />
                          <line x1="610" y1="40" x2="610" y2="560" />
                          <line x1="616" y1="40" x2="616" y2="560" />
                          <line x1="622" y1="40" x2="622" y2="560" />
                          <line x1="628" y1="40" x2="628" y2="560" />
                          <line x1="634" y1="40" x2="634" y2="560" />
                          <line x1="640" y1="40" x2="640" y2="560" />
                          <line x1="646" y1="40" x2="646" y2="560" />
                          <line x1="652" y1="40" x2="652" y2="560" />
                          {/* Horizontal mesh lines */}
                          <line x1="599" y1="60" x2="654" y2="60" />
                          <line x1="599" y1="80" x2="654" y2="80" />
                          <line x1="599" y1="100" x2="654" y2="100" />
                          <line x1="599" y1="120" x2="654" y2="120" />
                          <line x1="599" y1="140" x2="654" y2="140" />
                          <line x1="599" y1="160" x2="654" y2="160" />
                          <line x1="599" y1="180" x2="654" y2="180" />
                          <line x1="599" y1="200" x2="654" y2="200" />
                          <line x1="599" y1="220" x2="654" y2="220" />
                          <line x1="599" y1="240" x2="654" y2="240" />
                          <line x1="599" y1="260" x2="654" y2="260" />
                          <line x1="599" y1="280" x2="654" y2="280" />
                          <line x1="599" y1="300" x2="654" y2="300" />
                          <line x1="599" y1="320" x2="654" y2="320" />
                          <line x1="599" y1="340" x2="654" y2="340" />
                          <line x1="599" y1="360" x2="654" y2="360" />
                          <line x1="599" y1="380" x2="654" y2="380" />
                          <line x1="599" y1="400" x2="654" y2="400" />
                          <line x1="599" y1="420" x2="654" y2="420" />
                          <line x1="599" y1="440" x2="654" y2="440" />
                          <line x1="599" y1="460" x2="654" y2="460" />
                          <line x1="599" y1="480" x2="654" y2="480" />
                          <line x1="599" y1="500" x2="654" y2="500" />
                          <line x1="599" y1="520" x2="654" y2="520" />
                        </g>
                        <text x="626" y="300" textAnchor="middle" fontSize="20" fontWeight="bold" fill={courtRotation === 0 ? "white" : "#86909C"} transform="rotate(-90, 626, 300)">
                          {courtRotation === 0 ? player2.name : player1.name}
                        </text>
                      </>
                    );
                  } else {
                    // Show neutral net with white background and NET text
                    return (
                      <>
                        {/* Neutral net with white background */}
                        <rect x="550" y="40" width="120" height="520" fill="white" />
                        {/* NET text repeated from top to bottom - perfectly centered */}
                        <g fill="#1B2B5B" fontSize="18" fontWeight="bold">
                          {/* Top section */}
                          <text x="610" y="75" textAnchor="middle" transform="rotate(-90, 610, 85)">NET</text>
                          <text x="610" y="115" textAnchor="middle" transform="rotate(-90, 610, 125)">NET</text>
                          <text x="610" y="155" textAnchor="middle" transform="rotate(-90, 610, 165)">NET</text>
                          <text x="610" y="195" textAnchor="middle" transform="rotate(-90, 610, 205)">NET</text>
                          <text x="610" y="235" textAnchor="middle" transform="rotate(-90, 610, 245)">NET</text>
                          <text x="610" y="275" textAnchor="middle" transform="rotate(-90, 610, 285)">NET</text>
                          <text x="610" y="315" textAnchor="middle" transform="rotate(-90, 610, 325)">NET</text>
                          <text x="610" y="355" textAnchor="middle" transform="rotate(-90, 610, 365)">NET</text>
                          <text x="610" y="395" textAnchor="middle" transform="rotate(-90, 610, 405)">NET</text>
                          <text x="610" y="435" textAnchor="middle" transform="rotate(-90, 610, 445)">NET</text>
                          <text x="610" y="475" textAnchor="middle" transform="rotate(-90, 610, 485)">NET</text>
                          <text x="610" y="515" textAnchor="middle" transform="rotate(-90, 610, 525)">NET</text>
                        </g>
                      </>
                    );
                  }
                })()}

                
                {/* Player 2 zones (right side) - 6 vertical zones stacked: W|B|T|T|B|W */}
                <rect x="630" y="40" width="240" height="86" fill={getCourtColors().rightZones[0]} />
                <rect x="630" y="126" width="240" height="86" fill={getCourtColors().rightZones[1]} />
                <rect x="630" y="212" width="240" height="86" fill={getCourtColors().rightZones[2]} />
                <rect x="630" y="298" width="240" height="86" fill={getCourtColors().rightZones[3]} />
                <rect x="630" y="384" width="240" height="86" fill={getCourtColors().rightZones[4]} />
                <rect x="630" y="470" width="240" height="86" fill={getCourtColors().rightZones[5]} />
                    
                    {/* Zone division lines - aligned with service box lines */}
                    <line x1="630" y1="126" x2="870" y2="126" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                    <line x1="630" y1="212" x2="870" y2="212" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                    <line x1="630" y1="298" x2="870" y2="298" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                    <line x1="630" y1="384" x2="870" y2="384" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                    <line x1="630" y1="470" x2="870" y2="470" stroke="white" strokeWidth="2" strokeDasharray="5,5" />
                
                {/* Clickable zones for Level 3 */}
                {courtZones.map((zone) => {
                  // Determine which player this zone belongs to based on court rotation
                  const actualPlayer = courtRotation === 0 ? zone.player : (zone.player === 1 ? 2 : 1);
                  
                  // All zones are clickable in Level 3 - server clicking own field means opponent wins
                  const isClickable = isGameRunning;
                  
                  return (
                    <rect
                      key={zone.id}
                      x={zone.x}
                      y={zone.y}
                      width={zone.width}
                      height={zone.height}
                      fill="transparent"
                      stroke="white"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      style={{ cursor: isClickable ? "pointer" : "not-allowed" }}
                      onClick={() => isClickable && handleCourtZoneClick({
                        ...zone,
                        player: actualPlayer
                      })}
                    />
                  );
                })}
                
                {/* Zone labels - 6 per side, vertically stacked: W|B|T|T|B|W */}
                <text x="430" y="95" textAnchor="middle" fontSize="12" fill="white">W</text>
                <text x="430" y="181" textAnchor="middle" fontSize="12" fill="white">B</text>
                <text x="430" y="267" textAnchor="middle" fontSize="12" fill="white">T</text>
                <text x="430" y="353" textAnchor="middle" fontSize="12" fill="white">T</text>
                <text x="430" y="439" textAnchor="middle" fontSize="12" fill="white">B</text>
                <text x="430" y="525" textAnchor="middle" fontSize="12" fill="white">W</text>
                
                    <text x="750" y="95" textAnchor="middle" fontSize="12" fill="white">W</text>
                    <text x="750" y="181" textAnchor="middle" fontSize="12" fill="white">B</text>
                    <text x="750" y="267" textAnchor="middle" fontSize="12" fill="white">T</text>
                    <text x="750" y="353" textAnchor="middle" fontSize="12" fill="white">T</text>
                    <text x="750" y="439" textAnchor="middle" fontSize="12" fill="white">B</text>
                    <text x="750" y="525" textAnchor="middle" fontSize="12" fill="white">W</text>

                {/* Player Labels for Level 3 */}
            <rect x="10" y="180" width="50" height="240" fill={getCourtColors().leftCourt} rx="6" />
            <text x="35" y="300" transform="rotate(-90, 35, 300)" fontSize="16" fontWeight="bold" fill={getCourtColors().leftCourt === '#D4FF5A' ? "#86909C" : "white"} textAnchor="middle">
              {courtRotation === 0 ? player1.name : player2.name}
            </text>

            <rect x="1040" y="180" width="50" height="240" fill={getCourtColors().rightCourt} rx="6" />
            <text x="1065" y="300" transform="rotate(90, 1065, 300)" fontSize="16" fontWeight="bold" fill={getCourtColors().rightCourt === '#D4FF5A' ? "#86909C" : "white"} textAnchor="middle">
              {courtRotation === 0 ? player2.name : player1.name}
            </text>

                {/* Level 3: No scores displayed on court - use court zone clicks only */}

                {/* Serving Indicators for Level 3 */}
            {player1.isServing && (
              <g transform={`translate(${courtRotation === 0 ? 100 : 940},${servingPosition === 'up' ? 120 : 420}) ${courtRotation === 1 ? 'scale(-1,1)' : ''}`}>
                <ServingPlayerIcon flip={courtRotation === 1} />
              </g>
            )}

            {player2.isServing && (
              <g transform={`translate(${courtRotation === 0 ? 940 : 100},${servingPosition === 'up' ? 120 : 420}) ${courtRotation === 0 ? 'scale(-1,1)' : ''}`}>
                <ServingPlayerIcon flip={courtRotation === 0} />
              </g>
                )}
              </>
            ):(
              <>
              
              </>
            )}

            {/* Level 1 & 2 Scoring Areas - Show for all levels except Level 3 */}
            {match.level !== 3 && (
              <>
                {/* Left Court Scoring Area */}
                <rect 
                  x="310" y="40" width="240" height="520" 
                  fill={isGameRunning ? (getCourtColors().leftCourt === '#D4FF5A' ? "#49682E" : "#2F3FB0") : "#6B7280"} 
                  onClick={() => isGameRunning && addPoint(courtRotation === 0 ? 1 : 2)} 
                  style={{ 
                    cursor: isGameRunning ? "pointer" : "not-allowed" 
                  }} 
                />
                
                {/* Right Court Scoring Area */}
                  <rect 
                    x="550" y="40" width="240" height="520" 
                  fill={isGameRunning ? (getCourtColors().rightCourt === '#D4FF5A' ? "#49682E" : "#2F3FB0") : "#6B7280"} 
                  onClick={() => isGameRunning && addPoint(courtRotation === 0 ? 2 : 1)} 
                  style={{ 
                    cursor: isGameRunning ? "pointer" : "not-allowed" 
                  }} 
                />

                {/* Player Labels for Level 1 & 2 */}
                <rect x="10" y="180" width="50" height="240" fill={getCourtColors().leftCourt} rx="6" />
                <text x="35" y="300" transform="rotate(-90, 35, 300)" fontSize="16" fontWeight="bold" fill={getCourtColors().leftCourt === '#D4FF5A' ? "#86909C" : "white"} textAnchor="middle">
                  {courtRotation === 0 ? player1.name : player2.name}
                </text>

                <rect x="1040" y="180" width="50" height="240" fill={getCourtColors().rightCourt} rx="6" />
                <text x="1065" y="300" transform="rotate(90, 1065, 300)" fontSize="16" fontWeight="bold" fill={getCourtColors().rightCourt === '#D4FF5A' ? "#86909C" : "white"} textAnchor="middle">
                  {courtRotation === 0 ? player2.name : player1.name}
                </text>

                {/* Scores for Level 1 & 2 */}
                <text x="430" y="300" textAnchor="middle" fontSize="40" fontWeight="bold" fill="white">
                  {match.isDeuce ? "Deuce" : 
                   match.hasAdvantage === (courtRotation === 0 ? 1 : 2) ? "AD" : 
                   match.hasAdvantage === (courtRotation === 0 ? 2 : 1) ? "40" : 
                   pointToScore(courtRotation === 0 ? player1.points : player2.points)}
                </text>
                <text x="430" y="340" textAnchor="middle" fontSize="14" fill="white">
                  {isGameRunning ? "TAP TO ADD A POINT" : "START MATCH TO SCORE"}
                </text>
                <text x="670" y="300" textAnchor="middle" fontSize="40" fontWeight="bold" fill="white">
                  {match.isDeuce ? "Deuce" : 
                   match.hasAdvantage === (courtRotation === 0 ? 2 : 1) ? "AD" : 
                   match.hasAdvantage === (courtRotation === 0 ? 1 : 2) ? "40" : 
                   pointToScore(courtRotation === 0 ? player2.points : player1.points)}
                </text>
                <text x="670" y="340" textAnchor="middle" fontSize="14" fill="white">
                  {isGameRunning ? "TAP TO ADD A POINT" : "START MATCH TO SCORE"}
                </text>

                {/* Serving Indicators for Level 1 & 2 */}
                {player1.isServing && (
                  <g transform={`translate(${courtRotation === 0 ? 100 : 940},${servingPosition === 'up' ? 120 : 420}) ${courtRotation === 1 ? 'scale(-1,1)' : ''}`}>
                    <ServingPlayerIcon flip={courtRotation === 1} />
                  </g>
                )}

                {player2.isServing && (
                  <g transform={`translate(${courtRotation === 0 ? 940 : 100},${servingPosition === 'up' ? 120 : 420}) ${courtRotation === 0 ? 'scale(-1,1)' : ''}`}>
                    <ServingPlayerIcon flip={courtRotation === 0} />
                  </g>
                )}
              </>
            )}
          </svg>
        </div>
      </div>

      {/* Scoreboard */}
      <div className="bg-[var(--bg-card)] text-[var(--text-primary)] p-3 md:p-4 rounded-lg shadow-lg border border-[var(--border-primary)]">
        {/* Level Indicator */}
        <div className="text-center mb-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            match.level === 3
              ? 'bg-orange-100 text-orange-800 border border-orange-200'
              : match.level === 2 
              ? 'bg-blue-100 text-blue-800 border border-blue-200' 
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}>
            Level {match.level} - {
              match.level === 1 ? 'Basic Scoring' : 
              match.level === 2 ? 'Detailed Tracking' : 
              'Advanced Charting'
            }
          </span>
        </div>
        
        {/* Scoreboard Grid - 3 columns: Score (Large) | Game Time | Buttons */}
        <div className="grid grid-cols-5 gap-4 md:gap-6 text-center font-bold text-xs md:text-sm">
         
          {/* Column 1-2: Player Names & Scores (Large - Takes 2 columns) */}
          <div className="col-span-2 flex">
            {/* Left: Player Names (Stacked Vertically) */}
            <div className="w-1/2 space-y-2">
              {/* Left Court Player (changes based on rotation) - Dynamic Background */}
              <div 
                className="p-3 md:p-4 rounded-lg flex items-center justify-center space-x-2"
                style={{ backgroundColor: getCourtColors().leftCourt }}
              >
                <span className={`text-base md:text-lg font-semibold ${
                  getCourtColors().leftCourt === '#D4FF5A' ? 'text-gray-800' : 'text-white'
                }`}>
                  {courtRotation === 0 ? player1.name : player2.name}
                </span>
                {((courtRotation === 0 && player1.isServing) || (courtRotation === 1 && player2.isServing)) && (
                  <div className={`w-5 h-5 ${
                    getCourtColors().leftCourt === '#D4FF5A' ? 'text-gray-800' : 'text-white'
                  }`}>
                    <SmallServingIcon color={getCourtColors().leftCourt === '#D4FF5A' ? '#374151' : '#ffffff'} />
                  </div>
                )}
              </div>
              
              {/* Right Court Player (changes based on rotation) - Dynamic Background */}
              <div 
                className="p-3 md:p-4 rounded-lg flex items-center justify-center space-x-2"
                style={{ backgroundColor: getCourtColors().rightCourt }}
                title={`Court rotation: ${courtRotation}, Right court color: ${getCourtColors().rightCourt}`}
              >
                <span className={`text-base md:text-lg font-semibold ${
                  getCourtColors().rightCourt === '#D4FF5A' ? 'text-gray-800' : 'text-white'
                }`}>
                  {courtRotation === 0 ? player2.name : player1.name}
                </span>
                {((courtRotation === 0 && player2.isServing) || (courtRotation === 1 && player1.isServing)) && (
                  <div className={`w-5 h-5 ${
                    getCourtColors().rightCourt === '#D4FF5A' ? 'text-gray-800' : 'text-white'
                  }`}>
                    <SmallServingIcon color={getCourtColors().rightCourt === '#D4FF5A' ? '#374151' : '#ffffff'} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Right: Scores Grid (3 columns: Sets | Games | Points) */}
            <div className="w-1/2 bg-gray-100 p-3 md:p-4 rounded-lg ml-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                {/* Column Headers */}
                <div className="text-sm text-gray-600 font-medium">Sets</div>
                <div className="text-sm text-gray-600 font-medium">Games</div>
                <div className="text-sm text-gray-600 font-medium">Points</div>
                
                {/* Left Court Player Scores (Top Row) */}
                <div className="text-2xl md:text-3xl font-mono font-bold text-gray-800">
            {courtRotation === 0 ? match.sets.reduce((sum, set) => sum + set.player1, 0) : match.sets.reduce((sum, set) => sum + set.player2, 0)}
          </div>
                <div className="text-2xl md:text-3xl font-mono font-bold text-gray-800">
            {courtRotation === 0 ? (match.games[match.currentSet]?.player1 ?? 0) : (match.games[match.currentSet]?.player2 ?? 0)}
          </div>
                <div className="text-2xl md:text-3xl font-mono font-bold text-gray-800">
                  {match.isTieBreak ? (courtRotation === 0 ? player1.points : player2.points) : 
                    (() => {
                      const rules = getMatchRules(
                        match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
                        match.scoringVariation,
                        match.customTiebreakRules,
                        match.noAdScoring
                      );
                      if (rules.noAdScoring) {
                        return getScoreDisplay(courtRotation === 0 ? player1.points : player2.points, true);
                      } else {
                        return match.isDeuce ? "Deuce" : match.hasAdvantage === (courtRotation === 0 ? 1 : 2) ? "AD" : pointToScore(courtRotation === 0 ? player1.points : player2.points);
                      }
                    })()}
          </div>
          
                {/* Right Court Player Scores (Bottom Row) */}
                <div className="text-2xl md:text-3xl font-mono font-bold text-gray-800">
            {courtRotation === 0 ? match.sets.reduce((sum, set) => sum + set.player2, 0) : match.sets.reduce((sum, set) => sum + set.player1, 0)}
          </div>
                <div className="text-3xl font-mono font-bold text-gray-800">
            {courtRotation === 0 ? (match.games[match.currentSet]?.player2 ?? 0) : (match.games[match.currentSet]?.player1 ?? 0)}
          </div>
                <div className="text-2xl md:text-3xl font-mono font-bold text-gray-800">
                  {match.isTieBreak ? (courtRotation === 0 ? player2.points : player1.points) : 
                    (() => {
                      const rules = getMatchRules(
                        match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
                        match.scoringVariation,
                        match.customTiebreakRules,
                        match.noAdScoring
                      );
                      if (rules.noAdScoring) {
                        return getScoreDisplay(courtRotation === 0 ? player2.points : player1.points, true);
                      } else {
                        return match.isDeuce ? "Deuce" : match.hasAdvantage === (courtRotation === 0 ? 2 : 1) ? "AD" : pointToScore(courtRotation === 0 ? player2.points : player1.points);
                      }
                    })()}
          </div>
              </div>
            </div>
          </div>
          
          {/* Column 3: Game Time & In-Between Time */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-xs text-gray-600 mb-2">Game Time</div>
            <div className="text-2xl md:text-5xl font-mono font-bold text-gray-800">{formatTime(gameTime)}</div>
            
            {/* In-Between Time (Level 3 only) - Hidden when point is active */}
            {match.level === 3 && !isPointActive && (
              <>
                <div className="text-xs text-gray-600 mt-4 mb-2">In-Between Time</div>
                <div className="text-lg md:text-5xl font-mono font-bold text-gray-600">{formatTime(inBetweenTime)}</div>
              </>
            )}
          </div>
          
          {/* Column 4-5: Buttons (Takes 2 columns) */}
          <div className="col-span-2 flex flex-col items-center justify-center gap-3">
            {/* Start Match Button - Only shown when match is ready to start AND not running */}
            {matchReadyToStart && !isGameRunning && (
              <button 
                onClick={() => {
                  if (match.server) {
                    // Clear session storage for net state when starting new match
                    sessionStorage.removeItem('ballInCourtChoice');
                    sessionStorage.removeItem('cameFromModal');
                    
                    // Reset selections
                    setSelectedOutcome(null);
                    setSelectedRallyLength(null);
                    setCourtRotation(0);
                    setInBetweenTime(0);
                    setGameTime(0); // Reset game time to 0 for new match
                    setIsPointActive(false);
                    setShowWinnersModal(false);
                    setMatchWinner(null);
                    setShowInfoModal(false);
                    // Note: player1InBetweenTime and player2InBetweenTime are NOT reset to keep records
                    // Note: notes are NOT reset to keep existing notes
                    
                    // Server is already selected, just start the match
                    setIsGameRunning(true); // Start the match
                    setMatchReadyToStart(false); // Hide the Start Match button
                    
                    // Initialize point tracking for API submission
                    startNewPoint();
                    setLastPointEndTime(Date.now());
                    
                    // Clear any previous localStorage to start fresh
                    localStorage.removeItem('tennisMatchState');
                    
                    // Show match started toast
                    toast.success('Match started! 🚀', {
                      duration: 4000,
                      icon: '🎾',
                    });
                  }
                }}
                disabled={!match.server}
                className="text-center text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-2xl min-h-[60px] w-full bg-[#5368FF] hover:bg-[#4A5FE8]"
              >
                {match.server ? `TAP WHEN ${match.server === 1 ? player1.name : player2.name} HAS STARTED SERVING` : 'Select Server First'}
              </button>
            )}

            {/* Resume Match Button - Only shown when match is loaded and it's a saved match */}
            {matchData && (matchData as any).status === 'saved' && !isGameRunning && !matchReadyToStart && (
              <button 
                onClick={resumeMatchWithExistingData}
                className="text-center text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-2xl min-h-[60px] w-full bg-green-600 hover:bg-green-700"
              >
                Resume Match 🎾
              </button>
            )}

            {/* Debug Button - Always visible for troubleshooting */}
            {/* <button 
              onClick={debugCurrentState}
              className="text-center text-gray-600 font-bold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm min-h-[40px] w-full bg-gray-100 hover:bg-gray-200"
            >
              Debug State 🔍
            </button>
            
            {/* Test Data Button - For testing API submission */}
            {/* <button 
              onClick={populateTestData}
              className="text-center text-purple-600 font-bold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm min-h-[40px] w-full bg-purple-100 hover:bg-purple-200"
            >
              🧪 Test Data
            </button> */}

            {/* Load Sample Data Button - For testing API submission */}
            {/* <button 
              onClick={populateWithSampleData}
              className="text-center text-blue-600 font-bold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm min-h-[40px] w-full bg-blue-100 hover:bg-blue-200"
            >
              Load Sample Data 🧪
            </button> */}

            {/* Level 3 Fault/Start Button - Only shown when match is running */}
            {isGameRunning && match.level === 3 && (
              <>
                {/* Show Fault button when point is active */}
                {isPointActive && (
              <button 
                onClick={handleFaultClick}
                className={`text-center text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm md:text-base min-h-[60px] w-full ${
                  faultCount === 0 
                    ? 'bg-[#FF6633] hover:bg-[#E55A2B]' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {faultCount === 0 ? 'Fault' : faultCount === 1 ? 'Double Fault' : 'Double Fault'}
              </button>
                )}
                
                {/* Show Start button when point is not active (in-between time) */}
                {!isPointActive && (
                  <button 
                    onClick={handleStartPoint}
                    className="text-center text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-2xl min-h-[60px] w-full bg-[#5368FF] hover:bg-[#4A5FE8]"
                  >
                    TAP WHEN {player1.isServing ? player1.name : player2.name} HAS STARTED SERVING
                  </button>
                )}
              </>
            )}
            
            {/* Control Buttons */}
            <div className="flex gap-2 w-full">
              <button 
                onClick={togglePause}
                  disabled={!matchReadyToStart}
                className={`px-2 py-1 md:px-4 md:py-1 rounded text-xs md:text-sm flex-1 transition-all duration-200 ${
                    isPaused 
                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                      : 'bg-[#4C6BFF] hover:bg-[#3B5BDB] text-white'
                }`}
              >
                {isPaused ? 'Resume' : 'Pause'}
          </button>
              {/* <button 
                onClick={() => {
                  // Show confirmation toast
                  toast.success('Starting new match... 🔄', {
                    duration: 2000,
                    icon: '🔄',
                  });
                  
                  // Clear session storage for net state
                  sessionStorage.removeItem('ballInCourtChoice');
                  sessionStorage.removeItem('cameFromModal');
                  
                  // Reset selections
                  setSelectedOutcome(null);
                  setSelectedRallyLength(null);
                  setCourtRotation(0);
                  setInBetweenTime(0);
                  setIsPointActive(false);
                  setShowWinnersModal(false);
                  setMatchWinner(null);
                  setShowInfoModal(false);
                  // Note: player1InBetweenTime and player2InBetweenTime are NOT reset to keep records
                  // Note: notes are NOT reset to keep existing notes
                  
                  localStorage.removeItem('tennisMatchState');
                  window.location.reload();
                }}
                className="bg-red-500 text-white px-2 py-1 md:px-4 md:py-1 rounded text-xs md:text-sm flex-1">
                New Match
          </button> */}
        </div>
      </div>
    </div>
    </div>

     {/* Level 2 Point Outcome Modal */}
{showPointOutcomeModal && (
  <div className="fixed inset-0 z-50 flex items-start justify-center bg-transparent backdrop-blur-sm overflow-y-auto py-8">
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-6xl mx-4 my-8 overflow-hidden border border-[var(--border-primary)]">
             {/* Header */}
       <div className={`p-6 text-white ${
         lastPointWinner === 1 
           ? 'bg-gradient-to-r from-[#D4FF5A] to-[#9ACD32]' 
           : 'bg-gradient-to-r from-[#4C6BFF] to-[#3B5BDB]'
       }`}>
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-2xl font-bold text-gray-800">
               Point Outcome Analysis
             </h2>
             <p className={`opacity-90 ${
               lastPointWinner === 1 ? 'text-gray-700' : 'text-blue-100'
             }`}>
               {lastPointWinner === 1 ? player1.name : player2.name} won this point
             </p>
           </div>
                     <button 
             onClick={() => setShowPointOutcomeModal(false)}
             className={`p-2 rounded-full transition-colors ${
               lastPointWinner === 1 
                 ? 'hover:bg-gray-800/20' 
                 : 'hover:bg-white/20'
             }`}
             aria-label="Close modal"
           >
             <svg className={`w-6 h-6 ${
               lastPointWinner === 1 ? 'text-gray-800' : 'text-white'
             }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
             </svg>
           </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Point Outcome Selection */}
        <section className="space-y-4">
          <h3 className="flex items-center text-xl font-semibold text-gray-800">
            <svg className="w-6 h-6 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Point Type
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pointOutcomes.map((outcome) => (
              <button
                key={outcome.type}
                onClick={() => setSelectedPointOutcome(outcome.type)}
                className={`p-4 rounded-xl flex flex-col items-center justify-center transition-all duration-200 border-2 ${
                  selectedPointOutcome === outcome.type
                    ? 'bg-green-50 border-green-500 shadow-md transform scale-[1.02]'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="text-3xl mb-3">{outcome.icon}</div>
                <span className="text-sm font-medium text-gray-700 text-center">{outcome.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-200 my-6"></div>

        {/* Player Reactions */}
        <section className="space-y-8">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Player Reactions
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Player 1 Reaction */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center mb-4">
                <img 
                  src={player1.image} 
                  alt={player1.name} 
                  className="w-12 h-12 rounded-full border-2 border-[#D4FF5A] mr-3 shadow-sm"
                />
                <div>
                  <h4 className="font-semibold text-gray-800">{player1.name}</h4>
                  <p className="text-xs text-blue-600">Opponent's Reaction</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {playerReactions.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={() => setPlayer1Reaction(reaction.type)}
                    className={`p-3 rounded-lg flex flex-col items-center transition-all ${
                      player1Reaction === reaction.type
                        ? 'bg-[var(--bg-primary)] border-2 border-blue-400 shadow-sm transform scale-[1.03]'
                        : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-primary)]'
                    }`}
                  >
                    <span className="text-3xl mb-1">{reaction.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{reaction.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Player 2 Reaction */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="flex items-center mb-4">
                <img 
                  src={player2.image} 
                  alt={player2.name} 
                  className="w-12 h-12 rounded-full border-2 border-[#4C6BFF] mr-3 shadow-sm"
                />
                <div>
                  <h4 className="font-semibold text-gray-800">{player2.name}</h4>
                  <p className="text-xs text-blue-600">Opponent's Reaction</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {playerReactions.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={() => setPlayer2Reaction(reaction.type)}
                    className={`p-3 rounded-lg flex flex-col items-center transition-all ${
                      player2Reaction === reaction.type
                        ? 'bg-[var(--bg-primary)] border-2 border-blue-400 shadow-sm transform scale-[1.03]'
                        : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-primary)]'
                    }`}
                  >
                    <span className="text-3xl mb-1">{reaction.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{reaction.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={() => setShowPointOutcomeModal(false)}
            className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300"
          >
            Cancel
          </button>
                     <button
             onClick={handlePointOutcomeComplete}
             disabled={!selectedPointOutcome || !player1Reaction || !player2Reaction}
             className={`px-6 py-3 rounded-lg font-bold text-white transition-all flex-1 ${
               (!selectedPointOutcome || !player1Reaction || !player2Reaction)
                 ? 'bg-gray-400 cursor-not-allowed'
                 : lastPointWinner === 1
                   ? 'bg-gradient-to-r from-[#D4FF5A] to-[#9ACD32] hover:from-[#9ACD32] hover:to-[#7CB342] shadow-md hover:shadow-lg'
                   : 'bg-gradient-to-r from-[#4C6BFF] to-[#3B5BDB] hover:from-[#3B5BDB] hover:to-[#2E4B8F] shadow-md hover:shadow-lg'
             }`}
           >
             Save Point Analysis
           </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Level 3 Modals */}
      {showLevel3Modal && (
        <>
          {/* Point Outcome Modal (First Image) */}
          {level3ModalType === 'point_outcome' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
              <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-primary)] w-full max-w-4xl mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button 
                        onClick={() => setShowLevel3Modal(false)}
                        className="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h2 className="text-2xl font-bold">Select Result</h2>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column - Ball In Court */}
                    <div className="md:col-span-1">
                      <button
                        onClick={() => handleLevel3PointOutcome('ball_in_court')}
                        className="w-full h-full p-8 bg-gray-100 hover:bg-gray-200 rounded-xl border-2 border-gray-300 transition-all duration-200 hover:scale-105"
                      >
                        <div className="text-center">
                          <div className="text-4xl mb-4">🎾</div>
                          <h3 className="text-xl font-bold text-gray-800">Ball In Court</h3>
                        </div>
                      </button>
                    </div>

                    {/* Right Column - Three Options */}
                    <div className="md:col-span-2 space-y-4">
                      <button
                        onClick={() => handleLevel3PointOutcome('ace')}
                        className="w-full p-6 bg-gray-100 hover:bg-gray-200 rounded-xl border-2 border-gray-300 transition-all duration-200 hover:scale-105"
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">🎯</div>
                          <h3 className="text-lg font-bold text-gray-800">Ace</h3>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleLevel3PointOutcome('returnWinner')}
                        className="w-full p-6 bg-gray-100 hover:bg-gray-200 rounded-xl border-2 border-gray-300 transition-all duration-200 hover:scale-105"
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">🏆</div>
                          <h3 className="text-lg font-bold text-gray-800">Return Winner</h3>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleLevel3PointOutcome('return_error')}
                        className="w-full p-6 bg-gray-100 hover:bg-gray-200 rounded-xl border-2 border-gray-300 transition-all duration-200 hover:scale-105"
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">❌</div>
                          <h3 className="text-lg font-bold text-gray-800">Return Error</h3>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Shot Details Modal (Second Image) - For Return Winner - Only show for Level 2+ */}
          {level3ModalType === 'shot_details' && match.level > 1 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
              <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-primary)] w-full max-w-4xl mx-4 overflow-hidden">
                {/* Header */}
                <div className={`p-6 text-white ${
                  lastPointWinner === 1 
                    ? 'bg-gradient-to-r from-[#D4FF5A] to-[#9ACD32]' 
                    : 'bg-gradient-to-r from-[#4C6BFF] to-[#3B5BDB]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button 
                        onClick={() => setShowLevel3Modal(false)}
                        className={`mr-4 p-2 rounded-full transition-colors ${
                          lastPointWinner === 1 
                            ? 'hover:bg-gray-800/20' 
                            : 'hover:bg-white/20'
                        }`}
                      >
                        <svg className={`w-6 h-6 ${
                          lastPointWinner === 1 ? 'text-gray-800' : 'text-white'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h2 className={`text-2xl font-bold ${
                        lastPointWinner === 1 ? 'text-gray-800' : 'text-white'
                      }`}>Return Winner - {lastPointWinner === 1 ? player1.name : player2.name}</h2>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                  {/* Shot Placement */}
                  <section className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Shot Placement</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {shotPlacements.map((placement) => (
                        <button
                          key={placement.type}
                          onClick={() => setSelectedShotPlacement(placement.type)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedShotPlacement === placement.type
                              ? 'bg-blue-100 border-blue-500 text-blue-800'
                              : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
                          }`}
                        >
                          <span className="font-medium">{placement.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Shot Type */}
                  <section className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Shot Type</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {shotTypes.map((type) => (
                        <button
                          key={type.type}
                          onClick={() => setSelectedShotType(type.type)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedShotType === type.type
                              ? 'bg-blue-100 border-blue-500 text-blue-800'
                              : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
                          }`}
                        >
                          <span className="font-medium">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* Continue Button */}
                  <div className="text-center">
                    <button
                      onClick={() => {
                        // Close shot details modal
                        setShowLevel3Modal(false);
                        
                        // For Level 1, add point directly without reaction modal
                        if (match.level === 1) {
                          endPoint(lastPointWinner!, selectedOutcome || 'p1Winner');
                          return;
                        }
                        
                        // For Level 2+, show reaction modal
                        setLevel3ModalType('reaction');
                        setShowLevel3Modal(true);
                      }}
                      className={`px-8 py-4 rounded-lg font-bold transition-all shadow-md hover:shadow-lg ${
                        lastPointWinner === 1 
                          ? 'bg-[#D4FF5A] hover:bg-[#9ACD32] text-gray-800' 
                          : 'bg-[#4C6BFF] hover:bg-[#3B5BDB] text-white'
                      }`}
                    >
                      {match.level === 1 ? 'Complete Point' : 'Continue'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ball In Court Modal */}
          {level3ModalType === 'ball_in_court' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
              <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-primary)] w-full max-w-4xl mx-4 overflow-hidden">
                {/* Header */}
                <div className={`p-6 text-white ${
                  lastPointWinner === 1 
                    ? 'bg-gradient-to-r from-[#D4FF5A] to-[#9ACD32]' 
                    : lastPointWinner === 2
                    ? 'bg-gradient-to-r from-[#4C6BFF] to-[#3B5BDB]'
                    : 'bg-gradient-to-r from-gray-600 to-gray-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button 
                        onClick={() => setShowLevel3Modal(false)}
                        className={`mr-4 p-2 rounded-full transition-colors ${
                          lastPointWinner === 1 
                            ? 'hover:bg-gray-800/20' 
                            : lastPointWinner === 2
                            ? 'hover:bg-white/20'
                            : 'hover:bg-white/20'
                        }`}
                      >
                        <svg className={`w-6 h-6 ${
                          lastPointWinner === 1 ? 'text-gray-800' : 'text-white'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h2 className={`text-2xl font-bold ${
                        lastPointWinner === 1 ? 'text-gray-800' : 'text-white'
                      }`}>
                        {lastPointWinner 
                          ? `Ball In Court - ${lastPointWinner === 1 ? player1.name : player2.name} Wins`
                          : 'Ball In Court - Choose Winner'
                        }
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column - Winner Selection (Only show when coming from outfield) */}
                    {sessionStorage.getItem('cameFromOutfield') === 'true' && (
                      <section className="space-y-4 bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-700">Who Won This Point?</h3>
                        <div className="space-y-3">
                          {/* Player 1 Option */}
                      <button
                            onClick={() => setLastPointWinner(1)}
                            className={`w-full p-4 rounded-lg border-2 transition-all ${
                  lastPointWinner === 1 
                                ? 'bg-[#D4FF5A]/20 border-[#D4FF5A] text-gray-800' 
                                : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                          <img 
                            src={player1.image} 
                            alt={player1.name} 
                                className="w-8 h-8 rounded-full"
                              />
                              <span className="font-medium px-3 py-1 rounded-full bg-[#D4FF5A] text-gray-800">
                                {player1.name}
                              </span>
                          </div>
                          </button>
                          
                          {/* Player 2 Option */}
                            <button
                            onClick={() => setLastPointWinner(2)}
                            className={`w-full p-4 rounded-lg border-2 transition-all ${
                              lastPointWinner === 2
                                ? 'bg-[#4C6BFF]/20 border-[#4C6BFF] text-white' 
                                : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                          <img 
                            src={player2.image} 
                            alt={player2.name} 
                                className="w-8 h-8 rounded-full"
                              />
                              <span className="font-medium px-3 py-1 rounded-full bg-[#4C6BFF] text-white">
                                {player2.name}
                              </span>
                          </div>
                            </button>
                    </div>
                  </section>
                    )}

                    {/* Right Column - Outcome (Only show when winner is selected) */}
                    {lastPointWinner && (
                    <section className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <h3 className={`text-xl font-semibold ${
                        lastPointWinner === 1 ? 'text-gray-800' : 'text-gray-700'
                      }`}>Outcome</h3>
                      <div className="space-y-3">
                        {/* Winner based on which side was clicked - SELECTABLE */}
                        <button
                          onClick={() => setSelectedOutcome('winner')}
                          className={`w-full p-4 rounded-lg border-2 transition-all ${
                            (selectedOutcome === 'winner') || (!selectedOutcome)
                              ? (lastPointWinner === 1 
                                  ? 'bg-[#D4FF5A]/20 border-[#D4FF5A] text-gray-800' 
                                  : 'bg-[#4C6BFF]/20 border-[#4C6BFF] text-white')
                              : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <img 
                              src={lastPointWinner === 1 ? player1.image : player2.image} 
                              alt={lastPointWinner === 1 ? player1.name : player2.name} 
                              className="w-8 h-8 rounded-full"
                            />
                            <span className={`font-medium px-3 py-1 rounded-full ${
                              lastPointWinner === 1 
                                ? 'bg-[#D4FF5A] text-gray-800' 
                                : 'bg-[#4C6BFF] text-white'
                            }`}>
                              {lastPointWinner === 1 ? player1.name : player2.name}
                            </span>
                          </div>
                        </button>
                        
                        {/* Winner forced error - SELECTABLE */}
                        <button
                          onClick={() => setSelectedOutcome('forced_error')}
                          className={`w-full p-4 rounded-lg border-2 transition-all ${
                            selectedOutcome === 'forced_error'
                              ? (lastPointWinner === 1 
                                  ? 'bg-[#D4FF5A]/20 border-[#D4FF5A] text-gray-800' 
                                  : 'bg-[#4C6BFF]/20 border-[#4C6BFF] text-white')
                              : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
                          }`}
                        >
                          <span className="font-medium">{lastPointWinner === 1 ? player1.name : player2.name} Forced an Error</span>
                        </button>
                        
                        {/* Opponent unforced error - SELECTABLE */}
                        <button
                          onClick={() => setSelectedOutcome('unforced_error')}
                          className={`w-full p-4 rounded-lg border-2 transition-all ${
                            selectedOutcome === 'unforced_error'
                              ? (lastPointWinner === 1 
                                  ? 'bg-[#D4FF5A]/20 border-[#D4FF5A] text-gray-800' 
                                  : 'bg-[#4C6BFF]/20 border-[#4C6BFF] text-white')
                              : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
                          }`}
                        >
                          <span className="font-medium">{lastPointWinner === 1 ? player2.name : player1.name} Unforced Error</span>
                        </button>
                      </div>
                    </section>
                    )}

                    {/* Rally Length Section */}
                    <section className="space-y-4">
                      <h3 className={`text-xl font-semibold ${
                        lastPointWinner === 1 ? 'text-gray-800' : lastPointWinner === 2 ? 'text-gray-700' : 'text-gray-600'
                      }`}>Number of Rally</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {rallyLengths.map((rally, index) => (
                          <button
                            key={rally.type}
                            onClick={() => setSelectedRallyLength(rally.type)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              (selectedRallyLength === rally.type) || (rally.type === 'oneToFour' && !selectedRallyLength)
                                ? (lastPointWinner === 1 
                                    ? 'bg-[#D4FF5A]/20 border-[#D4FF5A] text-gray-800' 
                                    : lastPointWinner === 2
                                    ? 'bg-[#4C6BFF]/20 border-[#4C6BFF] text-white'
                                    : 'bg-gray-100 border-gray-300 text-gray-600')
                                : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
                            }`}
                          >
                            <span className="font-medium">{rally.label}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                                        {/* Court Visualization Section */}
                    <section className="space-y-4">
                      <h3 className={`text-xl font-semibold ${
                        lastPointWinner === 1 ? 'text-gray-800' : lastPointWinner === 2 ? 'text-gray-700' : 'text-gray-600'
                      }`}>Court Visualization</h3>
                      
                      {/* Mini Court with Two Nets */}
                      <div className="flex justify-center">
                        <div className="relative w-64 h-32 bg-gray-100 rounded-lg border-2 border-gray-300 overflow-hidden">
                          {/* Court Background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-blue-200"></div>
                          
                          {/* Left Court (Player 1 - Green) */}
                          <div 
                            className={`absolute left-0 top-0 w-1/2 h-full ${
                              courtRotation === 0 ? 'bg-[#D4FF5A]' : 'bg-[#4C6BFF]'
                            }`}
                          ></div>
                          
                          {/* Right Court (Player 2 - Blue) */}
                          <div 
                            className={`absolute right-0 top-0 w-1/2 h-full ${
                              courtRotation === 0 ? 'bg-[#4C6BFF]' : 'bg-[#D4FF5A]'
                            }`}
                          ></div>
                          
                          {/* Center Line */}
                          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white transform -translate-x-1/2"></div>
                          
                          {/* Net 1 (Left Side) */}
                          <div className="absolute left-1/4 top-1/2 w-1 h-8 bg-white transform -translate-x-1/2 -translate-y-1/2"></div>
                          
                          {/* Net 2 (Right Side) */}
                          <div className="absolute right-1/4 top-1/2 w-1 h-8 bg-white transform translate-x-1/2 -translate-y-1/2"></div>
                          
                          {/* Player Labels */}
                          <div className="absolute left-2 top-2 text-xs font-bold text-gray-800">
                            {courtRotation === 0 ? player1.name : player2.name}
                          </div>
                          <div className="absolute right-2 top-2 text-xs font-bold text-gray-800">
                            {courtRotation === 0 ? player2.name : player1.name}
                          </div>
                          
                          {/* Court Rotation Indicator */}
                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
                            {courtRotation === 0 ? 'Normal' : 'Rotated'} View
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Shot Details Section */}
                    <section className="space-y-4">
                      <h3 className={`text-xl font-semibold ${
                        lastPointWinner === 1 ? 'text-gray-800' : lastPointWinner === 2 ? 'text-gray-700' : 'text-gray-600'
                      }`}>Shot Details</h3>
                      
                      
                      
                      {/* Shot Way */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">Shot Way</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {['forehand', 'backhand'].map((way) => (
                            <button
                              key={way}
                              onClick={() => setSelectedShotWay(way)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                (selectedShotWay === way) || (way === 'forehand' && !selectedShotWay)
                                  ? (lastPointWinner === 1 
                                      ? 'bg-[#D4FF5A]/20 border-[#D4FF5A] text-gray-800' 
                                      : 'bg-[#4C6BFF]/20 border-[#4C6BFF] text-white')
                                  : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
                              }`}
                            >
                              <span className="font-medium capitalize">{way}</span>
                    </button>
                          ))}
                  </div>
                </div>

                      {/* Missed Shot */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">Missed Shot</h4>
                        <div className="grid grid-cols-3 gap-3">
                          {['wide', 'long', 'short'].map((shot) => (
                <button 
                              key={shot}
                              onClick={() => setSelectedMissedShot(shot)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                (selectedMissedShot === shot) || (shot === 'wide' && !selectedMissedShot)
                                  ? (lastPointWinner === 1 
                                      ? 'bg-[#D4FF5A]/20 border-[#D4FF5A] text-gray-800' 
                                      : 'bg-[#4C6BFF]/20 border-[#4C6BFF] text-white')
                                  : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
                              }`}
                            >
                              <span className="font-medium capitalize">{shot}</span>
                </button>
                          ))}
              </div>
            </div>

                      {/* Placement */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">Placement</h4>
                        <div className="grid grid-cols-3 gap-3">
                          {['downTheLine', 'crossCourt', 'dropShot'].map((place) => (
                    <button
                              key={place}
                              onClick={() => setSelectedPlacement(place)}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                (selectedPlacement === place) || (place === 'downTheLine' && !selectedPlacement)
                                  ? (lastPointWinner === 1 
                                      ? 'bg-[#D4FF5A]/20 border-[#D4FF5A] text-gray-800' 
                                      : 'bg-[#4C6BFF]/20 border-[#4C6BFF] text-white')
                                  : 'bg-[var(--bg-primary)] border-[var(--border-primary)] text-[var(--text-primary)] hover:border-[var(--border-secondary)]'
                              }`}
                            >
                              <span className="font-medium capitalize">{place.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </button>
                          ))}
                </div>
                      </div>
                    </section>
              </div>

                    {/* Continue Button - Only show when winner and outcome are selected */}
                    {lastPointWinner && selectedOutcome && selectedRallyLength && selectedShotWay && selectedMissedShot && selectedPlacement && (
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                      {/* Done Button - Complete point directly */}
                          <button
                        onClick={() => {
                          // Don't clear outfield flag here - let completePointWithReactions handle it
                          // sessionStorage.removeItem('cameFromOutfield');
                          
                          // Complete the point directly
                          completePointWithReactions();
                        }}
                        className={`px-8 py-4 rounded-lg font-bold transition-all shadow-md hover:shadow-lg ${
                          lastPointWinner === 1 
                            ? 'bg-[#D4FF5A] hover:bg-[#9ACD32] text-gray-800' 
                            : 'bg-[#4C6BFF] hover:bg-[#3B5BDB] text-white'
                        }`}
                      >
                        Done - Complete Point
                          </button>
                      
                      {/* Continue Button - Go to reaction modal */}
                          <button
                        onClick={() => {
                            // Don't clear outfield flag here - let completePointWithReactions handle it
                            // sessionStorage.removeItem('cameFromOutfield');
                          
                          // Close ball in court modal
                          setShowLevel3Modal(false);
                          
                          // Reset selections for next use
                          setSelectedOutcome(null);
                          setSelectedBallOutcome(null);
                          setSelectedRallyLength(null);
                          setSelectedShotWay(null);
                          setSelectedMissedShot(null);
                          setSelectedPlacement(null);
                          
                          // For Level 1, add point directly without reaction modal
                          if (match.level === 1) {
                            endPoint(lastPointWinner!, selectedOutcome || 'p1Winner');
                            return;
                          }
                          
                          // For Level 2+, show reaction modal
                          setLevel3ModalType('reaction');
                          setShowLevel3Modal(true);
                        }}
                        className={`px-8 py-4 rounded-lg font-bold transition-all shadow-md hover:shadow-lg bg-gray-600 hover:bg-gray-700 text-white`}
                      >
                        {match.level === 1 ? 'Complete Point' : 'Continue to Reactions'}
                          </button>
                        </div>
                    )}
                      </div>
                    </div>
                </div>
            
          )}

          {/* Reaction Modal - Only show for Level 2+ */}
          {level3ModalType === 'reaction' && match.level > 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
              <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-primary)] w-full max-w-4xl mx-4 overflow-hidden">
            {/* Header */}
                <div className={`p-6 text-white ${
                  lastPointWinner === 1 
                    ? 'bg-gradient-to-r from-[#D4FF5A] to-[#9ACD32]' 
                    : 'bg-gradient-to-r from-[#4C6BFF] to-[#3B5BDB]'
                }`}>
              <div className="flex items-center justify-between">
                    <div className="flex items-center">
              <button
                        onClick={() => setShowLevel3Modal(false)}
                        className={`mr-4 p-2 rounded-full transition-colors ${
                          lastPointWinner === 1 
                            ? 'hover:bg-gray-800/20' 
                            : 'hover:bg-white/20'
                        }`}
                      >
                        <svg className={`w-6 h-6 ${
                          lastPointWinner === 1 ? 'text-gray-800' : 'text-white'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
                      <h2 className={`text-2xl font-bold ${
                        lastPointWinner === 1 ? 'text-gray-800' : 'text-white'
                      }`}>Player Reactions - {lastPointWinner === 1 ? player1.name : player2.name} Wins</h2>
            </div>
                </div>
              </div>

            {/* Content */}
                <div className="p-8 space-y-8">
                  {/* Player Reactions */}
                  <section className="space-y-8">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Player Reactions
                    </h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Player 1 Reaction */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                        <div className="flex items-center mb-4">
                    <img 
                      src={player1.image} 
                      alt={player1.name}
                            className="w-12 h-12 rounded-full border-2 border-[#D4FF5A] mr-3 shadow-sm"
                    />
                    <div>
                            <h4 className="font-semibold text-gray-800">{player1.name}</h4>
                            <p className="text-xs text-blue-600">Reaction</p>
                      </div>
                    </div>
                        <div className="grid grid-cols-3 gap-3">
                          {playerReactions.map((reaction) => (
                            <button
                              key={reaction.type}
                              onClick={() => setPlayer1Reaction(reaction.type)}
                              className={`p-3 rounded-lg flex flex-col items-center transition-all ${
                                player1Reaction === reaction.type
                                  ? 'bg-[var(--bg-primary)] border-2 border-blue-400 shadow-sm transform scale-[1.03]'
                                  : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-primary)]'
                              }`}
                            >
                              <span className="text-3xl mb-1">{reaction.icon}</span>
                              <span className="text-xs font-medium text-gray-700">{reaction.label}</span>
                            </button>
                          ))}
                    </div>
                  </div>
                  
                      {/* Player 2 Reaction */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                        <div className="flex items-center mb-4">
                    <img 
                      src={player2.image} 
                      alt={player2.name}
                            className="w-12 h-12 rounded-full border-2 border-[#4C6BFF] mr-3 shadow-sm"
                    />
                    <div>
                            <h4 className="font-semibold text-gray-800">{player2.name}</h4>
                            <p className="text-xs text-blue-600">Reaction</p>
                      </div>
                    </div>
                        <div className="grid grid-cols-3 gap-3">
                          {playerReactions.map((reaction) => (
                            <button
                              key={reaction.type}
                              onClick={() => setPlayer2Reaction(reaction.type)}
                              className={`p-3 rounded-lg flex flex-col items-center transition-all ${
                                player2Reaction === reaction.type
                                  ? 'bg-[var(--bg-primary)] border-2 border-blue-400 shadow-sm transform scale-[1.03]'
                                  : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] border border-[var(--border-primary)]'
                              }`}
                            >
                              <span className="text-3xl mb-1">{reaction.icon}</span>
                              <span className="text-xs font-medium text-gray-700">{reaction.label}</span>
                            </button>
                          ))}
                  </div>
                </div>
              </div>
                  </section>

                  {/* Quick Complete Button with Default Reactions */}
                  <div className="text-center space-y-4">
                    <button
                      onClick={() => {
                        // Set default reactions
                        setPlayer1Reaction('noResponse');
                        setPlayer2Reaction('noResponse');
                        
                        // Complete the point immediately
                        completePointWithReactions();
                      }}
                      className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Quick Complete (Default)
                    </button>
                    
                    <p className="text-sm text-gray-600">
                      💡 Tip: Use "Quick Complete" to skip reaction selection with default "No Response"
                    </p>
                </div>
                
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                      onClick={() => setShowLevel3Modal(false)}
                      className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={completePointWithReactions}
                      disabled={!player1Reaction || !player2Reaction}
                      className={`px-6 py-3 rounded-lg font-bold text-white transition-all flex-1 ${
                        (!player1Reaction || !player2Reaction)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : lastPointWinner === 1
                            ? 'bg-gradient-to-r from-[#D4FF5A] to-[#9ACD32] hover:from-[#9ACD32] hover:to-[#7CB342] shadow-md hover:shadow-lg'
                            : 'bg-gradient-to-r from-[#4C6BFF] to-[#3B5BDB] hover:from-[#3B5BDB] hover:to-[#2E4B8F] shadow-md hover:shadow-lg'
                      }`}
                    >
                      Complete Point
              </button>
                  </div>
            </div>
          </div>
        </div>
          )}

          {/* Return Error Choice Modal */}
          {level3ModalType === 'return_error_choice' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
              <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-primary)] w-full max-w-2xl mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button 
                        onClick={() => setShowLevel3Modal(false)}
                        className="mr-4 p-2 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h2 className="text-2xl font-bold">Return Error Type</h2>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-4">❌</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">What type of return error?</h3>
                    <p className="text-gray-600">Select whether this was a forced or unforced error</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleReturnErrorChoice('forced')}
                      className="p-6 bg-orange-100 hover:bg-orange-200 rounded-xl border-2 border-orange-300 transition-all duration-200 hover:scale-105"
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">⏱️</div>
                        <h3 className="text-lg font-bold text-gray-800">Forced Error</h3>
                        <p className="text-sm text-gray-600">Good shot forced the error</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleReturnErrorChoice('unforced')}
                      className="p-6 bg-red-100 hover:bg-red-200 rounded-xl border-2 border-red-300 transition-all duration-200 hover:scale-105"
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">❌</div>
                        <h3 className="text-lg font-bold text-gray-800">Unforced Error</h3>
                        <p className="text-sm text-gray-600">Player made a mistake</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Match Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
          <div className="relative bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-primary)] w-full max-w-3xl mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h2 className="text-xl font-bold">Match Information</h2>
                </div>
                <button 
                  onClick={() => setShowInfoModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Compact Match Format Details */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-5 h-5 mr-2 text-blue-500">🎾</span>
                  Match Format
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center mb-1">
                      <span className="text-xs text-blue-600 font-medium">Format</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      {match.matchFormat ? getMatchFormatDisplayName(match.matchFormat) : `Best of ${match.bestOf} sets`}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center mb-1">
                      <span className="text-xs text-green-600 font-medium">Scoring</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      {match.scoringVariation ? 
                        match.scoringVariation.charAt(0).toUpperCase() + match.scoringVariation.slice(1).replace(/([A-Z])/g, ' $1') : 
                        'Standard'
                      }
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="flex items-center mb-1">
                      <span className="text-xs text-purple-600 font-medium">Level</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      Level {match.level}
                    </p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <div className="flex items-center mb-1">
                      <span className="text-xs text-yellow-600 font-medium">Type</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      {match.noAdScoring ? 'No-Ad' : 'Standard'}
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="flex items-center mb-1">
                      <span className="text-xs text-orange-600 font-medium">Tiebreak</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      {(() => {
                        const rules = getMatchRules(
                          match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
                          match.scoringVariation,
                          match.customTiebreakRules,
                          match.noAdScoring
                        );
                        const tiebreakRule = getTiebreakRuleForSet(match.currentSet + 1, rules, match.matchFormat || 'bestOfThree');
                        return `${tiebreakRule} pts`;
                      })()}
                    </p>
                  </div>

                  {match.customTiebreakRules && Object.keys(match.customTiebreakRules).length > 0 && (
                    <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                      <div className="flex items-center mb-1">
                        <span className="text-xs text-indigo-600 font-medium">Custom</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">
                        {Object.entries(match.customTiebreakRules).map(([set, points]) => `S${set}:${points}`).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Compact Match Progress */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-5 h-5 mr-2 text-gray-500">📋</span>
                  Progress
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-medium text-gray-700">
                    {(() => {
                      const rules = getMatchRules(
                        match.matchFormat || convertLegacyMatchType(match.bestOf === 1 ? 'one' : match.bestOf === 3 ? 'three' : 'five'),
                        match.scoringVariation,
                        match.customTiebreakRules,
                        match.noAdScoring
                      );
                      return getMatchProgressDescription(match.sets, rules);
                    })()}
                  </p>
                </div>
              </section>

              {/* Current Status */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-5 h-5 mr-2 text-green-500">✓</span>
                  Current Status
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <h4 className="text-xs text-gray-600 mb-1">Set</h4>
                    <p className="text-lg font-bold text-blue-600">{match.currentSet + 1}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <h4 className="text-xs text-gray-600 mb-1">Status</h4>
                    <p className={`text-sm font-semibold ${
                      isGameRunning ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {isGameRunning ? 'Active' : 'Paused'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <h4 className="text-xs text-gray-600 mb-1">Server</h4>
                    <p className="text-sm font-semibold text-blue-600 truncate">
                      {match.server === 1 ? player1.name.split(' ')[0] : player2.name.split(' ')[0]}
                    </p>
                  </div>
                </div>
              </section>

              {/* Player Information */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-5 h-5 mr-2 text-purple-500">👥</span>
                  Players
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Player 1 */}
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="flex items-center mb-2">
                      <img 
                        src={player1.image} 
                        alt={player1.name} 
                        className="w-8 h-8 rounded-full border-2 border-[#D4FF5A] mr-2"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-gray-800 truncate">{player1.name}</h4>
                        <p className="text-xs text-green-600">P1</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div>
                        <p className="text-xs text-gray-600">S</p>
                        <p className="text-sm font-bold text-gray-800">{player1.sets}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">G</p>
                        <p className="text-sm font-bold text-gray-800">{player1.games}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">P</p>
                        <p className="text-sm font-bold text-gray-800">{player1.points}</p>
                      </div>
                    </div>
                  </div>

                  {/* Player 2 */}
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center mb-2">
                      <img 
                        src={player2.image} 
                        alt={player2.name} 
                        className="w-8 h-8 rounded-full border-2 border-[#4C6BFF] mr-2"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-gray-800 truncate">{player2.name}</h4>
                        <p className="text-xs text-blue-600">P2</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div>
                        <p className="text-xs text-gray-600">S</p>
                        <p className="text-sm font-bold text-gray-800">{player2.sets}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">G</p>
                        <p className="text-sm font-bold text-gray-800">{player2.games}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">P</p>
                        <p className="text-sm font-bold text-gray-800">{player2.points}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Match Statistics */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-5 h-5 mr-2 text-orange-500">📊</span>
                  Statistics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <h4 className="text-xs text-gray-600 mb-1">Time</h4>
                    <p className="text-lg font-mono font-bold text-blue-600">{formatTime(gameTime)}</p>
                  </div>
                  {match.level === 3 && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <h4 className="text-xs text-gray-600 mb-1">Between</h4>
                      <p className="text-lg font-mono font-bold text-green-600">{formatTime(inBetweenTime)}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <h4 className="text-xs text-gray-600 mb-1">Points</h4>
                    <p className="text-lg font-bold text-purple-600">{pointHistory.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <h4 className="text-xs text-gray-600 mb-1">Game Pts</h4>
                    <p className="text-lg font-bold text-orange-600">{currentGameScores.length}</p>
                  </div>
                </div>
              </section>

              {/* Set Scores */}
              <section>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-5 h-5 mr-2 text-red-500">📋</span>
                  Set Scores
                </h3>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="text-xs font-medium text-gray-600">Set</div>
                    <div className="text-xs font-medium text-gray-600 truncate">{player1.name.split(' ')[0]}</div>
                    <div className="text-xs font-medium text-gray-600 truncate">{player2.name.split(' ')[0]}</div>
                    
                    {match.sets.map((set, index) => (
                      <React.Fragment key={index}>
                        <div className="text-sm font-semibold text-gray-800">{index + 1}</div>
                        <div className="text-sm font-bold text-gray-800">{set.player1}</div>
                        <div className="text-sm font-bold text-gray-800">{set.player2}</div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </section>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowInfoModal(false);
                    // Save match state
                    saveMatchState();
                    toast.success('Match state saved! 💾', {
                      duration: 3000,
                      icon: '💾',
                    });
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Save State
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
          <div className="relative bg-[var(--bg-card)] rounded-3xl shadow-2xl border border-[var(--border-primary)] w-full max-w-6xl mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h2 className="text-2xl font-bold">
                    {editingNoteId ? 'Edit Note' : 'Add Note'}
                  </h2>
                </div>
                <button 
                  onClick={() => setShowNoteModal(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side - Note Input */}
                <div className="space-y-6">
                  <div>
                    <label htmlFor="noteInput" className="block text-sm font-medium text-gray-700 mb-2">
                      Note Content
                    </label>
                    <textarea
                      id="noteInput"
                      value={currentNote}
                      onChange={handleNoteInput}
                      placeholder="Enter your note here..."
                      className="w-full h-32 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={() => setShowNoteModal(false)}
                      className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300"
                    >
                      Cancel
                    </button>
                    {editingNoteId ? (
                      <button
                        onClick={updateNote}
                        disabled={!currentNote.trim()}
                        className={`px-6 py-3 rounded-lg font-bold text-white transition-all flex-1 ${
                          currentNote.trim()
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Update Note
                      </button>
                    ) : (
                      <button
                        onClick={addNote}
                        disabled={!currentNote.trim()}
                        className={`px-6 py-3 rounded-lg font-bold text-white transition-all flex-1 ${
                          currentNote.trim()
                            ? 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Add Note
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Side - Existing Notes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Match Notes ({notes.length})
                  </h3>
                  
                  {notes.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {notes.map((note) => (
                        <div key={note.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-800 text-sm leading-relaxed">{note.content}</p>
                              <p className="text-xs text-gray-500 mt-2 font-mono">{note.timestamp}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => editNote(note.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit note"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteNote(note.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete note"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No notes yet</p>
                      <p className="text-sm">Add your first note to track match observations</p>
                    </div>
                  )}
                </div>
              </div>


            </div>
          </div>
        </div>
      )}

    </div>
    </>
  );
};

export default MatchTracker;