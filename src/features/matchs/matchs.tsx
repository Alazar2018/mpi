import Button from "@/components/Button";
import icons from "@/utils/icons";
import { Link, useLocation } from "react-router-dom";
import { useApiRequest } from "@/hooks/useApiRequest";
import { getUpcomingMatches, getCompletedMatches, getSavedMatches, deleteMatch } from "./api/matchs.api";
import { matchesService, type Match } from "@/service/matchs.server";
import { useEffect, useState } from "react";
import VersusSkeleton from "@/components/skeletons/VersusSkeleton";
import { useAuthStore } from "@/store/auth.store";
import { Carousel } from "@/components/Carousel";
import { toast } from "react-toastify";
import { useDialog } from "@/components/Dialog";

// Helper function to get player display name
const getPlayerDisplayName = (match: Match, playerKey: 'p1' | 'p2'): string => {
    const player = match[playerKey];
    
    if (player && typeof player === 'object' && 'firstName' in player) {
        return `${player.firstName} ${player.lastName}`;
    }
    
    // Handle case where p1 is a string name (non-registered player)
    if (playerKey === 'p1' && typeof player === 'string') {
        return player;
    }
    
    // Handle case where p2 is a string name (non-registered player)
    if (playerKey === 'p2' && typeof player === 'string') {
        return player;
    }
    
    // Handle case where p1Name exists (fallback)
    if (playerKey === 'p1' && match.p1Name) {
        return match.p1Name;
    }
    
    // Handle case where p2Name exists (fallback)
    if (playerKey === 'p2' && match.p2Name) {
        return match.p2Name;
    }
    
    return `Player ${playerKey === 'p1' ? '1' : '2'}`;
};

// Helper function to get player avatar
const getPlayerAvatar = (match: Match, playerKey: 'p1' | 'p2'): string => {
    const player = match[playerKey];
    if (player && typeof player === 'object' && 'avatar' in player) {
        return player.avatar || "https://randomuser.me/api/portraits/men/32.jpg";
    }
    return "https://randomuser.me/api/portraits/men/32.jpg";
};

// Helper function to get player USDTA rating
const getPlayerUSDTA = (match: Match, playerKey: 'p1' | 'p2'): string => {
    const player = match[playerKey];
    if (player && typeof player === 'object' && 'usdtaRating' in player) {
        return player.usdtaRating ? `USDTA: ${player.usdtaRating}` : 'USDTA: N/A';
    }
    return 'USDTA: N/A';
};

export default function Matches() {
    const { user } = useAuthStore();
    const location = useLocation();
    const [activeFilter, setActiveFilter] = useState<'completed' | 'saved' | 'all'>('completed');

    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [matchesPerPage] = useState(9);
    const { showDialog, Dialog } = useDialog();
    
    const upcomingMatchesReq = useApiRequest<{matches: Match[]}>({
        cacheKey: "upcoming-matches",
        freshDuration: 1000 * 60 * 2, // 2 minutes
        staleWhileRevalidate: true,
    });

    const completedMatchesReq = useApiRequest<{matches: Match[]}>({
        cacheKey: "completed-matches",
        freshDuration: 1000 * 60 * 5, // 5 minutes
        staleWhileRevalidate: true,
    });

    const savedMatchesReq = useApiRequest<{matches: Match[]}>({
        cacheKey: "saved-matches",
        freshDuration: 1000 * 60 * 2, // 2 minutes
        staleWhileRevalidate: true,
    });

    useEffect(() => {
        // Refresh all data when component mounts (e.g., after creating a new match)
        const refreshAllData = () => {
            // Invalidate cache and refresh upcoming matches
            upcomingMatchesReq.refresh(
                () => getUpcomingMatches(),
                (res) => {
                    if (res.success && res.data) {
                        // Data loaded successfully
                    } else {
                        // Handle error
                    }
                }
            );
            
            // Invalidate cache and refresh completed matches
            completedMatchesReq.refresh(
                () => getCompletedMatches(),
                (res) => {
                    if (res.success && res.data) {
                        // Data loaded successfully
                    }
                }
            );
            
            // Invalidate cache and refresh saved matches
            savedMatchesReq.refresh(
                () => getSavedMatches(),
                (res) => {
                    if (res.success && res.data) {
                        // Data loaded successfully
                    }
                }
            );
        };
        
        refreshAllData();
        
        // Refresh data when user navigates back to this page
        const handleFocus = () => {
            refreshAllData();
        };
        
        window.addEventListener('focus', handleFocus);
        
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);
    
    // Refresh data when navigating back to this page
    useEffect(() => {
        const refreshAllData = () => {
            upcomingMatchesReq.refresh(
                () => getUpcomingMatches(),
                (res) => {
                    if (res.success && res.data) {
                        // Data loaded successfully
                    }
                }
            );
            
            completedMatchesReq.refresh(
                () => getCompletedMatches(),
                (res) => {
                    if (res.success && res.data) {
                        // Data loaded successfully
                    }
                }
            );
            
            savedMatchesReq.refresh(
                () => getSavedMatches(),
                (res) => {
                    if (res.success && res.data) {
                        // Data loaded successfully
                    }
                }
            );
        };
        
        refreshAllData();
    }, [location.pathname]);

    useEffect(() => {
        // Load data based on active filter
        if (activeFilter === 'completed') {
            completedMatchesReq.send(
                () => getCompletedMatches(),
                (res) => {
                    if (res.success && res.data) {
                       
                    }
                }
            );
        } else if (activeFilter === 'saved') {
            savedMatchesReq.send(
                () => getSavedMatches(),
                (res) => {
                    if (res.success && res.data) {
                       
                    }
                }
            );
        }
    }, [activeFilter]);

    const upcomingMatches = upcomingMatchesReq.response?.matches || [];
    const completedMatches = completedMatchesReq.response?.matches || [];
    const savedMatches = savedMatchesReq.response?.matches || [];

    // Get current matches based on active filter
    const getCurrentMatches = () => {
        let matches: Match[] = [];
        switch (activeFilter) {
            case 'completed':
                matches = [...completedMatches];
                break;
            case 'saved':
                matches = [...savedMatches];
                break;
            case 'all':
                matches = [...completedMatches, ...savedMatches];
                break;
            default:
                matches = [];
        }
        
        // Sort matches by date in descending order (latest first)
        return matches.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        });
    };

    const currentMatches = getCurrentMatches();
    const isLoading = upcomingMatchesReq.pending || completedMatchesReq.pending || savedMatchesReq.pending;

    // Pagination calculations
    const totalMatches = currentMatches.length;
    const totalPages = Math.ceil(totalMatches / matchesPerPage);
    const startIndex = (currentPage - 1) * matchesPerPage;
    const endIndex = startIndex + matchesPerPage;
    const currentMatchesPage = currentMatches.slice(startIndex, endIndex);

    // Reset to first page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter]);

    // Pagination handlers
    const goToPage = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    };

    const canScheduleMatch = ["coach", "parent", "player"].includes(user?.role || "");

    // Delete match function
    const handleDeleteMatch = async (matchId: string) => {
        // Show confirmation dialog
        showDialog({
            title: "Delete Match",
            message: "This action will permanently remove the match and all associated data. This cannot be undone. Are you sure you want to continue?",
            buttons: [
                {
                    text: "Cancel",
                    variant: "outlined",
                    onClick: () => {
                        // Do nothing, dialog will close automatically
                    }
                },
                {
                    text: "Delete Match",
                    variant: "contained",
                    onClick: async () => {
                        // Show info toast that delete operation is starting
                        toast.info('Starting delete operation... ⚠️');
                        await performDelete(matchId);
                    }
                }
            ]
        });
    };

    // Perform the actual delete operation
    const performDelete = async (matchId: string) => {
        setIsDeleting(true);
        
        // Show loading toast
        const loadingToast = toast.loading('Deleting match... 🗑️');
        
        try {
            const response = await deleteMatch(matchId);
            if (response.success) {
                // Dismiss loading toast and show success
                toast.dismiss(loadingToast);
                toast.success('Match deleted successfully! 🗑️');
                
                // Refresh the current data based on active filter
                if (activeFilter === 'completed') {
                    completedMatchesReq.send(
                        () => getCompletedMatches(),
                        (res) => {
                            if (res.success && res.data) {
                               
                            }
                        }
                    );
                } else if (activeFilter === 'saved') {
                    savedMatchesReq.send(
                        () => getSavedMatches(),
                        (res) => {
                            if (res.success && res.data) {
                               
                            }
                        }
                    );
                }
                
                // Also refresh upcoming matches
                upcomingMatchesReq.send(
                    () => getUpcomingMatches(),
                    (res) => {
                        if (res.success && res.data) {
                                
                        }
                    }
                );

            } else {
                // Dismiss loading toast and show error
                toast.dismiss(loadingToast);
                toast.error(`Failed to delete match: ${response.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting match:', error);
            // Dismiss loading toast and show error
            toast.dismiss(loadingToast);
            toast.error('Failed to delete match. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-[var(--text-secondary)] dark:text-gray-300">Loading user data...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 sm:gap-8 bg-[var(--bg-primary)] min-h-screen p-3 sm:p-6">
            <div className="bg-[var(--bg-card)] rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-sm">
            {/* Pending Match Section */}
            <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] dark:text-white">Pending Match</h2>
                    {canScheduleMatch && (
                        <Link to="/admin/matchs/new">
                            <Button type="action" className="rounded-full gap-2 text-sm sm:text-base px-3 sm:px-4 py-2">
                                <span dangerouslySetInnerHTML={{ __html: icons.plus }} />
                                Schedule Match
                            </Button>
                        </Link>
                    )}
                </div>

                {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Array(2).fill(1).map((_, idx) => (
                                <VersusSkeleton key={idx} />
                            ))}
                        </div>
                ) : upcomingMatches.length > 0 ? (
                    <Carousel items={upcomingMatches} className="w-full">
                        {(match: Match) => (
                            <Link to={`detail/${match._id}`} key={match._id}>
                                        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-3 sm:p-6 shadow-sm cursor-pointer hover:shadow-md transition-all w-full">
                                            <div className="flex items-center justify-between gap-1 sm:gap-2 lg:gap-4">
                                                {/* Player 1 */}
                                                <div className="flex flex-col items-center">
                                                    <div className="relative">
                                                        <img
                                                            src={getPlayerAvatar(match, 'p1')}
                                                            alt={getPlayerDisplayName(match, 'p1')}
                                                            className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 border-[var(--border-primary)]"
                                                        />
                                                        <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                                            B
                                                        </div>
                                                    </div>
                                                    <span className="font-semibold text-xs sm:text-sm lg:text-base text-center mt-2 sm:mt-3 text-[var(--text-primary)] dark:text-white max-w-[60px] sm:max-w-none truncate">
                                                        {getPlayerDisplayName(match, 'p1')}
                                                    </span>
                                                    <span className="text-xs text-[var(--text-secondary)] dark:text-gray-400 mt-1">
                                                        {getPlayerUSDTA(match, 'p1')}
                                                    </span>
                                                </div>

                                                {/* VS Card */}
                                                <div className="bg-[var(--bg-secondary)] dark:bg-gray-700 rounded-lg sm:rounded-xl p-1 sm:p-2 lg:p-4 text-center min-w-[60px] sm:min-w-[80px] lg:min-w-[120px]">
                                                    <p className="text-xs text-[var(--text-secondary)] dark:text-gray-400 mb-1 sm:mb-2 lg:mb-3 font-medium">
                                                        {matchesService.formatMatchDate(match.date)}
                                                    </p>
                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-1 sm:mb-2 lg:mb-3">
                                                        <span className="text-white text-xs sm:text-sm lg:text-lg font-bold">VS</span>
                                                    </div>
                                                    <div className="bg-green-500 text-white text-xs px-1 sm:px-2 lg:px-3 py-1 sm:py-2 rounded-lg font-medium">
                                                        {matchesService.formatMatchTime(match.date)}
                                                    </div>
                                                </div>

                                                {/* Player 2 */}
                                                <div className="flex flex-col items-center">
                                                    <div className="relative">
                                                        <img
                                                            src={getPlayerAvatar(match, 'p2')}
                                                            alt={getPlayerDisplayName(match, 'p2')}
                                                            className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 border-[var(--border-primary)]"
                                                        />
                                                        <div className="absolute -top-1 -left-1 w-5 h-5 sm:w-6 sm:h-6 bg-gray-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                                                            A
                                                        </div>
                                                    </div>
                                                    <span className="font-semibold text-xs sm:text-sm lg:text-base text-center mt-2 sm:mt-3 text-[var(--text-primary)] dark:text-white max-w-[60px] sm:max-w-none truncate">
                                                        {getPlayerDisplayName(match, 'p2')}
                                                    </span>
                                                    <span className="text-xs text-[var(--text-secondary)] dark:text-gray-400 mt-1">
                                                        {getPlayerUSDTA(match, 'p2')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                            )}
                        </Carousel>
                ) : (
                    <div className="text-center py-6 sm:py-8 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded-xl">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 bg-[var(--bg-tertiary)] dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-xl sm:text-2xl">🎾</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] dark:text-white mb-2">No pending matches</h3>
                        <p className="text-sm sm:text-base text-[var(--text-secondary)] dark:text-gray-300 mb-4">Schedule your first match to get started!</p>
                        {canScheduleMatch && (
                            <Link to="/admin/matchs/new">
                                <Button type="action" className="rounded-full gap-2 text-sm sm:text-base px-3 sm:px-4 py-2">
                                    <span dangerouslySetInnerHTML={{ __html: icons.plus }} />
                                    Schedule Match
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>

            {/* Recent Matches Section */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] dark:text-white">Recent Matches</h2>
                    <Link to="/admin/matchs">
                        <Button type="secondary" className="rounded-full">
                            View All
                        </Button>
                    </Link>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 border-b border-[var(--border-primary)]">
                    <button
                        onClick={() => setActiveFilter('completed')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeFilter === 'completed'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white'
                        }`}
                    >
                        Completed
                    </button>
                    <button
                        onClick={() => setActiveFilter('saved')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeFilter === 'saved'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white'
                        }`}
                    >
                        Saved
                    </button>
                    <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-4 py-2 text-sm font-medium transition-colors ${
                            activeFilter === 'all'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white'
                        }`}
                    >
                        All
                    </button>
            </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array(6).fill(1).map((_, idx) => (
                            <div key={idx} className="bg-[var(--bg-secondary)] dark:bg-gray-700 rounded-xl p-4 h-32 animate-pulse" />
                        ))}
                    </div>
                ) : currentMatches.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {currentMatchesPage.map((match) => {
                                // Check if this is a tiebreak-only match
                                const isTiebreakOnly = match.matchFormat && match.matchFormat.startsWith('tiebreak');
                                
                                // Calculate actual match statistics from the data
                                const totalSets = match.sets?.length || 0;
                                // For tiebreak-only matches, use p1TotalScore/p2TotalScore, otherwise use p1Score/p2Score
                                const p1WonSets = match.sets?.filter(set => {
                                    const p1Score = set.p1TotalScore ?? set.p1Score ?? 0;
                                    const p2Score = set.p2TotalScore ?? set.p2Score ?? 0;
                                    return p1Score > p2Score;
                                }).length || 0;
                                const p2WonSets = match.sets?.filter(set => {
                                    const p1Score = set.p1TotalScore ?? set.p1Score ?? 0;
                                    const p2Score = set.p2TotalScore ?? set.p2Score ?? 0;
                                    return p2Score > p1Score;
                                }).length || 0;
                                
                                // Get actual statistics from match sets (if available)
                                let p1TotalAces = 0;
                                let p2TotalAces = 0;
                                let p1TotalDoubleFaults = 0;
                                let p2TotalDoubleFaults = 0;
                                
                                if (match.sets && match.sets.length > 0) {
                                    match.sets.forEach(set => {
                                        if (set.p1SetReport?.service) {
                                            p1TotalAces += set.p1SetReport.service.aces || 0;
                                            p1TotalDoubleFaults += set.p1SetReport.service.doubleFaults || 0;
                                        }
                                        if (set.p2SetReport?.service) {
                                            p2TotalAces += set.p2SetReport.service.aces || 0;
                                            p2TotalDoubleFaults += set.p2SetReport.service.doubleFaults || 0;
                                        }
                                    });
                                }
                                
                                // Calculate total game time if available
                                const totalGameTime = match.totalGameTime || 0;
                                const gameTimeMinutes = Math.floor(totalGameTime / 60);
                                const gameTimeSeconds = totalGameTime % 60;
                                const formattedGameTime = totalGameTime > 0 
                                    ? `${gameTimeMinutes.toString().padStart(2, '0')}:${gameTimeSeconds.toString().padStart(2, '0')}`
                                    : '00:00';

                                // Check if there's any meaningful data to display
                                const hasMeaningfulData = formattedGameTime !== '00:00' || 
                                                       (p1TotalAces > 0 || p2TotalAces > 0) || 
                                                       (p1TotalDoubleFaults > 0 || p2TotalDoubleFaults > 0) || 
                                                       totalSets > 0;

                                // If no meaningful data, don't render the card
                                if (!hasMeaningfulData) {
                                    return null;
                                }

                                return (
                                    <div key={match._id} className="bg-[var(--bg-secondary)] dark:bg-gray-700 border border-[var(--border-primary)] rounded-xl p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-bold text-[var(--text-primary)] dark:text-white text-sm">
                                                {match.winner === 'playerOne' ? (
                                                    <>
                                                        <span className="text-lg text-green-600 font-bold">
                                                            {getPlayerDisplayName(match, 'p1')}
                                                        </span>
                                                        <span className="text-[var(--text-primary)] dark:text-white"> Vs </span>
                                                        <span className="text-[var(--text-secondary)] dark:text-gray-400">
                                                            {getPlayerDisplayName(match, 'p2')}
                                                        </span>
                                                    </>
                                                ) : match.winner === 'playerTwo' ? (
                                                    <>
                                                        <span className="text-[var(--text-secondary)] dark:text-gray-400">
                                                            {getPlayerDisplayName(match, 'p1')}
                                                        </span>
                                                        <span className="text-[var(--text-primary)] dark:text-white"> Vs </span>
                                                        <span className="text-lg text-green-600 font-bold">
                                                            {getPlayerDisplayName(match, 'p2')}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-[var(--text-secondary)] dark:text-gray-400">
                                                            {getPlayerDisplayName(match, 'p1')}
                                                        </span>
                                                        <span className="text-[var(--text-primary)] dark:text-white"> Vs </span>
                                                        <span className="text-[var(--text-secondary)] dark:text-gray-400">
                                                            {getPlayerDisplayName(match, 'p2')}
                                                        </span>
                                                    </>
                                                )}
                                            </h3>
                                            {activeFilter === 'saved' && (
                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                                    Saved
                                            </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400 mb-3">
                                            {matchesService.formatMatchDate(match.date)} {matchesService.formatMatchTime(match.date)}
                                        </p>
                                        
                                        <div className="space-y-2 mb-4">
                                            {formattedGameTime !== '00:00' && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[var(--text-secondary)] dark:text-gray-400">Time</span>
                                                    <span className="font-medium">{formattedGameTime}</span>
                                                </div>
                                            )}
                                            {(p1TotalAces > 0 || p2TotalAces > 0) && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[var(--text-secondary)] dark:text-gray-400">Aces</span>
                                                    <span className="font-medium">{p1TotalAces}-{p2TotalAces}</span>
                                                </div>
                                            )}
                                            {(p1TotalDoubleFaults > 0 || p2TotalDoubleFaults > 0) && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[var(--text-secondary)] dark:text-gray-400">Double Fault</span>
                                                    <span className="font-medium">{p1TotalDoubleFaults}-{p2TotalDoubleFaults}</span>
                                                </div>
                                            )}
                                            {totalSets > 0 && !isTiebreakOnly && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-[var(--text-secondary)] dark:text-gray-400">Sets</span>
                                                    <span className="font-medium">{p1WonSets}-{p2WonSets}</span>
                                            </div>
                                            )}
                                        </div>

                                        {/* Only show set scores section if there are meaningful scores and not tiebreak-only */}
                                        {!isTiebreakOnly && match.sets && match.sets.length > 0 && match.sets.some(set => {
                                            const p1Score = set.p1TotalScore ?? set.p1Score ?? 0;
                                            const p2Score = set.p2TotalScore ?? set.p2Score ?? 0;
                                            return p1Score > p2Score || p2Score > p1Score;
                                        }) && (
                                            <div className="mb-4">
                                                                                        <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400 mb-1">Set Scores:</p>
                                        <div className="text-xs text-[var(--text-tertiary)] dark:text-gray-500 space-y-1">
                                                    {match.sets.map((set, index) => {
                                                        const p1Score = set.p1TotalScore ?? set.p1Score ?? 0;
                                                        const p2Score = set.p2TotalScore ?? set.p2Score ?? 0;
                                                        return (
                                                            <div key={set._id || index} className="flex justify-between">
                                                                <span>Set {index + 1}:</span>
                                                                <span>{p1Score}-{p2Score}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Show tiebreak score for tiebreak-only matches */}
                                        {isTiebreakOnly && match.sets && match.sets.length > 0 && match.sets[0] && (
                                            <div className="mb-4">
                                                <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400 mb-1">Score:</p>
                                                <div className="text-xs text-[var(--text-tertiary)] dark:text-gray-500">
                                                    <div className="flex justify-between">
                                                        <span>Tiebreak:</span>
                                                        <span>{match.sets[0].p1TotalScore ?? 0}-{match.sets[0].p2TotalScore ?? 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Only show statistics section if there's meaningful data */}
                                        {((p1TotalAces > 0 || p2TotalAces > 0) || 
                                          (p1TotalDoubleFaults > 0 || p2TotalDoubleFaults > 0) || 
                                          (totalSets > 0)) && (
                                            <div className="mb-4">
                                                                                        <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400 mb-1">Match Statistics:</p>
                                        <div className="text-xs text-[var(--text-tertiary)] dark:text-gray-500">
                                                    {p1TotalAces > 0 || p2TotalAces > 0 ? (
                                                        <div className="flex justify-between mb-1">
                                                            <span>Aces:</span>
                                                            <span>{p1TotalAces}-{p2TotalAces}</span>
                                                        </div>
                                                    ) : null}
                                                    {p1TotalDoubleFaults > 0 || p2TotalDoubleFaults > 0 ? (
                                                        <div className="flex justify-between mb-1">
                                                            <span>Double Faults:</span>
                                                            <span>{p1TotalDoubleFaults}-{p2TotalDoubleFaults}</span>
                                                        </div>
                                                    ) : null}
                                                    {totalSets > 0 && !isTiebreakOnly ? (
                                                        <div className="flex justify-between">
                                                            <span>Sets Won:</span>
                                                            <span>{p1WonSets}-{p2WonSets}</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-end gap-2">
                                            <Link to={`detail/${match._id}`}>
                                                <Button type="action" size="xs" className="rounded-full">
                                                    {activeFilter === 'saved' ? 'View' : 'Result'}
                                                </Button>
                                            </Link>
                                            <Button 
                                                type="secondary" 
                                                size="xs" 
                                                className="rounded-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteMatch(match._id)}
                                                disabled={isDeleting}
                                                aria-label={`Delete match between ${getPlayerDisplayName(match, 'p1')} and ${getPlayerDisplayName(match, 'p2')}`}
                                            >
                                                {isDeleting ? 'Deleting...' : 'Delete'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <Button
                                
                                    type="secondary"
                                    size="xs"
                                    onClick={goToPreviousPage}
                                    disabled={currentPage === 1}
                                    className="rounded-full"
                                >
                                    Previous
                                </Button>
                                
                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, index) => {
                                        const pageNumber = index + 1;
                                        const isCurrentPage = pageNumber === currentPage;
                                        
                                        // Show first page, last page, current page, and pages around current
                                        if (
                                            pageNumber === 1 ||
                                            pageNumber === totalPages ||
                                            (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNumber}
                                                    onClick={() => goToPage(pageNumber)}
                                                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                                                        isCurrentPage
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-[var(--bg-secondary)] dark:bg-gray-700 text-[var(--text-primary)] dark:text-white hover:bg-[var(--bg-tertiary)] dark:hover:bg-gray-600'
                                                    }`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        }
                                        
                                        // Show ellipsis for gaps
                                        if (
                                            pageNumber === currentPage - 2 ||
                                            pageNumber === currentPage + 2
                                        ) {
                                            return (
                                                <span key={pageNumber} className="text-[var(--text-secondary)] dark:text-gray-400">
                                                    ...
                                                </span>
                                            );
                                        }
                                        
                                        return null;
                                    })}
                                </div>
                                
                                <Button
                                    type="secondary"
                                    size="xs"
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="rounded-full"
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                        
                        {/* Results Summary */}
                        <div className="text-center text-sm text-[var(--text-secondary)] dark:text-gray-400 mt-4">
                            Showing {startIndex + 1}-{Math.min(endIndex, totalMatches)} of {totalMatches} matches
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 bg-[var(--bg-secondary)] dark:bg-gray-700 rounded-xl">
                        <div className="w-16 h-16 mx-auto mb-3 bg-[var(--bg-tertiary)] dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-2xl">🏆</span>
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] dark:text-white mb-2">
                            {activeFilter === 'completed' ? 'No completed matches' : 
                             activeFilter === 'saved' ? 'No saved matches' : 'No matches found'}
                        </h3>
                        <p className="text-[var(--text-secondary)] dark:text-gray-300">
                            {activeFilter === 'completed' ? 'Complete your first match to see results here!' :
                             activeFilter === 'saved' ? 'Save matches as drafts to resume later!' :
                             'No matches available for the selected filter.'}
                        </p>
                    </div>
                )}
            </div>
            </div>
            <Dialog />
        </div>
    );
}