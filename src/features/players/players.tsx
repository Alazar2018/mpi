import { useState } from "react";
import Button from "@/components/Button";
import PlayersCard from "@/components/PlayersCard";
import FriendRequestCard from "@/components/FriendRequestCard";
import icons from "@/utils/icons";
import { usePlayers } from "@/hooks/usePlayers";
import { useFriendRequests } from "@/hooks/useFriendRequests";
import { useAuthStore } from "@/store/auth.store";
import { usePlayerMessaging } from "@/hooks/usePlayerMessaging";
import { playersService } from "@/service/players.server";
import { inviteService } from "@/service/invite.server";

export default function Players() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  
  // Get current user's role to determine what to display
  const authStore = useAuthStore();
  const currentUserRole = authStore.getRole();
  
  // Debug: Log API config values and test URL construction
  console.log('API Config Debug:', {
    BASE_URL: 'https://mpiglobal.org',
    PLAYERS_LIST: '/api/v1/users/players',
    PLAYERS_SEARCH: '/api/v1/users/players/search'
  });
  
  // Test URL construction
  playersService.testUrlConstruction();
  
  const {
    players,
    loading,
    error,
    totalPlayers,
    currentPage,
    totalPages,
    fetchPlayers,
    searchPlayers,
    clearSearch
  } = usePlayers({ limit: 9 });

  // Friend requests hook
  const {
    friendRequests,
    loading: friendRequestsLoading,
    error: friendRequestsError,
    totalRequests,
    acceptFriendRequest,
    rejectFriendRequest,
    refreshFriendRequests
  } = useFriendRequests({ limit: 3, autoRefresh: true });



  // Handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchPlayers(searchQuery.trim());
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value === "") {
      setSearchQuery('');
      clearSearch();
      // Explicitly pass empty string to fetchPlayers to ensure we call /players endpoint
      fetchPlayers(1, '');
    }
  };

  // Handle search on Enter key
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchPlayers(page, searchQuery);
    }
  };

  // Handle send invite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    
    if (!inviteEmail.trim() || !selectedRelationship) {
      setInviteError("Please fill in all fields");
      return;
    }

    setIsSendingInvite(true);

    try {
      // Validate relationship type
      if (!inviteService.isValidRelationship(currentUserRole || '', selectedRelationship)) {
        setInviteError("Invalid relationship type for your role");
        return;
      }

      // Send invitation
      await inviteService.sendInvite({
        email: inviteEmail.trim(),
        relationship: selectedRelationship as 'parent' | 'coach' | 'child' | 'player' | 'join'
      });
      
      setInviteSuccess("Connection invite sent successfully!");
      setInviteEmail("");
      setSelectedRelationship("");
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setInviteSuccess("");
      }, 5000);
      
    } catch (error: any) {
      setInviteError(error.message || "Failed to send connection invite");
    } finally {
      setIsSendingInvite(false);
    }
  };

  // Get available relationships based on current user's role
  const getAvailableRelationships = () => {
    return inviteService.getAvailableRelationships(currentUserRole || '');
  };

  // Get the appropriate title and description based on user role
  const getPageTitle = () => {
    switch (currentUserRole) {
      case 'parent':
        return 'My Children';
      case 'coach':
        return 'Players';
      default:
        return 'Players';
    }
  };

  const getPageDescription = () => {
    switch (currentUserRole) {
      case 'parent':
        return 'View and manage your children\'s profiles and progress';
      case 'coach':
        return 'Manage your players and their training programs';
      default:
        return 'View and manage player profiles';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative isolate rounded-3xl overflow-hidden min-h-[20rem] shadow-[var(--shadow-primary)] transition-colors duration-300 bg-gradient-to-br from-[var(--bg-card)] via-[var(--bg-secondary)] to-[var(--bg-card)]">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 z-0"></div>
        <img
          src="/stuff.jpg"
          className="absolute inset-0 max-w-full object-cover w-full h-full opacity-10 z-0"
          alt="Hero background"
        />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-10 md:py-12">
          {/* Icon and Title Section */}
          <div className="text-center mb-8 w-full max-w-3xl">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg border border-primary/20">
              <span className="text-4xl">
                {currentUserRole === 'parent' ? '👶' : '🎾'}
              </span>
            </div>
            <h1 className="font-bold text-3xl md:text-4xl text-[var(--text-primary)] mb-3">
              {currentUserRole === 'parent' ? 'Add your child to the platform' : 'Invite new player via email'}
            </h1>
            <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-2xl mx-auto">
              {currentUserRole === 'parent' 
                ? 'Connect with coaches and track progress together'
                : 'Expand your team with talented players'
              }
            </p>
          </div>
          
          {/* Form Section for Coach */}
          {currentUserRole === 'coach' && (
            <div className="w-full max-w-4xl">
              <form onSubmit={handleSendInvite} className="flex flex-col gap-4 bg-[var(--bg-card)]/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-[var(--border-primary)] shadow-xl">
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                  <div className="flex items-center flex-1 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-primary)] transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <div className="pl-4 pr-2 flex-shrink-0">
                      <i dangerouslySetInnerHTML={{ __html: icons.mail }} className="text-[var(--text-tertiary)] text-lg" />
                    </div>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 placeholder:text-[var(--text-tertiary)] text-sm pl-2 pr-4 h-14 bg-transparent rounded-2xl outline-none border-none text-[var(--text-primary)] focus:outline-none focus:ring-0"
                      disabled={isSendingInvite}
                      required
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={selectedRelationship}
                      onChange={(e) => setSelectedRelationship(e.target.value)}
                      className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-2xl h-14 pl-6 pr-10 border border-[var(--border-primary)] outline-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm min-w-[180px] transition-all appearance-none cursor-pointer w-full"
                      disabled={isSendingInvite}
                      required
                    >
                      <option value="">Select Type</option>
                      {getAvailableRelationships().map((relationship) => (
                        <option key={relationship.value} value={relationship.value}>
                          {relationship.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <i dangerouslySetInnerHTML={{ __html: icons.arrowDown }} className="text-[var(--text-tertiary)]" />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingInvite}
                    className="bg-primary text-white rounded-2xl h-14 px-8 hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    {isSendingInvite ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Sending...
                      </span>
                    ) : (
                      'Invite Player'
                    )}
                  </button>
                </div>
                
                {/* Error Message */}
                {inviteError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl animate-in slide-in-from-top-2">
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <span>⚠️</span>
                      {inviteError}
                    </p>
                  </div>
                )}
                
                {/* Success Message */}
                {inviteSuccess && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl animate-in slide-in-from-top-2">
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <span>✅</span>
                      {inviteSuccess}
                    </p>
                  </div>
                )}
              </form>
            </div>
          )}
          
          {/* Parent Section */}
          {currentUserRole === 'parent' && (
            <div className="w-full max-w-2xl">
              <div className="bg-[var(--bg-card)]/80 backdrop-blur-md rounded-3xl p-8 border border-[var(--border-primary)] shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div>
                    <p className="text-[var(--text-primary)] text-lg font-semibold mb-2">Contact your coach</p>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                      Reach out to your child's coach to get them added to the platform and start tracking their progress
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-[var(--bg-card)] rounded-3xl p-6 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center flex-1 bg-[var(--bg-secondary)] rounded-2xl pr-4 border border-[var(--border-primary)] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="pl-4 pr-2">
                <span className="text-[var(--text-tertiary)]">🔍</span>
              </div>
              <input
                placeholder={currentUserRole === 'parent' ? 'Search your children by name...' : 'Search players by name or email...'}
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                className="w-full placeholder:text-[var(--text-tertiary)] text-sm h-12 bg-transparent outline-none text-[var(--text-primary)] focus:outline-none focus:ring-0"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    clearSearch();
                    // Explicitly pass empty string to fetchPlayers to ensure we call /players endpoint
                    fetchPlayers(1, '');
                  }}
                  className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors mr-2"
                  type="button"
                >
                  <i dangerouslySetInnerHTML={{ __html: icons.close }} className="text-[var(--text-tertiary)] text-sm" />
                </button>
              )}
            </div>
            <Button 
              onClick={handleSearch}
              className="bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl !h-12 px-8 hover:bg-[var(--bg-secondary)] transition-colors duration-300"
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? '🔍 Searching...' : currentUserRole === 'parent' ? 'Find Child' : 'Search'}
            </Button>
          </div>
          
          {/* Active Search Indicator */}
          {searchQuery && !loading && (
            <div className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-xl p-3 border border-[var(--border-primary)]">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)] text-sm">🔍</span>
                <span className="text-[var(--text-secondary)] text-sm">
                  Showing results for: <span className="font-semibold text-[var(--text-primary)]">"{searchQuery}"</span>
                </span>
                {totalPlayers !== undefined && (
                  <span className="text-[var(--text-tertiary)] text-xs">
                    ({totalPlayers} {totalPlayers === 1 ? 'result' : 'results'})
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  clearSearch();
                  // Explicitly pass empty string to fetchPlayers to ensure we call /players endpoint
                  fetchPlayers(1, '');
                }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors flex items-center gap-1"
                type="button"
              >
                <span>Clear search</span>
                <i dangerouslySetInnerHTML={{ __html: icons.close }} className="text-xs" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Players/Children Section */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="bg-[var(--bg-card)] rounded-3xl p-6 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center border border-[var(--border-primary)]">
                  <span className="text-2xl text-[var(--text-primary)]">
                    {currentUserRole === 'parent' ? '👶' : '🎾'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                    {searchQuery ? `Search Results` : getPageTitle()}
                  </h2>
                  <p className="text-[var(--text-secondary)]">
                    {searchQuery 
                      ? `Found ${totalPlayers || 0} ${currentUserRole === 'parent' ? 'children' : 'players'} matching "${searchQuery}"`
                      : getPageDescription()
                    }
                  </p>
                </div>
              </div>
              {!loading && totalPlayers !== undefined && (
                <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2 rounded-full text-sm font-medium border border-[var(--border-primary)]">
                  {totalPlayers} {currentUserRole === 'parent' ? 'child' : 'player'}{totalPlayers !== 1 ? 'ren' : ''}
                </div>
              )}
            </div>
            
            {/* Debug Info */}
            {/* <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
              <p>Debug: players={players?.length || 0}, loading={loading.toString()}, error={error || 'none'}</p>
              <p>totalPlayers={totalPlayers}, currentPage={currentPage}, totalPages={totalPages}</p>
            </div> */}
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-[var(--bg-secondary)] rounded-2xl p-6 animate-pulse transition-colors duration-300">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-2xl"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-[var(--bg-tertiary)] rounded w-3/4"></div>
                        <div className="h-4 bg-[var(--bg-tertiary)] rounded w-1/2"></div>
                        <div className="h-4 bg-[var(--bg-tertiary)] rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl border border-red-200 dark:border-red-700 transition-colors duration-300">
                <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
                <p className="text-red-600 dark:text-red-400 text-lg mb-6">{error}</p>
                <div className="flex justify-center">
                  <Button 
                    onClick={() => fetchPlayers(currentPage, searchQuery)} 
                    className="bg-[var(--bg-primary)] text-[var(--text-primary)] px-8 py-3 rounded-full hover:bg-[var(--bg-secondary)] transition-colors duration-300"
                  >
                    {currentUserRole === 'parent' ? '🔄 Refresh Children' : '🔄 Try Again'}
                  </Button>
                </div>
              </div>
            ) : !players || players.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 rounded-2xl border border-gray-200 dark:border-gray-600 transition-colors duration-300">
                <div className="text-gray-400 dark:text-gray-500 text-8xl mb-6">
                  {currentUserRole === 'parent' ? '👶' : '🎾'}
                </div>
                <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-4">
                  {searchQuery 
                    ? `No ${currentUserRole === 'parent' ? 'children' : 'players'} found matching your search.`
                    : `No ${currentUserRole === 'parent' ? 'children' : 'players'} found.`
                  }
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {searchQuery 
                    ? 'Try adjusting your search terms or check the spelling.'
                    : currentUserRole === 'parent' 
                      ? 'Contact your coach to get your child added to the platform.'
                      : 'Start by inviting players to join your team.'
                  }
                </p>
                {searchQuery && (
                  <Button 
                    onClick={() => {
                      setSearchQuery('');
                      clearSearch();
                      // Explicitly pass empty string to fetchPlayers to ensure we call /players endpoint
                      fetchPlayers(1, '');
                    }} 
                    className="bg-[var(--bg-primary)] text-[var(--text-primary)] px-8 py-3 rounded-full hover:bg-[var(--bg-secondary)] transition-colors duration-300"
                  >
                    {currentUserRole === 'parent' ? '🔄 Show All Children' : '🔄 Clear Search'}
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {players && players.map((player) => {
                    if (!player || !player._id) {
                      console.warn('Invalid player data:', player);
                      return null;
                    }
                    return (
                      <div key={player._id} className="group">
                        <div 
                          className="transform group-hover:scale-105 transition-all duration-200 cursor-pointer"
                          onClick={() => window.location.href = `/admin/players/detail/${player._id}`}
                        >
                          <PlayersCard player={player} />
                        </div>
                        {/* Message Button - Only show for coaches */}
                       
                      </div>
                    );
                  })}
                </div>
                
                {/* Enhanced Pagination */}
                {totalPages && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 mt-8">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors duration-300"
                    >
                      ← Previous
                    </Button>
                    
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 text-sm rounded-xl transition-all ${
                            currentPage === page
                              ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]'
                              : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                          }`}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors duration-300"
                    >
                      Next →
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--bg-card)] rounded-3xl p-6 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] sticky top-6 transition-colors duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center border border-[var(--border-primary)]">
                <span className="text-[var(--text-primary)] text-lg">
                  {currentUserRole === 'parent' ? '📊' : '📨'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--text-primary)]">
                  {currentUserRole === 'parent' ? 'Recent Activities' : 'Recent Invitations'}
                </h3>
                {!friendRequestsLoading && totalRequests > 0 && (
                  <span className="text-sm text-[var(--text-secondary)]">
                    {totalRequests} {currentUserRole === 'parent' ? 'activity' : 'request'}{totalRequests !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            
            {friendRequestsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="bg-[var(--bg-secondary)] rounded-2xl p-4 animate-pulse transition-colors duration-300">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-xl"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[var(--bg-tertiary)] rounded w-3/4"></div>
                        <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2"></div>
                        <div className="h-6 bg-[var(--bg-tertiary)] rounded w-full"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : friendRequestsError ? (
              <div className="text-center py-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-700 transition-colors duration-300">
                <div className="text-red-500 dark:text-red-400 text-4xl mb-3">⚠️</div>
                <p className="text-red-600 dark:text-red-400 text-sm mb-4">{friendRequestsError}</p>
                <Button 
                  onClick={refreshFriendRequests} 
                  className="text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2 rounded-full hover:bg-[var(--bg-secondary)] transition-colors duration-300"
                >
                  🔄 Try Again
                </Button>
              </div>
            ) : friendRequests && friendRequests.length > 0 ? (
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <div key={request._id} className="transform hover:scale-105 transition-all duration-200">
                    <FriendRequestCard
                      friendRequest={request}
                      onAccept={acceptFriendRequest}
                      onReject={rejectFriendRequest}
                      currentUserId="current-user-id" // TODO: Get from auth context
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-[var(--bg-secondary)] rounded-2xl transition-colors duration-300">
                <div className="text-[var(--text-tertiary)] text-4xl mb-3">
                  {currentUserRole === 'parent' ? '📊' : '📨'}
                </div>
                <p className="text-[var(--text-secondary)] text-sm">
                  {currentUserRole === 'parent' ? 'No recent activities' : 'No pending friend requests'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
