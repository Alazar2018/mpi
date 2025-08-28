import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from "@/components/Button";
import icons from "@/utils/icons";
import { goalsService } from "@/service/goals.server";
import type { Player } from '@/service/players.server';
import type { CreateGoalRequest, GoalAction, GoalObstacle, GoalProgress } from '@/service/goals.server';
import { useAuthStore } from "@/store/auth.store";

export default function PlayerGoals() {
  const player = useOutletContext<Player>();
  
  // Get current user's role to determine permissions
  const authStore = useAuthStore();
  const currentUserRole = authStore.getRole();
  
  // Check if current user can create new goals (parents, coaches, and admins can)
  const canCreateGoals = currentUserRole === 'parent' || currentUserRole === 'coach' || currentUserRole === 'admin';
  
  // Check if current user can edit goals (only admins can edit all, coaches and parents can edit their own)
  const canEditAllGoals = currentUserRole === 'admin';
  
  // Check if current user can mark goals as achieved (only players themselves can)
  const canMarkAsAchieved = currentUserRole === 'player';
  
  // Helper function to check if current user can edit a specific goal
  const canEditGoal = (goal: any) => {
    if (canEditAllGoals) return true; // Admins can edit all goals
    
    // For coaches and parents, check if they created the goal
    if (currentUserRole === 'coach') {
      // Coaches can only edit goals in coachGoals (goals they created)
      return player.coachGoals?.some(coachGoal => 
        coachGoal.goals?.some((g: any) => g._id === goal._id)
      ) || false;
    }
    
    if (currentUserRole === 'parent') {
      // Since we don't have parentGoals in the current structure,
      // we'll assume parents can edit goals that are NOT in coachGoals
      // This means parents can edit goals they created (which wouldn't be in coachGoals)
      const isCoachGoal = player.coachGoals?.some(coachGoal => 
        coachGoal.goals?.some((g: any) => g._id === goal._id)
      ) || false;
      
      return !isCoachGoal; // Parents can edit non-coach goals
    }
    
    return false;
  };
  
  const [expandedGoals, setExpandedGoals] = useState<string[]>([]);
  // Tab states for each term
  const [shortGoalsTab, setShortGoalsTab] = useState<'planned' | 'achieved' | 'overdue'>('planned');
  const [mediumGoalsTab, setMediumGoalsTab] = useState<'planned' | 'achieved' | 'overdue'>('planned');
  const [longGoalsTab, setLongGoalsTab] = useState<'planned' | 'achieved' | 'overdue'>('planned');
  
  // Goal modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<{
    goal: 'technical' | 'tactical' | 'physical' | 'mental' | 'nutrition' | 'recovery';
    description: string;
    term: 'short' | 'medium' | 'long';
    measurement: string;
    achievementDate: string;
    actions: GoalAction[];
    obstacles: GoalObstacle[];
    addOns?: string;
  }>({
    goal: 'technical',
    description: '',
    term: 'short',
    measurement: '',
    achievementDate: '',
    actions: [],
    obstacles: [],
    addOns: ''
  });
  
  // Action and obstacle inputs
  const [newAction, setNewAction] = useState('');
  const [newActionDate, setNewActionDate] = useState('');
  const [newObstacle, setNewObstacle] = useState('');
  const [newObstacleDate, setNewObstacleDate] = useState('');
  
  // Loading states for add buttons
  const [isAddingAction, setIsAddingAction] = useState(false);
  const [isAddingObstacle, setIsAddingObstacle] = useState(false);

  // Helper function to determine goal status
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

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Helper function to get goal type color
  const getGoalTypeColor = (goalType: string) => {
    const colors = {
      technical: 'bg-[var(--bg-primary)]',
      physical: 'bg-[var(--bg-primary)]',
      mental: 'bg-[var(--bg-primary)]',
      nutrition: 'bg-[var(--bg-primary)]',
      recovery: 'bg-[var(--bg-primary)]',
      strategic: 'bg-[var(--bg-primary)]',
      tactical: 'bg-[var(--bg-primary)]'
    };
    return colors[goalType as keyof typeof colors] || 'bg-[var(--bg-primary)]';
  };

  // Helper function to get goal type label
  const getGoalTypeLabel = (goalType: string) => {
    const labels = {
      technical: 'Technical',
      physical: 'Physical',
      mental: 'Mental',
      nutrition: 'Nutrition',
      recovery: 'Recovery',
      strategic: 'Strategic',
      tactical: 'Tactical'
    };
    return labels[goalType as keyof typeof labels] || goalType;
  };

  // Toggle goal expansion
  const toggleGoal = (goalId: string) => {
    setExpandedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  // Open modal for creating new goal
  const openCreateModal = () => {
    setIsEditing(false);
    setEditingGoalId(null);
    setFormData({
      goal: 'technical',
      description: '',
      term: 'short',
      measurement: '',
      achievementDate: '',
      actions: [],
      obstacles: [],
      addOns: ''
    });
    setIsModalOpen(true);
  };

  // Helper function to convert ISO date to yyyy-MM-dd format
  const convertISODateToInputFormat = (isoDate: string) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      return date.toISOString().split('T')[0]; // Convert to yyyy-MM-dd
    } catch (error) {
      console.warn('Invalid date format:', isoDate);
      return '';
    }
  };

  // Open modal for editing existing goal
  const openEditModal = (goal: any) => {
    console.log('🔍 Opening edit modal for goal:', goal);
    console.log('📅 Goal actions:', goal.actions);
    console.log('🚧 Goal obstacles:', goal.obstacles);
    
    setIsEditing(true);
    setEditingGoalId(goal._id);
    
    // Process existing actions and obstacles to ensure they have proper dates
    const processedActions = (goal.actions || []).map((action: any) => ({
      description: action.description || '',
      date: convertISODateToInputFormat(action.date) || new Date().toISOString().split('T')[0],
      isDone: action.isDone || false
    }));
    
    const processedObstacles = (goal.obstacles || []).map((obstacle: any) => ({
      description: obstacle.description || '',
      date: convertISODateToInputFormat(obstacle.date) || new Date().toISOString().split('T')[0],
      isOvercome: obstacle.isOvercome || false
    }));
    
    console.log('✅ Processed actions:', processedActions);
    console.log('✅ Processed obstacles:', processedObstacles);
    
    setFormData({
      goal: goal.goal || 'technical',
      description: goal.description || '',
      term: goal.term || 'short',
      measurement: goal.measurement || '',
      achievementDate: convertISODateToInputFormat(goal.achievementDate) || '',
      actions: processedActions,
      obstacles: processedObstacles,
      addOns: goal.addOns || ''
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditingGoalId(null);
  };

  // Add action to form
  const addAction = async () => {
    if (newAction.trim()) {
      setIsAddingAction(true);
      
      // Small delay to show loading state (optional, for better UX)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const action: GoalAction = {
        description: newAction.trim(),
        date: newActionDate,
        isDone: false
      };
      
      // Use functional update to avoid unnecessary re-renders
      setFormData(prev => ({
        ...prev,
        actions: [...prev.actions, action]
      }));
      
      // Clear inputs immediately for better UX
      setNewAction('');
      setNewActionDate(''); // Clear achievement date
      
      setIsAddingAction(false);
    }
  };

  // Remove action from form
  const removeAction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };

  // Add obstacle to form
  const addObstacle = async () => {
    if (newObstacle.trim()) {
      setIsAddingObstacle(true);
      
      // Small delay to show loading state (optional, for better UX)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const obstacle: GoalObstacle = {
        description: newObstacle.trim(),
        date: newObstacleDate,
        isOvercome: false
      };
      
      // Use functional update to avoid unnecessary re-renders
      setFormData(prev => ({
        ...prev,
        obstacles: [...prev.obstacles, obstacle]
      }));
      
      // Clear inputs immediately for better UX
      setNewObstacle('');
      setNewObstacleDate(''); // Clear achievement date
      
      setIsAddingObstacle(false);
    }
  };

  // Remove obstacle from form
  const removeObstacle = (index: number) => {
    setFormData(prev => ({
      ...prev,
      obstacles: prev.obstacles.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Starting goal submission...');
    console.log('📝 Form Data:', formData);
    
    // Validate form data
    const validation = goalsService.validateGoalData(formData);
    if (!validation.isValid) {
      console.log('❌ Validation failed:', validation.errors);
      validation.errors.forEach(error => toast.error(error));
      return;
    }
    
    console.log('✅ Validation passed, preparing API request...');
    
    try {
      setIsLoading(true);
      
      // Prepare data for API - remove _id properties from actions and obstacles
      const apiData = {
        ...formData,
        actions: formData.actions.map(action => ({
          description: action.description,
          date: action.date,
          isDone: action.isDone
        })),
        obstacles: formData.obstacles.map(obstacle => ({
          description: obstacle.description,
          date: obstacle.date,
          isOvercome: obstacle.isOvercome
        }))
      };
      
      console.log('📤 API Request Data (without _id):', apiData);
      
      if (isEditing && editingGoalId) {
        console.log('🔄 Updating existing goal...');
        await goalsService.updatePlayerGoal(player._id, editingGoalId, apiData);
        toast.success('Goal updated successfully!');
        console.log('✅ Goal updated successfully');
      } else {
        console.log('➕ Creating new goal...');
        await goalsService.addPlayerGoal(player._id, apiData);
        toast.success('Goal created successfully!');
        console.log('✅ Goal created successfully');
      }
      
      closeModal();
      // Refresh the page to show updated goals
      window.location.reload();
      
    } catch (error: any) {
      console.error('❌ Error submitting goal:', error);
      toast.error(error.response?.data?.message || 'Failed to save goal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key for adding actions
  const handleActionKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addAction();
    }
  };

  // Handle Enter key for adding obstacles
  const handleObstacleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addObstacle();
    }
  };

  // Handle Escape key to close modal
  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  };

  // Handle Ctrl/Cmd + Enter to submit form
  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Handle goal deletion
  const handleDeleteGoal = async (goalId: string) => {
    if (!player?._id) {
      toast.error('Player ID not found');
      return;
    }

    // Show confirmation toast with action buttons
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
            className="px-3 py-1 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded text-sm hover:bg-[var(--bg-secondary)] transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
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

  // Confirmed deletion function
  const deleteGoalConfirmed = async (goalId: string) => {
    if (!player?._id) {
      toast.error('Player ID not found');
      return;
    }

    try {
      console.log('🗑️ Deleting goal:', goalId);
      await goalsService.deletePlayerGoal(player._id, goalId);
      toast.success('Goal deleted successfully!');
      console.log('✅ Goal deleted successfully');
      
      // Refresh the page to show updated goals
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Error deleting goal:', error);
      toast.error('Failed to delete goal. Please try again.');
    }
  };

  // Handle marking goal as achieved
  const handleMarkAsAchieved = async (goalId: string) => {
    if (!player?._id) {
      toast.error('Player ID not found');
      return;
    }

    try {
      console.log('🎯 Marking goal as achieved...');
      
      // Find the goal to get current data
      const goalToUpdate = allGoals.find(goal => goal._id === goalId);
      if (!goalToUpdate) {
        toast.error('Goal not found');
        return;
      }

      // Prepare update data - mark everything as done/overcome
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

      console.log('📤 Update Data for achieved goal:', updateData);

      await goalsService.updatePlayerGoal(player._id, goalId, updateData);
      toast.success('Goal marked as achieved! All actions and obstacles completed.');
      console.log('✅ Goal marked as achieved successfully');

      // Refresh the page to show updated goals
      window.location.reload();
    } catch (error: any) {
      console.error('❌ Error marking goal as achieved:', error);
      toast.error('Failed to mark goal as achieved. Please try again.');
    }
  };

  if (!player) {
    return (
      <div className="p-6">
        <div className="text-center text-[var(--text-secondary)]">Loading player goals...</div>
      </div>
    );
  }

  // Get all goals from all coaches - memoized to prevent infinite loops
  const allGoals = useMemo(() => {
    if (!player?.coachGoals) return [];
    
    return player.coachGoals.flatMap(coachGoal => 
      coachGoal.goals?.map(goal => ({
        ...goal,
        coach: coachGoal.coach
      })) || []
    );
  }, [player?.coachGoals]);

  // Auto-expand one goal of each type when component loads
  useEffect(() => {
    if (player && player.coachGoals && allGoals.length > 0) {
      const goalsToExpand: string[] = [];
      
      // Find one goal of each type to expand
      const goalTypes = ['technical', 'physical', 'mental', 'nutrition', 'recovery', 'strategic', 'tactical'];
      
      goalTypes.forEach(goalType => {
        const goalOfType = allGoals.find(goal => goal.goal === goalType);
        if (goalOfType && !goalsToExpand.includes(goalOfType._id)) {
          goalsToExpand.push(goalOfType._id);
        }
      });
      
      // If no goals found by type, expand the first available goal
      if (goalsToExpand.length === 0 && allGoals.length > 0) {
        goalsToExpand.push(allGoals[0]._id);
      }
      
      setExpandedGoals(goalsToExpand);
    }
  }, [player, allGoals.length]); // Only depend on length, not the array itself

  // Group goals by term and status - memoized to prevent unnecessary recalculations
  const goalsByTerm = useMemo(() => {
    const categorized = {
      short: { planned: [] as any[], achieved: [] as any[], overdue: [] as any[] },
      medium: { planned: [] as any[], achieved: [] as any[], overdue: [] as any[] },
      long: { planned: [] as any[], achieved: [] as any[], overdue: [] as any[] }
    };

    allGoals.forEach(goal => {
      const goalStatus = getGoalStatus(goal);
      const term = (goal.term || 'short') as 'short' | 'medium' | 'long';
      
      if (goalStatus === 'achieved') {
        categorized[term].achieved.push(goal);
      } else if (goalStatus === 'overdue') {
        categorized[term].overdue.push(goal);
      } else {
        categorized[term].planned.push(goal);
      }
    });

    return categorized;
  }, [allGoals]);

  // Filter goals based on specific tab
  const getFilteredGoals = (goals: any[], tab: 'planned' | 'achieved' | 'overdue') => {
    // Since goals are already categorized by status, just return the goals for the selected tab
    return goals;
  };

  const renderGoalCard = (goal: any) => {
    const isExpanded = expandedGoals.includes(goal._id);
    const goalStatus = getGoalStatus(goal);

  return (
      <div key={goal._id} className="bg-[var(--bg-card)] rounded-xl shadow-[var(--shadow-secondary)] border border-[var(--border-primary)] p-4 mb-4 transition-colors duration-300">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium text-[var(--text-primary)] ${getGoalTypeColor(goal.goal)}`}>
                {getGoalTypeLabel(goal.goal)}
              </span>
                                      <span className="text-xs text-[var(--text-tertiary)]">Due: {formatDate(goal.achievementDate)}</span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              {goalStatus === 'achieved' && (
                <i dangerouslySetInnerHTML={{ __html: icons.check }} className="text-green-500" />
              )}
              <h4 className="font-bold text-[var(--text-primary)]">{goal.description.toUpperCase()}</h4>
              {canEditGoal(goal) && (
                <div className="flex items-center gap-2 ml-auto">
                  <button 
                    onClick={() => openEditModal(goal)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Edit Goal"
                  >
                    <i dangerouslySetInnerHTML={{ __html: icons.edit }} className="text-sm" />
                  </button>
                  <button 
                    onClick={() => handleDeleteGoal(goal._id)}
                    className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    title="Delete Goal"
                  >
                    <i dangerouslySetInnerHTML={{ __html: icons.trash }} className="text-sm" />
                  </button>
                </div>
              )}
            </div>

            {/* Goal Status Banner */}
        <div className="mb-3">
          {/* Overdue Banner */}
          {goalStatus === 'overdue' && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] px-3 py-2 rounded-md text-sm font-medium mb-2">
              ⚠️ Overdue - Due date: {goal.achievementDate ? formatDate(goal.achievementDate) : 'No due date'}
            </div>
          )}
          
          {/* Status Badge */}
          {goalStatus === 'achieved' ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] px-3 py-2 rounded-md text-sm font-medium">
              ✓ Achieved
            </div>
          ) : goalStatus === 'overdue' ? (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] px-3 py-2 rounded-md text-sm font-medium">
              ⚠️ Overdue
            </div>
          ) : (
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] px-3 py-2 rounded-md text-sm font-medium">
              📋 Planned - Due: {goal.achievementDate ? formatDate(goal.achievementDate) : 'No due date'}
            </div>
          )}
        </div>
          </div>
          <button 
            onClick={() => toggleGoal(goal._id)}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            <i dangerouslySetInnerHTML={{ __html: isExpanded ? icons.chevronLeft : icons.chevronRight }} />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-4 pt-4 border-t border-[var(--border-secondary)]">
            <div>
              <h5 className="font-bold text-sm text-[var(--text-primary)] mb-2">Measurement Type</h5>
                              <p className="text-sm text-[var(--text-secondary)]">{goal.measurement}</p>
            </div>

            {/* Actions */}
            {goal.actions && goal.actions.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Actions:</h4>
                <div className="space-y-2">
                  {goal.actions.map((action: any, index: number) => {
                    // Handle both old complex objects and new simple strings
                    const actionText = typeof action === 'string' ? action : action.description || '';
                    const isDone = typeof action === 'object' ? action.isDone : false;
                    
                    return (
                      <div 
                        key={action._id || index} 
                        className={`px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                          isDone 
                            ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]' 
                            : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{actionText}</div>
                          {typeof action === 'object' && action.date && (
                            <div className="text-xs text-[var(--text-tertiary)]">
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
                    // Handle both old complex objects and new simple strings
                    const obstacleText = typeof obstacle === 'string' ? obstacle : obstacle.description || '';
                    const isOvercome = typeof obstacle === 'object' ? obstacle.isOvercome : false;
                    
                    return (
                      <div 
                        key={obstacle._id || index} 
                        className={`px-3 py-2 rounded-md text-sm flex items-center justify-between ${
                          isOvercome 
                            ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]' 
                            : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-primary)]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{obstacleText}</div>
                          {typeof obstacle === 'object' && obstacle.date && (
                            <div className="text-xs text-[var(--text-tertiary)]">
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

            {goalStatus !== 'achieved' && canMarkAsAchieved && (
              <div className="flex justify-end gap-2">
                <Button 
                  onClick={() => handleMarkAsAchieved(goal._id)}
                  className="bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg px-4 py-2 text-sm transition-colors duration-300"
                >
                  Mark as Achieved
                </Button>
              </div>
            )}
            
            {goalStatus !== 'achieved' && !canMarkAsAchieved && (
              <div className="flex justify-end gap-2">
                <div className="text-sm text-[var(--text-secondary)] italic">
                  Only the player can mark goals as achieved
                </div>
              </div>
            )}
          </div>
      )}
      </div>
  );
  };

  return (
    <div className="space-y-6">
      {/* Role-based Information Banner */}
      {/* {(currentUserRole === 'parent' || currentUserRole === 'coach') && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-2xl p-6 transition-colors duration-300">
          <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-[var(--bg-primary)] rounded-full flex items-center justify-center border border-[var(--border-primary)]">
                                      <span className="text-[var(--text-primary)] text-sm">ℹ️</span>
            </div>
                          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {currentUserRole === 'parent' ? 'Parent Goal Management' : 'Coach Goal Management'}
            </h3>
          </div>
                      <p className="text-[var(--text-secondary)] text-sm">
              {currentUserRole === 'parent' 
                ? 'As a parent, you can create new goals for your child and edit the ones you created. You can view all goals but cannot edit goals created by coaches. Your child can mark goals as achieved when they complete them.'
                : 'As a coach, you can create new goals for your players and edit the ones you created. You can view all goals but cannot edit goals created by parents. Players can mark their own goals as achieved when they complete them.'
              }
            </p>
            <div className="mt-3 text-xs text-[var(--text-tertiary)]">
              💡 <strong>Tip:</strong> Click the "+" button to create new goals. Edit/delete buttons only appear on goals you created.
            </div>
        </div>
      )} */}
      
      {/* Goals Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Short Term Goals */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-primary)] transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-[var(--text-primary)]">Short Goals</h3>
            {canCreateGoals && (
              <button 
                onClick={openCreateModal}
                className="w-8 h-8 bg-[var(--bg-primary)] rounded-full flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-300 border border-[var(--border-primary)]"
                title="Create New Goal"
              >
                <i dangerouslySetInnerHTML={{ __html: icons.plus }} />
              </button>
            )}
          </div>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setShortGoalsTab('planned')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                shortGoalsTab === 'planned' 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]' 
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Planned
            </button>
            <button
              onClick={() => setShortGoalsTab('achieved')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                shortGoalsTab === 'achieved' 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]' 
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Achieved
            </button>
            <button
              onClick={() => setShortGoalsTab('overdue')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                shortGoalsTab === 'overdue' 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]' 
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Overdue
            </button>
          </div>

          <div className="space-y-4">
            {getFilteredGoals(goalsByTerm.short[shortGoalsTab], shortGoalsTab).map(renderGoalCard)}
            {getFilteredGoals(goalsByTerm.short[shortGoalsTab], shortGoalsTab).length === 0 && (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                No {shortGoalsTab} short-term goals
              </div>
            )}
          </div>
        </div>

        {/* Medium Term Goals */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-primary)] transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-[var(--text-primary)]">Medium Goals</h3>
            {canCreateGoals && (
              <button 
                onClick={openCreateModal}
                className="w-8 h-8 bg-[var(--bg-primary)] rounded-full flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-300 border border-[var(--border-primary)]"
                title="Create New Goal"
              >
                <i dangerouslySetInnerHTML={{ __html: icons.plus }} />
              </button>
            )}
          </div>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMediumGoalsTab('planned')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                mediumGoalsTab === 'planned' 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]' 
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Planned
            </button>
            <button
              onClick={() => setMediumGoalsTab('achieved')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                mediumGoalsTab === 'achieved' 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]' 
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Achieved
            </button>
            <button
              onClick={() => setMediumGoalsTab('overdue')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                mediumGoalsTab === 'overdue' 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]' 
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Overdue
            </button>
          </div>

          <div className="space-y-4">
            {getFilteredGoals(goalsByTerm.medium[mediumGoalsTab], mediumGoalsTab).map(renderGoalCard)}
            {getFilteredGoals(goalsByTerm.medium[mediumGoalsTab], mediumGoalsTab).length === 0 && (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                No {mediumGoalsTab} medium-term goals
              </div>
            )}
          </div>
        </div>

        {/* Long Term Goals */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 border border-[var(--border-primary)] transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-[var(--text-primary)]">Long Goals</h3>
            {canCreateGoals && (
              <button 
                onClick={openCreateModal}
                className="w-8 h-8 bg-[var(--bg-primary)] rounded-full flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors duration-300 border border-[var(--border-primary)]"
                title="Create New Goal"
              >
                <i dangerouslySetInnerHTML={{ __html: icons.plus }} />
              </button>
            )}
          </div>
          
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setLongGoalsTab('planned')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                longGoalsTab === 'planned' 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]' 
                  : 'text-[var(--text-secondary)]'
              }`}
            >
          Planned
        </button>
            <button
              onClick={() => setLongGoalsTab('achieved')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                longGoalsTab === 'achieved' 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]' 
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Achieved
            </button>
            <button
              onClick={() => setLongGoalsTab('overdue')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                longGoalsTab === 'overdue' 
                  ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-primary)]' 
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Overdue
            </button>
          </div>

          <div className="space-y-4">
            {getFilteredGoals(goalsByTerm.long[longGoalsTab], longGoalsTab).map(renderGoalCard)}
            {getFilteredGoals(goalsByTerm.long[longGoalsTab], longGoalsTab).length === 0 && (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                No {longGoalsTab} long-term goals
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goal Management Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm p-4"
          onKeyDown={handleModalKeyDown}
          tabIndex={-1}
        >
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-primary)] w-full max-w-4xl max-h-[90vh] flex flex-col border border-[var(--border-primary)] transition-colors duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-secondary)] flex-shrink-0">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                {isEditing ? 'Edit Goal' : 'Set Goal'}
              </h2>
                <button
                onClick={closeModal}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-2xl font-bold"
                aria-label="Close modal"
                >
                ×
                </button>
              </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6" onKeyDown={handleFormKeyDown}>
                {/* Keyboard Navigation Hints */}
              
                {/* Main Form Fields - 2 Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* Left Column */}
                <div className="space-y-4">
                    {/* Goal Term */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Goal Term <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.term}
                        onChange={(e) => setFormData(prev => ({ ...prev, term: e.target.value as 'short' | 'medium' | 'long' }))}
                        className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                        required
                      >
                        <option value="">Select goal term</option>
                        <option value="short">Short Term</option>
                        <option value="medium">Medium Term</option>
                        <option value="long">Long Term</option>
                      </select>
                    </div>

                    {/* Goal Type */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Goal Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.goal}
                        onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                        required
                      >
                        <option value="">Select goal type</option>
                        <option value="technical">Technical</option>
                        <option value="tactical">Tactical</option>
                        <option value="physical">Physical</option>
                        <option value="mental">Mental</option>
                        <option value="nutrition">Nutrition</option>
                        <option value="recovery">Recovery</option>
                      </select>
                  </div>

                    {/* Due Date */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                      <input
                        type="date"
                        value={formData.achievementDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, achievementDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                        required
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Specific Goal */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Specific Goal <span className="text-red-500">*</span>
                    </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Type specific goal"
                        className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                        rows={3}
                      required
                    />
                  </div>

                    {/* Measurement Type */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Measurement Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                        value={formData.measurement}
                        onChange={(e) => setFormData(prev => ({ ...prev, measurement: e.target.value }))}
                      placeholder="Type measurement type"
                        className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                      required
                    />
                    </div>

                    {/* Add Ons */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={formData.addOns}
                        onChange={(e) => setFormData(prev => ({ ...prev, addOns: e.target.value }))}
                        placeholder="Any additional notes or comments"
                        className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions and Obstacles Section */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions & Obstacles</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Actions */}
                                          <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-primary)] transition-colors duration-300">
                      <h4 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-[var(--bg-primary)] rounded-full"></span>
                        Actions
                      </h4>
                <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                      type="text"
                      value={newAction}
                      onChange={(e) => setNewAction(e.target.value)}
                      onKeyDown={handleActionKeyPress}
                      placeholder="Type action description (Press Enter to add)"
                      className="flex-1 px-3 py-2 border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-[var(--border-primary)] text-sm min-w-0 bg-[var(--bg-card)] text-[var(--text-primary)]"
                      aria-label="Action description"
                    />
                                                      <input
                              type="date"
                              value={newActionDate}
                              onChange={(e) => setNewActionDate(e.target.value)}
                              className="w-32 px-3 py-2 border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-[var(--border-primary)] text-sm bg-[var(--bg-card)] text-[var(--text-primary)]"
                              aria-label="Action achievement date"
                            />
                    <button
                      type="button"
                      onClick={addAction}
                            disabled={isAddingAction || !newAction.trim() || !newActionDate}
                            className="px-4 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            aria-label="Add action"
                            title="Add action (Enter key also works)"
                          >
                            {isAddingAction ? (
                              <div className="w-4 h-4 border-2 border-[var(--text-primary)] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              '+'
                            )}
                    </button>
                  </div>
                        {/* Actions List with Scrollable Container */}
                        <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                          {formData.actions.map((action: any, index: number) => {
                            // Handle both old complex objects and new simple strings
                            const actionText = typeof action === 'string' ? action : action.description || '';
                            const isDone = typeof action === 'object' ? action.isDone : false;
                            
                            return (
                              <div key={action._id || index} className="bg-[var(--bg-secondary)] text-[var(--text-primary)] px-3 py-2 rounded-md text-sm flex items-center justify-between border border-[var(--border-primary)]">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{actionText}</div>
                                  <div className="text-xs text-[var(--text-tertiary)]">
                                    Due: {action.date ? formatDate(action.date) : 'N/A'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                        <button
                                    type="button"
                                    onClick={() => {
                                      const newActions = [...formData.actions];
                                      newActions[index].isDone = !isDone;
                                      setFormData(prev => ({ ...prev, actions: newActions }));
                                    }}
                                    className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] font-bold ml-2 flex-shrink-0"
                                    title={isDone ? 'Mark as not done' : 'Mark as done'}
                                  >
                                    {isDone ? '✓' : '✗'}
                                  </button>
                                </div>
                                <button
                                  type="button"
                          onClick={() => removeAction(index)}
                                  className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] font-bold ml-2 flex-shrink-0"
                        >
                                  ×
                        </button>
                      </div>
                            );
                          })}
                          {formData.actions.length === 0 && (
                                                      <div className="text-center py-4 text-[var(--text-secondary)] text-sm">
                            No actions added yet
                          </div>
                          )}
                        </div>
      </div>
    </div>

                    {/* Obstacles */}
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-4 border border-[var(--border-primary)] transition-colors duration-300">
                      <h4 className="font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-[var(--bg-primary)] rounded-full"></span>
                        Potential Obstacles
                      </h4>
                <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newObstacle}
                      onChange={(e) => setNewObstacle(e.target.value)}
                            onKeyDown={handleObstacleKeyPress}
                            placeholder="Type obstacle description (Press Enter to add)"
                            className="flex-1 px-3 py-2 border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-[var(--border-primary)] text-sm min-w-0 bg-[var(--bg-card)] text-[var(--text-primary)]"
                            aria-label="Obstacle description"
                          />
                                                    <input
                            type="date"
                            value={newObstacleDate}
                            onChange={(e) => setNewObstacleDate(e.target.value)}
                            className="w-32 px-3 py-2 border border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] focus:border-[var(--border-primary)] text-sm bg-[var(--bg-card)] text-[var(--text-primary)]"
                            aria-label="Obstacle achievement date"
                          />
                    <button
                      type="button"
                      onClick={addObstacle}
                            disabled={isAddingObstacle || !newObstacle.trim() || !newObstacleDate}
                            className="px-4 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            aria-label="Add obstacle"
                            title="Add obstacle (Enter key also works)"
                          >
                            {isAddingObstacle ? (
                              <div className="w-4 h-4 border-2 border-[var(--text-primary)] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              '+'
                            )}
                    </button>
                  </div>
                        {/* Obstacles List with Scrollable Container */}
                        <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                          {formData.obstacles.map((obstacle: any, index: number) => {
                            // Handle both old complex objects and new simple strings
                            const obstacleText = typeof obstacle === 'string' ? obstacle : obstacle.description || '';
                            
                            return (
                              <div key={obstacle._id || index} className="bg-[var(--bg-secondary)] text-[var(--text-primary)] px-3 py-2 rounded-md text-sm flex items-center justify-between border border-[var(--border-primary)]">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{obstacleText}</div>
                                  <div className="text-xs text-[var(--text-tertiary)]">
                                    Due: {obstacle.date ? formatDate(obstacle.date) : 'N/A'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                        <button
                                    type="button"
                                    onClick={() => {
                                      const newObstacles = [...formData.obstacles];
                                      newObstacles[index].isOvercome = !obstacle.isOvercome;
                                      setFormData(prev => ({ ...prev, obstacles: newObstacles }));
                                    }}
                                    className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] font-bold ml-2 flex-shrink-0"
                                    title={obstacle.isOvercome ? 'Mark as not overcome' : 'Mark as overcome'}
                                  >
                                    {obstacle.isOvercome ? '✓' : '✗'}
                                  </button>
                                </div>
                                <button
                                  type="button"
                          onClick={() => removeObstacle(index)}
                                  className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] font-bold ml-2 flex-shrink-0"
                        >
                                  ×
                        </button>
                      </div>
                            );
                          })}
                          {formData.obstacles.length === 0 && (
                                                      <div className="text-center py-4 text-[var(--text-secondary)] text-sm">
                            No obstacles added yet
                  </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
                </div>

            {/* Modal Footer - Fixed at bottom */}
            <div className="flex justify-end gap-3 p-6 border-t border-[var(--border-secondary)] flex-shrink-0">
              <button
                type="button"
                onClick={closeModal}
                className="px-6 py-2 text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-md hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] transition-colors"
              >
                Cancel
              </button>
                  <button
                    type="submit"
                disabled={isLoading}
                onClick={handleSubmit}
                className="px-6 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                {isLoading ? 'Saving...' : (isEditing ? 'Update Goal' : 'Set Goal')}
                  </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
