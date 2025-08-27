import { useState, useEffect } from "react";
import { useAuthStore, type User } from "@/store/auth.store";
import { useChatStore } from "./store/chat.store";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { 
  friendsService, 
  type Friendship, 
  type FriendshipUser, 
  type FriendRequest,
  type FriendsListResponse,
  type SearchUser,
  type SearchUsersParams
} from "@/service/friends.server";
import { inviteService } from "@/service/invite.server";

interface Friend {
  _id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatar?: string;
  isOnline: boolean;
  role: string; // Add role field to store __t
  category: 'friendship' | 'players' | 'coaches' | 'parents';
}

type ActiveTab = 'all' | 'players' | 'coaches' | 'parents' | 'requests' | 'sent' | 'blocked';

export default function Friends() {
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [players, setPlayers] = useState<Friend[]>([]);
  const [coaches, setCoaches] = useState<Friend[]>([]);
  const [parents, setParents] = useState<Friend[]>([]);
  const [allUsers, setAllUsers] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentFriendRequests, setSentFriendRequests] = useState<FriendRequest[]>([]);
  const [blockedFriends, setBlockedFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingSent, setLoadingSent] = useState(false);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Friend | null>(null);
  const [searchUsersQuery, setSearchUsersQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const authStore = useAuthStore();
  const chatStore = useChatStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    // Set default tab based on user role
    const userRole = authStore.user?.role;
    if (userRole === 'player') return 'players'; // Players see their friends in players tab
    if (userRole === 'coach') return 'all'; // Coaches see all
    if (userRole === 'parent') return 'all'; // Parents see all
    return 'all';
  });

  // Load friends list on component mount
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
    loadSentFriendRequests();
    loadBlockedFriends();
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchUsersQuery && searchUsersQuery.trim()) {
        console.log('Searching for:', searchUsersQuery); // Debug log
        searchUsers(searchUsersQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchUsersQuery]);

  // Keyboard shortcuts for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddUserModal) {
          setShowAddUserModal(false);
        }
        if (showUserDetailModal) {
          setShowUserDetailModal(false);
          setSelectedUser(null);
        }
      }
    };

    if (showAddUserModal || showUserDetailModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showAddUserModal, showUserDetailModal]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await friendsService.getFriendsList();
      
      // Transform friendship users
      const transformedFriends: Friend[] = response.friendship.friends.map(friendship => {
        const otherUser = friendsService.getOtherUser(friendship, authStore.user?._id || '');
        if (otherUser) {
          return {
            _id: otherUser._id,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName,
            phoneNumber: '', // API doesn't provide phone number
            avatar: otherUser.avatar,
            isOnline: otherUser.isOnline,
            role: (otherUser as any).__t || 'User',
            category: 'friendship'
          };
        }
        return null;
      }).filter(Boolean) as Friend[];

      // Transform players
      const transformedPlayers: Friend[] = (response.players.players || []).map(player => ({
        _id: player._id,
        firstName: player.firstName,
        lastName: player.lastName,
        phoneNumber: '',
        avatar: player.avatar,
        isOnline: player.isOnline,
        role: (player as any).__t || 'Player',
        category: 'players'
      }));

      // Transform coaches
      const transformedCoaches: Friend[] = (response.coaches.coaches || []).map(coach => ({
        _id: coach._id,
        firstName: coach.firstName,
        lastName: coach.lastName,
        phoneNumber: '',
        avatar: coach.avatar,
        isOnline: coach.isOnline,
        role: (coach as any).__t || 'Coach',
        category: 'coaches'
      }));

      // Transform parents
      const transformedParents: Friend[] = (response.parents.parents || []).map(parent => ({
        _id: parent._id,
        firstName: parent.firstName,
        lastName: parent.lastName,
        phoneNumber: '',
        avatar: parent.avatar,
        isOnline: parent.isOnline,
        role: (parent as any).__t || 'Parent',
        category: 'parents'
      }));

      // Combine all users
      const allUsersCombined = [
        ...transformedFriends,
        ...transformedPlayers,
        ...transformedCoaches,
        ...transformedParents
      ];

      setFriends(transformedFriends);
      setPlayers(transformedPlayers);
      setCoaches(transformedCoaches);
      setParents(transformedParents);
      setAllUsers(allUsersCombined);
    } catch (error: any) {
      console.error('Failed to load friends:', error);
      toast.error(error.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const loadFriendRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await friendsService.getFriendRequests();
      setFriendRequests(response.friendRequests);
    } catch (error: any) {
      console.error('Failed to load friend requests:', error);
      toast.error(error.message || 'Failed to load friend requests');
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadSentFriendRequests = async () => {
    try {
      setLoadingSent(true);
      const response = await friendsService.getSentFriendRequests();
      setSentFriendRequests(response.friendRequests);
    } catch (error: any) {
      console.error('Failed to load sent friend requests:', error);
      toast.error(error.message || 'Failed to load sent friend requests');
    } finally {
      setLoadingSent(false);
    }
  };

  const loadBlockedFriends = async () => {
    try {
      setLoadingBlocked(true);
      const response = await friendsService.getBlockedFriends();
      setBlockedFriends(response.friends);
    } catch (error: any) {
      console.error('Failed to load blocked friends:', error);
      toast.error(error.message || 'Failed to load blocked friends');
    } finally {
      setLoadingBlocked(false);
    }
  };

  const handleAcceptRequest = async (request: FriendRequest) => {
    try {
      await friendsService.acceptFriendRequest(request._id);
      toast.success('Friend request accepted!');
      // Reload all data
      await Promise.all([
        loadFriends(), 
        loadFriendRequests(), 
        loadSentFriendRequests(),
        loadBlockedFriends()
      ]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (request: FriendRequest) => {
    try {
      await friendsService.rejectFriendRequest(request._id);
      toast.success('Friend request rejected');
      // Reload requests
      await loadFriendRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject friend request');
    }
  };

  const handleCancelSentRequest = async (request: FriendRequest) => {
    try {
      await friendsService.rejectFriendRequest(request._id);
      toast.success('Friend request cancelled');
      // Reload sent requests
      await loadSentFriendRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel friend request');
    }
  };

  const handleBlockFriend = async (friendship: Friendship) => {
    try {
      await friendsService.blockFriend(friendship._id);
      toast.success('Friend blocked successfully');
      // Reload all data
      await Promise.all([
        loadFriends(), 
        loadFriendRequests(), 
        loadSentFriendRequests(),
        loadBlockedFriends()
      ]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to block friend');
    }
  };

  const handleUnblockFriend = async (friendship: Friendship) => {
    try {
      await friendsService.unblockFriend(friendship._id);
      toast.success('Friend unblocked successfully');
      // Reload all data
      await Promise.all([
        loadFriends(), 
        loadFriendRequests(), 
        loadSentFriendRequests(),
        loadBlockedFriends()
      ]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to unblock friend');
    }
  };

  const handleRemoveFriend = async (friend: Friend) => {
    toast.info(
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-xl">🗑️</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Remove Friend</h3>
            <p className="text-gray-600 text-sm">This action cannot be undone</p>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Friend:</span> {friend.firstName} {friend.lastName}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={async () => {
              toast.dismiss();
              try {
                // Find the friendship ID for this friend
                const response = await friendsService.getFriendsList();
                const friendship = response.friendship.friends.find(f => {
                  const otherUser = friendsService.getOtherUser(f, authStore.user?._id || '');
                  return otherUser?._id === friend._id;
                });
                
                if (friendship) {
                  await friendsService.unfriendUser(friendship._id);
                  toast.success('Friend removed successfully!');
                  await Promise.all([
                    loadFriends(),
                    loadBlockedFriends()
                  ]);
                } else {
                  toast.error('Friendship not found');
                }
              } catch (error: any) {
                toast.error(error.message || 'Failed to remove friend');
              }
            }}
            className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
          >
            Remove Friend
          </button>
          <button
            onClick={() => {
              toast.dismiss();
              toast.info("Remove cancelled", {
                position: "top-right",
                autoClose: 2000,
              });
            }}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeButton: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const handleMessageFriend = (friend: Friend) => {
    // Check if a chat already exists with this friend
    const existingChat = chatStore.chats.find(chat => 
      !chat.isGroupChat && chat.users.some(user => user._id === friend._id)
    );

    if (existingChat) {
      // If chat exists, navigate to messages and select this chat
      chatStore.setSelectedChat(existingChat);
      navigate('/admin/connect');
    } else {
      // Create a proper User object from the friend data
      const friendAsUser = {
        _id: friend._id,
        firstName: friend.firstName,
        lastName: friend.lastName,
        avatar: friend.avatar || "",
        emailAddress: { email: `${friend.firstName.toLowerCase()}@example.com`, verified: true },
        phoneNumber: { countryCode: "+251", number: friend.phoneNumber || "" },
        role: "player" as const,
        isRegistrationComplete: true,
        hasOtp: false,
        badge: 0,
        dateOfBirth: "1990-01-01",
        gender: "male",
        address: {
          streetAddress: "",
          streetAddress2: "",
          city: "",
          stateProvince: "",
          country: "",
          zipCode: ""
        },
        isProfilePublic: true,
        notificationPreference: {
          emailNotification: { enabled: true, notificationType: [], notificationFrequency: "daily" },
          pushNotification: { enabled: true, notificationType: [], notificationFrequency: "daily" }
        },
        googleId: "",
        lastOnline: new Date().toISOString(),
        provider: "local",
        __t: "User",
        children: [],
        id: friend._id
      };

      // Create a new chat with this friend
      const newChat = {
        _id: `chat_${Date.now()}`,
        init: true,
        users: [authStore.user!, friendAsUser],
        chatName: `${friend.firstName} ${friend.lastName}`,
        isGroupChat: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        latestMessage: "New chat created",
        latestMessageContent: "New chat created",
        latestMessageSenderId: authStore.user?._id || "",
        latestMessageTimeStamp: new Date().toISOString(),
        messages: {}
      };

      chatStore.addChat(newChat);
      chatStore.setSelectedChat(newChat);
      navigate('/admin/connect');
    }
  };

  const handleUserDetailClick = (friend: Friend) => {
    setSelectedUser(friend);
    setShowUserDetailModal(true);
  };

  const handleFriendClick = (friend: Friend) => {
    handleMessageFriend(friend);
  };

  const searchUsers = async (query: string) => {
    if (!query || !query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchingUsers(true);
      console.log('Calling searchUsers with query:', query); // Debug log
      const response = await friendsService.searchUsers({ name: query });
      
      // Filter out current user and users who are already friends or have pending requests
      const filteredResults = (response.users || []).filter(user => {
        // Exclude current user
        if (user._id === authStore.user?._id) return false;
        
        // Exclude users who are already friends
        const isAlreadyFriend = friends.some(friend => friend._id === user._id);
        if (isAlreadyFriend) return false;
        
        // Exclude users who have pending friend requests
        const hasPendingRequest = friendRequests.some(request => {
          const requester = request.user1._id === authStore.user?._id ? request.user2 : request.user1;
          return requester._id === user._id;
        });
        if (hasPendingRequest) return false;
        
        // Exclude users who have sent requests from us
        const hasSentRequest = sentFriendRequests.some(request => {
          const recipient = request.user2._id === authStore.user?._id ? request.user1 : request.user2;
          return recipient._id === user._id;
        });
        if (hasSentRequest) return false;
        
        return true;
      });
      
      setSearchResults(filteredResults);
    } catch (error: any) {
      console.error('Failed to search users:', error);
      toast.error(error.message || 'Failed to search users');
      setSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      setSendingRequest(userId);
      await friendsService.sendFriendRequest({ user2: userId });
      toast.success('Friend request sent successfully!');
      // Clear search results for this user
      setSearchResults(prev => prev.filter(user => user._id !== userId));
      // Refresh all data
      await Promise.all([
        loadFriendRequests(),
        loadSentFriendRequests()
      ]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send friend request');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail.trim() || !selectedRelationship) {
      toast.error("Please fill in all fields");
      return;
    }

    setSendingInvite(true);

    try {
      if (!inviteService.isValidRelationship(authStore.user?.role || '', selectedRelationship)) {
        toast.error("Invalid relationship type for your role");
        return;
      }

      await inviteService.sendInvite({
        email: inviteEmail.trim(),
        relationship: selectedRelationship as 'parent' | 'coach' | 'child' | 'player' | 'join'
      });

      toast.success("Connection invite sent successfully!");
      setInviteEmail("");
      setSelectedRelationship("");
      setShowInviteModal(false);

    } catch (error: any) {
      toast.error(error.message || "Failed to send connection invite");
    } finally {
      setSendingInvite(false);
    }
  };

  const getAvailableRelationships = () => {
    return inviteService.getAvailableRelationships(authStore.user?.role || '');
  };

  // Reset search when modal opens/closes
  useEffect(() => {
    if (!showAddUserModal) {
      setSearchUsersQuery('');
      setSearchResults([]);
    }
  }, [showAddUserModal]);

  const getFilteredUsers = () => {
    let usersToFilter: Friend[] = [];
    const userRole = authStore.user?.role;
    
    switch (activeTab) {
      case 'all':
        usersToFilter = allUsers;
        break;

      case 'players':
        // If user is a player, show their friends. Otherwise show players data
        usersToFilter = userRole === 'player' ? friends : players;
        break;
      case 'coaches':
        // If user is a coach, show their friends. Otherwise show coaches data
        usersToFilter = userRole === 'coach' ? friends : coaches;
        break;
      case 'parents':
        // If user is a parent, show their friends. Otherwise show parents data
        usersToFilter = userRole === 'parent' ? friends : parents;
        break;
      default:
        usersToFilter = friends;
    }

    return usersToFilter.filter(friend =>
      friend.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.lastName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredUsers = getFilteredUsers();

  // Helper function to get search placeholder text
  const getSearchPlaceholderText = () => {
    const userRole = authStore.user?.role;
    
    switch (activeTab) {
      case 'players':
        return userRole === 'player' ? 'friends' : 'players';
      case 'coaches':
        return userRole === 'coach' ? 'friends' : 'coaches';
      case 'parents':
        return userRole === 'parent' ? 'friends' : 'parents';
      default:
        return activeTab;
    }
  };

  // Check if tab should be visible based on user role
  const shouldShowTab = (tab: ActiveTab) => {
    const userRole = authStore.user?.role;
    
    switch (tab) {
      case 'all':
      case 'requests':
      case 'sent':
      case 'blocked':
        return true; // Always show these tabs
      case 'players':
      case 'coaches':
      case 'parents':
        return true; // All users can see these tabs (they all show friendship.friends)
      default:
        return false;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'all':
      case 'players':
      case 'coaches':
      case 'parents':
        return (
          <>
            {/* Search Bar - Fixed at top */}
            <div className="sticky top-0 z-10 bg-[var(--bg-card)]/95 dark:bg-gray-800/95 backdrop-blur-sm pb-4 mb-6 border-b border-[var(--border-primary)]">
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                                 <input
                   type="text"
                   placeholder={`Search ${getSearchPlaceholderText()} by name...`}
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-10 pr-12 py-3 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] dark:bg-gray-700 shadow-sm text-[var(--text-primary)] dark:text-white"
                 />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    title="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

                         {/* Users List - Scrollable */}
             <div className="space-y-4">
               {filteredUsers.map((friend) => (
                                 <div 
                   key={friend._id} 
                   className="flex items-center justify-between p-4 border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] dark:hover:bg-gray-700 transition-colors cursor-pointer"
                   onClick={() => handleUserDetailClick(friend)}
                 >
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--bg-tertiary)] dark:bg-gray-600">
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={`${friend.firstName} ${friend.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {friend.firstName[0]}{friend.lastName[0]}
                          </div>
                        )}
                      </div>
                      {/* Online status indicator */}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                        friend.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] dark:text-white">
                        {friend.firstName} {friend.lastName}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] dark:text-gray-400">
                        {friend.isOnline ? 'Online' : 'Offline'}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] dark:text-gray-500 capitalize">
                        {friend.role}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Message Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessageFriend(friend);
                      }}
                      className="w-8 h-8 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                      title="Send Message"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>

                    {/* Block Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const friendship = friends.find(f => f._id === friend._id);
                        if (friendship) {
                          // Find the actual friendship object
                          // This is a simplified approach - in real implementation you'd need the friendship ID
                          toast.info('Blocking functionality requires friendship ID. Please use the remove friend option instead.');
                        }
                      }}
                      className="w-8 h-8 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center hover:bg-yellow-200 transition-colors"
                      title="Block Friend"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                    
                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFriend(friend);
                      }}
                      className="w-8 h-8 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors"
                      title="Remove Friend"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

                         {filteredUsers.length === 0 && (
               <div className="text-center py-8 text-gray-500">
                 {searchQuery ? 
                   `No ${getSearchPlaceholderText()} found matching your search.` : 
                   `No ${getSearchPlaceholderText()} yet.`
                 }
               </div>
             )}
          </>
        );

      case 'requests':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Incoming Friend Requests ({friendRequests.length})</h2>
            {friendRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No incoming friend requests.
              </div>
            ) : (
              friendRequests.map((request) => {
                const requester = request.user1._id === authStore.user?._id ? request.user2 : request.user1;
                return (
                  <div key={request._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        {requester.avatar ? (
                          <img
                            src={requester.avatar}
                            alt={`${requester.firstName} ${requester.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {requester.firstName[0]}{requester.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {requester.firstName} {requester.lastName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {friendsService.formatFriendshipDate(request.friendRequestSentAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptRequest(request)}
                        className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request)}
                        className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );

      case 'sent':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Sent Friend Requests ({sentFriendRequests.length})</h2>
            {sentFriendRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sent friend requests.
              </div>
            ) : (
              sentFriendRequests.map((request) => {
                const recipient = request.user2._id === authStore.user?._id ? request.user1 : request.user2;
                return (
                  <div key={request._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        {recipient.avatar ? (
                          <img
                            src={recipient.avatar}
                            alt={`${recipient.firstName} ${recipient.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                            {recipient.firstName[0]}{recipient.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {recipient.firstName} {recipient.lastName}
                        </p>
                        <p className="text-xs text-gray-400">
                          Sent {friendsService.formatFriendshipDate(request.friendRequestSentAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelSentRequest(request)}
                      className="px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Cancel Request
                    </button>
                  </div>
                );
              })
            )}
          </div>
        );

      case 'blocked':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Blocked Friends ({blockedFriends.length})</h2>
            {blockedFriends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No blocked friends.
              </div>
            ) : (
              blockedFriends.map((friendship) => {
                const blockedUser = friendsService.getOtherUser(friendship, authStore.user?._id || '');
                if (!blockedUser) return null;

                const isBlockedByMe = friendsService.isFriendshipBlocked(friendship, authStore.user?._id || '');
                
                return (
                  <div key={friendship._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-red-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        {blockedUser.avatar ? (
                          <img
                            src={blockedUser.avatar}
                            alt={`${blockedUser.firstName} ${blockedUser.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-semibold">
                            {blockedUser.firstName[0]}{blockedUser.lastName[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {blockedUser.firstName} {blockedUser.lastName}
                        </p>
                        <p className="text-xs text-red-500">
                          {isBlockedByMe ? 'Blocked by you' : 'You are blocked'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {isBlockedByMe && (
                        <button
                          onClick={() => handleUnblockFriend(friendship)}
                          className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                        >
                          Unblock
                        </button>
                      )}
                      <button
                                                 onClick={() => handleRemoveFriend({
                           _id: blockedUser._id,
                           firstName: blockedUser.firstName,
                           lastName: blockedUser.lastName,
                           phoneNumber: '',
                           avatar: blockedUser.avatar,
                           isOnline: blockedUser.isOnline,
                           role: (blockedUser as any).__t || 'User',
                           category: 'friendship'
                         })}
                        className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              }).filter(Boolean)
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--bg-primary)] rounded-2xl p-6 h-full">
        <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-2xl p-6 h-full shadow-sm">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-[var(--text-secondary)] dark:text-gray-400">Loading friends...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-primary)] rounded-2xl p-6 h-full flex flex-col max-h-screen">
      <div className="bg-[var(--bg-card)] dark:bg-gray-800 rounded-2xl p-6 h-full shadow-sm flex flex-col max-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] dark:text-white">Friends</h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              title="Send Connection Invite"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Invite</span>
            </button>
          <button 
            onClick={() => setShowAddUserModal(true)}
            className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
            title="Add New Friend"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          </div>
        </div>

                 {/* Tabs */}
                   <div className="flex space-x-1 mb-6 bg-[var(--bg-secondary)] dark:bg-gray-700 p-1 rounded-lg flex-shrink-0 overflow-x-auto">
            {shouldShowTab('all') && (
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-[var(--bg-card)] dark:bg-gray-600 text-blue-600 shadow-sm'
                    : 'text-[var(--text-secondary)] dark:text-gray-400 hover:text-[var(--text-primary)] dark:hover:text-white'
                }`}
              >
                All ({allUsers.length})
              </button>
            )}

            {shouldShowTab('players') && (
              <button
                onClick={() => setActiveTab('players')}
                className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'players'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Players ({authStore.user?.role === 'player' ? friends.length : players.length})
              </button>
            )}
            {shouldShowTab('coaches') && (
              <button
                onClick={() => setActiveTab('coaches')}
                className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'coaches'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Coaches ({authStore.user?.role === 'coach' ? friends.length : coaches.length})
              </button>
            )}
            {shouldShowTab('parents') && (
              <button
                onClick={() => setActiveTab('parents')}
                className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'parents'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Parents ({authStore.user?.role === 'parent' ? friends.length : parents.length})
              </button>
            )}
            {shouldShowTab('requests') && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'requests'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Requests ({friendRequests.length})
              </button>
            )}
            {shouldShowTab('sent') && (
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'sent'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Sent ({sentFriendRequests.length})
              </button>
            )}
            {shouldShowTab('blocked') && (
              <button
                onClick={() => setActiveTab('blocked')}
                className={`flex-shrink-0 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'blocked'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Blocked ({blockedFriends.length})
              </button>
            )}
          </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-300px)]">
          {renderTabContent()}
        </div>
      </div>

               {/* Add User Modal */}
         {showAddUserModal && (
           <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
             <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold text-gray-800">Add New Friend</h2>
                 <button
                   onClick={() => setShowAddUserModal(false)}
                   className="text-gray-400 hover:text-gray-600 transition-colors"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>

               {/* Search Input */}
               <div className="relative mb-4">
                 <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                 </div>
                 <input
                   type="text"
                   placeholder="Type name or email to search users..."
                   value={searchUsersQuery}
                   onChange={(e) => setSearchUsersQuery(e.target.value)}
                   className="w-full pl-10 pr-20 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   autoFocus
                 />
                 {searchUsersQuery && (
                   <button
                     onClick={() => setSearchUsersQuery('')}
                     className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                     title="Clear search"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 )}
                 {searchingUsers && (
                   <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                     <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                   </div>
                 )}
               </div>

               {/* Search Results */}
               <div className="max-h-64 overflow-y-auto">
                 {searchingUsers ? (
                   <div className="text-center py-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
                     <p className="text-gray-500 text-sm">Searching users...</p>
                   </div>
                 ) : searchResults.length > 0 ? (
                   <>
                     <div className="text-sm text-gray-500 mb-3 px-1">
                       Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                     </div>
                     <div className="space-y-2">
                       {searchResults.map((user) => (
                         <div
                           key={user._id}
                           className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                         >
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                               {user.avatar ? (
                                 <img
                                   src={user.avatar}
                                   alt={`${user.firstName} ${user.lastName}`}
                                   className="w-full h-full object-cover"
                                 />
                               ) : (
                                 <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                   {user.firstName[0]}{user.lastName[0]}
                                 </div>
                               )}
                             </div>
                             <div>
                               <p className="font-medium text-gray-800">
                                 {user.firstName} {user.lastName}
                               </p>
                               <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                             </div>
                           </div>
                           <button
                             onClick={() => handleSendFriendRequest(user._id)}
                             disabled={sendingRequest === user._id || !friendsService.canSendRequestToUser(user.role)}
                             className={`px-3 py-1 text-sm rounded transition-colors flex items-center space-x-1 ${
                               sendingRequest === user._id || !friendsService.canSendRequestToUser(user.role)
                                 ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                 : 'bg-blue-500 text-white hover:bg-blue-600'
                             }`}
                             title={!friendsService.canSendRequestToUser(user.role) ? `Cannot send friend request to ${user.role}s` : ''}
                           >
                             {sendingRequest === user._id ? (
                               <>
                                 <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                 <span>Sending...</span>
                               </>
                             ) : (
                               'Add Friend'
                             )}
                           </button>
                         </div>
                       ))}
                     </div>
                   </>
                 ) : searchUsersQuery && !searchingUsers ? (
                   <div className="text-center py-8 text-gray-500">
                     <div className="w-16 h-16 mx-auto mb-3 text-gray-300">
                       <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                       </svg>
                     </div>
                     <p className="text-gray-500 text-sm">No users found matching your search.</p>
                     <p className="text-gray-400 text-xs mt-1">Try different keywords or check spelling</p>
                   </div>
                 ) : !searchUsersQuery && !searchingUsers ? (
                   <div className="text-center py-8 text-gray-500">
                     <div className="w-16 h-16 mx-auto mb-3 text-gray-300">
                       <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                       </svg>
                     </div>
                     <p className="text-gray-500 text-sm">Start typing to search for users...</p>
                     <p className="text-gray-400 text-xs mt-1">Search by name or email address</p>
                   </div>
                 ) : null}
               </div>

               {/* Close Button */}
               <div className="mt-6">
                 <button
                   onClick={() => setShowAddUserModal(false)}
                   className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                 >
                   Close
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* User Detail Modal */}
         {showUserDetailModal && selectedUser && (
           <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
             <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
               <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-gray-800">User Details</h2>
                 <button
                   onClick={() => {
                     setShowUserDetailModal(false);
                     setSelectedUser(null);
                   }}
                   className="text-gray-400 hover:text-gray-600 transition-colors"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>

               {/* User Info */}
               <div className="text-center mb-6">
                 <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 mx-auto mb-4">
                   {selectedUser.avatar ? (
                     <img
                       src={selectedUser.avatar}
                       alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                       className="w-full h-full object-cover"
                     />
                   ) : (
                     <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xl">
                       {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                     </div>
                   )}
                 </div>
                 <h3 className="text-xl font-bold text-gray-800 mb-2">
                   {selectedUser.firstName} {selectedUser.lastName}
                 </h3>
                 <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                   <span className="capitalize">{selectedUser.role}</span>
                   <span>•</span>
                   <span className={`flex items-center ${selectedUser.isOnline ? 'text-green-500' : 'text-gray-400'}`}>
                     <div className={`w-2 h-2 rounded-full mr-2 ${selectedUser.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                     {selectedUser.isOnline ? 'Online' : 'Offline'}
                   </span>
                 </div>
                 <p className="text-xs text-gray-400 mt-2 capitalize">
                   Category: {selectedUser.category}
                 </p>
               </div>

               {/* Action Buttons */}
               <div className="space-y-3">
                 {/* Send Message Button */}
                 <button
                   onClick={() => {
                     setShowUserDetailModal(false);
                     setSelectedUser(null);
                     handleMessageFriend(selectedUser);
                   }}
                   className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center space-x-2"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                   </svg>
                   <span>Send Message</span>
                 </button>

                 {/* Block/Unblock Button - Only show for friendship users */}
                 {selectedUser.category === 'friendship' && (
                   <button
                     onClick={() => {
                       // Find the friendship to block/unblock
                       const friendship = friends.find(f => f._id === selectedUser._id);
                       if (friendship) {
                         // This would need the actual friendship ID to work properly
                         toast.info('Blocking functionality requires friendship ID. Please use the remove friend option instead.');
                       }
                       setShowUserDetailModal(false);
                       setSelectedUser(null);
                     }}
                     className="w-full py-3 px-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium flex items-center justify-center space-x-2"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                     </svg>
                     <span>Block User</span>
                   </button>
                 )}

                 {/* Remove Friend Button - Only show for friendship users */}
                 {selectedUser.category === 'friendship' && (
                   <button
                     onClick={() => {
                       setShowUserDetailModal(false);
                       setSelectedUser(null);
                       handleRemoveFriend(selectedUser);
                     }}
                     className="w-full py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium flex items-center justify-center space-x-2"
                   >
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                     <span>Remove Friend</span>
                   </button>
                 )}

                 {/* Close Button */}
                 <button
                   onClick={() => {
                     setShowUserDetailModal(false);
                     setSelectedUser(null);
                   }}
                   className="w-full py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                 >
                   Close
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Invite Modal */}
         {showInviteModal && (
           <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
             <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold text-gray-800">Send Connection Invite</h2>
                 <button
                   onClick={() => setShowInviteModal(false)}
                   className="text-gray-400 hover:text-gray-600 transition-colors"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>

               <form onSubmit={handleSendInvite} className="space-y-4">
                 {/* Email Input */}
                 <div>
                   <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-2">
                     Email Address
                   </label>
                   <input
                     type="email"
                     id="inviteEmail"
                     value={inviteEmail}
                     onChange={(e) => setInviteEmail(e.target.value)}
                     placeholder="Enter email address"
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01443B] focus:border-transparent"
                     disabled={sendingInvite}
                     required
                   />
                 </div>

                 {/* Relationship Type Selection */}
                 <div>
                   <label htmlFor="inviteRelationship" className="block text-sm font-medium text-gray-700 mb-2">
                     Connection Type
                   </label>
                   <select
                     id="inviteRelationship"
                     value={selectedRelationship}
                     onChange={(e) => setSelectedRelationship(e.target.value)}
                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01443B] focus:border-transparent"
                     disabled={sendingInvite}
                     required
                   >
                     <option value="">Select connection type</option>
                     {getAvailableRelationships().map((relationship) => (
                       <option key={relationship.value} value={relationship.value}>
                         {relationship.label}
                       </option>
                     ))}
                   </select>
                 </div>

                 {/* Info Text */}
                 <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                   <p className="text-xs text-blue-600">
                     Based on your role as <span className="font-medium capitalize">{authStore.user?.role}</span>, 
                     you can send connection invites to: {getAvailableRelationships().map(r => r.label).join(" and ")}
                   </p>
                 </div>

                 {/* Submit Button */}
                 <button
                   type="submit"
                   disabled={sendingInvite}
                   className="w-full bg-[#01443B] text-white py-2 px-4 rounded-lg hover:bg-[#01352E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {sendingInvite ? (
                     <div className="flex items-center justify-center">
                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                       Sending Invite...
                     </div>
                   ) : (
                     "Send Connection Invite"
                   )}
                 </button>
               </form>
             </div>
           </div>
         )}
    </div>
  );
}
