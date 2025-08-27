import Button from "@/components/Button";
import icons from "@/utils/icons";
import { NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useChildDetail } from "@/hooks/useChildDetail";
import { usePlayerMessaging } from "@/hooks/usePlayerMessaging";

export default function ChildDetail() {
  const local = useLocation();
  const params = useParams();
  
  // Get child ID from URL params
  const childId = params.id;
  
  // Debug: Log the extracted child ID
  console.log('ChildDetail Component - Extracted Child ID:', {
    params,
    childId,
    pathname: local.pathname,
    'params.id': params.id
  });
  
  // Fetch child details from API
  const {
    child,
    loading,
    error,
    fetchChild,
    refreshChild,
    clearError
  } = useChildDetail({
    childId: childId || '',
    autoRefresh: false
  });

  const { sendMessageToPlayer, hasUnreadMessages, getUnreadCount } = usePlayerMessaging();
  
  // Helper functions
  const getChildInitials = (firstName: string, lastName: string) => {
    if (!firstName && !lastName) return 'C';
    const first = firstName ? firstName.charAt(0) : '';
    const last = lastName ? lastName.charAt(0) : '';
    return (first + last).toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (firstName: string, lastName: string) => {
    const name = firstName || lastName || '';
    if (!name) return 'from-blue-400 to-purple-500';
    const colors = [
      'from-blue-400 to-purple-500',
      'from-green-400 to-blue-500',
      'from-orange-400 to-red-500',
      'from-purple-400 to-pink-500',
      'from-teal-400 to-green-500',
      'from-indigo-400 to-purple-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Unknown';
    }
  };

  const formatPhoneNumber = (phoneNumber: any) => {
    if (!phoneNumber) return 'Not specified';
    return `${phoneNumber.countryCode} ${phoneNumber.number}`;
  };

  const getChildFullName = (firstName: string, lastName: string) => {
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown Name';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800 rounded-3xl py-6 px-8 shadow-sm">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
          <div className="flex gap-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse"></div>
          </div>
        </div>
        <div className="flex gap-6 bg-gray-50 dark:bg-gray-800 rounded-3xl py-6 px-8 shadow-sm">
          <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
          <div className="flex-1 space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800 rounded-3xl py-6 px-8 shadow-sm">
          <span className="text-xl font-semibold text-gray-800 dark:text-white">Child Detail</span>
          <Button onClick={clearError} className="!px-6" type="neutral">
            Try Again
          </Button>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl py-12 px-8 text-center shadow-sm">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <p className="text-red-500 dark:text-red-400 text-lg mb-6">{error}</p>
          <Button onClick={refreshChild} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-full">
            🔄 Refresh
          </Button>
        </div>
      </div>
    );
  }

  // Show no child found state
  if (!child) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800 rounded-3xl py-6 px-8 shadow-sm">
          <span className="text-xl font-semibold text-gray-800 dark:text-white">Child Detail</span>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl py-12 px-8 text-center shadow-sm">
          <div className="text-gray-400 text-8xl mb-6">👶</div>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">Child not found</p>
          <Button onClick={refreshChild} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-full">
            🔄 Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-3xl py-6 px-8 border border-blue-200 dark:border-blue-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white">👶</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Child Detail</h1>
            {child && (
              <span className="text-sm text-gray-600 dark:text-gray-300">ID: {child._id}</span>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={refreshChild} 
            className="!px-6 !py-3" 
            type="neutral"
            disabled={loading}
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </Button>
                        <Button 
                onClick={() => sendMessageToPlayer(child._id, getChildFullName(child.firstName, child.lastName))}
                className="!px-6 !py-3 relative" 
                icon={icons.chat} 
                type="neutral"
              >
                💬 Message
                {hasUnreadMessages(child._id) && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getUnreadCount(child._id)}
                  </span>
                )}
              </Button>
          <Button className="!px-6 !py-3 !gap-2" icon={icons.user} type="neutral">
            👤 View Profile
          </Button>
        </div>
      </div>
      
      {/* Child Info Section */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl py-8 px-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex gap-8 items-start">
          {/* Avatar Section */}
          <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-lg">
            {child.avatar ? (
              <img 
                src={child.avatar} 
                alt={getChildFullName(child.firstName, child.lastName)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-r ${getAvatarColor(child.firstName, child.lastName)} flex items-center justify-center text-white font-bold text-6xl`}>
                {getChildInitials(child.firstName, child.lastName)}
              </div>
            )}
          </div>
          
          {/* Basic Info */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Full Name</span>
                  <div className="text-xl font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-xl">
                    {getChildFullName(child.firstName, child.lastName)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</span>
                  <div className="text-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-xl">
                    {child.emailAddress?.email || 'Not specified'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Phone</span>
                  <div className="text-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-xl">
                    {formatPhoneNumber(child.phoneNumber)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Online</span>
                  <div className="text-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-xl">
                    {formatDate(child.lastOnline)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Parents</span>
                  <div className="text-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-xl">
                    {child.parents?.length || 0} parent(s)
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Coaches</span>
                  <div className="text-lg text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-xl">
                    {child.coaches?.length || 0} coach(es)
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Badge */}
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center h-12 bg-gradient-to-r from-blue-500 to-indigo-600 p-3 gap-4 rounded-full text-white text-sm shadow-lg">
              <div className="flex h-6 items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                <i dangerouslySetInnerHTML={{ __html: icons.family }} />
                <span className="font-medium">Child ID</span>
              </div>
              <span className="font-mono text-xs">{child._id}</span>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {child.coachGoals?.reduce((total, coachGoal) => total + (coachGoal.goals?.length || 0), 0) || 0}
                </div>
                <div className="text-xs font-medium">Total Goals</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl py-6 px-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-2">
          {[
            { name: "Profile", to: `/admin/children/detail/${params.id}` },
            {
              name: "Matches",
              to: `/admin/children/detail/${params.id}/matches`,
            },
            { name: "Goals", to: `/admin/children/detail/${params.id}/goals` },
            {
              name: "Classes",
              to: `/admin/children/detail/${params.id}/classes`,
            },
            { name: "SOT", to: `/admin/children/detail/${params.id}/sot` },
          ].map((el) => {
            return (
              <NavLink
                className={({ isActive }) => {
                  return isActive && el.to == local.pathname
                    ? "active-route"
                    : "";
                }}
                key={el.name}
                to={el.to}
              >
                <Button
                  type={local.pathname == el.to ? "action" : "none"}
                  className={`!rounded-xl !font-medium !px-6 !h-12 transition-all duration-200 ${
                    local.pathname == el.to 
                      ? "!bg-gradient-to-r !from-blue-500 !to-indigo-600 !text-white shadow-lg" 
                      : "!bg-gray-100 dark:!bg-gray-700 !text-gray-600 dark:!text-gray-300 hover:!bg-gray-200 dark:hover:!bg-gray-600 hover:!text-gray-800 dark:hover:!text-white"
                  }`}
                >
                  {el.name}
                </Button>
              </NavLink>
            );
          })}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl py-6 px-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <Outlet context={child} />
      </div>
    </div>
  );
}
