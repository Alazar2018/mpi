import { useState } from "react";
import Button from "@/components/Button";
import PlayersCard from "@/components/PlayersCard";
import FriendRequestCard from "@/components/FriendRequestCard";
import icons from "@/utils/icons";
import { useChildren } from "@/hooks/useChildren";
import { useFriendRequests } from "@/hooks/useFriendRequests";
import { useAuthStore } from "@/store/auth.store";
import { usePlayerMessaging } from "@/hooks/usePlayerMessaging";
import { childrenService } from "@/service/children.server";
import type { Player } from "@/service/players.server";

export default function Children() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get current user's role to determine what to display
  const authStore = useAuthStore();
  const currentUserRole = authStore.getRole();
  
  // Debug: Test URL construction
  childrenService.testUrlConstruction();
  
  const {
    children,
    loading,
    error,
    totalChildren,
    currentPage,
    totalPages,
    fetchChildren,
    searchChildren,
    clearSearch
  } = useChildren({ limit: 9 });

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
      searchChildren(searchQuery.trim());
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
      fetchChildren(page, searchQuery);
    }
  };

  // Get the appropriate title and description based on user role
  const getPageTitle = () => {
    return 'My Children';
  };

  const getPageDescription = () => {
    return 'View and manage your children\'s profiles and progress';
  };

  return (
    <>
      <div className="relative isolate rounded-2xl overflow-hidden min-h-[13.5rem] max-h-[13.5rem] shadow-[var(--shadow-primary)] transition-colors duration-300">
        <div className="absolute pb-4 bg-primary/60 inset-0 flex flex-col justify-end gap-4 items-center">
          <span className="font-bold text-xl text-white">
            Add your child to the platform
          </span>
          <div className="text-center text-white text-sm">
            <p>Contact your coach to add your child to the platform</p>
          </div>
        </div>
        <img
          src="/stuff.jpg"
          className="max-w-full object-cover w-full h-full"
        />
      </div>

      {/* Search Bar */}
      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center w-80 bg-[var(--bg-card)] rounded-full pr-3 border border-[var(--border-primary)] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <input
            placeholder="Search your children by name..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyPress={handleSearchKeyPress}
            className="w-full placeholder:text-[var(--text-tertiary)] text-sm pl-3 h-[2.5rem] bg-transparent rounded-full outline-none text-[var(--text-primary)]"
          />
          <div className="grid place-items-center">
            <i dangerouslySetInnerHTML={{ __html: icons.search || '🔍' }} className="text-[var(--text-tertiary)]" />
          </div>
        </div>
        <Button 
          onClick={handleSearch}
          className="bg-primary text-white rounded-full !h-10 px-6"
          disabled={loading || !searchQuery.trim()}
        >
          {loading ? 'Searching...' : searchQuery.trim() ? 'Find Child' : 'Enter name to search'}
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="rounded-3xl flex flex-col gap-4 p-4 px-6 col-span-2 bg-[var(--bg-card)] shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-semibold text-lg text-[var(--text-primary)]">{getPageTitle()}</span>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{getPageDescription()}</p>
            </div>
            {!loading && totalChildren !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-secondary)]">
                  {totalChildren} child{totalChildren !== 1 ? 'ren' : ''}
                </span>
                {children && children.length > 0 && (
                  <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    ✓ Loaded
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Debug Info */}
          {/* <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            <p>Debug: children={children?.length || 0}, loading={loading.toString()}, error={error || 'none'}</p>
            <p>totalChildren={totalChildren}, currentPage={currentPage}, totalPages={totalPages}</p>
          </div> */}
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-[var(--text-secondary)]">Loading your children...</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="p-4 bg-[var(--bg-secondary)] rounded-xl animate-pulse transition-colors duration-300">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-[var(--bg-tertiary)] rounded w-3/4"></div>
                        <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2"></div>
                        <div className="h-3 bg-[var(--bg-tertiary)] rounded w-2/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 dark:text-red-400 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Error Loading Children</h3>
              <p className="text-red-500 dark:text-red-400 mb-4 max-w-md mx-auto">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => fetchChildren(currentPage, searchQuery)} className="bg-primary text-white">
                  Try Again
                </Button>
                <Button onClick={() => window.location.reload()} className="bg-gray-500 text-white">
                  Refresh Page
                </Button>
              </div>
            </div>
          ) : !children || children.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)] mb-4">
                {searchQuery 
                  ? 'No children found matching your search.'
                  : 'No children found.'
                }
              </p>
              {searchQuery && (
                <Button onClick={() => {
                  setSearchQuery('');
                  fetchChildren();
                }} className="bg-primary text-white">
                  Show All Children
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-3xl grid grid-cols-3 gap-4">
                {children && children.map((child: Player) => {
                  if (!child || !child._id) {
                    console.warn('Invalid child data:', child);
                    return null;
                  }
                  return (
                    <div key={child._id} className="group">
                      <div 
                        className="transform group-hover:scale-105 transition-all duration-200 cursor-pointer"
                        onClick={() => window.location.href = `/admin/children/detail/${child._id}`}
                      >
                        <PlayersCard player={child} />
                      </div>
                      {/* Message Button - Only show for parents */}
                      
                    </div>
                  );
                })}
              </div>
              
              {/* Pagination */}
              {totalPages && totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] disabled:opacity-50 hover:bg-[var(--bg-tertiary)] transition-colors duration-300"
                  >
                    Previous
                  </Button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm ${
                        currentPage === page
                          ? 'bg-primary text-white'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors duration-300'
                      }`}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm bg-[var(--bg-secondary)] text-[var(--text-primary)] disabled:opacity-50 hover:bg-[var(--bg-tertiary)] transition-colors duration-300"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="rounded-3xl flex flex-col gap-4 p-4 px-6 bg-[var(--bg-card)] shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="font-bold text-base text-[var(--text-primary)]">Recent Activities</span>
            {!friendRequestsLoading && totalRequests > 0 && (
              <span className="text-sm text-[var(--text-secondary)]">
                {totalRequests} activity{totalRequests !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {friendRequestsLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 bg-[var(--bg-secondary)] rounded-xl animate-pulse transition-colors duration-300">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-[var(--bg-tertiary)] rounded-full"></div>
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
            <div className="text-center py-4">
              <p className="text-red-500 dark:text-red-400 text-sm mb-2">{friendRequestsError}</p>
              <Button 
                onClick={refreshFriendRequests} 
                className="text-xs bg-primary text-white px-3 py-1"
              >
                Try Again
              </Button>
            </div>
          ) : friendRequests && friendRequests.length > 0 ? (
            <div className="flex flex-col gap-4">
              {friendRequests.map((request) => (
                <FriendRequestCard
                  key={request._id}
                  friendRequest={request}
                  onAccept={acceptFriendRequest}
                  onReject={rejectFriendRequest}
                  currentUserId="current-user-id" // TODO: Get from auth context
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)] text-sm">
                No recent activities
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
