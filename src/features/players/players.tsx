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

export default function Players() {
  const [searchQuery, setSearchQuery] = useState("");
  
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
    setSearchQuery(e.target.value);
    if (e.target.value === "") {
      clearSearch();
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
      <div className="relative isolate rounded-3xl overflow-hidden min-h-[16rem] max-h-[16rem] shadow-[var(--shadow-primary)] transition-colors duration-300">
        <div className="absolute inset-0 bg-[var(--bg-card)] flex flex-col justify-center items-center text-center px-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4 mx-auto">
              <span className="text-3xl text-[var(--text-primary)]">
                {currentUserRole === 'parent' ? '👶' : '🎾'}
              </span>
            </div>
            <h1 className="font-bold text-3xl text-[var(--text-primary)] mb-2">
              {currentUserRole === 'parent' ? 'Add your child to the platform' : 'Invite new player via email'}
            </h1>
            <p className="text-[var(--text-secondary)] text-lg">
              {currentUserRole === 'parent' 
                ? 'Connect with coaches and track progress together'
                : 'Expand your team with talented players'
              }
            </p>
          </div>
          
          {currentUserRole === 'coach' && (
            <div className="flex items-center gap-4 bg-[var(--bg-secondary)] backdrop-blur-sm rounded-2xl p-4 border border-[var(--border-primary)]">
              <div className="flex items-center w-80 bg-[var(--bg-card)] rounded-full pr-3 border border-[var(--border-primary)]">
                <input
                  placeholder="Enter Email"
                  className="w-full placeholder:text-[var(--text-tertiary)] text-sm pl-4 h-12 bg-transparent rounded-full outline-none text-[var(--text-primary)]"
                />
                <div className="grid place-items-center px-3">
                  <i dangerouslySetInnerHTML={{ __html: icons.mail }} className="text-[var(--text-tertiary)]" />
                </div>
              </div>
              <Button className="bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-full !h-12 px-8 hover:bg-[var(--bg-secondary)] transition-colors duration-300">
                Invite Player
              </Button>
            </div>
          )}
          
          {currentUserRole === 'parent' && (
            <div className="bg-[var(--bg-secondary)] backdrop-blur-sm rounded-2xl p-6 max-w-md border border-[var(--border-primary)]">
              <p className="text-[var(--text-primary)] text-lg font-medium mb-2">Contact your coach</p>
              <p className="text-[var(--text-secondary)] text-sm">
                Reach out to your child's coach to get them added to the platform and start tracking their progress
              </p>
            </div>
          )}
        </div>
        <img
          src="/stuff.jpg"
          className="max-w-full object-cover w-full h-full opacity-20"
          alt="Hero background"
        />
      </div>

      {/* Search Section */}
      <div className="bg-[var(--bg-card)] rounded-3xl p-6 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
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
              className="w-full placeholder:text-[var(--text-tertiary)] text-sm h-12 bg-transparent outline-none text-[var(--text-primary)]"
            />
          </div>
          <Button 
            onClick={handleSearch}
            className="bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl !h-12 px-8 hover:bg-[var(--bg-secondary)] transition-colors duration-300"
            disabled={loading}
          >
            {loading ? '🔍 Searching...' : currentUserRole === 'parent' ? 'Find Child' : 'Search'}
          </Button>
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
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">{getPageTitle()}</h2>
                  <p className="text-[var(--text-secondary)]">{getPageDescription()}</p>
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
                <Button 
                  onClick={() => fetchPlayers(currentPage, searchQuery)} 
                  className="bg-[var(--bg-primary)] text-[var(--text-primary)] px-8 py-3 rounded-full hover:bg-[var(--bg-secondary)] transition-colors duration-300"
                >
                  {currentUserRole === 'parent' ? '🔄 Refresh Children' : '🔄 Try Again'}
                </Button>
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
                      fetchPlayers();
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
