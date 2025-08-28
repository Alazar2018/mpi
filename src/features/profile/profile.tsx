import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth.store";
import { generateAvatar } from "@/utils/avatar";
import icons from "@/utils/icons";
import { getSessions, terminateSession } from "@/features/auth/session.api";
import type { Session } from "@/interface";
import { toast } from "react-toastify";
import { fetchUserProfile, uploadProfilePicture, updateProfile, addPlayerGoal, updatePlayerGoal, deletePlayerGoal, getMyGoals, changePassword, type UserProfile, type CreateGoalRequest, type Goal } from "@/service/profile.server";
import { 
    getAllUploads, 
    uploadImage, 
    uploadVideo, 
    updateUpload, 
    deleteUpload, 
    sendUploadToPlayers,
    type Upload,
    type CreateUploadRequest,
    type UpdateUploadRequest
} from "@/service/uploads.server";
import { friendsService, type SearchUser } from "@/service/friends.server";

export default function Profile() {
    const authStore = useAuthStore();
    const [activeTab, setActiveTab] = useState("Basic");
    const [isEditing, setIsEditing] = useState(false);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    
    // Profile data state
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        gender: "",
        dateOfBirth: "",
        phoneNumber: "",
        country: "",
        state: "",
        city: "",
        streetAddress: "",
        zipCode: ""
    });

    // Goals state
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loadingGoals, setLoadingGoals] = useState(false);

    // Security state
    const [securitySettings] = useState([
        { id: 1, name: "Two-Factor Authentication", enabled: true, description: "Add an extra layer of security" },
        { id: 2, name: "Login Notifications", enabled: true, description: "Get notified of new logins" },
        { id: 3, name: "Profile Visibility", enabled: false, description: "Make profile public to other players" },
        { id: 4, name: "Data Sharing", enabled: false, description: "Share data with coaches and trainers" }
    ]);

    // Purchases state
    const [purchases] = useState([
        { id: 1, item: "Premium Training Plan", date: "Jan 15, 2025", amount: "$99.99", status: "Active" },
        { id: 2, item: "Equipment Package", date: "Dec 20, 2024", amount: "$149.99", status: "Delivered" },
        { id: 3, item: "Tournament Entry", date: "Nov 10, 2024", amount: "$75.00", status: "Completed" },
        { id: 4, item: "Coaching Session", date: "Oct 25, 2024", amount: "$120.00", status: "Completed" }
    ]);

    // Change Password state
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [changePasswordData, setChangePasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [changingPassword, setChangingPassword] = useState(false);

    // Refs
    const searchTimeoutRef = useRef<number | null>(null);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        console.log("Saving profile data:", formData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        // Reset form data to original values from userProfile
        if (userProfile) {
            setFormData(prev => ({
                ...prev,
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                dateOfBirth: userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : prev.dateOfBirth,
                gender: userProfile.gender,
                phoneNumber: userProfile.phoneNumber?.number || "",
                country: userProfile.address?.country || "",
                state: userProfile.address?.stateProvince || "",
                city: userProfile.address?.city || "",
                streetAddress: userProfile.address?.streetAddress || "",
                zipCode: userProfile.address?.zipCode || ""
            }));
        }
        setIsEditing(false);
    };

    // Change Password handlers
    const handleChangePasswordInput = (field: string, value: string) => {
        setChangePasswordData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleChangePassword = async () => {
        try {
            setChangingPassword(true);
            
            // Validate passwords match
            if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
                toast.error("New password and confirm password do not match");
                return;
            }

            // Validate password strength (basic validation)
            if (changePasswordData.newPassword.length < 8) {
                toast.error("New password must be at least 8 characters long");
                return;
            }

            const result = await changePassword(changePasswordData);
            
            if (result.success) {
                toast.success("Password changed successfully!");
                setShowChangePasswordModal(false);
                setChangePasswordData({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to change password");
        } finally {
            setChangingPassword(false);
        }
    };

    const handleCancelChangePassword = () => {
        setShowChangePasswordModal(false);
        setChangePasswordData({
            oldPassword: "",
            newPassword: "",
            confirmPassword: ""
        });
    };

    // Pagination helpers
    const totalPages = Math.ceil(sessions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentSessions = sessions.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Log initial state and sessions changes for debugging
    useEffect(() => {
        console.log("Profile component mounted");
        console.log("Initial sessions state:", sessions);
        console.log("Initial active tab:", activeTab);
        
        // Load user data from localStorage
        const loadUserData = () => {
            try {
                // Check all possible localStorage keys for user data
                const localStorageKeys = ['user', 'profileData', 'signup_email', 'signup_otp'];
                const localStorageData: Record<string, any> = {};
                
                localStorageKeys.forEach(key => {
                    const data = localStorage.getItem(key);
                    if (data) {
                        try {
                            localStorageData[key] = JSON.parse(data);
                        } catch {
                            localStorageData[key] = data; // Store as string if not JSON
                        }
                    }
                });
                
                console.log("All localStorage data:", localStorageData);
                
                // Load user data from localStorage
                if (localStorageData.user) {
                    const user = localStorageData.user;
                    console.log("Loaded user data from localStorage:", user);
                    
                    // Set user data if available
                    if (user.firstName && user.lastName) {
                    setFormData(prev => ({
                        ...prev,
                            firstName: user.firstName,
                            lastName: user.lastName
                    }));
                }
                }
            } catch (error) {
                console.error("Error loading user data from localStorage:", error);
            }
        };
        
        loadUserData();
    }, []);

    // Populate form data when userProfile is loaded from API
    useEffect(() => {
        if (userProfile) {
            setFormData({
                firstName: userProfile.firstName || "",
                lastName: userProfile.lastName || "",
                gender: userProfile.gender || "",
                dateOfBirth: userProfile.dateOfBirth ? new Date(userProfile.dateOfBirth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : "",
                phoneNumber: userProfile.phoneNumber?.number || "",
                country: userProfile.address?.country || "",
                state: userProfile.address?.stateProvince || "",
                city: userProfile.address?.city || "",
                streetAddress: userProfile.address?.streetAddress || "",
                zipCode: userProfile.address?.zipCode || ""
            });

            // Also populate marketplace profile data
            if (userProfile.marketplaceProfile) {
                console.log("Populating marketplace profile data:", userProfile.marketplaceProfile);
                console.log("Desired services from API:", userProfile.marketplaceProfile.desiredServices);
                
                setMarketplaceProfileData({
                    services: userProfile.marketplaceProfile.desiredServices || [],
                    level: userProfile.marketplaceProfile.level || "",
                    rank: userProfile.marketplaceProfile.rank || "",
                    availability: userProfile.marketplaceProfile.availability?.map(slot => `Day ${slot.day} ${slot.startTime}:00-${slot.endTime}:00`) || [],
                    startDate: "",
                    startTime: "",
                    endTime: "",
                    sessionDuration: userProfile.marketplaceProfile.sessionDuration?.toString() || "",
                    courtSurfaces: userProfile.marketplaceProfile.courtSurfaces?.join(", ") || "",
                    playingStyle: userProfile.marketplaceProfile.playingStyle || "",
                    languages: userProfile.marketplaceProfile.languages?.join(", ") || "",
                    experience: userProfile.marketplaceProfile.experience || "",
                    packagePreference: userProfile.marketplaceProfile.packagePreference?.join(", ") || "",
                    budget: userProfile.marketplaceProfile.maxBudgetPerSession?.toString() || "",
                    currency: "USD",
                    travelDistance: userProfile.marketplaceProfile.travelDistance?.toString() || "",
                    activelySearching: userProfile.marketplaceProfile.isActivelySearching === true,
                    preferredCoachGender: userProfile.marketplaceProfile.preferredCoachGender || "",
                    specializations: userProfile.marketplaceProfile.goals || []
                });
            }
        }
    }, [userProfile]);

    // Helper function to flatten goals from API response and separate coach vs personal goals
    const flattenGoalsFromResponse = (response: any): Goal[] => {
        let flattenedGoals: Goal[] = [];
        
        if (response && Array.isArray(response)) {
            // If response is already an array of goals (direct format) - these are personal goals
            flattenedGoals = response.map((goal: any) => ({
                ...goal,
                isPersonalGoal: true
            }));
        } else if (response && typeof response === 'object' && 'goals' in response) {
            // If response has nested structure with coachGoals
            const coachGoalsResponse = response as any;
            if (coachGoalsResponse.goals && Array.isArray(coachGoalsResponse.goals)) {
                coachGoalsResponse.goals.forEach((coachGoal: any) => {
                    if (coachGoal.goals && Array.isArray(coachGoal.goals)) {
                        // Add coach information to each goal and mark as coach-assigned
                        const goalsWithCoach = coachGoal.goals.map((goal: any) => ({
                            ...goal,
                            coach: coachGoal.coach,
                            isPersonalGoal: false
                        }));
                        flattenedGoals = [...flattenedGoals, ...goalsWithCoach];
                    }
                });
            }
            
            // Also check if there are personal goals in the response
            if (coachGoalsResponse.personalGoals && Array.isArray(coachGoalsResponse.personalGoals)) {
                const personalGoals = coachGoalsResponse.personalGoals.map((goal: any) => ({
                    ...goal,
                    isPersonalGoal: true
                }));
                flattenedGoals = [...flattenedGoals, ...personalGoals];
            }
        }
        

        
        return flattenedGoals;
    };

    // Fetch goals when component mounts (for all users)
    useEffect(() => {
        const fetchGoals = async () => {
            try {
                setLoadingGoals(true);
                const response = await getMyGoals();
                const flattenedGoals = flattenGoalsFromResponse(response);
                setGoals(flattenedGoals);
                console.log("Fetched and flattened goals:", flattenedGoals);
            } catch (error) {
                console.error("Error fetching goals:", error);
                // Set empty array on error to avoid undefined issues
                setGoals([]);
            } finally {
                setLoadingGoals(false);
            }
        };

        fetchGoals();
    }, []);

    // Fetch uploads when component mounts (for coaches)
    useEffect(() => {
        if (authStore.getRole() === 'coach') {
            fetchUploads();
        }
    }, [authStore.getRole()]);

    // Add a refresh function for goals
    const refreshGoals = async () => {
        try {
            setLoadingGoals(true);
            // Force a fresh request by adding a timestamp to bypass cache
            const response = await getMyGoals();
            const flattenedGoals = flattenGoalsFromResponse(response);
            setGoals(flattenedGoals);
            console.log("Refreshed and flattened goals:", flattenedGoals);
        } catch (error) {
            console.error("Error refreshing goals:", error);
        } finally {
            setLoadingGoals(false);
        }
    };

    // Fetch uploads when component mounts (for coaches)
    const fetchUploads = async () => {
        if (authStore.getRole() === 'coach') {
            try {
                setUploadsData(prev => ({ ...prev, loading: true }));
                const uploads = await getAllUploads();
                setUploadsData(prev => ({ 
                    ...prev, 
                    mediaItems: uploads,
                    loading: false 
                }));
                console.log("Fetched uploads:", uploads);
            } catch (error) {
                console.error("Error fetching uploads:", error);
                toast.error("Failed to load uploads");
                setUploadsData(prev => ({ ...prev, loading: false }));
            }
        }
    };

    // Refresh uploads function
    const refreshUploads = async () => {
        if (authStore.getRole() === 'coach') {
            await fetchUploads();
        }
    };



    useEffect(() => {
        console.log("Sessions state changed:", sessions);
    }, [sessions]);

    // Fetch sessions when Devices tab is active
    useEffect(() => {
        console.log("Active tab changed to:", activeTab);
        if (activeTab === "Devices") {
            console.log("Devices tab active, fetching sessions...");
            fetchSessions();
        }
    }, [activeTab]);

    // Fetch user profile data when component mounts
    useEffect(() => {
        const fetchProfile = async () => {
            if (!authStore.tokens?.accessToken) {
                console.log("No access token available, skipping profile fetch");
                return;
            }

            setLoadingProfile(true);
            try {
                console.log("Fetching user profile...");
                const profile = await fetchUserProfile();
                console.log("Profile fetched successfully:", profile);
                setUserProfile(profile);
                
                // Populate form data with profile information
                if (profile) {
                    // Update basic form data
                    setFormData(prev => ({
                        ...prev,
                        firstName: profile.firstName || prev.firstName,
                        lastName: profile.lastName || prev.lastName,
                        gender: profile.gender || prev.gender,
                        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        }) : prev.dateOfBirth,
                        phoneNumber: profile.phoneNumber?.number || prev.phoneNumber,
                        country: profile.address?.country || prev.country,
                        state: profile.address?.stateProvince || prev.state,
                        city: profile.address?.city || prev.city,
                        streetAddress: profile.address?.streetAddress || prev.streetAddress,
                        zipCode: profile.address?.zipCode || prev.zipCode
                    }));

                    // Update marketplace profile data
                    if (profile.marketplaceProfile) {
                        setMarketplaceProfileData(prev => ({
                            ...prev,
                            services: profile.marketplaceProfile.desiredServices || prev.services,
                            level: profile.marketplaceProfile.level || prev.level,
                            rank: profile.marketplaceProfile.rank || prev.rank,
                            sessionDuration: profile.marketplaceProfile.sessionDuration ? `${profile.marketplaceProfile.sessionDuration} minutes` : prev.sessionDuration,
                            courtSurfaces: profile.marketplaceProfile.courtSurfaces?.join(", ") || prev.courtSurfaces,
                            playingStyle: profile.marketplaceProfile.playingStyle || prev.playingStyle,
                            languages: profile.marketplaceProfile.languages?.join(", ") || prev.languages,
                            experience: profile.marketplaceProfile.experience || prev.experience,
                            packagePreference: profile.marketplaceProfile.packagePreference?.join(", ") || prev.packagePreference,
                            budget: profile.marketplaceProfile.maxBudgetPerSession?.toString() || prev.budget,
                            travelDistance: profile.marketplaceProfile.travelDistance ? `Within ${profile.marketplaceProfile.travelDistance} miles` : prev.travelDistance,
                            activelySearching: profile.marketplaceProfile.isActivelySearching === true,
                            preferredCoachGender: profile.marketplaceProfile.preferredCoachGender || prev.preferredCoachGender
                        }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch profile:", error);
                toast.error("Failed to load profile data");
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchProfile();
    }, [authStore.tokens?.accessToken]);



    const fetchSessions = async () => {
        setLoadingSessions(true);
        try {
            console.log("Fetching sessions...");
            const response = await getSessions();
            console.log("Sessions API response:", response);
            
            // Check if response has data property
            if (response && response.data) {
                const responseData = response.data;
                console.log("Response data:", responseData);
                
                if (responseData.status === "success" && responseData.data && responseData.data.sessions) {
                    console.log("Setting sessions:", responseData.data.sessions);
                    setSessions(responseData.data.sessions);
                    setCurrentPage(1); // Reset to first page when refreshing
                } else {
                    console.warn("Unexpected response structure:", responseData);
                    setSessions([]);
                }
            } else {
                console.warn("No data in response:", response);
                setSessions([]);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
            toast.error("Failed to load sessions");
            setSessions([]);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleTerminateSession = async (sessionId: string) => {
        toast.info(
            <div className="flex flex-col space-y-3">
                <div className="text-sm">
                    Are you sure you want to terminate this session? This will log out the device immediately.
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={async () => {
                            try {
                                await terminateSession(sessionId);
                                await fetchSessions();
                                toast.dismiss();
                                toast.success("Session terminated successfully!");
                            } catch (error) {
                                console.error("Failed to terminate session:", error);
                                toast.error("Failed to terminate session.");
                            }
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                    >
                        Yes, Terminate
                    </button>
                    <button
                        onClick={() => toast.dismiss()}
                        className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                    >
                        No, Cancel
                    </button>
                </div>
            </div>,
            {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: true,
            }
        );
    };

    const tabs = [
        { name: "Basic", icon: "👤" },
        { name: "Profile", icon: "📋" },
        { name: "Privacy & Security", icon: "🔒" },
        { name: "Devices", icon: "💻" },
        { name: "Purchases", icon: "🛒" },
        ...(authStore.getRole() === 'coach' ? [{ name: "Uploads", icon: "📤" }] : []),
        ...(authStore.getRole() !== 'coach' ? [{ name: "My Goals", icon: "🎯" }] : []),
    ];

    // Profile form state for marketplace profile - now populated from API
    const [marketplaceProfileData, setMarketplaceProfileData] = useState({
        services: [] as string[],
        level: "",
        rank: "",
        availability: [] as string[],
        startDate: "",
        startTime: "",
        endTime: "",
        sessionDuration: "",
        courtSurfaces: "",
        playingStyle: "",
        languages: "",
        experience: "",
        packagePreference: "",
        budget: "",
        currency: "USD",
        travelDistance: "",
        activelySearching: false,
        preferredCoachGender: "",
        specializations: [] as string[]
    });

    // Uploads state for coaches
    const [uploadsData, setUploadsData] = useState({
        activeFilter: "All",
        activeTab: "Photos",
        searchQuery: "",
        isFilterOpen: false,
        selectedMedia: null as Upload | null,
        isViewerOpen: false,
        isShareModalOpen: false,
        isEditModalOpen: false,
        isDeleteModalOpen: false,
        mediaItems: [] as Upload[],
        loading: false
    });

    // Profile sub-tabs state
    const [profileActiveTab, setProfileActiveTab] = useState("Basic");

    // Goals section state
    const [shortGoalsTab, setShortGoalsTab] = useState<'planned' | 'achieved' | 'overdue'>('planned');
    const [mediumGoalsTab, setMediumGoalsTab] = useState<'planned' | 'achieved' | 'overdue'>('planned');
    const [longGoalsTab, setLongGoalsTab] = useState<'planned' | 'achieved' | 'overdue'>('planned');
    const [expandedGoals, setExpandedGoals] = useState<string[]>([]);
    const [goalFilter, setGoalFilter] = useState<'all' | 'coach' | 'personal'>('all');

    // Goal management state
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [isLoadingGoal, setIsLoadingGoal] = useState(false);
    
    // Goal form state
    const [goalFormData, setGoalFormData] = useState<CreateGoalRequest>({
        goal: 'technical',
        description: '',
        term: 'short',
        measurement: '',
        achievementDate: '',
        actions: [],
        obstacles: [],
        addOn: ''
    });
    
    // Action and obstacle inputs
    const [newAction, setNewAction] = useState('');
    const [newActionDate, setNewActionDate] = useState('');
    const [newObstacle, setNewObstacle] = useState('');
    const [newObstacleDate, setNewObstacleDate] = useState('');
    
    // Loading states for add buttons
    const [isAddingAction, setIsAddingAction] = useState(false);
    const [isAddingObstacle, setIsAddingObstacle] = useState(false);

    // Profile saving state
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    // Edit modal state
    const [editFormData, setEditFormData] = useState({
        title: "",
        category: "All",
        file: null as File | null
    });

    // Share modal state
    const [shareFormData, setShareFormData] = useState({
        selectedContacts: [] as string[],
        message: "",
        searchQuery: "",
        searchResults: [] as SearchUser[],
        isSearching: false
    });

    const handleProfileChange = (field: string, value: any) => {
        setMarketplaceProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleServiceToggle = (service: string) => {
        setMarketplaceProfileData(prev => {
            const existingService = prev.services.find(s => s.toLowerCase() === service.toLowerCase());
            if (existingService) {
                // Remove the existing service (case-insensitive)
                return {
            ...prev,
                    services: prev.services.filter(s => s.toLowerCase() !== service.toLowerCase())
                };
            } else {
                // Add the new service
                return {
                    ...prev,
                    services: [...prev.services, service]
                };
            }
        });
    };

    const handleAvailabilityToggle = (day: string) => {
        setMarketplaceProfileData(prev => ({
            ...prev,
            availability: prev.availability.includes(day)
                ? prev.availability.filter(d => d !== day)
                : [...prev.availability, day]
        }));
    };

    const handleSpecializationToggle = (specialization: string) => {
        setMarketplaceProfileData(prev => ({
            ...prev,
            specializations: prev.specializations?.includes(specialization)
                ? prev.specializations.filter(s => s !== specialization)
                : [...(prev.specializations || []), specialization]
        }));
    };

    const handleUploadsFilterChange = (filter: string) => {
        setUploadsData(prev => ({ ...prev, activeFilter: filter, isFilterOpen: false }));
    };

    const handleUploadsTabChange = (tab: string) => {
        setUploadsData(prev => ({ ...prev, activeTab: tab }));
    };

    const handleUploadsSearch = (query: string) => {
        setUploadsData(prev => ({ ...prev, searchQuery: query }));
    };

    const toggleFilterDropdown = () => {
        setUploadsData(prev => ({ ...prev, isFilterOpen: !prev.isFilterOpen }));
    };

    const closeFilterDropdown = () => {
        setUploadsData(prev => ({ ...prev, isFilterOpen: false }));
    };

    // Media viewer and modal handlers
    const openMediaViewer = (media: any) => {
        setUploadsData(prev => ({ ...prev, selectedMedia: media, isViewerOpen: true }));
    };

    const closeMediaViewer = () => {
        setUploadsData(prev => ({ ...prev, isViewerOpen: false, selectedMedia: null }));
    };

    const openShareModal = () => {
        setUploadsData(prev => ({ ...prev, isShareModalOpen: true }));
        setShareFormData({ 
            selectedContacts: [], 
            message: "", 
            searchQuery: "", 
            searchResults: [], 
            isSearching: false 
        });
    };

    const closeShareModal = () => {
        setUploadsData(prev => ({ ...prev, isShareModalOpen: false }));
    };

    const openEditModal = () => {
        const media = uploadsData.selectedMedia;
        setEditFormData({
            title: media?.title || "",
            category: media?.category || "All",
            file: null
        });
        setUploadsData(prev => ({ ...prev, isEditModalOpen: true }));
    };

    const closeEditModal = () => {
        setUploadsData(prev => ({ ...prev, isEditModalOpen: false }));
        setEditFormData({ title: "", category: "All", file: null });
    };

    const openDeleteModal = () => {
        setUploadsData(prev => ({ ...prev, isDeleteModalOpen: true }));
    };

    const closeDeleteModal = () => {
        setUploadsData(prev => ({ ...prev, isDeleteModalOpen: false }));
    };

    // Handle file upload
    const handleFileUpload = async (file: File, title: string, category: string) => {
        try {
            setUploadsData(prev => ({ ...prev, uploading: true }));
            
            const uploadData: CreateUploadRequest = {
                title,
                type: file.type.startsWith('image/') ? 'photo' : 'video',
                category: category.toLowerCase() as 'forehand' | 'backhand' | 'volley' | 'serve'
            };

            let uploadedFile: Upload;
            if (file.type.startsWith('image/')) {
                uploadedFile = await uploadImage(file, uploadData);
            } else {
                uploadedFile = await uploadVideo(file, uploadData);
            }

            // Refresh uploads list
            await refreshUploads();
            
            toast.success(`${uploadData.type === 'photo' ? 'Image' : 'Video'} uploaded successfully!`);
            closeEditModal();
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Failed to upload file. Please try again.');
        } finally {
            setUploadsData(prev => ({ ...prev, uploading: false }));
        }
    };

    // Handle upload update
    const handleUploadUpdate = async (id: string, data: UpdateUploadRequest) => {
        try {
            await updateUpload(id, data);
            await refreshUploads();
            toast.success('Upload updated successfully!');
            closeEditModal();
        } catch (error) {
            console.error('Error updating upload:', error);
            toast.error('Failed to update upload. Please try again.');
        }
    };

    // Handle upload deletion
    const handleUploadDelete = async (id: string) => {
        try {
            await deleteUpload(id);
            await refreshUploads();
            toast.success('Upload deleted successfully!');
            closeDeleteModal();
        } catch (error) {
            console.error('Error deleting upload:', error);
            toast.error('Failed to delete upload. Please try again.');
        }
    };

    // Handle sending upload to players
    const handleSendUpload = async (id: string, players: string[], message: string) => {
        try {
            await sendUploadToPlayers(id, { players, message });
            toast.success('Upload sent to players successfully!');
            closeShareModal();
        } catch (error) {
            console.error('Error sending upload:', error);
            toast.error('Failed to send upload. Please try again.');
        }
    };

    const handleSaveProfile = async () => {
        try {
            setIsSavingProfile(true);
            
            // Prepare the profile data for the API
            const profileData = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender.toLowerCase() as 'male' | 'female' | 'other',
                phoneNumber: formData.phoneNumber,
                phoneNumberCountryCode: "+1", // Default to US for now
                streetAddress: formData.streetAddress,
                streetAddress2: "", // Not in current form
                city: formData.city,
                stateProvince: formData.state,
                country: formData.country,
                zipCode: formData.zipCode,
                isProfilePublic: true, // Default value
                emailNotificationEnabled: true, // Default value
                emailNotificationType: ["newMatch", "matchReminder", "matchResult", "friendActivity"],
                emailNotificationFrequency: "daily" as const,
                pushNotificationEnabled: true, // Default value
                pushNotificationType: ["newMatch", "matchReminder", "matchResult", "friendActivity", "homeWork"],
                pushNotificationFrequency: "daily" as const
            };

            // Call the updateProfile API
            const updatedProfile = await updateProfile(profileData);
            
            // Update the local state
            setUserProfile(updatedProfile);
            setFormData(prev => ({
                ...prev,
                firstName: updatedProfile.firstName,
                lastName: updatedProfile.lastName,
                dateOfBirth: updatedProfile.dateOfBirth,
                gender: updatedProfile.gender,
                phoneNumber: updatedProfile.phoneNumber?.number || "",
                country: updatedProfile.address?.country || "",
                state: updatedProfile.address?.stateProvince || "",
                city: updatedProfile.address?.city || "",
                streetAddress: updatedProfile.address?.streetAddress || "",
                zipCode: updatedProfile.address?.zipCode || ""
            }));

            // Exit editing mode and show success message
            setIsEditing(false);
            toast.success("Profile updated successfully!");
            
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Failed to update profile. Please try again.");
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleEditSubmit = () => {
        // Update the media item
        const updatedItems = uploadsData.mediaItems.map(item => 
            item._id === uploadsData.selectedMedia?._id 
                ? { ...item, title: editFormData.title, category: editFormData.category }
                : item
        );
        setUploadsData(prev => ({ 
            ...prev, 
            mediaItems: updatedItems,
            selectedMedia: { ...prev.selectedMedia, title: editFormData.title, category: editFormData.category }
        }));
        closeEditModal();
        toast.success("Media updated successfully!");
    };

    const handleDeleteMedia = () => {
        const updatedItems = uploadsData.mediaItems.filter(item => item._id !== uploadsData.selectedMedia?._id);
        setUploadsData(prev => ({ ...prev, mediaItems: updatedItems }));
        closeDeleteModal();
        closeMediaViewer();
        toast.success("Media deleted successfully!");
    };

    const handleShareSubmit = () => {
        // Handle sharing logic here
        toast.success(`Shared with ${shareFormData.selectedContacts.length} people!`);
        closeShareModal();
    };

    const toggleContactSelection = (contactId: string) => {
        setShareFormData(prev => ({
            ...prev,
            selectedContacts: prev.selectedContacts.includes(contactId)
                ? prev.selectedContacts.filter(id => id !== contactId)
                : [...prev.selectedContacts, contactId]
        }));
    };

    const searchConnections = async (query: string) => {
        if (!query.trim()) {
            setShareFormData(prev => ({ ...prev, searchResults: [], isSearching: false }));
            return;
        }

        setShareFormData(prev => ({ ...prev, isSearching: true }));
        
        try {
            const response = await friendsService.searchUsers({ name: query });
            setShareFormData(prev => ({ 
                ...prev, 
                searchResults: response.users || [],
                isSearching: false 
            }));
        } catch (error) {
            console.error('Failed to search connections:', error);
            toast.error('Failed to search connections');
            setShareFormData(prev => ({ ...prev, isSearching: false }));
        }
    };

    const handleSearchInputChange = (query: string) => {
        setShareFormData(prev => ({ ...prev, searchQuery: query }));
        
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // Debounce search
        searchTimeoutRef.current = setTimeout(() => {
            searchConnections(query);
        }, 300);
    };

    // Handle clicking outside filter dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.filter-dropdown')) {
                closeFilterDropdown();
            }
        };

        if (uploadsData.isFilterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [uploadsData.isFilterOpen]);

    // Cleanup search timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    const getFilteredMedia = () => {
        let filtered = uploadsData.mediaItems;
        
        // Filter by category
        if (uploadsData.activeFilter !== "All") {
            filtered = filtered.filter(item => 
                item.category.toLowerCase() === uploadsData.activeFilter.toLowerCase()
            );
        }
        
        // Filter by search query
        if (uploadsData.searchQuery) {
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(uploadsData.searchQuery.toLowerCase()) ||
                item.category.toLowerCase().includes(uploadsData.searchQuery.toLowerCase())
            );
        }
        
        return filtered;
    };

    const serviceOptions = [
        "Private Lessons", "Group Sessions", "Match Play", 
        "Fitness Training", "Mental Coaching", "Strategy Coaching", "Video Analysis", "Tournament Coaching"
    ];

    const availabilityDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const specializationOptions = [
        "Beginners", "Juniors", "High School", "College", "Adults", "Seniors", 
        "Tournament Preparation", "Technique", "Fitness"
    ];

    const profileSubTabs = [
        { name: "Basic", icon: "👤" },
        { name: "Location & availability", icon: "📍" },
        { name: "Certifications & Preferences", icon: "🏆" }
    ];

    // Helper functions for goals
    const getGoalStatus = (goal: any) => {
        // Check if goal is achieved (has progress with isDone: true)
        const isAchieved = goal.progress && goal.progress.some((p: any) => p.isDone === true);
        
        if (isAchieved) {
            return 'achieved';
        }
        
        // Check if goal is overdue (past due date and not achieved)
        if (goal.achievementDate && new Date(goal.achievementDate) < new Date()) {
            return 'overdue';
        }
        
        // Default to planned
        return 'planned';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getGoalTypeColor = (goalType: string) => {
        const colors: Record<string, string> = {
            technical: 'bg-green-500',
            physical: 'bg-orange-500',
            mental: 'bg-sky-500',
            nutrition: 'bg-yellow-500',
            recovery: 'bg-red-500',
            strategic: 'bg-purple-500',
            tactical: 'bg-purple-500'
        };
        return colors[goalType] || 'bg-gray-500';
    };

    const getGoalTypeLabel = (goalType: string) => {
        const labels: Record<string, string> = {
            technical: 'Technical',
            physical: 'Physical',
            mental: 'Mental',
            nutrition: 'Nutrition',
            recovery: 'Recovery',
            strategic: 'Strategic',
            tactical: 'Tactical'
        };
        return labels[goalType] || 'Other';
    };

    const toggleGoal = (goalId: string) => {
        setExpandedGoals(prev => 
            prev.includes(goalId) 
                ? prev.filter(id => id !== goalId)
                : [...prev, goalId]
        );
    };

    // Helper function to filter goals based on selected filter
    const getFilteredGoals = (allGoals: Goal[]): Goal[] => {
        console.log('Filtering goals with filter:', goalFilter);
        console.log('Current user ID:', authStore.user?._id);
        console.log('All goals:', allGoals);
        
        let filteredGoals: Goal[] = [];
        
        switch (goalFilter) {
            case 'coach':
                // Show goals assigned by other coaches (not the current user)
                filteredGoals = allGoals.filter(goal => goal.coach && goal.coach._id !== authStore.user?._id);
                console.log('Coach filter - goals assigned by others:', filteredGoals);
                break;
            case 'personal':
                // Show goals where the current user is the coach (they created them)
                filteredGoals = allGoals.filter(goal => goal.coach && goal.coach._id === authStore.user?._id);
                console.log('Personal filter - goals I created:', filteredGoals);
                break;
            case 'all':
            default:
                filteredGoals = allGoals;
                console.log('All filter - showing all goals:', filteredGoals);
                break;
        }
        
        return filteredGoals;
    };

    // Helper function to filter goals by status (planned, achieved, overdue)
    const getGoalsByStatus = (goals: Goal[], status: 'planned' | 'achieved' | 'overdue'): Goal[] => {
        return goals.filter(goal => {
            const goalStatus = getGoalStatus(goal);
            return goalStatus === status;
        });
    };

    // Helper function to check if user can edit a goal
    const canEditGoal = (goal: Goal): boolean => {
        // User can only edit goals they created (where they are the coach)
        return !!(goal.coach && goal.coach._id === authStore.user?._id);
    };

    // Goal management functions
    const openCreateGoalModal = (term?: 'short' | 'medium' | 'long') => {
        setIsGoalModalOpen(true);
        setIsEditingGoal(false);
        setEditingGoalId(null);
        setGoalFormData({
            goal: 'technical',
            description: '',
            term: term || 'short',
            measurement: '',
            achievementDate: '',
            actions: [],
            obstacles: [],
            addOn: ''
        });
        setNewAction('');
        setNewActionDate('');
        setNewObstacle('');
        setNewObstacleDate('');
    };

    const openEditGoalModal = (goal: Goal) => {
        // Check if user can edit this goal
        if (!canEditGoal(goal)) {
            toast.error('You can only edit goals that you created');
            return;
        }

        setIsGoalModalOpen(true);
        setIsEditingGoal(true);
        setEditingGoalId(goal._id);
        setGoalFormData({
            goal: goal.goal as any,
            description: goal.description,
            term: goal.term as any,
            measurement: goal.measurement,
            achievementDate: goal.achievementDate,
            actions: goal.actions || [],
            obstacles: goal.obstacles || [],
            addOn: goal.addOn || ''
        });
        setNewAction('');
        setNewActionDate('');
        setNewObstacle('');
        setNewObstacleDate('');
    };

    const closeGoalModal = () => {
        setIsGoalModalOpen(false);
        setIsEditingGoal(false);
        setEditingGoalId(null);
        setIsLoadingGoal(false);
    };

    const addAction = async () => {
        if (newAction.trim()) {
            setIsAddingAction(true);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const action = {
                description: newAction.trim(),
                date: newActionDate,
                isDone: false
            };
            
            setGoalFormData(prev => ({
                ...prev,
                actions: [...prev.actions, action]
            }));
            
            setNewAction('');
            setNewActionDate('');
            
            setIsAddingAction(false);
        }
    };

    const removeAction = (index: number) => {
        setGoalFormData(prev => ({
            ...prev,
            actions: prev.actions.filter((_, i) => i !== index)
        }));
    };

    const addObstacle = async () => {
        if (newObstacle.trim()) {
            setIsAddingObstacle(true);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const obstacle = {
                description: newObstacle.trim(),
                date: newObstacleDate,
                isOvercome: false
            };
            
            setGoalFormData(prev => ({
                ...prev,
                obstacles: [...prev.obstacles, obstacle]
            }));
            
            setNewObstacle('');
            setNewObstacleDate('');
            
            setIsAddingObstacle(false);
        }
    };

    const removeObstacle = (index: number) => {
        setGoalFormData(prev => ({
            ...prev,
            obstacles: prev.obstacles.filter((_, i) => i !== index)
        }));
    };

    const handleGoalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            setIsLoadingGoal(true);
            
            if (isEditingGoal && editingGoalId) {
                await updatePlayerGoal(authStore.user?._id || '', editingGoalId, goalFormData);
                toast.success('Goal updated successfully!');
            } else {
                await addPlayerGoal(authStore.user?._id || '', goalFormData);
                toast.success('Goal created successfully!');
            }
            
            closeGoalModal();
            // Refresh goals using the refresh function
            await refreshGoals();
            
        } catch (error: any) {
            console.error('Error submitting goal:', error);
            toast.error(error.response?.data?.message || 'Failed to save goal. Please try again.');
        } finally {
            setIsLoadingGoal(false);
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        if (!authStore.user?._id) {
            toast.error('User ID not found');
            return;
        }

        // Check if user can delete this goal
        const goalToDelete = goals.find(goal => goal._id === goalId);
        if (!goalToDelete || !canEditGoal(goalToDelete)) {
            toast.error('You can only delete goals that you created');
            return;
        }

        // Show confirmation toast
        toast.info(
            <div className="flex flex-col gap-3">
                <div className="font-medium">Are you sure you want to delete this goal?</div>
                <div className="text-sm text-gray-600">This action cannot be undone.</div>
                <div className="flex gap-2 mt-2">
                    <button
                        onClick={() => {
                            toast.dismiss();
                            deleteGoalConfirmed(goalId);
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => toast.dismiss()}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>,
            {
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false,
                position: "top-center",
                toastId: `delete-confirm-${goalId}`
            }
        );
    };

    const deleteGoalConfirmed = async (goalId: string) => {
        if (!authStore.user?._id) {
            toast.error('User ID not found');
            return;
        }

        try {
            await deletePlayerGoal(authStore.user._id, goalId);
            toast.success('Goal deleted successfully!');
            // Refresh goals using the refresh function
            await refreshGoals();
        } catch (error: any) {
            console.error('Error deleting goal:', error);
            toast.error('Failed to delete goal. Please try again.');
        }
    };

    const handleMarkAsAchieved = async (goalId: string) => {
        if (!authStore.user?._id) {
            toast.error('User ID not found');
            return;
        }

        // Check if user can mark this goal as achieved
        const goalToUpdate = goals.find(goal => goal._id === goalId);
        if (!goalToUpdate || !canEditGoal(goalToUpdate)) {
            toast.error('You can only mark goals as achieved if you created them');
            return;
        }

        try {
            const goalToUpdate = goals.find(goal => goal._id === goalId);
            if (!goalToUpdate) {
                toast.error('Goal not found');
                return;
            }

            const updateData = {
                progress: [
                    {
                        description: 'Goal completed',
                        date: new Date().toISOString().split('T')[0],
                        isDone: true
                    }
                ],
                actions: (goalToUpdate.actions || []).map((action: any) => ({
                    description: typeof action === 'string' ? action : action.description || '',
                    date: typeof action === 'object' && action.date ? action.date : new Date().toISOString().split('T')[0],
                    isDone: true
                })),
                obstacles: (goalToUpdate.obstacles || []).map((obstacle: any) => ({
                    description: typeof obstacle === 'string' ? obstacle : obstacle.description || '',
                    date: typeof obstacle === 'object' && obstacle.date ? obstacle.date : new Date().toISOString().split('T')[0],
                    isOvercome: true
                }))
            };

            await updatePlayerGoal(authStore.user._id, goalId, updateData);
            toast.success('Goal marked as achieved! All actions and obstacles completed.');
            // Refresh goals using the refresh function
            await refreshGoals();
        } catch (error: any) {
            console.error('Error marking goal as achieved:', error);
            toast.error('Failed to mark goal as achieved. Please try again.');
        }
    };

    const renderGoalCard = (goal: any) => {
        const isExpanded = expandedGoals.includes(goal._id);
        const goalStatus = getGoalStatus(goal);

        return (
            <div key={goal._id} className="bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-primary)] p-4 mb-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getGoalTypeColor(goal.goal)}`}>
                                {getGoalTypeLabel(goal.goal)}
                            </span>
                            <span className="text-xs text-[var(--text-secondary)]">Due: {formatDate(goal.achievementDate)}</span>
                            {goal.coach && (
                                <span className={`text-xs px-2 py-1 rounded transition-colors duration-300 ${
                                    canEditGoal(goal) 
                                        ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30' 
                                        : 'text-[var(--text-secondary)] bg-[var(--bg-tertiary)]'
                                }`}>
                                    {canEditGoal(goal) ? '✓ My Goal' : `Coach: ${goal.coach.firstName} ${goal.coach.lastName}`}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                            {goalStatus === 'achieved' && (
                                <span className="text-green-500">✓</span>
                            )}
                            <h4 className="font-bold text-[var(--text-primary)]">{goal.description?.toUpperCase() || goal.title?.toUpperCase()}</h4>
                        </div>

                        {/* Goal Status Banner */}
                        <div className="mb-3">
                            {goalStatus === 'overdue' && (
                                <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-md text-sm font-medium mb-2 transition-colors duration-300">
                                    ⚠️ Overdue - Due date: {goal.achievementDate ? formatDate(goal.achievementDate) : 'No due date'}
                                </div>
                            )}
                            
                            {goalStatus === 'achieved' ? (
                                <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300">
                                    ✓ Achieved
                                </div>
                            ) : goalStatus === 'overdue' ? (
                                <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300">
                                    ⚠️ Overdue
                                </div>
                            ) : (
                                <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300">
                                    📋 Planned - Due: {goal.achievementDate ? formatDate(goal.achievementDate) : 'No due date'}
                                </div>
                            )}
                        </div>
                    </div>
                                            <button 
                            onClick={() => toggleGoal(goal._id)}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            {isExpanded ? '‹' : '›'}
                        </button>
                </div>

                {isExpanded && (
                    <div className="mt-4 space-y-4 pt-4 border-t border-[var(--border-primary)]">
                        <div>
                            <h5 className="font-bold text-sm text-[var(--text-primary)] mb-2">Measurement Type</h5>
                            <p className="text-sm text-[var(--text-secondary)]">{goal.measurement || 'No measurement specified'}</p>
                        </div>

                        {/* Actions */}
                        {goal.actions && goal.actions.length > 0 && (
                            <div className="mt-3">
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Actions:</h4>
                                <div className="space-y-2">
                                    {goal.actions.map((action: any, index: number) => {
                                        const actionText = typeof action === 'string' ? action : action.description || '';
                                        const isDone = typeof action === 'object' ? action.isDone : false;
                                        
                                        return (
                                            <div 
                                                key={action._id || index} 
                                                className={`px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                                                    isDone 
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700' 
                                                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                                                } transition-colors duration-300`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{actionText}</div>
                                                    {typeof action === 'object' && action.date && (
                                                                                                        <div className="text-xs text-[var(--text-secondary)]">
                                                    Due: {formatDate(action.date)}
                                                </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 ml-2">
                                                    <span className="text-xs">
                                                        {isDone ? '✓ Done' : '✗ Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Obstacles */}
                        {goal.obstacles && goal.obstacles.length > 0 && (
                            <div className="mt-3">
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Potential Obstacles:</h4>
                                <div className="space-y-2">
                                    {goal.obstacles.map((obstacle: any, index: number) => {
                                        const obstacleText = typeof obstacle === 'string' ? obstacle : obstacle.description || '';
                                        const isOvercome = typeof obstacle === 'object' ? obstacle.isOvercome : false;
                                        
                                        return (
                                            <div 
                                                key={obstacle._id || index} 
                                                className={`px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                                                    isOvercome 
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700' 
                                                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700'
                                                } transition-colors duration-300`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{obstacleText}</div>
                                                    {typeof obstacle === 'object' && obstacle.date && (
                                                                                                        <div className="text-xs text-[var(--text-secondary)]">
                                                    Due: {formatDate(obstacle.date)}
                                                </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 ml-2">
                                                    <span className="text-xs">
                                                        {isOvercome ? '✓ Overcome' : '✗ Pending'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            {/* Only show action buttons if user can edit this goal */}
                            {canEditGoal(goal) ? (
                                <>
                                    {goalStatus !== 'achieved' && (
                                        <button 
                                            onClick={() => handleMarkAsAchieved(goal._id)}
                                            className="bg-green-500 text-white hover:bg-green-600 rounded-lg px-4 py-2 text-sm"
                                        >
                                            Mark as Achieved
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => openEditGoalModal(goal)}
                                        className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteGoal(goal._id)}
                                        className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </>
                            ) : (
                                <div className="text-sm text-[var(--text-secondary)] italic">
                                    Assigned by {goal.coach?.firstName} {goal.coach?.lastName}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const userAvatar = userProfile?.avatar || authStore.user?.avatar
        ? (typeof (userProfile?.avatar || authStore.user?.avatar) === 'string' ? (userProfile?.avatar || authStore.user?.avatar) : generateAvatar({ name: userProfile?.firstName || authStore.user?.firstName || "User" }))
        : generateAvatar({ name: formData.firstName || "User" });

    // Render content based on active tab
    const renderTabContent = () => {
        switch (activeTab) {
            case "Basic":
                return (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Form Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Basic Info</h3>
                            <div className="flex gap-2 w-full sm:w-auto">
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-sm sm:text-base w-1/2 sm:w-auto transition-colors"
                                        >
                                            Edit Profile
                                        </button>
                                    ) : (
                                        <>
                                <button
                                    onClick={handleCancel}
                                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] text-sm sm:text-base w-1/2 sm:w-auto transition-colors duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                                onClick={handleSaveProfile}
                                                disabled={isSavingProfile}
                                                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-lime-500 text-white hover:bg-lime-600 text-sm sm:text-base w-1/2 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSavingProfile ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Saving...
                                                    </div>
                                                ) : (
                                                    'Save Changes'
                                                )}
                                </button>
                                        </>
                                    )}
                            </div>
                        </div>


                        {/* Form Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {/* Profile Picture Upload */}
                            <div className="md:col-span-2 flex flex-col items-center space-y-4">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200">
                                        <img
                                            src={userAvatar}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <label 
                                        htmlFor="profile-picture-upload"
                                        className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
                                    >
                                        {uploadingProfilePic ? (
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </label>
                                    <input
                                        id="profile-picture-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setUploadingProfilePic(true);
                                                try {
                                                    const updatedProfile = await uploadProfilePicture(file);
                                                    setUserProfile(updatedProfile);
                                                    toast.success("Profile picture updated successfully!");
                                                } catch (error) {
                                                    console.error("Failed to upload profile picture:", error);
                                                    toast.error("Failed to upload profile picture");
                                                } finally {
                                                    setUploadingProfilePic(false);
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] text-center">
                                    Click the camera icon to upload a new profile picture
                                </p>
                            </div>

                            {/* Personal Information */}
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 sm:mb-2">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm sm:text-base bg-[var(--bg-card)] text-[var(--text-primary)] ${
                                            !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm sm:text-base bg-[var(--bg-card)] text-[var(--text-primary)] ${
                                            !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 sm:mb-2">
                                        Gender *
                                    </label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => handleInputChange("gender", e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm sm:text-base bg-[var(--bg-card)] text-[var(--text-primary)] ${
                                            !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 sm:mb-2">
                                        Date of birth *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.dateOfBirth}
                                            onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                                            disabled={!isEditing}
                                            className={`w-full px-3 py-2 pr-10 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm sm:text-base bg-[var(--bg-card)] text-[var(--text-primary)] ${
                                                !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                                            }`}
                                        />
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <i
                                                className="*:size-4 text-gray-400"
                                                dangerouslySetInnerHTML={{ __html: icons.calender }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 sm:mb-2">
                                        Phone Number *
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex items-center px-3 py-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-tertiary)] text-xs sm:text-sm text-[var(--text-primary)]">
                                            <span>🇺🇸 +1</span>
                                        </div>
                                        <input
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                                            disabled={!isEditing}
                                            className={`flex-1 px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm sm:text-base bg-[var(--bg-card)] text-[var(--text-primary)] ${
                                                !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address Information */}
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 sm:mb-2">
                                        Country *
                                    </label>
                                    <select
                                        value={formData.country}
                                        onChange={(e) => handleInputChange("country", e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm sm:text-base bg-[var(--bg-card)] text-[var(--text-primary)] ${
                                            !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <option value="Ethiopia">Ethiopia</option>
                                        <option value="United States">United States</option>
                                        <option value="Canada">Canada</option>
                                        <option value="United Kingdom">United Kingdom</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 sm:mb-2">
                                        State *
                                    </label>
                                    <select
                                        value={formData.state}
                                        onChange={(e) => handleInputChange("state", e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm sm:text-base bg-[var(--bg-card)] text-[var(--text-primary)] ${
                                            !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <option value="Addis Ababa">Addis Ababa</option>
                                        <option value="California">California</option>
                                        <option value="New York">New York</option>
                                        <option value="Texas">Texas</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 sm:mb-2">
                                        City *
                                    </label>
                                    <select
                                        value={formData.city}
                                        onChange={(e) => handleInputChange("city", e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm sm:text-base bg-[var(--bg-card)] text-[var(--text-primary)] ${
                                            !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                                        }`}
                                    >
                                        <option value="Addis Ababa">Addis Ababa</option>
                                        <option value="Los Angeles">Los Angeles</option>
                                        <option value="New York City">New York City</option>
                                        <option value="Houston">Houston</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 sm:mb-2">
                                        Street Address *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.streetAddress}
                                        onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm sm:text-base bg-[var(--bg-card)] text-[var(--text-primary)] ${
                                            !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1 sm:mb-2">
                                        Zip Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.zipCode}
                                        onChange={(e) => handleInputChange("zipCode", e.target.value)}
                                        disabled={!isEditing}
                                        className={`w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent text-sm sm:text-base bg-[var(--bg-card)] text-[var(--text-primary)] ${
                                            !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                                        }`}
                                    />
                                </div>
                            </div>


                        </div>
                    </div>
                );

            case "Profile":
                return (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">Profile</h3>
                                <p className="text-[var(--text-secondary)]">Manage your profile information and preferences</p>
                                {loadingProfile && (
                                    <div className="flex items-center gap-2 text-sm text-blue-600">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                                        Loading profile data...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Sub-tabs Navigation */}
                        <div className="bg-[var(--bg-card)] rounded-xl p-1 border border-[var(--border-primary)] shadow-sm">
                            <div className="flex">
                                {profileSubTabs.map((tab) => (
                                    <button
                                        key={tab.name}
                                        onClick={() => setProfileActiveTab(tab.name)}
                                        className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                                            profileActiveTab === tab.name
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                                        }`}
                                    >
                                        <span className="mr-2">{tab.icon}</span>
                                        {tab.name}
                                    </button>
                                ))}
                                </div>
                                </div>

                        {/* Profile Sub-tab Content */}
                        {profileActiveTab === "Basic" && (
                            <div className="space-y-6">
                                {/* Edit/Save Buttons - Moved to top */}
                                <div className="flex justify-end">
                                    {!isEditing ? (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                        >
                                            Edit Profile
                                        </button>
                                    ) : (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleCancel}
                                                className="px-6 py-2 border border-[var(--border-primary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-300"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={isSavingProfile}
                                                className="px-6 py-2 bg-lime-500 text-white rounded-lg hover:bg-lime-600 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                {isSavingProfile ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        Saving...
                            </div>
                                                ) : (
                                                    'Save Changes'
                                                )}
                                            </button>
                                        </div>
                                    )}
                        </div>

                                {/* About You Section */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-sm">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">About You</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 border border-[var(--border-primary)]">
                                            <div className="text-sm text-[var(--text-secondary)] mb-1">Experience Level</div>
                                            <div className="text-lg font-semibold text-[var(--text-primary)]">
                                                {userProfile?.marketplaceProfile?.experience || "Not specified"}
                                </div>
                                </div>
                                        <div className="bg-[var(--bg-tertiary)] rounded-lg p-4 border border-[var(--border-primary)]">
                                            <div className="text-sm text-[var(--text-secondary)] mb-1">Location</div>
                                            <div className="text-lg font-semibold text-[var(--text-primary)]">
                                                {userProfile?.marketplaceProfile?.zip || "Not specified"}
                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Note Section */}
                                <div className="bg-blue-50 dark:bg-blue-900/50 rounded-xl p-6 border border-blue-200 dark:border-blue-600 transition-colors duration-300">
                                    <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">Note</h4>
                                    <p className="text-blue-700 dark:text-blue-100 leading-relaxed">
                                        Please provide your accurate information, as we will use it to connect you with the most suitable players.
                                    </p>
                            </div>

                                {/* Services Section */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-sm">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Which services do you offer?</h4>
                                    <div className="text-xs text-[var(--text-secondary)] mb-2">
                                        Debug: Current services: {JSON.stringify(marketplaceProfileData.services)}
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {serviceOptions.map(service => {
                                            const isSelected = marketplaceProfileData.services.some(s => s.toLowerCase() === service.toLowerCase());
                                            console.log(`Service: ${service}, isSelected: ${isSelected}, current services:`, marketplaceProfileData.services);
                                            
                                            return (
                                                                        <button
                                        key={service}
                                        onClick={() => isEditing ? handleServiceToggle(service) : undefined}
                                        disabled={!isEditing}
                                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                                            isSelected
                                                ? 'border-blue-500 bg-green-100 dark:bg-green-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                                                : 'border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                                        } ${
                                            !isEditing 
                                                ? 'cursor-not-allowed opacity-60' 
                                                : 'hover:border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] cursor-pointer'
                                        } transition-colors duration-300`}
                                    >
                                        {service}
                                    </button>
                                            );
                                        })}
                            </div>
                        </div>
                            </div>
                        )}

                        {profileActiveTab === "Location & availability" && (
                            <div className="space-y-6">
                        {/* Level and Rank Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-sm">
                                        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">What skill levels do you accept?</h4>
                                        <div className="text-lg font-medium text-[var(--text-primary)]">
                                            {userProfile?.marketplaceProfile?.level || "Not specified"}
                                    </div>
                                    </div>

                                    <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-sm">
                                        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Where are you based?</h4>
                                        <div className="text-lg font-medium text-[var(--text-primary)]">
                                            {userProfile?.marketplaceProfile?.zip || "Not specified"}
                                </div>
                                    </div>
                            </div>

                                {/* Availability Section */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-sm">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">When are you available to coach?</h4>
                                    <div className="space-y-3">
                                        {userProfile?.marketplaceProfile?.availability && userProfile.marketplaceProfile.availability.length > 0 ? (
                                            userProfile.marketplaceProfile.availability.map((slot, index) => (
                                                <div key={index} className="p-4 rounded-lg border-2 border-green-500 bg-green-100 dark:bg-green-900/30 transition-colors duration-300">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-medium text-[var(--text-primary)]">
                                                                Day {slot.day} - {slot.startTime}:00 to {slot.endTime}:00
                                                            </span>
                                    </div>
                                    </div>
                                </div>
                                            ))
                                        ) : (
                                            <div className="text-[var(--text-secondary)] italic">No availability set</div>
                                        )}
                            </div>
                        </div>

                                {/* Session Duration */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-sm">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Session Duration</h4>
                                    <div className="text-lg font-medium text-[var(--text-primary)]">
                                        {userProfile?.marketplaceProfile?.sessionDuration ? `${userProfile.marketplaceProfile.sessionDuration} minutes` : "Not specified"}
                                </div>
                                </div>

                                {/* Court Surfaces */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-sm">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Preferred Court Surfaces</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {userProfile?.marketplaceProfile?.courtSurfaces && userProfile.marketplaceProfile.courtSurfaces.length > 0 ? (
                                            userProfile.marketplaceProfile.courtSurfaces.map((surface, index) => (
                                                <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm transition-colors duration-300">
                                                    {surface}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[var(--text-secondary)] italic">No court surfaces specified</span>
                                            )}
                            </div>
                            </div>

                                {/* Playing Style */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-sm">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Playing Style</h4>
                                    <div className="text-lg font-medium text-[var(--text-primary)]">
                                        {userProfile?.marketplaceProfile?.playingStyle || "Not specified"}
                        </div>
                                </div>
                            </div>
                        )}

                                                {profileActiveTab === "Certifications & Preferences" && (
                            <div className="space-y-6">
                                {/* Desired Services Section */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-sm">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Services You Offer</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {userProfile?.marketplaceProfile?.desiredServices && userProfile.marketplaceProfile.desiredServices.length > 0 ? (
                                            userProfile.marketplaceProfile.desiredServices.map((service, index) => (
                                                <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
                                                    {service}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[var(--text-secondary)] italic">No services specified</span>
                                        )}
                                </div>
                                </div>

                                {/* Experience Section */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-sm">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Experience Level</h4>
                                    <div className="text-lg font-medium text-[var(--text-primary)]">
                                        {userProfile?.marketplaceProfile?.experience || "Not specified"}
                            </div>
                                </div>

                                {/* Languages Section */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-sm">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Languages You Speak</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {userProfile?.marketplaceProfile?.languages && userProfile.marketplaceProfile.languages.length > 0 ? (
                                            userProfile.marketplaceProfile.languages.map((language, index) => (
                                                <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                                                    {language}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[var(--text-secondary)] italic">No languages specified</span>
                                        )}
                                </div>
                                </div>

                                {/* Package Preferences */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-sm">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Package Preferences</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {userProfile?.marketplaceProfile?.packagePreference && userProfile.marketplaceProfile.packagePreference.length > 0 ? (
                                            userProfile.marketplaceProfile.packagePreference.map((pref, index) => (
                                                <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm">
                                                    {pref}
                                            </span>
                                        ))
                                        ) : (
                                            <span className="text-[var(--text-secondary)] italic">No package preferences specified</span>
                                        )}
                                </div>
                                </div>

                                {/* Budget and Travel */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-[var(--shadow-secondary)] transition-colors duration-300">
                                        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Max Budget Per Session</h4>
                                        <div className="text-lg font-medium text-[var(--text-primary)]">
                                            {userProfile?.marketplaceProfile?.maxBudgetPerSession ? `$${userProfile.marketplaceProfile.maxBudgetPerSession}` : "Not specified"}
                            </div>
                        </div>

                                    <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-[var(--shadow-secondary)] transition-colors duration-300">
                                        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Travel Distance</h4>
                                        <div className="text-lg font-medium text-[var(--text-primary)]">
                                            {userProfile?.marketplaceProfile?.travelDistance ? `${userProfile.marketplaceProfile.travelDistance} miles` : "Not specified"}
                                    </div>
                                    </div>
                                </div>

                                {/* Goals */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-[var(--shadow-secondary)] transition-colors duration-300">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Your Goals</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {userProfile?.marketplaceProfile?.goals && userProfile.marketplaceProfile.goals.length > 0 ? (
                                            userProfile.marketplaceProfile.goals.map((goal, index) => (
                                                <span key={index} className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded-full text-sm transition-colors duration-300">
                                                    {goal}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[var(--text-tertiary)] italic">No goals specified</span>
                                        )}
                                    </div>
                                    </div>

                                {/* Active Search Status */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-[var(--shadow-secondary)] transition-colors duration-300">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Active Search Status</h4>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${userProfile?.marketplaceProfile?.isActivelySearching ? 'bg-green-500' : 'bg-[var(--text-tertiary)]'}`}></div>
                                        <span className="text-lg font-medium text-[var(--text-primary)]">
                                            {userProfile?.marketplaceProfile?.isActivelySearching ? 'Actively searching for opportunities' : 'Not actively searching'}
                                        </span>
                                </div>
                            </div>

                                {/* Preferred Coach Gender */}
                                <div className="bg-[var(--bg-card)] rounded-xl p-6 border border-[var(--border-primary)] shadow-[var(--shadow-secondary)] transition-colors duration-300">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Preferred Coach Gender</h4>
                                    <div className="text-lg font-medium text-[var(--text-primary)]">
                                        {userProfile?.marketplaceProfile?.preferredCoachGender || "No preference"}
                                    </div>
                                    </div>
                                </div>
                        )}
                                    </div>
                );

            case "My Goals":
                return (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-2">My Goals</h3>
                                <p className="text-[var(--text-secondary)]">Track and manage your tennis goals across different timeframes</p>
                            </div>
                                                        <div className="flex flex-col sm:flex-row gap-3">
                                {/* Goal Filter */}
                                <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1">
                                    <button
                                        onClick={() => setGoalFilter('all')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            goalFilter === 'all'
                                                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        } transition-colors duration-300`}
                                    >
                                        All Goals
                                    </button>
                                    <button
                                        onClick={() => setGoalFilter('coach')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            goalFilter === 'coach'
                                                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        } transition-colors duration-300`}
                                    >
                                        Other Coaches
                                    </button>
                                    <button
                                        onClick={() => setGoalFilter('personal')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            goalFilter === 'personal'
                                                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                        } transition-colors duration-300`}
                                    >
                                        I Created
                                    </button>
                                    </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={refreshGoals}
                                        className="px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium transition-colors duration-300"
                                        title="Refresh goals"
                                    >
                                        🔄 Refresh
                                    </button>
                                    <button 
                                        onClick={() => openCreateGoalModal()}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-medium"
                                    >
                                        + Add New Goal
                                    </button>
                                    </div>
                                </div>
                            </div>

                        {/* Goals Summary */}
                        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mb-6 border border-[var(--border-primary)] transition-colors duration-300">
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-[var(--text-primary)]">Total Goals:</span>
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-300">
                                        {goals.length}
                                    </span>
                                    </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-[var(--text-primary)]">Other Coaches:</span>
                                    <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-300">
                                        {goals.filter(goal => goal.coach && goal.coach._id !== authStore.user?._id).length}
                                    </span>
                                    </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-[var(--text-primary)]">I Created:</span>
                                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-medium transition-colors duration-300">
                                        {goals.filter(goal => goal.coach && goal.coach._id === authStore.user?._id).length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Goals Overview - Three Column Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {loadingGoals ? (
                                // Loading state for all three columns
                                <>
                                                                        <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-primary)] transition-colors duration-300">
                                        <div className="animate-pulse">
                                            <div className="h-6 bg-[var(--bg-tertiary)] rounded mb-4"></div>
                                            <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-2"></div>
                                            <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-2"></div>
                                            <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-4"></div>
                                            <div className="space-y-3">
                                                <div className="h-20 bg-[var(--bg-tertiary)] rounded"></div>
                                                <div className="h-20 bg-[var(--bg-tertiary)] rounded"></div>
                                    </div>
                                    </div>
                                </div>
                                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-primary)] transition-colors duration-300">
                                        <div className="animate-pulse">
                                            <div className="h-6 bg-[var(--bg-tertiary)] rounded mb-4"></div>
                                            <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-2"></div>
                                            <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-2"></div>
                                            <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-4"></div>
                                            <div className="space-y-3">
                                                <div className="h-20 bg-[var(--bg-tertiary)] rounded"></div>
                                                <div className="h-20 bg-[var(--bg-tertiary)] rounded"></div>
                                    </div>
                                    </div>
                                </div>
                                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-primary)] transition-colors duration-300">
                                        <div className="animate-pulse">
                                            <div className="h-6 bg-[var(--bg-tertiary)] rounded mb-4"></div>
                                            <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-2"></div>
                                            <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-2"></div>
                                            <div className="h-4 bg-[var(--bg-tertiary)] rounded mb-4"></div>
                                            <div className="space-y-3">
                                                <div className="h-20 bg-[var(--bg-tertiary)] rounded"></div>
                                                <div className="h-20 bg-[var(--bg-tertiary)] rounded"></div>
                                    </div>
                                    </div>
                                </div>
                                </>
                            ) : (
                                <>
                                    {/* No Goals Message */}
                                    {getFilteredGoals(goals).length === 0 && (
                                        <div className="col-span-full text-center py-12">
                                            <div className="text-[var(--text-tertiary)] mb-4">
                                                {goalFilter === 'coach' && 'No goals assigned by other coaches'}
                                                {goalFilter === 'personal' && 'No goals created by you'}
                                                {goalFilter === 'all' && 'No goals found'}
                                    </div>
                                            <button 
                                                onClick={() => openCreateGoalModal()}
                                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-medium"
                                            >
                                                + Create Your First Goal
                                            </button>
                                </div>
                                    )}
                                    
                                    {/* Short Term Goals */}
                                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-primary)] transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Short Goals</h3>
                                            <button 
                                                onClick={() => openCreateGoalModal('short')}
                                                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors duration-300"
                                            >
                                                +
                                            </button>
                                    </div>
                                        
                                        <div className="flex gap-2 mb-4">
                                            <button
                                                onClick={() => setShortGoalsTab('planned')}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                                                    shortGoalsTab === 'planned' 
                                                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' 
                                                        : 'text-[var(--text-secondary)]'
                                                }`}
                                            >
                                                Planned
                                                <span className="ml-1 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full transition-colors duration-300">
                                                    {getGoalsByStatus(
                                                        getFilteredGoals(goals).filter(goal => goal.term === 'short' || !goal.term),
                                                        'planned'
                                                    ).length}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => setShortGoalsTab('achieved')}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                                                    shortGoalsTab === 'achieved' 
                                                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' 
                                                        : 'text-[var(--text-secondary)]'
                                                }`}
                                            >
                                                Achieved
                                                <span className="ml-1 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full transition-colors duration-300">
                                                    {getGoalsByStatus(
                                                        getFilteredGoals(goals).filter(goal => goal.term === 'short' || !goal.term),
                                                        'achieved'
                                                    ).length}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => setShortGoalsTab('overdue')}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                                                    shortGoalsTab === 'overdue' 
                                                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' 
                                                        : 'text-[var(--text-secondary)]'
                                                }`}
                                            >
                                                Overdue
                                                <span className="ml-1 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full transition-colors duration-300">
                                                    {getGoalsByStatus(
                                                        getFilteredGoals(goals).filter(goal => goal.term === 'short' || !goal.term),
                                                        'overdue'
                                                    ).length}
                                                </span>
                                            </button>
                                    </div>

                                                                                <div className="space-y-4">
                                            {getGoalsByStatus(
                                                getFilteredGoals(goals).filter(goal => goal.term === 'short' || !goal.term),
                                                shortGoalsTab
                                            ).map(renderGoalCard)}
                                            {getGoalsByStatus(
                                                getFilteredGoals(goals).filter(goal => goal.term === 'short' || !goal.term),
                                                shortGoalsTab
                                            ).length === 0 && (
                                                <div className="text-center py-8 text-[var(--text-tertiary)]">
                                                    No {shortGoalsTab} short-term goals
                                </div>
                                            )}
                            </div>
                        </div>

                                    {/* Medium Term Goals */}
                                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-primary)] transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Medium Goals</h3>
                                            <button 
                                                onClick={() => openCreateGoalModal('medium')}
                                                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors duration-300"
                                            >
                                                +
                                            </button>
                    </div>
                                        
                                        <div className="flex gap-2 mb-4">
                                            <button
                                                onClick={() => setMediumGoalsTab('planned')}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                                                    mediumGoalsTab === 'planned' 
                                                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' 
                                                        : 'text-[var(--text-secondary)]'
                                                }`}
                                            >
                                                Planned
                                                <span className="ml-1 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full transition-colors duration-300">
                                                    {getGoalsByStatus(
                                                        getFilteredGoals(goals).filter(goal => goal.term === 'medium'),
                                                        'planned'
                                                    ).length}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => setMediumGoalsTab('achieved')}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                                                    mediumGoalsTab === 'achieved' 
                                                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' 
                                                        : 'text-[var(--text-secondary)]'
                                                }`}
                                            >
                                                Achieved
                                                <span className="ml-1 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full transition-colors duration-300">
                                                    {getGoalsByStatus(
                                                        getFilteredGoals(goals).filter(goal => goal.term === 'medium'),
                                                        'achieved'
                                                    ).length}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => setMediumGoalsTab('overdue')}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                                                    mediumGoalsTab === 'overdue' 
                                                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' 
                                                        : 'text-[var(--text-secondary)]'
                                                }`}
                                            >
                                                Overdue
                                                <span className="ml-1 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full transition-colors duration-300">
                                                    {getGoalsByStatus(
                                                        getFilteredGoals(goals).filter(goal => goal.term === 'medium'),
                                                        'overdue'
                                                    ).length}
                                                </span>
                            </button>
                        </div>

                                                                                <div className="space-y-4">
                                            {getGoalsByStatus(
                                                getFilteredGoals(goals).filter(goal => goal.term === 'medium'),
                                                mediumGoalsTab
                                            ).map(renderGoalCard)}
                                            {getGoalsByStatus(
                                                getFilteredGoals(goals).filter(goal => goal.term === 'medium'),
                                                mediumGoalsTab
                                            ).length === 0 && (
                                                <div className="text-center py-8 text-[var(--text-tertiary)]">
                                                    No {mediumGoalsTab} medium-term goals
                                        </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Long Term Goals */}
                                    <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-primary)] transition-colors duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)]">Long Goals</h3>
                                            <button 
                                                onClick={() => openCreateGoalModal('long')}
                                                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors duration-300"
                                            >
                                                +
                                            </button>
                                    </div>
                                    
                                        <div className="flex gap-2 mb-4">
                                            <button
                                                onClick={() => setLongGoalsTab('planned')}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                                                    longGoalsTab === 'planned' 
                                                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' 
                                                        : 'text-[var(--text-secondary)]'
                                                }`}
                                            >
                                                Planned
                                                <span className="ml-1 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full transition-colors duration-300">
                                                    {getGoalsByStatus(
                                                        getFilteredGoals(goals).filter(goal => goal.term === 'long'),
                                                        'planned'
                                                    ).length}
                                                </span>
                                        </button>
                                            <button
                                                onClick={() => setLongGoalsTab('achieved')}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                                                    longGoalsTab === 'achieved' 
                                                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' 
                                                        : 'text-[var(--text-secondary)]'
                                                }`}
                                            >
                                                Achieved
                                                <span className="ml-1 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full transition-colors duration-300">
                                                    {getGoalsByStatus(
                                                        getFilteredGoals(goals).filter(goal => goal.term === 'long'),
                                                        'achieved'
                                                    ).length}
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => setLongGoalsTab('overdue')}
                                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                                                    longGoalsTab === 'overdue' 
                                                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' 
                                                        : 'text-[var(--text-secondary)]'
                                                }`}
                                            >
                                                Overdue
                                                <span className="ml-1 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-0.5 rounded-full transition-colors duration-300">
                                                    {getGoalsByStatus(
                                                        getFilteredGoals(goals).filter(goal => goal.term === 'long'),
                                                        'overdue'
                                                    ).length}
                                                </span>
                                        </button>
                                    </div>

                                                                                <div className="space-y-4">
                                            {getGoalsByStatus(
                                                getFilteredGoals(goals).filter(goal => goal.term === 'long'),
                                                longGoalsTab
                                            ).map(renderGoalCard)}
                                            {getGoalsByStatus(
                                                getFilteredGoals(goals).filter(goal => goal.term === 'long'),
                                                longGoalsTab
                                            ).length === 0 && (
                                                <div className="text-center py-4 text-[var(--text-tertiary)]">
                                                    No {longGoalsTab} long-term goals
                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );

            case "Privacy & Security":
                return (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Privacy & Security</h3>
                            <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm w-full sm:w-auto">
                                Save Changes
                            </button>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                            {securitySettings.map((setting) => (
                                <div key={setting.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] gap-3 transition-colors duration-300">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-[var(--text-primary)] mb-1">{setting.name}</h4>
                                        <p className="text-sm text-[var(--text-secondary)]">{setting.description}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            defaultChecked={setting.enabled}
                                        />
                                        <div className="w-11 h-6 bg-[var(--bg-tertiary)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[var(--border-primary)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 transition-colors duration-300"></div>
                                    </label>
                                </div>
                            ))}
                        </div>

                        {/* Change Password Section */}
                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-[var(--bg-card)] rounded-lg border border-[var(--border-primary)] transition-colors duration-300">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="font-semibold text-[var(--text-primary)] mb-1">Change Password</h4>
                                    <p className="text-sm text-[var(--text-secondary)]">Update your account password for enhanced security</p>
                                </div>
                                <button
                                    onClick={() => setShowChangePasswordModal(true)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors duration-300"
                                >
                                    Change Password
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors duration-300">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Security Tips</h4>
                            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                <li>• Use a strong, unique password</li>
                                <li>• Enable two-factor authentication</li>
                                <li>• Regularly review your login activity</li>
                                <li>• Keep your personal information private</li>
                            </ul>
                        </div>
                    </div>
                );

            case "Devices":
                return (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Header with session count and refresh */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Active Sessions</h3>
                                <p className="text-[var(--text-secondary)]">Manage your device sessions and security</p>
                                {sessions.length > 0 && (
                                    <p className="text-sm text-[var(--text-tertiary)] mt-1">
                                        Showing {startIndex + 1}-{Math.min(endIndex, sessions.length)} of {sessions.length} sessions
                                    </p>
                                )}
                                {/* Debug info */}
                                <div className="text-xs text-[var(--text-tertiary)] mt-2">
                                    <p>Debug: Sessions count: {sessions.length}</p>
                                    <p>Debug: Loading: {loadingSessions ? 'Yes' : 'No'}</p>
                                    <p>Debug: Current page: {currentPage}</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={() => {
                                        console.log("Manual refresh clicked");
                                        console.log("Current sessions state:", sessions);
                                        fetchSessions();
                                    }}
                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg sm:rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
                                >
                                    <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Debug Refresh
                                </button>
                                <button
                                    onClick={fetchSessions}
                                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
                                >
                                    <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Refresh
                                </button>
                            </div>
                        </div>
                        
                        {loadingSessions ? (
                            <div className="flex justify-center items-center py-8 sm:py-16">
                                <div className="flex flex-col items-center gap-3 sm:gap-4">
                                    <div className="animate-spin rounded-full h-10 sm:h-12 w-10 sm:w-12 border-4 border-blue-200 border-t-blue-500"></div>
                                    <p className="text-[var(--text-secondary)] text-sm sm:text-lg font-medium">Loading sessions...</p>
                                </div>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-8 sm:py-16">
                                <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                    <svg className="w-8 sm:w-10 h-8 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="text-[var(--text-secondary)] text-lg sm:text-xl font-medium mb-1 sm:mb-2">No active sessions found</p>
                                <p className="text-[var(--text-tertiary)] text-sm sm:text-base">Your device sessions will appear here</p>
                            </div>
                        ) : (
                            <>
                                {/* Sessions List - One per row */}
                                <div className="space-y-3 sm:space-y-4">
                                    {currentSessions.map((session) => (
                                        <div key={session._id} className="bg-[var(--bg-card)] rounded-lg sm:rounded-xl border border-[var(--border-primary)] p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300 sm:hover:transform sm:hover:scale-[1.02] transition-colors duration-300">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                                                {/* Left side - Device info */}
                                                <div className="flex items-center gap-4 sm:gap-6 flex-1">
                                                    {/* Platform icon and status */}
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className={`w-2 sm:w-3 h-2 sm:h-3 rounded-full ${session.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                                        <div className="text-xl sm:text-2xl">
                                                            {session.deviceInfo.platform === 'web' ? '🌐' : 
                                                             session.deviceInfo.platform === 'ios' ? '📱' :
                                                             session.deviceInfo.platform === 'android' ? '🤖' :
                                                             session.deviceInfo.platform === 'desktop' ? '💻' :
                                                             '📱'}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Device details */}
                                                    <div className="flex-1">
                                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-2">
                                                            <span className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                                                                {session.deviceInfo.platform === 'web' ? 'Web Browser' : 
                                                                 session.deviceInfo.platform === 'ios' ? 'iOS Device' :
                                                                 session.deviceInfo.platform === 'android' ? 'Android Device' :
                                                                 session.deviceInfo.platform === 'desktop' ? 'Desktop App' :
                                                                 'Mobile Device'}
                                                            </span>
                                                            <span className={`px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm font-medium rounded-full transition-colors duration-300 ${
                                                                session.isActive 
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700' 
                                                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-primary)]'
                                                            }`}>
                                                                {session.isActive ? '🟢 Active' : '⚫ Inactive'}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 text-xs sm:text-sm">
                                                            <div>
                                                                <span className="text-[var(--text-tertiary)]">Device ID:</span>
                                                                <span className="ml-1 sm:ml-2 font-mono text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg transition-colors duration-300">
                                                                    {session.deviceInfo.deviceId.substring(0, 8)}...
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[var(--text-tertiary)]">Created:</span>
                                                                <span className="ml-1 sm:ml-2 text-[var(--text-primary)] font-medium">
                                                                    {new Date(session.createdAt).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-[var(--text-tertiary)]">Expires:</span>
                                                                <span className="ml-1 sm:ml-2 text-[var(--text-primary)] font-medium">
                                                                    {new Date(session.expiresAt).toLocaleDateString('en-US', {
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Right side - Actions */}
                                                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                                    <div className="text-right sm:text-left">
                                                        <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">Created via</p>
                                                        <p className="text-xs sm:text-sm font-medium text-[var(--text-primary)] capitalize">{session.createdBy}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleTerminateSession(session._id)}
                                                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2 shadow-md hover:shadow-lg transform hover:scale-105 w-full sm:w-auto"
                                                    >
                                                        <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        Terminate
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between bg-[var(--bg-card)] rounded-lg sm:rounded-xl border border-[var(--border-primary)] p-3 sm:p-4 gap-3 sm:gap-0 transition-colors duration-300">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs sm:text-sm text-[var(--text-secondary)]">
                                                Page {currentPage} of {totalPages}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <button
                                                onClick={goToPreviousPage}
                                                disabled={currentPage === 1}
                                                className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transition-colors duration-300"
                                            >
                                                <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            
                                            {/* Page numbers */}
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                    <button
                                                        key={page}
                                                        onClick={() => goToPage(page)}
                                                        className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                                                            page === currentPage
                                                                ? 'bg-blue-500 text-white shadow-md'
                                                                : 'text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            <button
                                                onClick={goToNextPage}
                                                disabled={currentPage === totalPages}
                                                className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transition-colors duration-300"
                                            >
                                                <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        
                        {/* Security Tips Section */}
                        <div className="bg-gradient-to-r from-blue-50 dark:from-blue-900/30 to-indigo-50 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-lg sm:rounded-xl p-4 sm:p-6 transition-colors duration-300">
                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3 text-base sm:text-lg">
                                <svg className="w-4 sm:w-6 h-4 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                Security Tips
                            </h4>
                            <ul className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 space-y-2 sm:space-y-3">
                                <li className="flex items-start gap-2 sm:gap-3">
                                    <span className="text-blue-500 mt-1 text-sm sm:text-lg">•</span>
                                    <span>Regularly review your active sessions and terminate unknown devices</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-3">
                                    <span className="text-blue-500 mt-1 text-sm sm:text-lg">•</span>
                                    <span>Keep your password secure, unique, and change it regularly</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-3">
                                    <span className="text-blue-500 mt-1 text-sm sm:text-lg">•</span>
                                    <span>Enable two-factor authentication for enhanced security</span>
                                </li>
                                <li className="flex items-start gap-2 sm:gap-3">
                                    <span className="text-blue-500 mt-1 text-sm sm:text-lg">•</span>
                                    <span>Log out from shared devices and public computers</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                );

            case "Purchases":
                return (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Purchase History</h3>
                            <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm w-full sm:w-auto">
                                Download Receipts
                            </button>
                        </div>

                        <div className="space-y-3 sm:space-y-4">
                            {purchases.map((purchase) => (
                                <div key={purchase.id} className="bg-[var(--bg-secondary)] rounded-lg p-3 sm:p-4 border border-[var(--border-primary)] transition-colors duration-300">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
                                        <div>
                                            <h4 className="font-semibold text-[var(--text-primary)]">{purchase.item}</h4>
                                            <p className="text-sm text-[var(--text-secondary)]">Date: {purchase.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-base sm:text-lg font-bold text-[var(--text-primary)]">{purchase.amount}</div>
                                            <span className={`px-2 py-0.5 sm:py-1 text-xs rounded-full transition-colors duration-300 ${
                                                purchase.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                                                purchase.status === 'Delivered' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                                'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                                            }`}>
                                                {purchase.status}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button className="px-2 sm:px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-300">
                                            View Details
                                        </button>
                                        <button className="px-2 sm:px-3 py-1 text-xs bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-secondary)] transition-colors duration-300">
                                            Download Receipt
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700 transition-colors duration-300">
                            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-1 sm:mb-2">Total Spent</h4>
                            <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">$444.98</div>
                            <p className="text-sm text-green-700 dark:text-green-300">Across {purchases.length} purchases</p>
                        </div>
                    </div>
                );

            case "Uploads":
                return (
                    <div className="space-y-4 sm:space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Uploads</h3>
                            <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm w-full sm:w-auto flex items-center gap-2">
                                <i className="*:size-4" dangerouslySetInnerHTML={{ __html: icons.plus }} />
                                Upload
                            </button>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            {/* Search Bar */}
                            <div className="relative flex-1 max-w-md">
                                <input
                                    type="text"
                                    placeholder="Q Search Media"
                                    value={uploadsData.searchQuery}
                                    onChange={(e) => handleUploadsSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors duration-300"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    <i className="*:size-4 text-[var(--text-tertiary)]" dangerouslySetInnerHTML={{ __html: icons.search }} />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                {/* Filter Dropdown */}
                                <div className="relative filter-dropdown">
                                    <button 
                                        onClick={toggleFilterDropdown}
                                        className="px-3 py-2 border border-[var(--border-primary)] rounded-lg hover:bg-[var(--bg-secondary)] text-sm flex items-center gap-2 transition-colors duration-300"
                                    >
                                        <i className="*:size-4" dangerouslySetInnerHTML={{ __html: icons.menu }} />
                                        Filter
                                    </button>
                                    {uploadsData.isFilterOpen && (
                                        <div className="absolute right-0 top-full mt-1 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg shadow-[var(--shadow-secondary)] z-10 min-w-32 transition-colors duration-300">
                                            {["All", "Forehand", "Backhand", "Volley", "Serve"].map((filter) => (
                                                <button
                                                    key={filter}
                                                    onClick={() => handleUploadsFilterChange(filter)}
                                                    className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-secondary)] first:rounded-t-lg last:rounded-b-lg transition-colors duration-300 ${
                                                        uploadsData.activeFilter === filter ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600" : "text-[var(--text-primary)]"
                                                    }`}
                                                >
                                                    {filter}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Sort Button */}
                                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                    Sort
                                </button>
                            </div>
                        </div>

                        {/* Media Grid */}
                        {uploadsData.loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, index) => (
                                    <div key={index} className="bg-white rounded-lg overflow-hidden shadow-sm animate-pulse">
                                        <div className="aspect-square bg-gray-200"></div>
                                        <div className="p-3">
                                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : uploadsData.mediaItems.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-600 mb-2">No uploads yet</h3>
                                <p className="text-gray-500 mb-4">Start by uploading your first instructional photo or video</p>
                                <button 
                                    onClick={() => {
                                        setUploadsData(prev => ({ ...prev, selectedMedia: null }));
                                        openEditModal();
                                    }}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                    Upload First Media
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {uploadsData.mediaItems.map((item) => (
                                    <div key={item._id} className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="aspect-square overflow-hidden cursor-pointer" onClick={() => openMediaViewer(item)}>
                                        <img
                                            src={item.url}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                                {item.category}
                                            </span>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => {
                                                        setUploadsData(prev => ({ ...prev, selectedMedia: item }));
                                                        openShareModal();
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Share"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setUploadsData(prev => ({ ...prev, selectedMedia: item }));
                                                        openEditModal();
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        setUploadsData(prev => ({ ...prev, selectedMedia: item }));
                                                        openDeleteModal();
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-medium text-gray-800 truncate">{item.title}</h4>
                                    </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Media Viewer */}
                        {uploadsData.isViewerOpen && uploadsData.selectedMedia && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
                                <div className="relative w-full h-full bg-black">
                                    {/* Viewer Header */}
                                    <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={closeMediaViewer}
                                                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <span className="text-lg font-medium">Profile</span>
                                        </div>
                                        <button className="text-sm text-gray-300 hover:text-white">
                                            Full Screen
                                        </button>
                                    </div>

                                    {/* Media Content */}
                                    <div className="relative h-full flex items-center justify-center">
                                        <img
                                            src={uploadsData.selectedMedia.url}
                                            alt={uploadsData.selectedMedia.title}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                        
                                        {/* Control Bar Overlay */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6">
                                            {/* Playback Controls */}
                                            <div className="flex items-center justify-between text-white mb-4">
                                                <div className="flex items-center gap-3">
                                                    <button className="p-2 rounded-full hover:bg-white/20 transition-colors">
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M8 5v14l11-7z" />
                                                        </svg>
                                                    </button>
                                                    <span className="text-sm">0:10 / 0:41</span>
                                                </div>
                                                <div className="text-sm font-medium">
                                                    {uploadsData.selectedMedia.title}
                                                </div>
                                                <button className="p-2 rounded-full hover:bg-white/20 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    </svg>
                                                </button>
                                            </div>
                                            
                                            {/* Progress Bar */}
                                            <div className="w-full bg-white/30 rounded-full h-1 mb-4">
                                                <div className="bg-white h-1 rounded-full w-1/4"></div>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={openShareModal}
                                                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                                                    </svg>
                                                    Share
                                                </button>
                                                <button
                                                    onClick={openEditModal}
                                                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 font-medium"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={openDeleteModal}
                                                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 font-medium"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bottom Navigation */}
                        <div className="flex justify-center">
                            <div className="bg-[var(--bg-tertiary)] rounded-lg p-1 flex transition-colors duration-300">
                                <button
                                    onClick={() => handleUploadsTabChange("Videos")}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                                        uploadsData.activeTab === "Videos" 
                                            ? "bg-[var(--bg-card)] text-blue-600 shadow-sm" 
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Videos
                                </button>
                                <button
                                    onClick={() => handleUploadsTabChange("Photos")}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                                        uploadsData.activeTab === "Photos" 
                                            ? "bg-[var(--bg-card)] text-blue-600 shadow-sm" 
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Photos
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-auto bg-[var(--bg-primary)] transition-colors duration-300">
            {/* Header with Tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 pb-2 sm:pb-4 gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                        <i
                            className="*:size-4 sm:*:size-5 text-[var(--text-secondary)]"
                            dangerouslySetInnerHTML={{ __html: icons.back }}
                        />
                    </button>
                    <h1 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">User Profile</h1>
                </div>

                {/* Responsive Tabs */}
                <div className="flex flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                activeTab === tab.name
                                    ? "bg-lime-500 text-white"
                                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                            }`}
                        >
                            <span className="hidden sm:inline-block mr-1">{tab.icon}</span>
                            {tab.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-b border-[var(--border-primary)] mx-3 sm:mx-6 transition-colors duration-300"></div>

            {/* Main Content */}
            <div className={`flex flex-col gap-4 p-4 sm:p-6 flex-1 overflow-auto lg:flex-row `}>
                {/* Left Panel - Profile Summary - Hidden for all tabs except Basic */}
                {activeTab === "Basic" && (
                <div className="w-full lg:w-1/3 xl:w-1/2 flex justify-center items-center lg:sticky lg:top-0 lg:self-start lg:h-screen lg:overflow-y-auto lg:pt-6 lg:pb-20 hidden lg:flex">
                    <div className="bg-[var(--bg-card)] rounded-xl sm:rounded-2xl shadow-[var(--shadow-secondary)] overflow-hidden w-full max-w-md transition-all duration-300 hover:shadow-[var(--shadow-primary)] h-fit flex-shrink-0 sm:transform sm:hover:scale-105 border border-[var(--border-primary)]">
                        {/* Profile Header */}
                        <div className="bg-gradient-to-br from-[#C3F85C] to-[#A3D94C] p-4 sm:p-6 flex flex-col justify-center items-center text-center relative">
                            {/* Decorative elements */}
                            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-white"></div>
                                <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 w-8 sm:w-12 h-8 sm:h-12 rounded-full bg-white"></div>
                            </div>

                            <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden mx-auto mb-3 sm:mb-4 border-4 border-white shadow-lg transition-transform duration-300 hover:scale-110">
                                <img
                                    src={userProfile?.avatar}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                                    <label 
                                        htmlFor="profile-picture-upload-summary"
                                        className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 rounded-full flex items-center justify-center cursor-pointer group"
                                    >
                                        {uploadingProfilePic ? (
                                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                                        ) : (
                                            <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </label>
                                    <input
                                        id="profile-picture-upload-summary"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setUploadingProfilePic(true);
                                                try {
                                                    const updatedProfile = await uploadProfilePicture(file);
                                                    setUserProfile(updatedProfile);
                                                    toast.success("Profile picture updated successfully!");
                                                } catch (error) {
                                                    console.error("Failed to upload profile picture:", error);
                                                    toast.error("Failed to upload profile picture");
                                                } finally {
                                                    setUploadingProfilePic(false);
                                                }
                                            }
                                        }}
                                />
                            </div>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 drop-shadow-sm">Welcome, {userProfile?.firstName || formData.firstName}</h2>
                            <p className="text-gray-800/90 text-xs sm:text-sm font-medium">{userProfile?.tennisRanking?.toUpperCase() || 'Professional Player'}</p>
                        </div>

                        {/* Stats Section */}
                        <div className="bg-gradient-to-r from-[#5368FF] to-[#4A5FE8] p-3 sm:p-4 md:p-5 lg:p-6 text-white">
                            <div className="flex justify-between items-center">
                                <div className="text-center flex-1">
                                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
                                        {userProfile?.coachGoals?.reduce((total, coachGoal) => total + (coachGoal.goals?.length || 0), 0) || 21}
                                    </div>
                                    <div className="text-xs sm:text-xs md:text-sm font-medium opacity-90 tracking-wider">GOALS</div>
                                </div>
                                <div className="w-px h-8 sm:h-10 md:h-12 bg-white/30"></div>
                                <div className="text-center flex-1">
                                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
                                        {userProfile?.periodizations?.length || 38}
                                    </div>
                                    <div className="text-xs sm:text-xs md:text-sm font-medium opacity-90 tracking-wider">PROGRAMS</div>
                                </div>
                                <div className="w-px h-8 sm:h-10 md:h-12 bg-white/30"></div>
                                <div className="text-center flex-1">
                                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1">
                                        {userProfile?.coaches?.length || 8}
                                    </div>
                                    <div className="text-xs sm:text-xs md:text-sm font-medium opacity-90 tracking-wider">COACHES</div>
                                </div>
                            </div>
                        </div>

                        {/* Quote Section */}
                        <div className="bg-gradient-to-r from-[#5368FF] to-[#4A5FE8] text-white p-3 sm:p-4 md:p-5 lg:p-6 pb-4 sm:pb-6 text-center relative overflow-hidden rounded-b-xl sm:rounded-b-2xl">
                            {/* Decorative pattern */}
                            <div className="absolute inset-0 opacity-10 pattern-dots pattern-white pattern-size-4"></div>

                            <div className="relative z-10">
                                <div className="text-xs sm:text-sm md:text-base mb-2 sm:mb-3 font-medium flex items-center justify-center">
                                    <svg className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                    Joined on {userProfile?.updatedAt ? new Date(userProfile.updatedAt).toLocaleDateString('en-US', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    }) : '07 May 2025'}
                                </div>

                                <div className="border-t border-white/20 my-2 sm:my-4 mx-4 sm:mx-8"></div>

                                <div className="relative">
                                    <svg className="absolute -left-2 sm:-left-3 -top-2 sm:-top-3 w-4 sm:w-6 h-4 sm:h-6 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                    <blockquote className="text-xs sm:text-sm md:text-base italic font-medium leading-relaxed px-2 sm:px-4">
                                        "Champions keep playing until they get it right, not because it's easy, but because they refuse to quit."
                                    </blockquote>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {/* Right Panel - Tab Content - Full width for all tabs except Basic */}
                <div className={`bg-[var(--bg-card)] rounded-xl sm:rounded-2xl shadow-[var(--shadow-secondary)] p-4 sm:p-6 md:p-8 min-h-0 flex-1 border border-[var(--border-primary)] transition-colors duration-300 ${
                    activeTab === "Basic" 
                        ? 'w-full lg:w-2/3 xl:w-1/2' 
                        : 'w-full'
                }`}>
                    {renderTabContent()}
                </div>
            </div>

            {/* Modals */}
            {/* Share Modal */}
            {uploadsData.isShareModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] w-full max-w-md mx-4 border border-[var(--border-primary)] transition-colors duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Share Media</h3>
                            <button
                                onClick={closeShareModal}
                                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Search Connections */}
                        <div className="p-4 border-b border-[var(--border-primary)]">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search Connections"
                                    value={shareFormData.searchQuery}
                                    onChange={(e) => handleSearchInputChange(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors duration-300"
                                />
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                    {shareFormData.isSearching ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                                    ) : (
                                        <svg className="w-5 h-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Share with Section */}
                        <div className="p-4 border-b border-[var(--border-primary)]">
                            <h4 className="font-medium text-[var(--text-primary)] mb-3">Share with</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {shareFormData.searchResults.length === 0 && !shareFormData.isSearching ? (
                                    <div className="text-center py-4 text-[var(--text-tertiary)]">
                                        {shareFormData.searchQuery ? 'No connections found' : 'Start typing to search connections'}
                                    </div>
                                ) : (
                                    shareFormData.searchResults.map((contact) => (
                                        <div
                                            key={contact._id}
                                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                                                shareFormData.selectedContacts.includes(contact._id)
                                                    ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                                                    : "hover:bg-[var(--bg-secondary)]"
                                            }`}
                                            onClick={() => toggleContactSelection(contact._id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-lg overflow-hidden">
                                                    {contact.avatar ? (
                                                        <img 
                                                            src={contact.avatar} 
                                                            alt={contact.firstName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-[var(--text-secondary)] font-medium">
                                                            {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-[var(--text-primary)]">
                                                        {contact.firstName} {contact.lastName}
                                                    </div>
                                                    <div className="text-sm text-[var(--text-secondary)] capitalize">
                                                        {contact.role}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border-2 ${
                                                shareFormData.selectedContacts.includes(contact._id)
                                                    ? "bg-blue-500 border-blue-500"
                                                    : "border-[var(--border-primary)]"
                                            }`}>
                                                {shareFormData.selectedContacts.includes(contact._id) && (
                                                    <div className="w-full h-full rounded-full bg-white scale-75"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Message Section */}
                        <div className="p-4 border-b border-[var(--border-primary)]">
                            <h4 className="font-medium text-[var(--text-primary)] mb-3">Message</h4>
                            <textarea
                                value={shareFormData.message}
                                onChange={(e) => setShareFormData(prev => ({ ...prev, message: e.target.value }))}
                                placeholder="Achieve 70% first serve accuracy in practice within 2 weeks."
                                className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors duration-300"
                                rows={3}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 p-4">
                            <button
                                onClick={closeShareModal}
                                className="flex-1 px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleShareSubmit}
                                disabled={shareFormData.selectedContacts.length === 0}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Send to {shareFormData.selectedContacts.length} people
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {uploadsData.isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] w-full max-w-md mx-4 border border-[var(--border-primary)] transition-colors duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Edit Media</h3>
                            <button
                                onClick={closeEditModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Edit Form */}
                        <div className="p-4 space-y-4">
                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload New File (Optional)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Title Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.title}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter media title"
                                />
                            </div>

                            {/* Category Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <select
                                    value={editFormData.category}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="All">All</option>
                                    <option value="Forehand">Forehand</option>
                                    <option value="Backhand">Backhand</option>
                                    <option value="Volley">Volley</option>
                                    <option value="Serve">Serve</option>
                                </select>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={closeEditModal}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSubmit}
                                disabled={!editFormData.title.trim()}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {uploadsData.isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] rounded-lg shadow-[var(--shadow-secondary)] w-full max-w-md mx-4 border border-[var(--border-primary)] transition-colors duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Delete Media</h3>
                            <button
                                onClick={closeDeleteModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Delete Confirmation */}
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-800">Are you sure?</h4>
                                    <p className="text-sm text-gray-500">This action cannot be undone.</p>
                                </div>
                            </div>
                            <p className="text-gray-600">
                                You are about to delete "{uploadsData.selectedMedia?.title}". This will permanently remove the media from your uploads.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={closeDeleteModal}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteMedia}
                                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Goal Modal */}
            {isGoalModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-secondary)] w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto border border-[var(--border-primary)] transition-colors duration-300">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
                            <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                                {isEditingGoal ? 'Edit Goal' : 'Create New Goal'}
                            </h3>
                            <button
                                onClick={closeGoalModal}
                                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors p-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Goal Form */}
                        <form onSubmit={handleGoalSubmit} className="p-6 space-y-6">
                            {/* Basic Goal Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                        Goal Type *
                                    </label>
                                    <select
                                        value={goalFormData.goal}
                                        onChange={(e) => setGoalFormData(prev => ({ ...prev, goal: e.target.value as any }))}
                                        className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300"
                                        required
                                    >
                                        <option value="technical">Technical</option>
                                        <option value="tactical">Tactical</option>
                                        <option value="physical">Physical</option>
                                        <option value="mental">Mental</option>
                                        <option value="nutrition">Nutrition</option>
                                        <option value="recovery">Recovery</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                        Timeframe *
                                    </label>
                                    <select
                                        value={goalFormData.term}
                                        onChange={(e) => setGoalFormData(prev => ({ ...prev, term: e.target.value as any }))}
                                        className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300"
                                        required
                                    >
                                        <option value="short">Short Term</option>
                                        <option value="medium">Medium Term</option>
                                        <option value="long">Long Term</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                    Goal Description *
                                </label>
                                <input
                                    type="text"
                                    value={goalFormData.description}
                                    onChange={(e) => setGoalFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors duration-300"
                                    placeholder="e.g., Improve backhand consistency"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                    Measurement Criteria *
                                </label>
                                <textarea
                                    value={goalFormData.measurement}
                                    onChange={(e) => setGoalFormData(prev => ({ ...prev, measurement: e.target.value }))}
                                    className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors duration-300"
                                    placeholder="e.g., Achieve 80% accuracy in backhand shots"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                    Target Achievement Date *
                                </label>
                                <input
                                    type="date"
                                    value={goalFormData.achievementDate}
                                    onChange={(e) => setGoalFormData(prev => ({ ...prev, achievementDate: e.target.value }))}
                                    className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300"
                                    required
                                />
                            </div>

                            {/* Actions Section */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-4">Action Steps</h4>
                                <div className="space-y-4">
                                    {goalFormData.actions.map((action, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">{action.description}</p>
                                                <p className="text-sm text-gray-500">Due: {action.date}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeAction(index)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={newAction}
                                            onChange={(e) => setNewAction(e.target.value)}
                                            placeholder="Enter action step"
                                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <input
                                            type="date"
                                            value={newActionDate}
                                            onChange={(e) => setNewActionDate(e.target.value)}
                                            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <button
                                            type="button"
                                            onClick={addAction}
                                            disabled={!newAction.trim() || !newActionDate}
                                            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isAddingAction ? 'Adding...' : 'Add Action'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Obstacles Section */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-4">Potential Obstacles</h4>
                                <div className="space-y-4">
                                    {goalFormData.obstacles.map((obstacle, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">{obstacle.description}</p>
                                                <p className="text-sm text-gray-500">Due: {obstacle.date}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeObstacle(index)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={newObstacle}
                                            onChange={(e) => setNewObstacle(e.target.value)}
                                            placeholder="Enter potential obstacle"
                                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <input
                                            type="date"
                                            value={newObstacleDate}
                                            onChange={(e) => setNewObstacleDate(e.target.value)}
                                            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <button
                                            type="button"
                                            onClick={addObstacle}
                                            disabled={!newObstacle.trim() || !newObstacleDate}
                                            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isAddingObstacle ? 'Adding...' : 'Add Obstacle'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Notes (Optional)
                                </label>
                                <textarea
                                    value={goalFormData.addOn}
                                    onChange={(e) => setGoalFormData(prev => ({ ...prev, addOn: e.target.value }))}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Any additional information or notes..."
                                    rows={3}
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={closeGoalModal}
                                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoadingGoal || !goalFormData.description.trim() || !goalFormData.measurement.trim() || !goalFormData.achievementDate}
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                    {isLoadingGoal ? 'Saving...' : (isEditingGoal ? 'Update Goal' : 'Create Goal')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showChangePasswordModal && (
                <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--bg-card)] rounded-lg max-w-md w-full p-6 border border-[var(--border-primary)] transition-colors duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-[var(--text-primary)]">Change Password</h3>
                            <button
                                onClick={handleCancelChangePassword}
                                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={changePasswordData.oldPassword}
                                    onChange={(e) => handleChangePasswordInput("oldPassword", e.target.value)}
                                    className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors duration-300"
                                    placeholder="Enter your current password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={changePasswordData.newPassword}
                                    onChange={(e) => handleChangePasswordInput("newPassword", e.target.value)}
                                    className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors duration-300"
                                    placeholder="Enter your new password"
                                />
                                <p className="text-xs text-[var(--text-tertiary)] mt-1">Password must be at least 8 characters long</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={changePasswordData.confirmPassword}
                                    onChange={(e) => handleChangePasswordInput("confirmPassword", e.target.value)}
                                    className="w-full p-3 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] transition-colors duration-300"
                                    placeholder="Confirm your new password"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCancelChangePassword}
                                className="flex-1 px-4 py-3 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors duration-300 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={changingPassword || !changePasswordData.oldPassword || !changePasswordData.newPassword || !changePasswordData.confirmPassword}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 font-medium"
                            >
                                {changingPassword ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}