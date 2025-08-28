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
        <div className="flex items-center justify-between gap-4 bg-[var(--bg-secondary)] rounded-3xl py-6 px-8 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
          <div className="h-8 bg-[var(--bg-tertiary)] rounded w-40 animate-pulse"></div>
          <div className="flex gap-4">
            <div className="h-12 bg-[var(--bg-tertiary)] rounded w-28 animate-pulse"></div>
            <div className="h-12 bg-[var(--bg-tertiary)] rounded w-36 animate-pulse"></div>
          </div>
        </div>
        <div className="flex gap-6 bg-[var(--bg-secondary)] rounded-3xl py-6 px-8 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
          <div className="w-32 h-32 bg-[var(--bg-tertiary)] rounded-2xl animate-pulse"></div>
          <div className="flex-1 space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-6 bg-[var(--bg-tertiary)] rounded w-64 animate-pulse"></div>
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
        <div className="flex items-center justify-between gap-4 bg-[var(--bg-secondary)] rounded-3xl py-6 px-8 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
          <span className="text-xl font-semibold text-[var(--text-primary)]">Child Detail</span>
          <Button onClick={clearError} className="!px-6" type="neutral">
            Try Again
          </Button>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-3xl py-12 px-8 text-center shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
          <div className="text-red-500 dark:text-red-400 text-6xl mb-6">⚠️</div>
          <p className="text-red-500 dark:text-red-400 text-lg mb-6">{error}</p>
          <Button onClick={refreshChild} className="bg-[var(--bg-primary)] text-[var(--text-primary)] px-8 py-3 rounded-full hover:bg-[var(--bg-secondary)] transition-colors duration-300">
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
        <div className="flex items-center justify-between gap-4 bg-[var(--bg-secondary)] rounded-3xl py-6 px-8 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
          <span className="text-xl font-semibold text-[var(--text-primary)]">Child Detail</span>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-3xl py-12 px-8 text-center shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
          <div className="text-[var(--text-tertiary)] text-8xl mb-6">👶</div>
          <p className="text-[var(--text-secondary)] text-lg mb-6">Child not found</p>
          <Button onClick={refreshChild} className="bg-[var(--bg-primary)] text-[var(--text-primary)] px-8 py-3 rounded-full hover:bg-[var(--bg-secondary)] transition-colors duration-300">
            🔄 Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4 bg-[var(--bg-card)] rounded-3xl py-6 px-8 border border-[var(--border-primary)] shadow-[var(--shadow-secondary)] transition-colors duration-300">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center border border-[var(--border-primary)]">
            <span className="text-2xl text-[var(--text-primary)]">👶</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Child Detail</h1>
            {child && (
              <span className="text-sm text-[var(--text-secondary)]">ID: {child._id}</span>
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
      <div className="bg-[var(--bg-card)] rounded-3xl py-8 px-8 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
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
              <div className="w-full h-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)] font-bold text-6xl border border-[var(--border-primary)]">
                {getChildInitials(child.firstName, child.lastName)}
              </div>
            )}
          </div>
          
          {/* Basic Info */}
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">Full Name</span>
                  <div className="text-xl font-bold text-[var(--text-primary)] bg-[var(--bg-secondary)] px-4 py-3 rounded-xl">
                    {getChildFullName(child.firstName, child.lastName)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">Email</span>
                  <div className="text-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] px-4 py-3 rounded-xl">
                    {child.emailAddress?.email || 'Not specified'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">Phone</span>
                  <div className="text-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] px-4 py-3 rounded-xl">
                    {formatPhoneNumber(child.phoneNumber)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">Last Online</span>
                  <div className="text-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] px-4 py-3 rounded-xl">
                    {formatDate(child.lastOnline)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">Parents</span>
                  <div className="text-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] px-4 py-3 rounded-xl">
                    {child.parents?.length || 0} parent(s)
                  </div>
                </div>
                
                <div className="space-y-2">
                  <span className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide">Coaches</span>
                  <div className="text-lg text-[var(--text-primary)] bg-[var(--bg-secondary)] px-4 py-3 rounded-xl">
                    {child.coaches?.length || 0} coach(es)
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Badge */}
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center h-12 bg-[var(--bg-secondary)] p-3 gap-4 rounded-full text-[var(--text-primary)] text-sm border border-[var(--border-primary)]">
              <div className="flex h-6 items-center gap-2 bg-[var(--bg-tertiary)] rounded-full px-3 py-1">
                <i dangerouslySetInnerHTML={{ __html: icons.family }} />
                <span className="font-medium">Child ID</span>
              </div>
              <span className="font-mono text-xs">{child._id}</span>
            </div>
            
            <div className="bg-[var(--bg-secondary)] text-[var(--text-primary)] px-6 py-3 rounded-full border border-[var(--border-primary)]">
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
      <div className="bg-[var(--bg-card)] rounded-3xl py-6 px-8 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
        <div className="flex items-center justify-center gap-2 bg-[var(--bg-secondary)] rounded-2xl p-2 border border-[var(--border-primary)]">
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
                      ? "!bg-[var(--bg-primary)] !text-[var(--text-primary)] border border-[var(--border-primary)]" 
                      : "!bg-[var(--bg-card)] !text-[var(--text-primary)] hover:!bg-[var(--bg-secondary)] hover:!text-[var(--text-primary)]"
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
      <div className="bg-[var(--bg-card)] rounded-3xl py-6 px-8 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300">
        <Outlet context={child} />
      </div>
    </div>
  );
}
