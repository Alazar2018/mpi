import React, { useState, useEffect } from 'react';
import { inviteService } from '@/service/invite.server';
import { marketplaceService } from '@/service/marketplace.server';
import type { CoachProfile } from '@/service/marketplace.server';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'react-toastify';
import Button from './Button';

// Using CoachProfile from marketplace service

const Marketplace: React.FC = () => {
  const [coaches, setCoaches] = useState<CoachProfile[]>([]);

  const [selectedCoach, setSelectedCoach] = useState<CoachProfile | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState<string>('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    experience: '',
    targetGroup: '',
    specialization: '',
    minRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'profile' | 'user'>('ai');
  const [tabLoading, setTabLoading] = useState(false);

  const authStore = useAuthStore();
  const currentUserRole = authStore.getRole();

  // Get available relationships for the current user
  const getAvailableRelationships = () => {
    return inviteService.getAvailableRelationships(currentUserRole || '');
  };

  // Handle connect button click
  const handleConnect = (coach: CoachProfile) => {
    setSelectedCoach(coach);
    setShowConnectModal(true);
    setInviteEmail(''); // Reset email
    setSelectedRelationship(''); // Reset relationship
  };

  // Handle search
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    try {
      setSearching(true);
      const searchResults = await marketplaceService.getRecommendationsByQuestion(query);
      
      if (searchResults.length > 0) {
        setCoaches(searchResults);
        toast.success(`Found ${searchResults.length} coaches matching your search`);
      } else {
        toast.info('No coaches found for your search. Try different keywords.');
      }
    } catch (error) {
      toast.error('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Handle sending invite
  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim() || !selectedRelationship) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!inviteService.isValidRelationship(currentUserRole || '', selectedRelationship)) {
      toast.error('Invalid relationship type');
      return;
    }

    try {
      setSendingInvite(true);
      
      await inviteService.sendInvite({
        email: inviteEmail.trim(),
        relationship: selectedRelationship as any
      });
      
      toast.success('Connection invite sent successfully!');
      setInviteEmail('');
      setShowConnectModal(false);
      setSelectedCoach(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send connection invite');
    } finally {
      setSendingInvite(false);
    }
  };

  // Filter coaches based on selected filters
  const filteredCoaches = coaches.filter(coach => {
    if (filters.experience && !coach.experience.includes(filters.experience)) return false;
    if (filters.targetGroup && coach.targetGroup !== filters.targetGroup) return false;
    if (filters.specialization && !coach.specialization.includes(filters.specialization)) return false;
    if (filters.minRating > 0 && coach.rating < filters.minRating) return false;
    return true;
  });



  // Fetch marketplace data function - uses all three APIs
  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get AI-powered recommendations first
      const recommendations = await marketplaceService.getMarketplaceRecommendations();
      
      if (recommendations.length > 0) {
        setCoaches(recommendations);
      } else {
        // If no AI recommendations, show a message
        setError('No coaches found. Please try adjusting your search criteria.');
      }
    } catch (err) {
      console.error('Error fetching marketplace data:', err);
      setError('Failed to load coach recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced data fetching using all three APIs
  const fetchDataByTab = async (tab: 'ai' | 'profile' | 'user') => {
    try {
      setTabLoading(true);
      setError(null);
      
      let results: CoachProfile[] = [];
      
      switch (tab) {
        case 'ai':
          // Use /api/get_recommendations - question-based AI recommendations
          results = await marketplaceService.getRecommendationsByQuestion(
            'Find me tennis coaches for my skill level and playing style'
          );
          break;
          
                 case 'profile':
           // Use /api/match - profile-based matching
           try {
             // Import fetchUserProfile from profile service
             const { fetchUserProfile } = await import('@/service/profile.server');
             const userProfile = await fetchUserProfile();
             if (userProfile) {
               const playerData = {
                 level: userProfile.marketplaceProfile?.level || 'Intermediate',
                 experience: userProfile.marketplaceProfile?.experience || '1 year',
                 playing_style: userProfile.marketplaceProfile?.playingStyle || 'Baseline',
                 languages: userProfile.marketplaceProfile?.languages || ['English'],
                 zip: userProfile.marketplaceProfile?.zip || userProfile.address?.zipCode,
                 desired_services: ['coaching'],
                 package_preference: userProfile.marketplaceProfile?.packagePreference || ['monthly'],
                 session_duration: userProfile.marketplaceProfile?.sessionDuration || 60,
                 court_surfaces: userProfile.marketplaceProfile?.courtSurfaces || ['hard'],
                 availability: userProfile.marketplaceProfile?.availability?.map((avail: any) => [avail.startTime, avail.endTime]) || [[9, 12], [14, 18]],
               };
               
               const matchResponse = await marketplaceService.matchCoaches(playerData);
               if (matchResponse && matchResponse.length > 0) {
                 results = matchResponse;
               }
             }
           } catch (error) {
             // Show user-friendly error message
             toast.warning('Profile matching is currently unavailable. Using AI recommendations instead.');
             
             try {
               results = await marketplaceService.getRecommendationsByQuestion(
                 'Find me tennis coaches for my skill level and playing style'
               );
             } catch (fallbackError) {
               setError('Both profile matching and AI recommendations are currently unavailable. Please try again later.');
               return;
             }
           }
           break;
          
                 case 'user':
           // Use /api/match_recommendations - user ID based matching
           try {
             const userMatchResponse = await marketplaceService.matchUserById();
             if (userMatchResponse.success && userMatchResponse.data?.coaches) {
               results = userMatchResponse.data.coaches;
             }
           } catch (error) {
             // Show user-friendly error message
             toast.warning('User ID matching is currently unavailable. Using AI recommendations instead.');
             
             try {
               results = await marketplaceService.getRecommendationsByQuestion(
                 'Find me tennis coaches for my skill level and playing style'
               );
             } catch (fallbackError) {
               setError('Both user ID matching and AI recommendations are currently unavailable. Please try again later.');
               return;
             }
           }
           break;
      }
      
      if (results.length > 0) {
        setCoaches(results);
        toast.success(`Found ${results.length} coaches using ${tab === 'ai' ? 'AI recommendations' : tab === 'profile' ? 'profile matching' : 'user matching'}`);
      } else {
        setError(`No coaches found using ${tab === 'ai' ? 'AI recommendations' : tab === 'profile' ? 'profile matching' : 'user matching'}. Try a different approach.`);
      }
      
    } catch (error) {
      setError(`Failed to load coaches using ${tab === 'ai' ? 'AI recommendations' : tab === 'profile' ? 'profile matching' : 'user matching'}. Please try again.`);
    } finally {
      setTabLoading(false);
      // Don't reset general loading here to avoid interfering with tab state
    }
  };

  // Handle tab change
  const handleTabChange = async (tab: 'ai' | 'profile' | 'user') => {
   
    // Update active tab immediately
    setActiveTab(tab);
    // Clear any previous errors
    setError(null);
    // Fetch data for the selected tab
    await fetchDataByTab(tab);
  };

  // Fetch marketplace data on component mount
  useEffect(() => {
    // Start with AI recommendations tab
    setLoading(true); // Set initial loading state
    fetchDataByTab('ai').finally(() => {
      setLoading(false); // Reset loading state after initial fetch
    });
  }, []);


  // Get unique filter options
  const experienceOptions = [...new Set(coaches.map(c => c.experience))];
  const targetGroupOptions = [...new Set(coaches.map(c => c.targetGroup))];
  const specializationOptions = [...new Set(coaches.map(c => c.specialization))];

  return (
          <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
              <div className="bg-[var(--bg-primary)] shadow-sm">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
          <div className="flex flex-col gap-4">
            {/* Title */}
                          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] dark:text-white text-center sm:text-left">
              Find Your Perfect Tennis Coach
            </h1>
            
            {/* API Selection Tabs */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start">
              <div className="flex flex-wrap justify-center sm:justify-start bg-[var(--bg-secondary)] dark:bg-gray-700 rounded-lg p-1 w-full sm:w-auto">
                <button
                  onClick={() => handleTabChange('ai')}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'ai'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:text-gray-300 dark:hover:text-white'
                  }`}
                  disabled={tabLoading}
                  title="AI-powered recommendations based on questions"
                >
                  {tabLoading && activeTab === 'ai' ? 'Loading...' : '🤖 AI'}
                </button>
                <button
                  onClick={() => handleTabChange('profile')}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'profile'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:text-gray-300 dark:hover:text-white'
                  }`}
                  disabled={tabLoading}
                  title="Profile-based matching using your tennis profile data"
                >
                  {tabLoading && activeTab === 'profile' ? 'Loading...' : '👤 Profile'}
                </button>
                <button
                  onClick={() => handleTabChange('user')}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'user'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:text-gray-300 dark:hover:text-white'
                  }`}
                  disabled={tabLoading}
                  title="User ID-based matching for personalized results"
                >
                  {tabLoading && activeTab === 'user' ? 'Loading...' : '🆔 User ID'}
                </button>
              </div>
              
             
              
              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
                {/* Search Bar */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search coaches..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border border-[var(--border-primary)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  />
                  <Button
                    onClick={() => handleSearch(searchQuery)}
                    type="primary"
                    className="px-3 sm:px-4 py-2 text-sm whitespace-nowrap"
                    disabled={searching || !searchQuery.trim()}
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
                  <Button
                    onClick={() => setShowFilters(!showFilters)}
                    type="neutral"
                    className="px-4 sm:px-6 py-2 text-sm"
                  >
                    Filter
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      fetchMarketplaceData();
                    }}
                    type="neutral"
                    className="px-4 sm:px-6 py-2 text-sm"
                    disabled={loading}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
          <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <select
                value={filters.experience}
                onChange={(e) => setFilters(prev => ({ ...prev, experience: e.target.value }))}
                className="border border-[var(--border-primary)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
              >
                <option value="">All Experience Levels</option>
                {experienceOptions.map(exp => (
                  <option key={exp} value={exp}>{exp}</option>
                ))}
              </select>

              <select
                value={filters.targetGroup}
                onChange={(e) => setFilters(prev => ({ ...prev, targetGroup: e.target.value }))}
                className="border border-[var(--border-primary)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
              >
                <option value="">All Target Groups</option>
                {targetGroupOptions.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>

              <select
                value={filters.specialization}
                onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
                className="border border-[var(--border-primary)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
              >
                <option value="">All Specializations</option>
                {specializationOptions.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>

              <select
                value={filters.minRating}
                onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                className="border border-[var(--border-primary)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
              >
                <option value={0}>All Ratings</option>
                <option value={4.5}>4.5+ Stars</option>
                <option value={4.7}>4.7+ Stars</option>
                <option value={4.8}>4.8+ Stars</option>
                <option value={4.9}>4.9+ Stars</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8">
        {/* Loading State */}
        {(loading || tabLoading) && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 text-4xl sm:text-6xl mb-4">🎾</div>
            <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] dark:text-white mb-2">Loading coaches...</h3>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] dark:text-gray-300">Finding the perfect tennis coaches for you</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && !tabLoading && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-yellow-400 text-4xl sm:text-6xl mb-4">⚠️</div>
            <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] dark:text-white mb-2">Notice</h3>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] dark:text-gray-300">{error}</p>
          </div>
        )}

        {/* Coaches Grid */}
        {!loading && !tabLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredCoaches.map((coach) => (
              <div key={coach.id} className="w-full bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-primary)] overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col">
                  {/* Coach Image */}
                  <div className="relative">
                    <img
                      src={coach.image}
                      alt={coach.name}
                      className="w-full h-40 sm:h-48 object-cover"
                      onError={(e) => {
                        // Fallback to a placeholder if image fails to load
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop&crop=center';
                      }}
                    />
                    {coach.badge && (
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-gray-800">
                        {coach.badge}
                      </div>
                    )}
                  </div>

                  {/* Coach Info */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] dark:text-white mb-3">{coach.name}</h3>
                    
                    {/* Rating and Experience */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="font-semibold text-[var(--text-primary)] dark:text-white text-sm sm:text-base">{coach.rating}</span>
                      </div>
                                              <span className="text-xs sm:text-sm text-[var(--text-secondary)] dark:text-gray-300">{coach.experience}</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {coach.targetGroup}
                      </span>
                      <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {coach.specialization}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[var(--text-secondary)] dark:text-gray-300 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed line-clamp-3">
                      {coach.description}
                    </p>

                    {/* Connect Button */}
                    <Button
                      onClick={() => handleConnect(coach)}
                      type="primary"
                      className="w-full text-sm sm:text-base py-2 sm:py-3"
                    >
                      Connect
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !tabLoading && !error && filteredCoaches.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <div className="text-gray-400 text-4xl sm:text-6xl mb-4">🎾</div>
            <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] dark:text-white mb-2">No coaches found</h3>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] dark:text-gray-300 mb-4">Try adjusting your filters or search for different criteria</p>
            <div className="bg-[var(--bg-secondary)] dark:bg-blue-900/20 border border-[var(--border-primary)] dark:border-blue-800 rounded-lg p-3 sm:p-4 max-w-md mx-auto">
              <p className="text-xs sm:text-sm text-[var(--text-primary)] dark:text-blue-200">
                <strong>Tip:</strong> The marketplace uses AI to find coaches based on your profile. 
                Make sure your tennis profile is complete for better recommendations.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showConnectModal && selectedCoach && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-[var(--bg-card)] rounded-xl max-w-sm sm:max-w-md w-full p-4 sm:p-6 mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] dark:text-white">Connect with {selectedCoach.name}</h2>
              <button
                onClick={() => setShowConnectModal(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] dark:text-gray-400 dark:hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3 sm:space-y-4">
              <div>
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-[var(--text-primary)] dark:text-gray-200 mb-2">
                  Email Address
                </label>
                                  <input
                    type="email"
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full border border-[var(--border-primary)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
                    placeholder="Enter email address"
                    required
                    disabled={sendingInvite}
                  />
              </div>

              <div>
                <label htmlFor="inviteRelationship" className="block text-sm font-medium text-[var(--text-primary)] dark:text-gray-200 mb-2">
                  Relationship Type
                </label>
                                  <select
                    id="inviteRelationship"
                    value={selectedRelationship}
                    onChange={(e) => setSelectedRelationship(e.target.value)}
                    className="w-full border border-[var(--border-primary)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--bg-primary)] text-[var(--text-primary)] dark:text-white"
                    required
                    disabled={sendingInvite}
                  >
                  <option value="">Select relationship type</option>
                  {getAvailableRelationships().map(relationship => (
                    <option key={relationship.value} value={relationship.value}>
                      {relationship.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-[var(--text-secondary)] dark:text-gray-300 bg-[var(--bg-secondary)] dark:bg-gray-700 p-3 rounded">
                As a {currentUserRole}, you can send connection invites to: {getAvailableRelationships().map(r => r.label).join(" and ")}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="neutral"
                  onClick={() => setShowConnectModal(false)}
                  className="flex-1"
                  disabled={sendingInvite}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  className="flex-1"
                  disabled={sendingInvite}
                >
                  {sendingInvite ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Sending Invite...
                    </>
                  ) : (
                    'Send Connection Invite'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
