import Button from "@/components/Button";
import icons from "@/utils/icons";
import { useApiRequest } from "@/hooks/useApiRequest";
import { useEffect, useState, useMemo } from "react";
import { getAllMatchs } from "@/features/matchs/api/matchs.api";
import { type Match } from "@/service/matchs.server";
import { useNavigate } from "react-router-dom";

export default function PlayerMatches() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: 'all',
    matchType: 'all',
    dateRange: 'all',
    searchQuery: ''
  });
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const matchesReq = useApiRequest<{matches: Match[]}>({
    cacheKey: "player-matches",
    freshDuration: 1000 * 60 * 5, // 5 minutes
    staleWhileRevalidate: true,
  });

  useEffect(() => {
    matchesReq.send(
      () => getAllMatchs(),
      (res) => {
        if (res.success && res.data) {
          console.log('Player matches:', res.data);
        }
      }
    );
  }, []);

  // Filter matches for this player based on selected filters
  const filteredMatches = useMemo(() => {
    let matches = matchesReq.response?.matches || [];
    
    // Apply status filter
    if (filters.status !== 'all') {
      matches = matches.filter(match => match.status === filters.status);
    }
    
    // Apply match type filter
    if (filters.matchType !== 'all') {
      matches = matches.filter(match => match.matchType === filters.matchType);
    }
    
    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (filters.dateRange) {
        case 'today':
          matches = matches.filter(match => {
            const matchDate = new Date(match.date);
            return matchDate.toDateString() === today.toDateString();
          });
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          matches = matches.filter(match => {
            const matchDate = new Date(match.date);
            return matchDate >= weekAgo && matchDate <= today;
          });
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(today.getMonth() - 1);
          matches = matches.filter(match => {
            const matchDate = new Date(match.date);
            return matchDate >= monthAgo && matchDate <= today;
          });
          break;
        case 'upcoming':
          matches = matches.filter(match => {
            const matchDate = new Date(match.date);
            return matchDate > today;
          });
          break;
        case 'past':
          matches = matches.filter(match => {
            const matchDate = new Date(match.date);
            return matchDate < today;
          });
          break;
      }
    }
    
    // Apply search query filter
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      matches = matches.filter(match => {
        const p1Name = typeof match.p1 === 'object' ? `${match.p1.firstName} ${match.p1.lastName}` : match.p1Name || '';
        const p2Name = typeof match.p2 === 'object' ? `${match.p2.firstName} ${match.p2.lastName}` : match.p2Name || '';
        const surface = match.courtSurface || '';
        const type = match.matchType || '';
        
        return p1Name.toLowerCase().includes(query) ||
               p2Name.toLowerCase().includes(query) ||
               surface.toLowerCase().includes(query) ||
               type.toLowerCase().includes(query);
      });
    }
    
    return matches;
  }, [matchesReq.response?.matches, filters]);

  const isLoading = matchesReq.pending;

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      matchType: 'all',
      dateRange: 'all',
      searchQuery: ''
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '🏆';
      case 'in_progress': return '⚡';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      default: return '🎾';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'from-green-400 to-emerald-500';
      case 'in_progress': return 'from-blue-400 to-cyan-500';
      case 'pending': return 'from-yellow-400 to-orange-500';
      case 'cancelled': return 'from-red-400 to-pink-500';
      default: return 'from-gray-400 to-slate-500';
    }
  };

  const getMatchTypeIcon = (matchType: string) => {
    switch (matchType) {
      case 'one': return '1️⃣';
      case 'three': return '3️⃣';
      case 'five': return '5️⃣';
      default: return '🎾';
    }
  };

  // Check if any filters are active
  const hasActiveFilters = filters.status !== 'all' || 
                          filters.matchType !== 'all' || 
                          filters.dateRange !== 'all' || 
                          filters.searchQuery.trim();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-[var(--text-tertiary)] text-6xl mb-4 animate-bounce">🎾</div>
          <h4 className="text-xl font-semibold text-[var(--text-secondary)] mb-2">Loading Matches</h4>
          <p className="text-[var(--text-tertiary)]">Please wait while we fetch your match data...</p>
        </div>
      </div>
    );
  }

    return (
      <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border-primary)] transition-colors duration-300">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center border border-[var(--border-primary)]">
            <span className="text-2xl text-[var(--text-primary)]">🎾</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Match History</h2>
            <p className="text-[var(--text-secondary)]">Track your tennis journey through your matches</p>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)] transition-colors duration-300">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{filteredMatches.length}</div>
            <div className="text-sm text-[var(--text-secondary)]">Total Matches</div>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)] transition-colors duration-300">
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {filteredMatches.filter(m => m.status === 'completed').length}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Completed</div>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)] transition-colors duration-300">
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {filteredMatches.filter(m => m.status === 'pending').length}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Pending</div>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-center border border-[var(--border-primary)] transition-colors duration-300">
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {filteredMatches.filter(m => m.status === 'in_progress').length}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">In Progress</div>
          </div>
        </div>
      </div>

      {/* Collapsible Filters Section */}
      <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-primary)] overflow-hidden transition-colors duration-300">
        {/* Filter Header - Always Visible */}
        <div className="p-6 border-b border-[var(--border-secondary)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center border border-[var(--border-primary)]">
                <span className="text-[var(--text-primary)] text-lg">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">Match Filters</h3>
              {hasActiveFilters && (
                <span className="text-xs text-[var(--text-primary)] bg-[var(--bg-primary)] px-3 py-1 rounded-full border border-[var(--border-primary)]">
                  ✨ Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <Button 
                  onClick={clearFilters}
                  className="text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-300"
                  type="neutral"
                >
                  🗑️ Clear All
                </Button>
              )}
              <Button 
                onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                className="text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-300"
                type="neutral"
              >
                {isFiltersExpanded ? '📁 Collapse' : '🔍 Expand'} Filters
              </Button>
            </div>
          </div>
        </div>
        
        {/* Collapsible Filter Content */}
        <div className={`transition-all duration-300 ease-in-out ${
          isFiltersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}>
          <div className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">⏳ Pending</option>
                  <option value="in_progress">⚡ In Progress</option>
                  <option value="completed">🏆 Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>

              {/* Match Type Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Match Type</label>
                <select
                  value={filters.matchType}
                  onChange={(e) => handleFilterChange('matchType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                >
                  <option value="all">All Types</option>
                  <option value="one">1️⃣ Best of 1</option>
                  <option value="three">3️⃣ Best of 3</option>
                  <option value="five">5️⃣ Best of 5</option>
                </select>
              </div>
              
              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                >
                  <option value="all">📅 All Time</option>
                  <option value="today">☀️ Today</option>
                  <option value="week">📆 Last 7 Days</option>
                  <option value="month">📅 Last 30 Days</option>
                  <option value="upcoming">🚀 Upcoming</option>
                  <option value="past">⏰ Past</option>
                </select>
              </div>

              {/* Search Filter */}
              <div className="lg:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by player name, surface, or type..."
                    value={filters.searchQuery}
                    onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                    className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔍</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Results Summary */}
            <div className="mt-6 pt-6 border-t border-[var(--border-secondary)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-3 py-1 rounded-full border border-[var(--border-primary)]">
                    📊 Showing {filteredMatches.length} of {matchesReq.response?.matches?.length || 0} matches
                  </span>
                  {hasActiveFilters && (
                    <span className="text-xs text-[var(--text-primary)] bg-[var(--bg-primary)] px-3 py-1 rounded-full border border-[var(--border-primary)]">
                      ✨ Filters applied
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Matches Section */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center border border-[var(--border-primary)]">
            <span className="text-[var(--text-primary)] text-sm">🎯</span>
          </div>
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">Match Results</h3>
        </div>
        
        {filteredMatches.length === 0 ? (
          <div className="text-center py-16 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-primary)] transition-colors duration-300">
            <div className="text-[var(--text-tertiary)] text-8xl mb-6 animate-bounce">🎾</div>
            <h4 className="text-2xl font-semibold text-[var(--text-secondary)] mb-4">No Matches Found</h4>
            <p className="text-[var(--text-tertiary)] mb-6 max-w-md mx-auto">
              {hasActiveFilters 
                ? 'No matches match your current filters. Try adjusting your search criteria to see more results.'
                : 'You haven\'t participated in any matches yet. Matches will appear here once you start playing!'
              }
            </p>
            {hasActiveFilters && (
              <Button onClick={clearFilters} className="bg-[var(--bg-primary)] text-[var(--text-primary)] px-8 py-3 rounded-full hover:bg-[var(--bg-secondary)] transition-colors duration-300">
                🗑️ Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
              <div key={match._id} className="group bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-6 hover:bg-[var(--bg-secondary)] transition-all duration-300">
                {/* Header with Status */}
                <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className={`text-2xl ${getStatusIcon(match.status)}`}></span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]">
                      {match.status.charAt(0).toUpperCase() + match.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-[var(--text-primary)]">
                      {new Date(match.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {new Date(match.date).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Match Type Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">{getMatchTypeIcon(match.matchType)}</span>
                  <span className="text-sm font-medium text-[var(--text-secondary)]">
                    {match.matchType === 'one' ? 'Best of 1' : match.matchType === 'three' ? 'Best of 3' : 'Best of 5'}
                  </span>
                </div>
                
                {/* Players Section */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                    <div className="w-8 h-8 bg-[var(--bg-primary)] rounded-full flex items-center justify-center border border-[var(--border-primary)]">
                      <span className="text-[var(--text-primary)] text-sm font-bold">1</span>
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {typeof match.p1 === 'object' ? `${match.p1.firstName} ${match.p1.lastName}` : match.p1Name || 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-2xl font-bold text-[var(--text-tertiary)]">VS</div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                    <div className="w-8 h-8 bg-[var(--bg-primary)] rounded-full flex items-center justify-center border border-[var(--border-primary)]">
                      <span className="text-[var(--text-primary)] text-sm font-bold">2</span>
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {typeof match.p2 === 'object' ? `${match.p2.firstName} ${match.p2.lastName}` : match.p2Name || 'Unknown'}
                    </span>
                  </div>
                </div>
                
                {/* Match Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-tertiary)]">🏟️</span>
                    <span className="text-[var(--text-secondary)] capitalize">{match.courtSurface || 'Surface not specified'}</span>
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="flex justify-end">
                  <Button 
                    onClick={() => navigate(`/admin/matchs/detail/${match._id}`)}
                    type="action" 
                    size="xs" 
                    className="bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-full px-6 py-2 hover:bg-[var(--bg-secondary)] transition-colors duration-300"
                  >
                    View Details →
                  </Button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}