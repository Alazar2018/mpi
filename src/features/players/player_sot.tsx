import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import Button from "@/components/Button";
import icons from "@/utils/icons";
import { motion, AnimatePresence } from "framer-motion";
import { useSOT } from "@/hooks/useSOT";
import SOTService from "@/service/sot.server";
import { toast } from "react-toastify";
import { useAuthStore } from "@/store/auth.store";
import type { 
  Periodization, 
  TrainingPhase,
  CreatePeriodizationRequest,
  AddPreparationRequest,
  AddCompetitionRequest,
  AddTransitionRequest
} from "@/service/sot.server";
import type { Player } from "@/service/players.server";

export default function PlayerSOT() {
  const [showPreparationModal, setShowPreparationModal] = useState(false);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [showCreateSOTModal, setShowCreateSOTModal] = useState(false);
  const [activeTab, setActiveTab] = useState('physical');
  const [dateRange, setDateRange] = useState('Jan-01-25 - Aug-01-25');
  
  // SOT Creation Form State
  const [sotFormData, setSotFormData] = useState({
    goalTerm: '',
    periodDuration: '6', // Default to 6 months
    endDate: ''
  });

  // Editing and deletion state
  const [editingPeriodization, setEditingPeriodization] = useState<Periodization | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPeriodizationId, setDeletingPeriodizationId] = useState<string | null>(null);
  
  // Get player data from parent component context
  const player = useOutletContext<Player>();
  
  // Get current user's role to determine permissions
  const authStore = useAuthStore();
  const currentUserRole = authStore.getRole();
  
  // Check if current user can create/edit SOT (coaches and admins can, parents cannot)
  const canCreateSOT = currentUserRole === 'coach' || currentUserRole === 'admin';
  
  // Use SOT hook for API integration
  const {
    periodizations,
    currentPeriodization,
    isLoading,
    error,
    fetchPeriodizations,
    createPeriodization,
    addPreparationPhase,
    addCompetitionPhase,
    addTransitionPhase,
    updatePreparationPhase,
    updateCompetitionPhase,
    updateTransitionPhase,
    calculateProgress,
    getDayProgress,
    clearError,
    setCurrentPeriodizationById
  } = useSOT();

  // Helper functions for player data
  const getPlayerFullName = useCallback(() => {
    if (!player) return 'Player';
    return `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Player';
  }, [player]);

  const getPlayerAvatar = useCallback(() => {
    if (!player) return 'https://randomuser.me/api/portraits/men/32.jpg';
    if (player.avatar) return player.avatar;
    
    // Generate initials avatar if no avatar
    const initials = getPlayerFullName().split(' ').map(n => n.charAt(0)).join('').toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(getPlayerFullName())}&background=random&color=fff&size=128`;
  }, [player, getPlayerFullName]);

  const getPlayerInitials = useCallback(() => {
    if (!player) return 'P';
    const firstName = player.firstName || '';
    const lastName = player.lastName || '';
    if (!firstName && !lastName) return 'P';
    const first = firstName ? firstName.charAt(0) : '';
    const last = lastName ? lastName.charAt(0) : '';
    return (first + last).toUpperCase().slice(0, 2);
  }, [player]);

  const getAvatarColor = useCallback(() => {
    if (!player) return 'bg-[var(--bg-primary)]';
    const name = player.firstName || player.lastName || '';
    if (!name) return 'bg-[var(--bg-primary)]';
    const colors = [
      'bg-[var(--bg-primary)]',
      'bg-[var(--bg-primary)]',
      'bg-[var(--bg-primary)]',
      'bg-[var(--bg-primary)]',
      'bg-[var(--bg-primary)]',
      'bg-[var(--bg-primary)]'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }, [player]);

  // Helper function for date formatting
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  // State for editing phases
  const [editingPhase, setEditingPhase] = useState<{
    type: 'preparation' | 'competition' | 'transition';
    data: any;
  } | null>(null);

  const trainingTabs = useMemo(() => [
    { id: 'physical', label: 'Physical', icon: icons.users, color: 'bg-blue-500' },
    { id: 'technical', label: 'Technical', icon: icons.technical, color: 'bg-purple-500' },
    { id: 'psychological', label: 'Psychological', icon: icons.book, color: 'bg-green-500' },
    { id: 'tactical', label: 'Tactical', icon: icons.moon, color: 'bg-indigo-500' },
    { id: 'nutrition', label: 'Nutrition', icon: icons.settings, color: 'bg-red-500' },
    { id: 'recovery', label: 'Recovery', icon: icons.users, color: 'bg-yellow-500' }
  ], []);

  // Get player ID from URL params
  const { id } = useParams();
  const playerId = id || '1';

  // Transform API data to match component expectations
  const transformPeriodizationData = (periodization: Periodization | null) => {
    if (!periodization) {
      return {
        name: getPlayerFullName(),
        image: getPlayerAvatar(),
        periods: [],
        overallProgress: 0,
        currentDay: 0,
        totalDays: 0
      };
    }

    const periods = [
        {
          id: 1,
          name: "Preparations",
          icon: icons.settings,
          goals: (periodization[activeTab as keyof Periodization] as TrainingPhase)?.preparation?.generals || [],
          progress: (periodization[activeTab as keyof Periodization] as TrainingPhase)?.preparation ? 60 : 0,
          type: "preparations",
          color: "bg-blue-500"
        },
        {
          id: 2,
          name: "Competition",
          icon: icons.trophy,
          goals: (periodization[activeTab as keyof Periodization] as TrainingPhase)?.competition?.tournaments || [],
          progress: (periodization[activeTab as keyof Periodization] as TrainingPhase)?.competition ? 75 : 0,
          type: "competition",
          color: "bg-green-500"
        },
        {
          id: 3,
          name: "Transition",
          icon: icons.chevronRight,
          goals: (periodization[activeTab as keyof Periodization] as TrainingPhase)?.transition?.activeRest || [],
          progress: (periodization[activeTab as keyof Periodization] as TrainingPhase)?.transition ? 70 : 0,
          type: "transition",
          color: "bg-purple-500"
        }
    ];

    const overallProgress = calculateProgress(periodization);
    const { currentDay, totalDays } = getDayProgress(periodization);

    return {
      name: getPlayerFullName(),
      image: getPlayerAvatar(),
      periods,
      overallProgress,
      currentDay,
      totalDays
    };
  };

  const currentPlayerSOT = useMemo(() => transformPeriodizationData(currentPeriodization), [currentPeriodization, activeTab, calculateProgress, getDayProgress]);
  const sotPeriods = currentPlayerSOT.periods;

  // Fetch periodizations when component mounts
  useEffect(() => {
    fetchPeriodizations();
  }, [fetchPeriodizations]);

  // Update date range when current periodization changes
  useEffect(() => {
    if (currentPeriodization?.startingDate && currentPeriodization?.endingDate) {
      const startDate = new Date(currentPeriodization.startingDate);
      const endDate = new Date(currentPeriodization.endingDate);
      const startStr = formatDate(currentPeriodization.startingDate);
      const endStr = formatDate(currentPeriodization.endingDate);
      setDateRange(`${startStr} - ${endStr}`);
    }
  }, [currentPeriodization, formatDate]);

  const handleAddPreparationPhase = useCallback(() => {
    if (!currentPeriodization) {
      alert('Please create a periodization first');
      return;
    }
    setShowPreparationModal(true);
  }, [currentPeriodization]);

  const handleAddCompetitionPhase = useCallback(() => {
    if (!currentPeriodization) {
      alert('Please create a periodization first');
      return;
    }
    setShowCompetitionModal(true);
  }, [currentPeriodization]);

  const handleAddTransitionPhase = useCallback(() => {
    if (!currentPeriodization) {
      alert('Please create a periodization first');
      return;
    }
    setShowTransitionModal(true);
  }, [currentPeriodization]);

  const handleCreatePreparationPhase = useCallback(async (data: AddPreparationRequest) => {
    if (!currentPeriodization) return;
    
    try {
      await addPreparationPhase(currentPeriodization._id, data);
      // Refresh the periodization data to show the new phase
      await fetchPeriodizations();
      setShowPreparationModal(false);
    } catch (error) {
      console.error('Failed to create preparation phase:', error);
      throw error; // Re-throw to handle in the calling function
    }
  }, [currentPeriodization, addPreparationPhase, fetchPeriodizations]);

  const handleCreateCompetitionPhase = useCallback(async (data: AddCompetitionRequest) => {
    if (!currentPeriodization) return;
    
    try {
      await addCompetitionPhase(currentPeriodization._id, data);
      // Refresh the periodization data to show the new phase
      await fetchPeriodizations();
      setShowCompetitionModal(false);
    } catch (error) {
      console.error('Failed to create competition phase:', error);
      throw error; // Re-throw to handle in the calling function
    }
  }, [currentPeriodization, addCompetitionPhase, fetchPeriodizations]);

  const handleCreateTransitionPhase = useCallback(async (data: AddTransitionRequest) => {
    if (!currentPeriodization) return;
    
    try {
      await addTransitionPhase(currentPeriodization._id, data);
      // Refresh the periodization data to show the new phase
      await fetchPeriodizations();
      setShowTransitionModal(false);
    } catch (error) {
      console.error('Failed to create transition phase:', error);
      throw error; // Re-throw to handle in the calling function
    }
  }, [currentPeriodization, addTransitionPhase, fetchPeriodizations]);

  const handleCreateNewPeriodization = useCallback(() => {
    // Create a new periodization with default dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6); // 6 months from now
    
    createPeriodization({
      startingDate: startDate.toISOString(),
      endingDate: endDate.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
  }, [createPeriodization]);

  const handleOpenCreateSOTModal = useCallback(() => {
    setShowCreateSOTModal(true);
  }, []);

  const handleCreateSOTPeriod = useCallback(() => {
    // Get form data and create periodization
    const startDate = new Date();
    let endDate = new Date();
    
    if (sotFormData.periodDuration) {
      // Use selected period duration
      const months = parseInt(sotFormData.periodDuration);
      endDate.setMonth(endDate.getMonth() + months);
    } else if (sotFormData.endDate) {
      // Use custom end date
      endDate = new Date(sotFormData.endDate);
    }
    
    createPeriodization({
      startingDate: startDate.toISOString(),
      endingDate: endDate.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
    
    setShowCreateSOTModal(false);
    // Reset form
    setSotFormData({
      goalTerm: '',
      periodDuration: '6',
      endDate: ''
    });
  }, [sotFormData, createPeriodization]);

  const handleEditPeriodization = useCallback((periodization: Periodization) => {
    setEditingPeriodization(periodization);
    setSotFormData({
      goalTerm: '', // No goalTerm in Periodization interface
      periodDuration: '',
      endDate: periodization.endingDate ? new Date(periodization.endingDate).toISOString().split('T')[0] : ''
    });
    setShowCreateSOTModal(true);
  }, []);

  const handleDeletePeriodization = useCallback((periodizationId: string) => {
    setDeletingPeriodizationId(periodizationId);
    setShowDeleteConfirm(true);
  }, []);

  const confirmDeletePeriodization = useCallback(async () => {
    if (deletingPeriodizationId) {
      try {
        // Call delete API here - you'll need to add this to your SOT service
        // await deletePeriodization(deletingPeriodizationId);
        setShowDeleteConfirm(false);
        setDeletingPeriodizationId(null);
        // Refresh the list
        fetchPeriodizations();
      } catch (error) {
        console.error('Failed to delete periodization:', error);
      }
    }
  }, [deletingPeriodizationId, fetchPeriodizations]);

  // Phase action handlers
  const handlePeriodTypeAction = useCallback((type: string) => {
    switch (type) {
      case 'preparations':
        setShowPreparationModal(true);
        break;
      case 'competition':
        setShowCompetitionModal(true);
        break;
      case 'transition':
        setShowTransitionModal(true);
        break;
      default:
        break;
    }
  }, []);

  // Edit phase handlers
  const handleEditPreparationPhase = useCallback(() => {
    if (!currentPeriodization || !currentPeriodization[activeTab as keyof Periodization]) return;
    
    const phaseData = (currentPeriodization[activeTab as keyof Periodization] as TrainingPhase)?.preparation;
    if (!phaseData) return;
    
    setEditingPhase({
      type: 'preparation',
      data: phaseData
    });
    setShowPreparationModal(true);
  }, [currentPeriodization, activeTab]);

  const handleEditCompetitionPhase = useCallback(() => {
    if (!currentPeriodization || !currentPeriodization[activeTab as keyof Periodization]) return;
    
    const phaseData = (currentPeriodization[activeTab as keyof Periodization] as TrainingPhase)?.competition;
    if (!phaseData) return;
    
    setEditingPhase({
      type: 'competition',
      data: phaseData
    });
    setShowCompetitionModal(true);
  }, [currentPeriodization, activeTab]);

  const handleEditTransitionPhase = useCallback(() => {
    if (!currentPeriodization || !currentPeriodization[activeTab as keyof Periodization]) return;
    
    const phaseData = (currentPeriodization[activeTab as keyof Periodization] as TrainingPhase)?.transition;
    if (!phaseData) return;
    
    setEditingPhase({
      type: 'transition',
      data: phaseData
    });
    setShowTransitionModal(true);
  }, [currentPeriodization, activeTab]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  const handlePeriodizationChange = useCallback((periodizationId: string) => {
    setCurrentPeriodizationById(periodizationId);
  }, [setCurrentPeriodizationById]);

  // Clear editing state when closing modals
  const clearEditingState = useCallback(() => {
    setEditingPhase(null);
  }, []);

  const handleClosePreparationModal = useCallback(() => {
    setShowPreparationModal(false);
    clearEditingState();
  }, [clearEditingState]);

  const handleCloseCompetitionModal = useCallback(() => {
    setShowCompetitionModal(false);
    clearEditingState();
  }, [clearEditingState]);

  const handleCloseTransitionModal = useCallback(() => {
    setShowTransitionModal(false);
    clearEditingState();
  }, [clearEditingState]);


  // Show error if there's an API error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div className="text-red-500 text-xl font-semibold">Error Loading SOT Data</div>
        <div className="text-[var(--text-secondary)]">{error}</div>
        <Button onClick={clearError} className="!px-4 !py-2 !bg-blue-600 !text-white">
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 bg-[var(--bg-tertiary)] min-h-screen transition-colors duration-300">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl p-6 shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] transition-colors duration-300"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
                         {player?.avatar ? (
            <img 
                 src={player.avatar} 
                 alt={getPlayerFullName()}
              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
            />
             ) : (
               <div className="w-12 h-12 rounded-full border-2 border-[var(--border-primary)] shadow bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-primary)] font-bold text-lg">
                 {getPlayerInitials()}
               </div>
             )}
            <div>
                             <h2 className="text-xl font-bold text-[var(--text-primary)]">{getPlayerFullName()}</h2>
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                <i dangerouslySetInnerHTML={{ __html: icons.calendar }} />
                <span className="font-medium">{dateRange}</span>
                {currentPeriodization && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentPeriodization.status === 'active' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]' :
                    currentPeriodization.status === 'completed' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]' :
                    currentPeriodization.status === 'pending' ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]' :
                    'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]'
                  }`}>
                    {currentPeriodization.status.charAt(0).toUpperCase() + currentPeriodization.status.slice(1)}
                  </span>
                )}
              </div>
              {periodizations.length > 1 && (
                <div className="mt-2">
                                     <select 
                     className="text-sm border border-[var(--border-primary)] rounded px-2 py-1 bg-[var(--bg-card)] text-[var(--text-primary)]"
                     value={currentPeriodization?._id || ''}
                     onChange={(e) => handlePeriodizationChange(e.target.value)}
                   >
                                         {periodizations.map(p => (
                       <option key={p._id} value={p._id}>
                         {formatDate(p.startingDate)} - {formatDate(p.endingDate)}
                       </option>
                     ))}
                  </select>
            </div>
              )}
          </div>
          </div>
                                                                 {canCreateSOT && (
                                                                   periodizations.length === 0 ? (
                                                                     <Button
                                                                       onClick={handleCreateNewPeriodization}
                                                                       className="!px-4 !py-2 !bg-[var(--bg-primary)] !text-[var(--text-primary)] !rounded-lg !flex !items-center !gap-2 hover:!bg-[var(--bg-secondary)] transition-all duration-200"
                                                                       icon={icons.plus}
                                                                     >
                                                                       Create New Periodization
                                                                     </Button>
                                                                   ) : (
                                                                     <Button
                                                                       onClick={handleOpenCreateSOTModal}
                                                                       className="!px-4 !py-2 !bg-[var(--bg-primary)] !text-[var(--text-primary)] !rounded-lg !flex !items-center !gap-2 hover:!bg-[var(--bg-secondary)] transition-all duration-200"
                                                                       icon={icons.plus}
                                                                     >
                                                                       Add SOT Period
                                                                     </Button>
                                                                   )
                                                                 )}
                                                                 {!canCreateSOT && (
                                                                   <div className="text-sm text-[var(--text-secondary)] italic">
                                                                     SOT creation is restricted to coaches and administrators
                                                                   </div>
                                                                 )}
        </div>

        {/* Progress Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Season Progress</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-[var(--bg-tertiary)] rounded-full h-3 overflow-hidden">
              <motion.div 
                className="bg-[var(--bg-primary)] h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${currentPlayerSOT.overallProgress}%` }}
                transition={{ duration: 1, delay: 0.3 }}
              ></motion.div>
            </div>
            <span className="text-lg font-bold text-[var(--text-primary)]">{currentPlayerSOT.overallProgress}%</span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">Day {currentPlayerSOT.currentDay}</div>
              <div className="text-sm text-[var(--text-secondary)]">{currentPlayerSOT.totalDays - currentPlayerSOT.currentDay} days remaining</div>
            </div>
            {canCreateSOT && (
              <div className="flex gap-2">
                <button 
                  onClick={() => currentPeriodization && handleEditPeriodization(currentPeriodization)}
                  className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <i dangerouslySetInnerHTML={{ __html: icons.edit }} />
                </button>
                <button 
                  onClick={() => currentPeriodization && handleDeletePeriodization(currentPeriodization._id)}
                  className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <i dangerouslySetInnerHTML={{ __html: icons.trash }} />
                </button>
              </div>
            )}
          </div>
        </div>

      </motion.div>

      {/* Training Content Based on Active Tab */}
      

      {/* SOT Periods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sotPeriods.map((period) => (
          <motion.div 
            key={period.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl p-6 shadow-[var(--shadow-secondary)] hover:shadow-[var(--shadow-primary)] transition-all duration-300 border border-[var(--border-primary)]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${period.color} text-white`}>
                  <i dangerouslySetInnerHTML={{ __html: period.icon }} className="text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">{period.name}</h3>
              </div>
              <div className="flex gap-2">
                {canCreateSOT && period.goals.length > 0 && (
                  <Button
                    onClick={() => {
                      if (period.type === 'preparations') {
                        handleEditPreparationPhase();
                      } else if (period.type === 'competition') {
                        handleEditCompetitionPhase();
                      } else if (period.type === 'transition') {
                        handleEditTransitionPhase();
                      }
                    }}
                    className="!px-3 !py-1.5 !bg-[var(--bg-primary)] !text-[var(--text-primary)] !rounded-lg !flex !items-center !gap-1 hover:!bg-[var(--bg-secondary)]"
                    size="xs"
                  >
                    Edit
                  </Button>
                )}
                {canCreateSOT && (
                  <Button
                    onClick={() => handlePeriodTypeAction(period.type)}
                    className="!px-3 !py-1.5 !bg-[var(--bg-primary)] !text-[var(--text-primary)] !rounded-lg !flex !items-center !gap-1 hover:!bg-[var(--bg-secondary)]"
                    icon={icons.plus}
                    size="xs"
                  >
                    {period.goals.length > 0 ? 'Add New' : 'Add'}
                  </Button>
                )}
              </div>
            </div>

            {/* Phase-specific content based on active training tab */}
            <div className="min-h-[120px]">
              {period.goals.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-32 text-[var(--text-tertiary)]"
                >
                  <div className="text-4xl mb-2">
                    <i dangerouslySetInnerHTML={{ __html: icons.tennisServer }} />
                  </div>
                  <div className="text-sm">No goals added yet</div>
                  {canCreateSOT && (
                    <button 
                      onClick={() => handlePeriodTypeAction(period.type)}
                      className="mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Add your first goal
                    </button>
                  )}
                  {!canCreateSOT && (
                    <div className="mt-2 text-sm text-[var(--text-secondary)] italic">
                      Goal creation is restricted to coaches and administrators
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {period.goals.map((goal: string, index: number) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <div className={`w-2 h-2 ${period.color} rounded-full mt-2 flex-shrink-0`}></div>
                      <span className="text-[var(--text-primary)]">{goal}</span>
                      {canCreateSOT && (
                        <button className="ml-auto text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                          <i dangerouslySetInnerHTML={{ __html: icons.menu }} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Phase-specific training content based on active tab */}
            <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Training Focus
              </h4>
              
              {period.type === 'preparations' && (
                <div className="space-y-2">
                  {activeTab === 'physical' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Strength building exercises</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Endurance training</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Flexibility work</div>
                    </>
                  )}
                  {activeTab === 'technical' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Skill development drills</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Technique refinement</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Practice routines</div>
                    </>
                  )}
                  {activeTab === 'nutrition' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Meal planning</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Supplement strategy</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Hydration plan</div>
                    </>
                  )}
                  {activeTab === 'recovery' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Rest protocols</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Sleep optimization</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Active recovery</div>
                    </>
                  )}
                  {activeTab === 'prevention' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Injury prevention</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Warm-up routines</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Mobility work</div>
                    </>
                  )}
                  {activeTab === 'immunity' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Immune support</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Health monitoring</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Wellness practices</div>
                    </>
                  )}
                  {activeTab === 'wellness' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Mental preparation</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Stress management</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Goal setting</div>
                    </>
                  )}
                </div>
              )}

              {period.type === 'competition' && (
                <div className="space-y-2">
                  {activeTab === 'physical' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Peak performance</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Match fitness</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Energy management</div>
                    </>
                  )}
                  {activeTab === 'technical' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Match strategies</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Tactical execution</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Performance under pressure</div>
                    </>
                  )}
                  {activeTab === 'nutrition' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Pre-match fueling</div>
                      <div className="text-xs text-[var(--text-secondary)]">• During match nutrition</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Quick energy sources</div>
                    </>
                  )}
                  {activeTab === 'recovery' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Post-match recovery</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Fatigue management</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Quick recovery protocols</div>
                    </>
                  )}
                  {activeTab === 'prevention' && (
                    <>
                        <div className="text-xs text-[var(--text-secondary)]">• Injury risk reduction</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Protective measures</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Safe play techniques</div>
                    </>
                  )}
                  {activeTab === 'immunity' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Health maintenance</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Immune support</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Wellness during competition</div>
                    </>
                  )}
                  {activeTab === 'wellness' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Mental toughness</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Focus and concentration</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Pressure handling</div>
                    </>
                  )}
                </div>
              )}

              {period.type === 'transition' && (
                <div className="space-y-2">
                  {activeTab === 'physical' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Active rest</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Light conditioning</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Recovery maintenance</div>
                    </>
                  )}
                  {activeTab === 'technical' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Skill assessment</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Future planning</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Learning integration</div>
                    </>
                  )}
                  {activeTab === 'nutrition' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Recovery nutrition</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Rebuilding phase</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Long-term planning</div>
                    </>
                  )}
                  {activeTab === 'recovery' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Deep recovery</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Rest and rejuvenation</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Next cycle preparation</div>
                    </>
                  )}
                  {activeTab === 'prevention' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Injury assessment</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Prevention planning</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Future safeguards</div>
                    </>
                  )}
                  {activeTab === 'immunity' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Health restoration</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Immune rebuilding</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Wellness foundation</div>
                    </>
                  )}
                  {activeTab === 'wellness' && (
                    <>
                      <div className="text-xs text-[var(--text-secondary)]">• Mental recovery</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Reflection and growth</div>
                      <div className="text-xs text-[var(--text-secondary)]">• Future mindset</div>
                    </>
                  )}
                </div>
              )}
            </div>

            {period.goals.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[var(--text-secondary)]">Progress</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{period.progress}%</span>
                </div>
                                  <div className="bg-[var(--bg-tertiary)] rounded-full h-2 overflow-hidden">
                  <motion.div 
                    className={`h-2 rounded-full ${period.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${period.progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  ></motion.div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

             {/* Create SOT Period Modal */}
       <AnimatePresence>
         {showCreateSOTModal && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4"
           >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl p-6 w-full max-w-2xl shadow-[var(--shadow-primary)] max-h-[90vh] overflow-y-auto border border-[var(--border-primary)] transition-colors duration-300"
             >
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                   <button
                     onClick={() => {
                       setShowCreateSOTModal(false);
                       setEditingPeriodization(null);
                       setSotFormData({
                         goalTerm: '',
                         periodDuration: '6',
                         endDate: ''
                       });
                     }}
                     className="text-gray-500 hover:text-gray-700 text-xl transition-colors"
                   >
                     <i dangerouslySetInnerHTML={{ __html: icons.chevronLeft }} />
                   </button>
                   <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                     {editingPeriodization ? 'Edit SOT Period' : 'Add SOT'}
                   </h3>
                 </div>
                 <button
                   onClick={() => {
                     setShowCreateSOTModal(false);
                     setEditingPeriodization(null);
                     setSotFormData({
                       goalTerm: '',
                       periodDuration: '6',
                       endDate: ''
                     });
                   }}
                   className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
                 >
                   ×
                 </button>
               </div>
               
               <div className="space-y-6">
                 {/* Goal Term Section */}
                 <div>
                   <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                     Goal Term <span className="text-red-500">*</span>
                   </label>
                   <div className="relative">
                     <input
                       type="text"
                       className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] transition-all bg-[var(--bg-card)] text-[var(--text-primary)]"
                       placeholder="Select goal term"
                       value={sotFormData.goalTerm}
                       onChange={(e) => setSotFormData(prev => ({ ...prev, goalTerm: e.target.value }))}
                     />
                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                       <i dangerouslySetInnerHTML={{ __html: icons.calendar }} />
                     </div>
                   </div>
                 </div>
                 
                 {/* Period Selection Section */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     You can select period
                   </label>
                   <div className="grid grid-cols-2 gap-3">
                     {[
                       { value: '1', label: '1 Month' },
                       { value: '3', label: '3 Months' },
                       { value: '6', label: '6 Months' },
                       { value: '12', label: '1 Year' }
                     ].map((period) => (
                       <button
                         key={period.value}
                         onClick={() => setSotFormData(prev => ({ ...prev, periodDuration: period.value, endDate: '' }))}
                         className={`p-3 rounded-lg border transition-all ${
                           sotFormData.periodDuration === period.value
                             ? 'border-blue-500 bg-blue-50 text-blue-700'
                             : 'border-gray-300 hover:border-gray-400'
                         }`}
                       >
                         {period.label}
                       </button>
                     ))}
                   </div>
                 </div>
                 
                 {/* Custom End Date Section */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Or select end date
                   </label>
                   <div className="relative">
                     <input
                       type="date"
                       className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] transition-all bg-[var(--bg-card)] text-[var(--text-primary)]"
                       value={sotFormData.endDate}
                       onChange={(e) => setSotFormData(prev => ({ ...prev, endDate: e.target.value, periodDuration: '' }))}
                     />
                     <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                       <i dangerouslySetInnerHTML={{ __html: icons.calendar }} />
                     </div>
                   </div>
                 </div>
               </div>
               
               <div className="flex gap-3 mt-8">
                 <Button
                   onClick={() => {
                     setShowCreateSOTModal(false);
                     setEditingPeriodization(null);
                     setSotFormData({
                       goalTerm: '',
                       periodDuration: '6',
                       endDate: ''
                     });
                   }}
                   className="!flex-1 !bg-white !text-gray-700 !border !border-gray-300 hover:!bg-gray-50"
                 >
                   Cancel
                 </Button>
                 <Button
                   onClick={handleCreateSOTPeriod}
                   className="!flex-1 !bg-blue-600 !text-white hover:!bg-blue-700"
                 >
                   {editingPeriodization ? 'Update' : 'Create'}
                 </Button>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* Delete Confirmation Modal */}
       <AnimatePresence>
         {showDeleteConfirm && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
           >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-[var(--bg-card)] rounded-2xl p-6 w-full max-w-md shadow-[var(--shadow-primary)] border border-[var(--border-primary)] transition-colors duration-300"
             >
               <div className="text-center">
                 <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                   <i dangerouslySetInnerHTML={{ __html: icons.trash }} className="text-red-600 text-xl" />
                 </div>
                 <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Delete SOT Period</h3>
                 <p className="text-sm text-[var(--text-secondary)] mb-6">
                   Are you sure you want to delete this SOT period? This action cannot be undone.
                 </p>
                 <div className="flex gap-3">
                   <Button
                     onClick={() => {
                       setShowDeleteConfirm(false);
                       setDeletingPeriodizationId(null);
                     }}
                     className="!flex-1 !bg-[var(--bg-secondary)] !text-[var(--text-primary)] !border !border-[var(--border-primary)] hover:!bg-[var(--bg-tertiary)] transition-colors duration-300"
                   >
                     Cancel
                   </Button>
                   <Button
                     onClick={confirmDeletePeriodization}
                     className="!flex-1 !bg-red-600 !text-white hover:!bg-red-700"
                   >
                     Delete
                   </Button>
                 </div>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

      {/* Preparation Phase Modal */}
      <AnimatePresence>
        {showPreparationModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[var(--bg-card)] rounded-2xl md:rounded-3xl p-6 w-full max-w-2xl shadow-[var(--shadow-primary)] max-h-[90vh] overflow-y-auto border border-[var(--border-primary)] transition-colors duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClosePreparationModal}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-xl transition-colors"
                  >
                    <i dangerouslySetInnerHTML={{ __html: icons.chevronLeft }} />
                  </button>
                   <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                     {editingPhase?.type === 'preparation' ? 'Edit' : 'Add'} Preparation Phase - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                   </h3>
                </div>
                <button
                  onClick={handleClosePreparationModal}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Time Allocated Section */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Time Allocated <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                     <select 
                       id="prep-time-type"
                       className="flex-1 px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] transition-all bg-[var(--bg-card)] text-[var(--text-primary)]"
                       defaultValue={editingPhase?.type === 'preparation' ? editingPhase.data.timeType : "weeks"}
                     >
                       <option value="weeks">Weeks</option>
                       <option value="days">Days</option>
                       <option value="months">Months</option>
                    </select>
                    <input
                       id="prep-allocated-time"
                      type="number"
                      className="flex-1 px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] transition-all bg-[var(--bg-card)] text-[var(--text-primary)]"
                      placeholder="Number of Weeks"
                       defaultValue={editingPhase?.type === 'preparation' ? editingPhase.data.allocatedTime : "8"}
                    />
                  </div>
                </div>
                
                {/* Add Objectives Section */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    Add Objectives <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                       id="prep-objective-input"
                      type="text"
                      className="flex-1 px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] transition-all bg-[var(--bg-card)] text-[var(--text-primary)]"
                      placeholder="Type and add actions"
                    />
                    <Button
                       onClick={() => {
                         const input = document.getElementById('prep-objective-input') as HTMLInputElement;
                         const value = input.value.trim();
                         if (value) {
                           const list = document.getElementById('prep-objectives-list');
                           if (list) {
                             const item = document.createElement('div');
                             item.className = 'flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded border border-[var(--border-secondary)]';
                             item.innerHTML = `
                               <span class="text-[var(--text-primary)]">• ${value}</span>
                               <button class="p-1 text-red-500 hover:text-red-700" onclick="this.parentElement.remove()">×</button>
                             `;
                             list.appendChild(item);
                             input.value = '';
                           }
                         }
                       }}
                      className="!px-4 !py-2 !bg-blue-600 !text-white !rounded-lg"
                      icon={icons.plus}
                    >
                      Add
                    </Button>
                  </div>
                   <div id="prep-objectives-list" className="mt-3 space-y-2">
                     {/* Populate with existing objectives if editing */}
                     {editingPhase?.type === 'preparation' && editingPhase.data.generals.map((objective: string, index: number) => (
                       <div key={index} className="flex items-center justify-between p-2 bg-[var(--bg-secondary)] rounded border border-[var(--border-secondary)]">
                         <span className="text-[var(--text-primary)]">• {objective}</span>
                         <button 
                           className="p-1 text-red-500 hover:text-red-700"
                           onClick={(e) => (e.target as HTMLElement).parentElement?.remove()}
                         >
                           ×
                         </button>
                       </div>
                     ))}
                  </div>
                </div>
                
                {/* Specific Description Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specific description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                     id="prep-specific-description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    rows={4}
                    placeholder="Type specific description"
                  ></textarea>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <Button
                  onClick={handleClosePreparationModal}
                  className="!flex-1 !bg-white !text-gray-700 !border !border-gray-300 hover:!bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                   onClick={async () => {
                     // Get form data and submit
                     const timeTypeSelect = document.getElementById('prep-time-type') as HTMLSelectElement;
                     const timeType = timeTypeSelect?.value;
                     const allocatedTime = parseInt((document.getElementById('prep-allocated-time') as HTMLInputElement)?.value || '8');
                     const specificDescription = (document.getElementById('prep-specific-description') as HTMLTextAreaElement)?.value || '';
                     
                     // Get objectives from the list
                     const objectivesList = document.getElementById('prep-objectives-list');
                     const generals: string[] = [];
                     if (objectivesList) {
                       objectivesList.querySelectorAll('span').forEach(span => {
                         const text = span.textContent?.replace('• ', '') || '';
                         if (text) generals.push(text);
                       });
                     }
                     
                     if (currentPeriodization && generals.length > 0 && timeType) {
                       try {
                         const data = {
                           preparationType: activeTab as any,
                           preparation: {
                             allocatedTime,
                             timeType: timeType as 'days' | 'weeks' | 'months',
                             generals,
                             specifics: [],
                             specificDescriptions: specificDescription ? [specificDescription] : []
                           }
                         };

                         if (editingPhase?.type === 'preparation') {
                           // Update existing phase
                           await updatePreparationPhase(currentPeriodization._id, data);
                           toast.success('Preparation phase updated successfully!');
                         } else {
                           // Create new phase
                           await handleCreatePreparationPhase(data);
                           toast.success('Preparation phase created successfully!');
                         }
                         
                         handleClosePreparationModal();
                         clearEditingState(); // Clear editing state
                       } catch (error: any) {
                         if (error.message?.includes('already exists')) {
                           toast.error('Preparation phase already exists for this period. Please edit the existing one instead.');
                         } else {
                           toast.error(error.message || 'Failed to save preparation phase');
                         }
                       }
                     } else {
                       toast.warning('Please add at least one objective');
                     }
                   }}
                  className="!flex-1 !bg-blue-600 !text-white hover:!bg-blue-700"
                >
                  {editingPhase?.type === 'preparation' ? 'Update' : 'Finish and Save'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Competition Phase Modal */}
      <AnimatePresence>
        {showCompetitionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl md:rounded-3xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCloseCompetitionModal}
                    className="text-gray-500 hover:text-gray-700 text-xl transition-colors"
                  >
                    <i dangerouslySetInnerHTML={{ __html: icons.chevronLeft }} />
                  </button>
                   <h3 className="text-xl font-semibold text-gray-800">
                     {editingPhase?.type === 'competition' ? 'Edit' : 'Add'} Competition Phase - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                   </h3>
                </div>
                <button
                  onClick={handleCloseCompetitionModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Time Allocated Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Allocated <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                     <select 
                       id="comp-time-type"
                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                       defaultValue={editingPhase?.type === 'competition' ? editingPhase.data.timeType : "weeks"}
                     >
                       <option value="weeks">Weeks</option>
                       <option value="days">Days</option>
                       <option value="months">Months</option>
                    </select>
                    <input
                       id="comp-allocated-time"
                      type="number"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 transition-all"
                      placeholder="Number of Weeks"
                       defaultValue={editingPhase?.type === 'competition' ? editingPhase.data.allocatedTime : "4"}
                    />
                  </div>
                </div>
                
                {/* Pre-computation Activities Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Pre-competition Activities <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                       id="comp-precomp-input"
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Type and add activities"
                    />
                    <Button
                       onClick={() => {
                         const input = document.getElementById('comp-precomp-input') as HTMLInputElement;
                         const value = input.value.trim();
                         if (value) {
                           const list = document.getElementById('comp-precomp-list');
                           if (list) {
                             const item = document.createElement('div');
                             item.className = 'flex items-center justify-between p-2 bg-gray-100 rounded';
                             item.innerHTML = `
                               <span class="text-gray-700">• ${value}</span>
                               <button class="p-1 text-red-500 hover:text-red-700" onclick="this.parentElement.remove()">×</button>
                             `;
                             list.appendChild(item);
                             input.value = '';
                           }
                         }
                       }}
                      className="!px-4 !py-2 !bg-blue-600 !text-white !rounded-lg"
                      icon={icons.plus}
                    >
                      Add
                    </Button>
                  </div>
                   <div id="comp-precomp-list" className="mt-3 space-y-2">
                     {/* Populate with existing pre-competition activities if editing */}
                     {editingPhase?.type === 'competition' && editingPhase.data.precompetitions.map((activity: string, index: number) => (
                       <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                         <span className="text-gray-700">• {activity}</span>
                         <button 
                           className="p-1 text-red-500 hover:text-red-700"
                           onClick={(e) => (e.target as HTMLElement).parentElement?.remove()}
                         >
                           ×
                         </button>
                       </div>
                     ))}
                  </div>
                </div>
                
                {/* Tournament Activities Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tournament Activities <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                       id="comp-tournament-input"
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Type and add activities"
                    />
                    <Button
                       onClick={() => {
                         const input = document.getElementById('comp-tournament-input') as HTMLInputElement;
                         const value = input.value.trim();
                         if (value) {
                           const list = document.getElementById('comp-tournament-list');
                           if (list) {
                             const item = document.createElement('div');
                             item.className = 'flex items-center justify-between p-2 bg-gray-100 rounded';
                             item.innerHTML = `
                               <span class="text-gray-700">• ${value}</span>
                               <button class="p-1 text-red-500 hover:text-red-700" onclick="this.parentElement.remove()">×</button>
                             `;
                             list.appendChild(item);
                             input.value = '';
                           }
                         }
                       }}
                      className="!px-4 !py-2 !bg-blue-600 !text-white !rounded-lg"
                      icon={icons.plus}
                    >
                      Add
                    </Button>
                  </div>
                   <div id="comp-tournament-list" className="mt-3 space-y-2">
                     {/* Populate with existing tournament activities if editing */}
                     {editingPhase?.type === 'competition' && editingPhase.data.tournaments.map((activity: string, index: number) => (
                       <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                         <span className="text-gray-700">• {activity}</span>
                         <button 
                           className="p-1 text-red-500 hover:text-red-700"
                           onClick={(e) => (e.target as HTMLElement).parentElement?.remove()}
                         >
                           ×
                         </button>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <Button
                  onClick={handleCloseCompetitionModal}
                  className="!flex-1 !bg-white !text-gray-700 !border !border-gray-300 hover:!bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                   onClick={async () => {
                     // Get form data and submit
                     const timeTypeSelect = document.getElementById('comp-time-type') as HTMLSelectElement;
                     const timeType = timeTypeSelect?.value;
                     const allocatedTime = parseInt((document.getElementById('comp-allocated-time') as HTMLInputElement)?.value || '4');
                     
                     // Get pre-competition activities from the list
                     const precompList = document.getElementById('comp-precomp-list');
                     const precompetitions: string[] = [];
                     if (precompList) {
                       precompList.querySelectorAll('span').forEach(span => {
                         const text = span.textContent?.replace('• ', '') || '';
                         if (text) precompetitions.push(text);
                       });
                     }
                     
                     // Get tournament activities from the list
                     const tournamentList = document.getElementById('comp-tournament-list');
                     const tournaments: string[] = [];
                     if (tournamentList) {
                       tournamentList.querySelectorAll('span').forEach(span => {
                         const text = span.textContent?.replace('• ', '') || '';
                         if (text) tournaments.push(text);
                       });
                     }
                     
                     if (currentPeriodization && (precompetitions.length > 0 || tournaments.length > 0) && timeType) {
                       try {
                         const data = {
                           competitionType: activeTab as any,
                           competition: {
                             allocatedTime,
                             timeType: timeType as 'days' | 'weeks' | 'months',
                             precompetitions,
                             tournaments
                           }
                         };

                         if (editingPhase?.type === 'competition') {
                           // Update existing phase
                           await updateCompetitionPhase(currentPeriodization._id, data);
                           toast.success('Competition phase updated successfully!');
                         } else {
                           // Create new phase
                           await handleCreateCompetitionPhase(data);
                           toast.success('Competition phase created successfully!');
                         }
                         
                         handleCloseCompetitionModal();
                       } catch (error: any) {
                         if (error.message?.includes('already exists')) {
                           toast.error('Competition phase already exists for this period. Please edit the existing one instead.');
                         } else {
                           toast.error(error.message || 'Failed to save competition phase');
                         }
                       }
                     } else {
                       toast.warning('Please add at least one pre-competition or tournament activity');
                     }
                   }}
                  className="!flex-1 !bg-blue-600 !text-white hover:!bg-blue-700"
                >
                  {editingPhase?.type === 'competition' ? 'Update' : 'Finish and Save'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transition Phase Modal */}
      <AnimatePresence>
        {showTransitionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl md:rounded-3xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCloseTransitionModal}
                    className="text-gray-500 hover:text-gray-700 text-xl transition-colors"
                  >
                    <i dangerouslySetInnerHTML={{ __html: icons.chevronLeft }} />
                  </button>
                   <h3 className="text-xl font-semibold text-gray-800">
                     {editingPhase?.type === 'transition' ? 'Edit' : 'Add'} Transition Phase - {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                   </h3>
                </div>
                <button
                  onClick={handleCloseTransitionModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Time Allocated Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Allocated <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                     <select 
                       id="trans-time-type"
                       className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                       defaultValue={editingPhase?.type === 'transition' ? editingPhase.data.timeType : "weeks"}
                     >
                       <option value="weeks">Weeks</option>
                       <option value="days">Days</option>
                       <option value="months">Months</option>
                    </select>
                    <input
                       id="trans-allocated-time"
                      type="number"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Number of Weeks"
                       defaultValue={editingPhase?.type === 'transition' ? editingPhase.data.allocatedTime : "2"}
                    />
                  </div>
                </div>
                
                {/* Active Rest Instruction Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                     Active Rest Instructions <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                       id="trans-active-rest-input"
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Type and add activities"
                    />
                    <Button
                       onClick={() => {
                         const input = document.getElementById('trans-active-rest-input') as HTMLInputElement;
                         const value = input.value.trim();
                         if (value) {
                           const list = document.getElementById('trans-active-rest-list');
                           if (list) {
                             const item = document.createElement('div');
                             item.className = 'flex items-center justify-between p-2 bg-gray-100 rounded';
                             item.innerHTML = `
                               <span class="text-gray-700">• ${value}</span>
                               <button class="p-1 text-red-500 hover:text-red-700" onclick="this.parentElement.remove()">×</button>
                             `;
                             list.appendChild(item);
                             input.value = '';
                           }
                         }
                       }}
                      className="!px-4 !py-2 !bg-blue-600 !text-white !rounded-lg"
                      icon={icons.plus}
                    >
                      Add
                    </Button>
                  </div>
                   <div id="trans-active-rest-list" className="mt-3 space-y-2">
                     {/* Populate with existing active rest instructions if editing */}
                     {editingPhase?.type === 'transition' && editingPhase.data.activeRest.map((instruction: string, index: number) => (
                       <div key={index} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                         <span className="text-gray-700">• {instruction}</span>
                         <button 
                           className="p-1 text-red-500 hover:text-red-700"
                           onClick={(e) => (e.target as HTMLElement).parentElement?.remove()}
                         >
                           ×
                         </button>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <Button
                  onClick={handleCloseTransitionModal}
                  className="!flex-1 !bg-white !text-gray-700 !border !border-gray-300 hover:!bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                   onClick={async () => {
                     // Get form data and submit
                     const timeTypeSelect = document.getElementById('trans-time-type') as HTMLSelectElement;
                     const timeType = timeTypeSelect?.value;
                     const allocatedTime = parseInt((document.getElementById('trans-allocated-time') as HTMLInputElement)?.value || '2');
                     
                     // Get active rest instructions from the list
                     const activeRestList = document.getElementById('trans-active-rest-list');
                     const activeRest: string[] = [];
                     if (activeRestList) {
                       activeRestList.querySelectorAll('span').forEach(span => {
                         const text = span.textContent?.replace('• ', '') || '';
                         if (text) activeRest.push(text);
                       });
                     }
                     
                     if (currentPeriodization && activeRest.length > 0 && timeType) {
                       try {
                         const data = {
                           transitionType: activeTab as any,
                           transition: {
                             allocatedTime,
                             timeType: timeType as 'days' | 'weeks' | 'months',
                             activeRest
                           }
                         };

                         if (editingPhase?.type === 'transition') {
                           // Update existing phase
                           await updateTransitionPhase(currentPeriodization._id, data);
                           toast.success('Transition phase updated successfully!');
                         } else {
                           // Create new phase
                           await handleCreateTransitionPhase(data);
                           toast.success('Transition phase created successfully!');
                         }
                         
                         handleCloseTransitionModal();
                       } catch (error: any) {
                         if (error.message?.includes('already exists')) {
                           toast.error('Transition phase already exists for this period. Please edit the existing one instead.');
                         } else {
                           toast.error(error.message || 'Failed to save transition phase');
                         }
                       }
                     } else {
                       toast.warning('Please add at least one active rest instruction');
                     }
                   }}
                  className="!flex-1 !bg-blue-600 !text-white hover:!bg-blue-700"
                >
                  {editingPhase?.type === 'transition' ? 'Update' : 'Finish and Save'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}