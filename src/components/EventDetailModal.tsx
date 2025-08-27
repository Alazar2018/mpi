import React, { useState, useEffect } from 'react';
import Button from './Button';
import { classService } from '@/service/class.server';
import { playersService } from '@/service/players.server';
import { toast } from 'react-toastify';
import { useAuthStore } from '@/store/auth.store';

interface EventDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: {
    id: string;
    title: string;
    date: string;
        type: string;
        status?: string;
    time?: string;
    endTime?: string;
    location?: string;
    description?: string;
        participants?: (string | { firstName?: string; lastName?: string; name?: string; [key: string]: any })[];
        color?: string;
        isAllDay?: boolean;
        opponentName?: string | null;
        coachName?: string;
        sourceType?: string;
        sourceId?: string;
    };
}

interface ClassDetails {
    _id: string;
    coach: {
        _id: string;
        firstName: string;
        lastName: string;
        emailAddress?: {
            email: string;
        };
        avatar?: string;
    };
    players: Array<{
        _id: string;
        firstName: string;
        lastName: string;
        emailAddress?: {
            email: string;
        };
        avatar?: string;
    }>;
    date: string;
    to: string;
    levelPlan: string;
    goal?: string;
    status: 'active' | 'cancelled' | 'completed';
    feedback?: string;
    playersCanReflect?: boolean;
    attendance: Array<{
        player: {
            _id: string;
            firstName: string;
            lastName: string;
            emailAddress?: {
                email: string;
            };
            avatar?: string;
        } | string;
        response?: 'confirmed' | 'rejected' | 'pending';
        status: 'present' | 'absent' | 'pending' | 'late' | 'excused';
        _id?: string;
    }>;
    objectives: Array<{
        objective: 'physical' | 'technical' | 'tactics' | 'mental' | 'recovery';
        subObjective: string;
        nestedSubObjective?: string;
        technicalStroke?: string;
        technicalProblem?: string;
        videoUrl?: string;
        tacticsType?: string;
        placementDetails?: any;
        consistencyResult?: any;
        additionalInfo?: string;
        actualResults?: any;
    }>;
    evaluations: Array<{
        player: {
            _id: string;
            firstName: string;
            lastName: string;
            emailAddress?: {
                email: string;
            };
            avatar?: string;
        };
        coachEvaluation: {
            measurement: string;
            achievable: boolean;
            isRelevant: boolean;
            isTimeBound: boolean;
            goal: string;
            performance: {
                engagement: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
                effort: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
                execution: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
            };
            additionalInfo?: string;
        };
        _id?: string;
        playerEvaluation?: {
            performance?: {
                engagement: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
                effort: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
                execution: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
            };
            additionalInfo?: string;
        };
    }>;
    reflections: Array<{
        player: {
            _id: string;
            firstName: string;
            lastName: string;
            emailAddress?: {
                email: string;
            };
            avatar?: string;
        };
        P: number;
        R: number;
        I: number;
        M: number;
        stepsTaken?: string;
        feelTowardsGoal?: string;
        additionalInfo?: string;
        _id?: string;
    }>;
    preSessionQuestions: Array<{
        player: {
            _id: string;
            firstName: string;
            lastName: string;
            emailAddress?: {
                email: string;
            };
            avatar?: string;
        };
        emotion: number;
        energy: number;
        engagement: number;
        additionalInfo?: string;
        _id?: string;
    }>;
    videos: string[];
    photos: string[];
    sessionType: 'private' | 'semi' | 'group';
    checkList?: Array<{
        player: {
            _id: string;
            firstName: string;
            lastName: string;
            emailAddress?: {
                email: string;
                verified?: boolean;
            };
            phoneNumber?: {
                countryCode: string;
                number: string;
            };
            avatar?: string;
            lastOnline?: string;
            __t?: string;
            id?: string;
        };
        survey: boolean;
        mindfulness: boolean;
        imagery: boolean;
        stretching: boolean;
        _id: string;
    }>;
    createdAt?: string;
    updatedAt?: string;
}

interface AttendanceRecord {
    playerId: string;
    playerName: string;
    status: 'present' | 'absent' | 'pending' | 'late' | 'excused';
    response?: 'confirmed' | 'rejected' | 'pending';
    avatar?: string;
}

interface PreGameChecklistItem {
    id: string;
    title: string;
    description: string;
    type: 'survey' | 'mindfulness' | 'imagery' | 'stretching';
    completed: boolean;
    videoUrl?: string;
    instructions?: string;
}

interface PlayerEvaluation {
    engagement: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
    effort: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
    execution: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
    additionalInfo?: string;
}

export default function EventDetailModal({ isOpen, onClose, event }: EventDetailModalProps) {
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const [isLoadingClass, setIsLoadingClass] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'attendance' | 'evaluation' | 'feedback' | 'uploads' | 'checklist'>('details');
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isMarkingAttendance, setIsMarkingAttendance] = useState(false);
    const [isCompletingClass, setIsCompletingClass] = useState(false);
    const [isUpdatingReflection, setIsUpdatingReflection] = useState(false);
    const [showPreGameChecklist, setShowPreGameChecklist] = useState(false);
    const [showEvaluationForm, setShowEvaluationForm] = useState(false);
    const [selectedPlayerForEvaluation, setSelectedPlayerForEvaluation] = useState<string | null>(null);
    const [preGameChecklist, setPreGameChecklist] = useState<PreGameChecklistItem[]>([
        {
            id: 'survey',
            title: 'Self Assessment Evaluation',
            description: 'Rate your current emotional, energy, and engagement state',
            type: 'survey',
            completed: false,
            instructions: 'Complete the pre-game survey to assess your readiness'
        },
        {
            id: 'mindfulness',
            title: 'Quick Ground Mindfulness Exercise',
            description: 'Complete a short mindfulness session',
            type: 'mindfulness',
            completed: false,
            videoUrl: 'https://example.com/mindfulness-video.mp4',
            instructions: 'Watch the video and complete the mindfulness exercise'
        },
        {
            id: 'imagery',
            title: 'Imagery Work',
            description: 'Visualize your performance and goals',
            type: 'imagery',
            completed: false,
            videoUrl: 'https://example.com/imagery-video.mp4',
            instructions: 'Watch the imagery video and complete the visualization exercise'
        },
        {
            id: 'stretching',
            title: 'Dynamic Stretching',
            description: 'Complete your pre-session stretching routine',
            type: 'stretching',
            completed: false,
            instructions: 'Perform the recommended dynamic stretches'
        }
    ]);

    // Pre-game questionnaire modal states
    const [showSurveyModal, setShowSurveyModal] = useState(false);
    const [showMindfulnessModal, setShowMindfulnessModal] = useState(false);
    const [showImageryModal, setShowImageryModal] = useState(false);
    const [showStretchingModal, setShowStretchingModal] = useState(false);
    
    // Survey form data
    const [surveyData, setSurveyData] = useState({
        emotion: 3,
        energy: 3,
        engagement: 3,
        additionalInfo: ''
    });

    // Menu and edit modal states
    const [showClassMenu, setShowClassMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPlayerManagementModal, setShowPlayerManagementModal] = useState(false);
    const [showPlayerSelectionModal, setShowPlayerSelectionModal] = useState(false);
    const [showCoachEvaluationModal, setShowCoachEvaluationModal] = useState(false);
    const [showReflectionModal, setShowReflectionModal] = useState(false);
    const [editData, setEditData] = useState({
        date: '',
        to: '',
        levelPlan: '',
        feedback: '',
        status: 'active' as 'active' | 'cancelled'
    });
    const [isSaving, setIsSaving] = useState(false);

    // Player management states
    const [playerSearchTerm, setPlayerSearchTerm] = useState('');
    const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAddingPlayers, setIsAddingPlayers] = useState(false);
    const [isRemovingPlayer, setIsRemovingPlayer] = useState<string | null>(null);

    // Coach evaluation states
    const [evaluationData, setEvaluationData] = useState({
        measurement: '',
        achievable: false,
        isRelevant: false,
        isTimeBound: false,
        goal: '',
        performance: {
            engagement: 'neutral' as 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree',
            effort: 'neutral' as 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree',
            execution: 'neutral' as 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree'
        },
        additionalInfo: ''
    });
    const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState(false);
    
    // Player goals states for evaluation
    const [playerGoals, setPlayerGoals] = useState<Array<{ _id: string; goal: string; description: string }>>([]);
    const [isLoadingGoals, setIsLoadingGoals] = useState(false);

    // Reflection form states
    const [reflectionData, setReflectionData] = useState({
        P: 3, // Purpose 1-5
        R: 3, // Relevance 1-5
        I: 3, // Interest 1-5
        M: 3, // Motivation 1-5
        stepsTaken: '',
        feelTowardsGoal: '',
        additionalInfo: ''
    });
    const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);

    // Self-evaluation form states
    const [showSelfEvaluationModal, setShowSelfEvaluationModal] = useState(false);
    const [selfEvaluationData, setSelfEvaluationData] = useState({
        performance: {
            engagement: 'neutral' as 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree',
            effort: 'neutral' as 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree',
            execution: 'neutral' as 'stronglyDisagree' | 'neutral' | 'agree' | 'stronglyAgree'
        },
        additionalInfo: ''
    });
    const [isSubmittingSelfEvaluation, setIsSubmittingSelfEvaluation] = useState(false);

    // Check if current user is the coach
    const isCurrentUserCoach = () => {
        // Check actual user role from auth store
        const userRole = useAuthStore.getState().user?.role;
        return userRole === 'coach' || userRole === 'admin';
        
        // For testing purposes, you can temporarily override:
        // Option 1: Always show coach view (for testing)
        // return true;
        
        // Option 2: Always show player view (for testing)
        // return false;
        
        // Option 3: Check if current user is the coach of this class
        // if (classDetails && classDetails.coach) {
        //     const currentUserId = useAuthStore.getState().user?._id;
        //     return currentUserId === classDetails.coach._id;
        // }
        // return false;
    };

    // Check if current user is a player in this class
    const isCurrentUserPlayer = () => {
        // This should be implemented based on your auth system
        // For now, we'll assume the current user is a player if not coach
        return !isCurrentUserCoach();
    };

    // Check if class is completed
    const isClassCompleted = () => {
        return classDetails?.status === 'completed';
    };

    // Check if class is active
    const isClassActive = () => {
        return classDetails?.status === 'active';
    };

    // Show item information
    const showItemInfo = (item: PreGameChecklistItem) => {
        switch (item.id) {
            case 'survey':
                toast.info('Complete a quick self-assessment to evaluate your emotional state, energy level, and engagement before your session. This helps coaches understand your readiness.', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                break;
            case 'mindfulness':
                toast.info('Practice mindfulness through guided meditation to center yourself and improve focus before your tennis session. This exercise helps reduce stress and enhance mental clarity.', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                break;
            case 'imagery':
                toast.info('Use visualization techniques to mentally rehearse your tennis performance. Imagine successful shots, strategies, and positive outcomes to build confidence and improve mental preparation.', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                break;
            case 'stretching':
                toast.info('Perform dynamic stretching exercises to warm up your muscles, improve flexibility, and reduce the risk of injury. These stretches prepare your body for optimal tennis performance.', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                break;
            default:
                toast.info(item.description || 'Click to learn more about this item.', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
        }
    };

    // Show survey modal
    const showSurvey = (itemId: string) => {
        setShowSurveyModal(true);
    };

    // Show mindfulness exercise
    const showMindfulnessExercise = (itemId: string) => {
        setShowMindfulnessModal(true);
    };

    // Show imagery work
    const showImageryWork = (itemId: string) => {
        setShowImageryModal(true);
    };

    // Show stretching guide
    const showStretchingGuide = (itemId: string) => {
        setShowStretchingModal(true);
    };

    // Submit survey and mark as completed
    const submitSurvey = async () => {
        if (!classDetails) return;
        
        try {
            // Call your API to submit the survey answers
            await addPreSessionQuestions(surveyData);
            
            // Mark survey as completed in the checklist
            setPreGameChecklist(prev => 
                prev.map(item => 
                    item.id === 'survey' 
                        ? { ...item, completed: true }
                        : item
                )
            );
            
            // Close the modal
            setShowSurveyModal(false);
            
            // Reset survey data
            setSurveyData({
                emotion: 3,
                energy: 3,
                engagement: 3,
                additionalInfo: ''
            });
            
            toast.success('Survey submitted successfully!');
        } catch (error) {
            console.error('Error submitting survey:', error);
            toast.error('Failed to submit survey. Please try again.');
        }
    };

    // Mark exercise as completed
    const completeExercise = async (exerciseType: string) => {
        if (!classDetails) return;
        
        try {
            // Call the appropriate checklist update API based on exercise type
            switch (exerciseType) {
                case 'mindfulness':
                    await classService.updateMindfulnessChecklist(classDetails._id);
                    break;
                case 'imagery':
                    await classService.updateImageryChecklist(classDetails._id);
                    break;
                case 'stretching':
                    await classService.updateStretchingChecklist(classDetails._id);
                    break;
                default:
                    console.warn('Unknown exercise type:', exerciseType);
                    return;
            }
            
            // Update local state to mark as completed
            setPreGameChecklist(prev => 
                prev.map(item => 
                    item.id === exerciseType 
                        ? { ...item, completed: true }
                        : item
                )
            );
            
            // Close the appropriate modal
            switch (exerciseType) {
                case 'mindfulness':
                    setShowMindfulnessModal(false);
                    break;
                case 'imagery':
                    setShowImageryModal(false);
                    break;
                case 'stretching':
                    setShowStretchingModal(false);
                    break;
            }
            
            toast.success(`${exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} exercise completed successfully!`);
        } catch (error) {
            console.error(`Error completing ${exerciseType} exercise:`, error);
            toast.error(`Failed to complete ${exerciseType} exercise. Please try again.`);
        }
    };

    // Function to fetch player goals for evaluation
    const fetchPlayerGoals = async (playerId: string) => {
        try {
            setIsLoadingGoals(true);
            const { playersService } = await import('@/service/players.server');
            const response = await playersService.getPlayerById(playerId);
            
            if (response.player && response.player.coachGoals) {
                // Extract all goals from all coach goals
                const allGoals: Array<{ _id: string; goal: string; description: string }> = [];
                response.player.coachGoals.forEach((coachGoal: any) => {
                    if (coachGoal.goals && Array.isArray(coachGoal.goals)) {
                        coachGoal.goals.forEach((goal: any) => {
                            allGoals.push({
                                _id: goal._id,
                                goal: goal.goal,
                                description: goal.description
                            });
                        });
                    }
                });
                setPlayerGoals(allGoals);
            } else {
                setPlayerGoals([]);
            }
        } catch (error) {
            console.error('Error fetching player goals:', error);
            setPlayerGoals([]);
        } finally {
            setIsLoadingGoals(false);
        }
    };

    useEffect(() => {
        if (isOpen && event.sourceType === 'class' && event.sourceId) {
            fetchClassDetails();
        }
    }, [isOpen, event.sourceType, event.sourceId]);

    useEffect(() => {
        if (classDetails && classDetails.players && Array.isArray(classDetails.players) && classDetails.attendance && Array.isArray(classDetails.attendance)) {
            // Initialize attendance records from class details
            const records: AttendanceRecord[] = classDetails.players.map(player => {
                if (!player || !player._id) {
                    return {
                        playerId: 'unknown',
                        playerName: 'Unknown Player',
                        status: 'pending' as const,
                        response: 'pending' as const,
                        avatar: undefined
                    };
                }
                
                const existingAttendance = classDetails.attendance.find(a => 
                    a && a.player && (
                        typeof a.player === 'string' ? a.player === player._id : a.player._id === player._id
                    )
                );
                
                return {
                    playerId: player._id,
                    playerName: `${player.firstName || 'Unknown'} ${player.lastName || 'Player'}`,
                    status: existingAttendance?.status || 'pending',
                    response: existingAttendance?.response || 'pending',
                    avatar: player.avatar
                };
            });
            setAttendanceRecords(records);
        }
    }, [classDetails]);

    const fetchClassDetails = async () => {
        if (!event.sourceId) return;
        
        setIsLoadingClass(true);
        setError(null);
        
        try {
            const response = await classService.getClass(event.sourceId);
            
            // Validate the response structure before setting it
            if (response && typeof response === 'object' && response._id) {
                // Ensure arrays exist and are properly initialized
                const validatedResponse = {
                    ...response,
                    players: Array.isArray(response.players) ? response.players : [],
                    attendance: Array.isArray(response.attendance) ? response.attendance : [],
                    objectives: Array.isArray(response.objectives) ? response.objectives : [],
                    evaluations: Array.isArray(response.evaluations) ? response.evaluations : [],
                    reflections: Array.isArray(response.reflections) ? response.reflections : [],
                    preSessionQuestions: Array.isArray(response.preSessionQuestions) ? response.preSessionQuestions : [],
                    videos: Array.isArray(response.videos) ? response.videos : [],
                    photos: Array.isArray(response.photos) ? response.photos : [],
                    // Add default values for properties that might not exist in the API response
                    playersCanReflect: response.playersCanReflect ?? false,
                    feedback: response.feedback ?? ''
                };
                
                setClassDetails(validatedResponse);
                
                // Update the pre-game checklist based on backend checkList
                if (response.checkList && Array.isArray(response.checkList) && response.checkList.length > 0) {
                    setPreGameChecklist(prev => prev.map(item => ({
                        ...item,
                        completed: response.checkList.some(playerChecklist => 
                            playerChecklist[item.id as keyof typeof playerChecklist] === true
                        )
                    })));
                }
            } else {
                throw new Error('Invalid response structure from API');
            }
        } catch (error) {
            console.error('Error fetching class details:', error);
            setError('Failed to fetch class details');
            setClassDetails(null);
        } finally {
            setIsLoadingClass(false);
        }
    };

    const saveAttendance = async () => {
        if (!classDetails) return;
        
        setIsMarkingAttendance(true);
        try {
            // Use the class service to mark attendance for each player
            const validAttendanceRecords = attendanceRecords.filter(record => 
                record.status !== 'pending'
            );
            
            const attendancePromises = validAttendanceRecords.map(record => 
                classService.markAttendance(classDetails._id, record.playerId, {
                    status: record.status as 'present' | 'absent' | 'late' | 'excused'
                })
            );
            
            await Promise.all(attendancePromises);
            
            // Show success message
            toast.success(`Attendance saved successfully for ${validAttendanceRecords.length} players!`);
            
            // Refresh class details to get updated attendance
            await fetchClassDetails();
        } catch (error) {
            console.error('Error saving attendance:', error);
            toast.error('Failed to save attendance. Please try again.');
        } finally {
            setIsMarkingAttendance(false);
        }
    };

    const completeClass = async () => {
        if (!classDetails) return;
        
        setIsCompletingClass(true);
        try {
            // Use the class service to mark class as completed
            await classService.completeClass(classDetails._id);
            
            // Update local state
            setClassDetails(prev => prev ? { ...prev, status: 'completed' } : null);
            
            toast.success('Class marked as completed!');
        } catch (error) {
            console.error('Error completing class:', error);
            toast.error('Failed to complete class. Please try again.');
        } finally {
            setIsCompletingClass(false);
        }
    };

    // Toggle players can reflect setting
    const togglePlayersCanReflect = async () => {
        if (!classDetails) return;
        
        try {
            // Use the class service to enable/disable player reflections
            await classService.enablePlayerReflections(classDetails._id, !classDetails.playersCanReflect);
            
            // Update local state
            setClassDetails(prev => prev ? { ...prev, playersCanReflect: !prev.playersCanReflect } : null);
            
            toast.success(`Players reflection ${!classDetails.playersCanReflect ? 'enabled' : 'disabled'}!`);
        } catch (error) {
            console.error('Error updating reflection setting:', error);
            toast.error('Failed to update reflection setting. Please try again.');
        }
    };

    // Initialize edit data when modal opens
    const initializeEditData = () => {
        if (classDetails) {
            setEditData({
                date: classDetails.date ? new Date(classDetails.date).toISOString().slice(0, 16) : '',
                to: classDetails.to ? new Date(classDetails.to).toISOString().slice(0, 16) : '',
                levelPlan: classDetails.levelPlan || '',
                feedback: classDetails.feedback || '',
                status: classDetails.status as 'active' | 'cancelled'
            });
        }
    };

    // Save edited class data
    const handleSaveEdit = async () => {
        if (!classDetails) return;
        
        setIsSaving(true);
        try {
            const updateData: any = {};
            
            // Only include fields that have changed
            if (editData.date && editData.date !== new Date(classDetails.date).toISOString().slice(0, 16)) {
                updateData.date = new Date(editData.date).toISOString();
            }
            if (editData.to && editData.to !== new Date(classDetails.to).toISOString().slice(0, 16)) {
                updateData.to = new Date(editData.to).toISOString();
            }
            if (editData.levelPlan !== classDetails.levelPlan) {
                updateData.levelPlan = editData.levelPlan;
            }
            if (editData.feedback !== classDetails.feedback) {
                updateData.feedback = editData.feedback;
            }
            if (editData.status !== classDetails.status) {
                updateData.status = editData.status;
            }
            
            // Only call API if there are changes
            if (Object.keys(updateData).length > 0) {
                await classService.updateClass(classDetails._id, updateData);
                
                // Update local state
                setClassDetails(prev => prev ? { ...prev, ...updateData } : null);
                
                toast.success('Class updated successfully!');
            }
            
            setShowEditModal(false);
        } catch (error) {
            console.error('Error updating class:', error);
            toast.error('Failed to update class. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Cancel class
    const handleCancelClass = async () => {
        if (!classDetails) return;
        
        try {
            await classService.cancelClass(classDetails._id);
            
            // Update local state
            setClassDetails(prev => prev ? { ...prev, status: 'cancelled' } : null);
            
            toast.success('Class cancelled successfully!');
        } catch (error) {
            console.error('Error cancelling class:', error);
            toast.error('Failed to cancel class. Please try again.');
        }
    };

    // Activate class
    const handleActivateClass = async () => {
        if (!classDetails) return;
        
        try {
            await classService.activateClass(classDetails._id);
            
            // Update local state
            setClassDetails(prev => prev ? { ...prev, status: 'active' } : null);
            
            toast.success('Class activated successfully!');
        } catch (error) {
            console.error('Error activating class:', error);
            toast.error('Failed to activate class. Please try again.');
        }
    };

    // Delete class
    const handleDeleteClass = async () => {
        if (!classDetails) return;
        
        if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
            return;
        }
        
        try {
            await classService.deleteClass(classDetails._id);
            
            toast.success('Class deleted successfully!');
            onClose(); // Close the modal after deletion
        } catch (error) {
            console.error('Error deleting class:', error);
            toast.error('Failed to delete class. Please try again.');
        }
    };

    // Player management functions
    const searchPlayers = async (searchTerm: string) => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await playersService.getPlayers(1, 100);
            const allPlayers = response.players || [];
            
            // Filter players who are not already in the class
            const currentPlayerIds = classDetails?.players?.map((p: any) => p._id) || [];
            const availablePlayers = allPlayers.filter((player: any) => 
                !currentPlayerIds.includes(player._id) &&
                (player.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 player.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 player.emailAddress?.email?.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            
            setSearchResults(availablePlayers);
        } catch (error) {
            console.error('Error searching players:', error);
            toast.error('Failed to search players. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const addPlayersToClass = async (playerIds: string[]) => {
        if (!classDetails || playerIds.length === 0) return;
        
        setIsAddingPlayers(true);
        try {
            await classService.addPlayersToClass(classDetails._id, { players: playerIds });
            
            // Refresh class details to get updated player list
            const updatedClass = await classService.getClass(classDetails._id);
            setClassDetails(updatedClass);
            
            toast.success(`${playerIds.length} player(s) added successfully!`);
            setPlayerSearchTerm('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error adding players:', error);
            toast.error('Failed to add players. Please try again.');
        } finally {
            setIsAddingPlayers(false);
        }
    };

    const removePlayerFromClass = async (playerId: string) => {
        if (!classDetails) return;
        
        if (!confirm('Are you sure you want to remove this player from the class?')) {
            return;
        }
        
        setIsRemovingPlayer(playerId);
        try {
            await classService.removePlayerFromClass(classDetails._id, playerId);
            
            // Refresh class details to get updated player list
            const updatedClass = await classService.getClass(classDetails._id);
            setClassDetails(updatedClass);
            
            toast.success('Player removed successfully!');
        } catch (error) {
            console.error('Error removing player:', error);
            toast.error('Failed to remove player. Please try again.');
        } finally {
            setIsRemovingPlayer(null);
        }
    };

    const initializePlayerManagement = async () => {
        try {
            const response = await playersService.getPlayers(1, 100);
            setAvailablePlayers(response.players || []);
        } catch (error) {
            console.error('Error fetching available players:', error);
        }
    };

    // Coach evaluation functions
    const openCoachEvaluationModal = (player: any) => {
        setSelectedPlayerForEvaluation(player);
        setEvaluationData({
            measurement: '',
            achievable: false,
            isRelevant: false,
            isTimeBound: false,
            goal: '',
            performance: {
                engagement: 'neutral',
                effort: 'neutral',
                execution: 'neutral'
            },
            additionalInfo: ''
        });
        
        // Fetch player goals for the evaluation
        fetchPlayerGoals(player._id);
        
        setShowCoachEvaluationModal(true);
    };

    const submitCoachEvaluation = async () => {
        if (!classDetails || !selectedPlayerForEvaluation) return;
        
        setIsSubmittingEvaluation(true);
        try {
            await classService.addCoachEvaluation(
                classDetails._id, 
                selectedPlayerForEvaluation._id, 
                evaluationData
            );
            
            // Refresh class details to get updated evaluations
            const updatedClass = await classService.getClass(classDetails._id);
            setClassDetails(updatedClass);
            
            toast.success('Coach evaluation submitted successfully!');
            setShowCoachEvaluationModal(false);
            setSelectedPlayerForEvaluation(null);
        } catch (error) {
            console.error('Error submitting coach evaluation:', error);
            toast.error('Failed to submit evaluation. Please try again.');
        } finally {
            setIsSubmittingEvaluation(false);
        }
    };

    const resetEvaluationForm = () => {
        setEvaluationData({
            measurement: '',
            achievable: false,
            isRelevant: false,
            isTimeBound: false,
            goal: '',
            performance: {
                engagement: 'neutral',
                effort: 'neutral',
                execution: 'neutral'
            },
            additionalInfo: ''
        });
    };

    // Update class feedback
    const updateClassFeedback = async (feedback: string) => {
        if (!classDetails) return;
        
        try {
            // Use the class service to update feedback
            await classService.updateClass(classDetails._id, { feedback });
            
            // Update local state
            setClassDetails(prev => prev ? { ...prev, feedback } : null);
            
            toast.success('Feedback updated successfully!');
        } catch (error) {
            console.error('Error updating feedback:', error);
            toast.error('Failed to update feedback. Please try again.');
        }
    };

    // Handle checklist item toggle with API integration
    const handleChecklistItemToggle = async (itemId: string) => {
        if (!classDetails) return;
        
        try {
            // Update the checklist item based on type
            switch (itemId) {
                case 'mindfulness':
                    await classService.updateMindfulnessChecklist(classDetails._id);
                    break;
                case 'imagery':
                    await classService.updateImageryChecklist(classDetails._id);
                    break;
                case 'stretching':
                    await classService.updateStretchingChecklist(classDetails._id);
                    break;
                case 'survey':
                    // Survey is handled separately through pre-session questions
                    break;
            }
            
            // Update local state
            setPreGameChecklist(prev => 
                prev.map(item => 
                    item.id === itemId 
                        ? { ...item, completed: !item.completed }
                        : item
                )
            );
            
            toast.success(`${itemId.charAt(0).toUpperCase() + itemId.slice(1)} marked as completed!`);
        } catch (error) {
            console.error('Error updating checklist:', error);
            toast.error('Failed to update checklist. Please try again.');
        }
    };

    // Handle player response to attendance
    const handlePlayerResponse = async (playerId: string, response: 'confirmed' | 'rejected') => {
        if (!classDetails) return;
        
        try {
            // Use the class service to update player availability
            await classService.updatePlayerAvailability(classDetails._id, { 
                response,
                reason: response === 'rejected' ? 'Player declined' : undefined
            });
            
            // Update local state
            setAttendanceRecords(prev => 
                prev.map(record => 
                    record.playerId === playerId 
                        ? { ...record, response }
                        : record
                )
            );
            
            toast.success(`Attendance ${response === 'confirmed' ? 'confirmed' : 'declined'} successfully!`);
        } catch (error) {
            console.error('Error updating attendance response:', error);
            toast.error('Failed to update attendance response. Please try again.');
        }
    };

    // Handle attendance change by coach
    const handleAttendanceChange = (playerId: string, status: 'present' | 'absent' | 'pending' | 'late' | 'excused') => {
        setAttendanceRecords(prev => 
            prev.map(record => 
                record.playerId === playerId 
                    ? { ...record, status, response: 'pending' }
                    : record
            )
        );
    };

    // Create coach evaluation for a player
    const createCoachEvaluation = async (playerId: string, evaluationData: {
        measurement: string;
        achievable: boolean;
        isRelevant: boolean;
        isTimeBound: boolean;
        goal: string;
        performance: {
            engagement: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
            effort: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
            execution: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
        };
        additionalInfo?: string;
    }) => {
        if (!classDetails) return;
        
        try {
            // Use the class service to add coach evaluation
            await classService.addCoachEvaluation(classDetails._id, playerId, evaluationData);
            
            toast.success('Evaluation created successfully!');
            
            // Refresh class details to get updated evaluations
            await fetchClassDetails();
            
            // Close evaluation form
            setShowEvaluationForm(false);
            setSelectedPlayerForEvaluation(null);
        } catch (error) {
            console.error('Error creating evaluation:', error);
            toast.error('Failed to create evaluation. Please try again.');
        }
    };

    // Add player reflection
    const addPlayerReflection = async (reflectionData: {
        P: number;
        R: number;
        I: number;
        M: number;
        stepsTaken?: string;
        feelTowardsGoal?: string;
        additionalInfo?: string;
    }) => {
        if (!classDetails) return;
        
        try {
            // Use the class service to add player reflection
            await classService.addPlayerReflection(classDetails._id, reflectionData);
            
            toast.success('Reflection added successfully!');
            
            // Refresh class details to get updated reflections
            await fetchClassDetails();
        } catch (error) {
            console.error('Error adding reflection:', error);
            toast.error('Failed to add reflection. Please try again.');
        }
    };

    // Submit reflection form
    const submitReflection = async () => {
        if (!classDetails) return;
        
        setIsSubmittingReflection(true);
        try {
            await addPlayerReflection(reflectionData);
            
            // Close the modal
            setShowReflectionModal(false);
            
            // Reset reflection data
            setReflectionData({
                P: 3,
                R: 3,
                I: 3,
                M: 3,
                stepsTaken: '',
                feelTowardsGoal: '',
                additionalInfo: ''
            });
            
            toast.success('Reflection submitted successfully!');
        } catch (error) {
            console.error('Error submitting reflection:', error);
            toast.error('Failed to submit reflection. Please try again.');
        } finally {
            setIsSubmittingReflection(false);
        }
    };

    // Reset reflection form
    const resetReflectionForm = () => {
        setReflectionData({
            P: 3,
            R: 3,
            I: 3,
            M: 3,
            stepsTaken: '',
            feelTowardsGoal: '',
            additionalInfo: ''
        });
    };

    // Submit self-evaluation
    const submitSelfEvaluation = async () => {
        if (!classDetails) return;
        
        setIsSubmittingSelfEvaluation(true);
        try {
            await classService.addPlayerEvaluation(classDetails._id, selfEvaluationData);
            
            // Close the modal
            setShowSelfEvaluationModal(false);
            
            // Reset self-evaluation data
            setSelfEvaluationData({
                performance: {
                    engagement: 'neutral',
                    effort: 'neutral',
                    execution: 'neutral'
                },
                additionalInfo: ''
            });
            
            toast.success('Self-evaluation submitted successfully!');
            
            // Refresh class details to get updated evaluations
            await fetchClassDetails();
        } catch (error) {
            console.error('Error submitting self-evaluation:', error);
            toast.error('Failed to submit self-evaluation. Please try again.');
        } finally {
            setIsSubmittingSelfEvaluation(false);
        }
    };

    // Reset self-evaluation form
    const resetSelfEvaluationForm = () => {
        setSelfEvaluationData({
            performance: {
                engagement: 'neutral',
                effort: 'neutral',
                execution: 'neutral'
            },
            additionalInfo: ''
        });
    };

    // Add pre-session questions
    const addPreSessionQuestions = async (questionsData: {
        emotion: number;
        energy: number;
        engagement: number;
        additionalInfo?: string;
    }) => {
        if (!classDetails) return;
        
        try {
            // Use the class service to add pre-session questions
            await classService.addPreSessionQuestions(classDetails._id, questionsData);
            
            toast.success('Pre-session questions submitted successfully!');
            
            // Refresh class details to get updated questions
            await fetchClassDetails();
        } catch (error) {
            console.error('Error submitting pre-session questions:', error);
            toast.error('Failed to submit pre-session questions. Please try again.');
        }
    };

    // Upload class videos
    const uploadClassVideos = async (files: FileList) => {
        if (!classDetails) return;
        
        try {
            const formData = new FormData();
            Array.from(files).forEach(file => {
                formData.append('videos', file);
            });
            
            // Use the class service to upload videos
            await classService.addClassVideos(classDetails._id, formData);
            
            toast.success('Videos uploaded successfully!');
            
            // Refresh class details to get updated videos
            await fetchClassDetails();
        } catch (error) {
            console.error('Error uploading videos:', error);
            toast.error('Failed to upload videos. Please try again.');
        }
    };

    // Upload class photos
    const uploadClassPhotos = async (files: FileList) => {
        if (!classDetails) return;
        
        try {
            const formData = new FormData();
            Array.from(files).forEach(file => {
                formData.append('photos', file);
            });
            
            // Use the class service to upload photos
            await classService.addClassPhotos(classDetails._id, formData);
            
            toast.success('Photos uploaded successfully!');
            
            // Refresh class details to get updated photos
            await fetchClassDetails();
        } catch (error) {
            console.error('Error uploading photos:', error);
            toast.error('Failed to upload photos. Please try again.');
        }
    };

    // Remove class videos
    const removeClassVideos = async (videoUrls: string[]) => {
        if (!classDetails) return;
        
        try {
            // Use the class service to remove videos
            await classService.removeClassVideos(classDetails._id, videoUrls);
            
            toast.success('Videos removed successfully!');
            
            // Refresh class details to get updated videos
            await fetchClassDetails();
        } catch (error) {
            console.error('Error removing videos:', error);
            toast.error('Failed to remove videos. Please try again.');
        }
    };

    // Remove class photos
    const removeClassPhotos = async (photoUrls: string[]) => {
        if (!classDetails) return;
        
        try {
            // Use the class service to remove photos
            await classService.removeClassPhotos(classDetails._id, photoUrls);
            
            toast.success('Photos removed successfully!');
            
            // Refresh class details to get updated photos
            await fetchClassDetails();
        } catch (error) {
            console.error('Error removing photos:', error);
            toast.error('Failed to remove photos. Please try again.');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const formatTime = (timeString: string) => {
        const date = new Date(timeString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const getParticipantName = (participant: any): string => {
        if (typeof participant === 'string') {
            return participant;
        }
        if (participant && typeof participant === 'object') {
            if (participant.firstName && participant.lastName) {
                return `${participant.firstName} ${participant.lastName}`;
            }
            else if (participant.name) {
                return participant.name;
            }
            else if (participant.title) {
                return participant.title;
            }
            else if (participant._id) {
                return `Player ${participant._id.slice(-4)}`;
            }
            try {
                return JSON.stringify(participant).slice(0, 20) + '...';
            } catch {
                return 'Player';
            }
        }
                        return 'Participant';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                    <button
            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                    </button>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {isCurrentUserCoach() ? 'Class Details' : 'My Class'}
                        </h2>
                </div>

                    {classDetails && isCurrentUserCoach() && (
                    <div className="flex items-center space-x-3">
                            <Button
                                type="primary"
                                size="none"
                                onClick={completeClass}
                                disabled={isCompletingClass || classDetails.status === 'completed'}
                                className="px-4 py-2 text-sm"
                            >
                                {isCompletingClass ? 'Completing...' : 'Mark as Complete'}
                            </Button>
                            
                                                        <div className="relative">
                                <Button
                                    type="neutral"
                                    size="none"
                                    onClick={() => setShowClassMenu(!showClassMenu)}
                                    className="px-4 py-2 text-sm"
                                >
                                    Menu
                                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </Button>
                                
                                {/* Dropdown Menu */}
                                {showClassMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    setShowClassMenu(false);
                                                    initializeEditData();
                                                    setShowEditModal(true);
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit Class
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setShowClassMenu(false);
                                                    initializePlayerManagement();
                                                    setShowPlayerManagementModal(true);
                                                }}
                                                className="flex items-start justify-start w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                                </svg>
                                                Player Management
                                            </button>
                                            
                                            {classDetails.status === 'active' && (
                                                <button
                                                    onClick={() => {
                                                        setShowClassMenu(false);
                                                        if (confirm('Are you sure you want to cancel this class?')) {
                                                            handleCancelClass();
                                                        }
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Cancel Class
                                                </button>
                                            )}
                                            
                                            {classDetails.status === 'cancelled' && (
                                                <button
                                                    onClick={() => {
                                                        setShowClassMenu(false);
                                                        handleActivateClass();
                                                    }}
                                                    className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Activate Class
                                                </button>
                                            )}
                                            
                                            <hr className="my-1" />
                                            
                                            <button
                                                onClick={() => {
                                                    setShowClassMenu(false);
                                                    handleDeleteClass();
                                                }}
                                                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete Class
                                            </button>
                    </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        )}
                    </div>

                {/* Navigation Tabs */}
                {isCurrentUserCoach() && (
                    <div className="flex border-b border-gray-200">
                        {['details', 'attendance', 'evaluation', 'uploads', 'checklist'].map((tab) => (
                    <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === tab
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                        ))}
                </div>
                )}

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {isLoadingClass ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500">{error}</p>
                        </div>
                    ) : classDetails && event.sourceType === 'class' ? (
                        // Show different layouts based on user role
                        isCurrentUserCoach() ? (
                            // COACH VIEW - Full functionality
                            <CoachView 
                                classDetails={classDetails}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                attendanceRecords={attendanceRecords}
                                isMarkingAttendance={isMarkingAttendance}
                                isCompletingClass={isCompletingClass}
                                isUpdatingReflection={isUpdatingReflection}
                                showPreGameChecklist={showPreGameChecklist}
                                showEvaluationForm={showEvaluationForm}
                                selectedPlayerForEvaluation={selectedPlayerForEvaluation}
                                preGameChecklist={preGameChecklist}
                                onAttendanceChange={handleAttendanceChange}
                                onPlayerResponse={handlePlayerResponse}
                                onSaveAttendance={saveAttendance}
                                onCompleteClass={completeClass}
                                onTogglePlayersCanReflect={togglePlayersCanReflect}
                                onUpdateFeedback={updateClassFeedback}
                                onChecklistItemToggle={handleChecklistItemToggle}
                                onShowItemInfo={showItemInfo}
                                onShowSurvey={showSurvey}
                                onShowMindfulnessExercise={showMindfulnessExercise}
                                onShowImageryWork={showImageryWork}
                                onShowStretchingGuide={showStretchingGuide}
                                onCreateEvaluation={createCoachEvaluation}
                                onAddPlayerReflection={addPlayerReflection}
                                onAddPreSessionQuestions={addPreSessionQuestions}
                                onUploadVideos={uploadClassVideos}
                                onUploadPhotos={uploadClassPhotos}
                                onRemoveVideos={removeClassVideos}
                                onRemovePhotos={removeClassPhotos}
                                onOpenCoachEvaluationModal={openCoachEvaluationModal}
                                onShowPlayerSelectionModal={() => setShowPlayerSelectionModal(true)}
                            />
                        ) : (
                            // PLAYER VIEW - Simplified layout
                            <PlayerView 
                                classDetails={classDetails}
                                attendanceRecords={attendanceRecords}
                                preGameChecklist={preGameChecklist}
                                onPlayerResponse={handlePlayerResponse}
                                onChecklistItemToggle={handleChecklistItemToggle}
                                onShowItemInfo={showItemInfo}
                                onShowSurvey={showSurvey}
                                onShowMindfulnessExercise={showMindfulnessExercise}
                                onShowImageryWork={showImageryWork}
                                onShowStretchingGuide={showStretchingGuide}
                                onAddPlayerReflection={addPlayerReflection}
                                onAddPreSessionQuestions={addPreSessionQuestions}
                                onShowReflectionModal={() => setShowReflectionModal(true)}
                                onShowSelfEvaluationModal={() => setShowSelfEvaluationModal(true)}
                            />
                        )
                    ) : (
                        // Basic event details for non-class events
                        <div className="space-y-6">
                            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Event Details</h3>
                            
                            {/* Event Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Event Type</label>
                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm capitalize">
                                    {event.type}
                            </span>
                        </div>

                            {/* Date & Time */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                    <p className="text-gray-900">{formatDate(event.date)}</p>
                        </div>
                                {event.time && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                                        <p className="text-gray-900">{event.time}</p>
                                    </div>
                                )}
                    </div>

                    {/* Location */}
                    {event.location && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                    <p className="text-gray-900">{event.location}</p>
                                </div>
                            )}

                            {/* Description */}
                            {event.description && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <p className="text-gray-900">{event.description}</p>
                        </div>
                    )}

                    {/* Participants */}
                    {event.participants && event.participants.length > 0 && (
                        <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Participants</label>
                            <div className="flex flex-wrap gap-2">
                                {event.participants.map((participant, index) => (
                                    <span 
                                        key={index}
                                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                    >
                                                {getParticipantName(participant)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 mt-8 px-6 pb-6">
                    <Button
                        type="neutral"
                        size="none"
                        onClick={onClose}
                        className="px-8 py-3 text-base"
                    >
                        Close
                    </Button>
                </div>
            </div>

            {/* Pre-Game Questionnaire Modals */}
            
            {/* Survey Modal */}
            {showSurveyModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={() => setShowSurveyModal(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Pre-Game Survey</h3>
                            <button
                                onClick={() => setShowSurveyModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Question 1: Emotional State */}
                        <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    1. How would you rate your current emotional state?
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={surveyData.emotion}
                                    onChange={(e) => setSurveyData(prev => ({ ...prev, emotion: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: 'linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%)',
                                        outline: 'none'
                                    }}
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Very negative</span>
                                    <span>Excellent</span>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {surveyData.emotion === 1 ? 'Very negative' :
                                         surveyData.emotion === 2 ? 'Negative' :
                                         surveyData.emotion === 3 ? 'Neutral' :
                                         surveyData.emotion === 4 ? 'Positive' : 'Excellent'}
                                    </span>
                                </div>
                            </div>

                            {/* Question 2: Energy State */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    2. How would you rate your current energy state?
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={surveyData.energy}
                                    onChange={(e) => setSurveyData(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: 'linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%)',
                                        outline: 'none'
                                    }}
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Extremely low</span>
                                    <span>Extremely high</span>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {surveyData.energy === 1 ? 'Extremely low' :
                                         surveyData.energy === 2 ? 'Low' :
                                         surveyData.energy === 3 ? 'Moderate' :
                                         surveyData.energy === 4 ? 'High' : 'Extremely high'}
                                    </span>
                                </div>
                            </div>

                            {/* Question 3: Engagement */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    3. How engaged do you feel right now, before your session?
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={surveyData.engagement}
                                    onChange={(e) => setSurveyData(prev => ({ ...prev, engagement: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: 'linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%)',
                                        outline: 'none'
                                    }}
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Not at all present</span>
                                    <span>Fully present</span>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {surveyData.engagement === 1 ? 'Not at all present' :
                                         surveyData.engagement === 2 ? 'Slightly present' :
                                         surveyData.engagement === 3 ? 'Moderately present' :
                                         surveyData.engagement === 4 ? 'Very present' : 'Fully present'}
                                    </span>
                                </div>
                            </div>

                            {/* Additional Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Additional Notes
                                </label>
                                <textarea
                                    value={surveyData.additionalInfo}
                                    onChange={(e) => setSurveyData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Any additional thoughts or feelings..."
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                onClick={submitSurvey}
                                className="w-full px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                Submit Survey
                            </button>
                        </div>
                    </div>
                        </div>
                    )}

            {/* Mindfulness Exercise Modal */}
            {showMindfulnessModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={() => setShowMindfulnessModal(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Meditation Exercise</h3>
                            <button
                                onClick={() => setShowMindfulnessModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Video Player */}
                            <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                                <div className="text-center text-white">
                                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-lg font-medium">Mindfulness Video</p>
                                    <p className="text-sm text-gray-300">Video player would be embedded here</p>
                                </div>
                            </div>
                            
                            {/* Instructions */}
                            <div className="text-center">
                                <p className="text-gray-700">
                                    Please watch the entire video to complete the meditation exercise.
                            </p>
                        </div>

                            {/* Complete Button */}
                            <button
                                onClick={() => completeExercise('mindfulness')}
                                className="w-full px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
                            >
                                Complete Exercise
                            </button>
                        </div>
                    </div>
                        </div>
                    )}

            {/* Imagery Work Modal */}
            {showImageryModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={() => setShowImageryModal(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Imagery Work</h3>
                            <button
                                onClick={() => setShowImageryModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Video Player */}
                            <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                                <div className="text-center text-white">
                                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-lg font-medium">Imagery Video</p>
                                    <p className="text-sm text-gray-300">Video player would be embedded here</p>
                                </div>
                            </div>
                            
                            {/* Instructions */}
                            <div className="text-center">
                                <p className="text-gray-700">
                                    Please watch the entire video to complete the imagery work exercise.
                                </p>
                            </div>

                            {/* Complete Button */}
                            <button
                                onClick={() => completeExercise('imagery')}
                                className="w-full px-6 py-3 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition-colors"
                            >
                                Complete Exercise
                            </button>
                        </div>
                    </div>
                            </div>
                        )}

            {/* Stretching Guide Modal */}
            {showStretchingModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={() => setShowStretchingModal(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Dynamic Stretching</h3>
                            <button
                                onClick={() => setShowStretchingModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Stretching Instructions */}
                            <div className="bg-yellow-50 p-6 rounded-lg">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Pre-Session Stretching Routine</h4>
                                <div className="space-y-4 text-sm text-gray-700">
                                    <div className="flex items-start space-x-3">
                                        <span className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                                        <div>
                                            <p className="font-medium">Arm Circles</p>
                                            <p>Stand with feet shoulder-width apart. Make circular motions with your arms, both forward and backward.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <span className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                                        <div>
                                            <p className="font-medium">Leg Swings</p>
                                            <p>Hold onto a wall or chair and swing each leg forward and backward, then side to side.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <span className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                                        <div>
                                            <p className="font-medium">Hip Rotations</p>
                                            <p>Stand with hands on hips and rotate your hips in a circular motion.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <span className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                                        <div>
                                            <p className="font-medium">Ankle Rolls</p>
                                            <p>Sit or stand and rotate your ankles in both directions.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Instructions */}
                            <div className="text-center">
                                <p className="text-gray-700">
                                    Please perform these stretches before your session.
                                </p>
                            </div>

                            {/* Complete Button */}
                            <button
                                onClick={() => completeExercise('stretching')}
                                className="w-full px-6 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors"
                            >
                                Complete Stretching
                            </button>
                                                </div>
                    </div>
                            </div>
                        )}

            {/* Edit Class Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Edit Class</h3>
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                <input
                                    type="datetime-local"
                                    value={editData.date}
                                    onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* End Time */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                                <input
                                    type="datetime-local"
                                    value={editData.to}
                                    onChange={(e) => setEditData(prev => ({ ...prev, to: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Level Plan */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Level Plan</label>
                                <input
                                    type="text"
                                    value={editData.levelPlan}
                                    onChange={(e) => setEditData(prev => ({ ...prev, levelPlan: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter level plan"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select
                                    value={editData.status}
                                    onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as 'active' | 'cancelled' }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="active">Active</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Feedback */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                                <textarea
                                    value={editData.feedback}
                                    onChange={(e) => setEditData(prev => ({ ...prev, feedback: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter feedback for the class"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                            </div>
                        )}

            {/* Player Management Modal */}
            {showPlayerManagementModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={() => setShowPlayerManagementModal(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Player Management</h3>
                            <button
                                onClick={() => setShowPlayerManagementModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                    </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Current Players Section */}
                            <div>
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Current Players ({classDetails?.players?.length || 0})</h4>
                                {classDetails?.players && classDetails.players.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {classDetails.players.map((player: any) => (
                                            <div key={player._id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg min-w-0">
                                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                                        {player.avatar ? (
                                                            <img src={player.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                                                        ) : (
                                                            <span className="text-gray-600 text-sm font-medium">
                                                                {player.firstName?.[0]}{player.lastName?.[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-gray-900 truncate">
                                                            {player.firstName} {player.lastName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {player.emailAddress?.email || 'No email'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removePlayerFromClass(player._id)}
                                                    disabled={isRemovingPlayer === player._id}
                                                    className="ml-2 p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
                                                    title="Remove player"
                                                >
                                                    {isRemovingPlayer === player._id ? (
                                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No players in this class yet.</p>
                                    </div>
                                )}
                </div>

                            {/* Add Players Section */}
                            <div className="border-t border-gray-200 pt-6">
                                <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Players</h4>
                                
                                {/* Search Input */}
                                <div className="relative mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search for players by name or email..."
                                        value={playerSearchTerm}
                                        onChange={(e) => {
                                            setPlayerSearchTerm(e.target.value);
                                            searchPlayers(e.target.value);
                                        }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    
                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {searchResults.map((player: any) => (
                                                <div
                                                    key={player._id}
                                                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                                                        addPlayersToClass([player._id]);
                                                    }}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                            {player.avatar ? (
                                                                <img src={player.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                                                            ) : (
                                                                <span className="text-gray-600 text-sm font-medium">
                                                                    {player.firstName?.[0]}{player.lastName?.[0]}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900">
                                                                {player.firstName} {player.lastName}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {player.emailAddress?.email || 'No email'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors">
                                                        Add
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {isSearching && (
                                        <div className="absolute right-3 top-3">
                                            <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {searchResults.length === 0 && playerSearchTerm && !isSearching && (
                                    <p className="text-gray-500 text-center py-4">No players found matching your search.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Player Selection Modal for Evaluation */}
            {showPlayerSelectionModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={() => setShowPlayerSelectionModal(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Select Player for Evaluation</h3>
                            <button
                                onClick={() => setShowPlayerSelectionModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="space-y-3">
                                {classDetails?.players && classDetails.players.length > 0 ? (
                                    classDetails.players.map((player: any) => (
                                        <button
                                            key={player._id}
                            onClick={() => {
                                                setShowPlayerSelectionModal(false);
                                                openCoachEvaluationModal(player);
                                            }}
                                            className="w-full flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                        >
                                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                                {player.avatar ? (
                                                    <img src={player.avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
                                                ) : (
                                                    <span className="text-gray-600 font-medium">
                                                        {player.firstName?.[0]}{player.lastName?.[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {player.firstName} {player.lastName}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {player.emailAddress?.email || 'No email'}
                                                </p>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <p>No players available for evaluation.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Coach Evaluation Modal */}
            {showCoachEvaluationModal && selectedPlayerForEvaluation && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={() => setShowCoachEvaluationModal(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Coach Evaluation - {selectedPlayerForEvaluation.firstName} {selectedPlayerForEvaluation.lastName}
                            </h3>
                            <button
                                onClick={() => setShowCoachEvaluationModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">Technical</p>
                            </div>

                            {/* How did you measure it? */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">How did you measure it? *</label>
                                <input
                                    type="text"
                                    value={evaluationData.measurement}
                                    onChange={(e) => setEvaluationData(prev => ({ ...prev, measurement: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="How did you measure it?"
                                    required
                                />
                            </div>

                            {/* Goal Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Goal *</label>
                                <select
                                    value={evaluationData.goal}
                                    onChange={(e) => setEvaluationData(prev => ({ ...prev, goal: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    disabled={isLoadingGoals || playerGoals.length === 0}
                                >
                                    <option value="">
                                        {isLoadingGoals ? 'Loading goals...' : 
                                         playerGoals.length === 0 ? 'No goals available for this player' : 
                                         'Select a goal...'}
                                    </option>
                                    {playerGoals.map(goal => (
                                        <option key={goal._id} value={goal.goal}>
                                            {goal.goal} - {goal.description}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    {playerGoals.length === 0 ? 'No goals found for the selected player' : 'Select a goal from the player\'s existing goals'}
                                </p>
                            </div>

                            {/* Did you achieve it? */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Did you achieve it? *</label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="achievable"
                                            value="true"
                                            checked={evaluationData.achievable === true}
                                            onChange={(e) => setEvaluationData(prev => ({ ...prev, achievable: e.target.value === 'true' }))}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Yes</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="achievable"
                                            value="false"
                                            checked={evaluationData.achievable === false}
                                            onChange={(e) => setEvaluationData(prev => ({ ...prev, achievable: e.target.value === 'true' }))}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">No</span>
                                    </label>
                                </div>
                            </div>

                            {/* Was it relevant? */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Was it relevant? *</label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="isRelevant"
                                            value="true"
                                            checked={evaluationData.isRelevant === true}
                                            onChange={(e) => setEvaluationData(prev => ({ ...prev, isRelevant: e.target.value === 'true' }))}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Yes</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="isRelevant"
                                            value="false"
                                            checked={evaluationData.isRelevant === false}
                                            onChange={(e) => setEvaluationData(prev => ({ ...prev, isRelevant: e.target.value === 'true' }))}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">No</span>
                                    </label>
                                </div>
                            </div>

                            {/* Is it time bound? */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Is it time bound? *</label>
                                <div className="flex space-x-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="isTimeBound"
                                            value="true"
                                            checked={evaluationData.isTimeBound === true}
                                            onChange={(e) => setEvaluationData(prev => ({ ...prev, isTimeBound: e.target.value === 'true' }))}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Yes</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            name="isTimeBound"
                                            value="false"
                                            checked={evaluationData.isTimeBound === false}
                                            onChange={(e) => setEvaluationData(prev => ({ ...prev, isTimeBound: e.target.value === 'true' }))}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">No</span>
                                    </label>
                                </div>
                            </div>

                            {/* Performance Assessment */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-medium text-gray-900">Performance Assessment</h4>
                                
                                {/* Engagement */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Engagement *</label>
                                    <div className="flex items-center space-x-2">
                                        <select
                                            value={evaluationData.performance.engagement}
                                            onChange={(e) => setEvaluationData(prev => ({
                                                ...prev,
                                                performance: { ...prev.performance, engagement: e.target.value as any }
                                            }))}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="stronglyDisagree">Strongly Disagree</option>
                                            <option value="disagree">Disagree</option>
                                            <option value="neutral">Neutral</option>
                                            <option value="agree">Agree</option>
                                            <option value="stronglyAgree">Strongly Agree</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => toast.info('Engagement measures how actively the player participated in the session')}
                                            className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                                        >
                                            i
                                        </button>
                                    </div>
                                </div>

                                {/* Effort */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Effort *</label>
                                    <div className="flex items-center space-x-2">
                                        <select
                                            value={evaluationData.performance.effort}
                                            onChange={(e) => setEvaluationData(prev => ({
                                                ...prev,
                                                performance: { ...prev.performance, effort: e.target.value as any }
                                            }))}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="stronglyDisagree">Strongly Disagree</option>
                                            <option value="disagree">Disagree</option>
                                            <option value="neutral">Neutral</option>
                                            <option value="agree">Agree</option>
                                            <option value="stronglyAgree">Strongly Agree</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => toast.info('Effort measures how hard the player worked during the session')}
                                            className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                                        >
                                            i
                                        </button>
                                    </div>
                                </div>

                                {/* Execution */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Execution *</label>
                                    <div className="flex items-center space-x-2">
                                        <select
                                            value={evaluationData.performance.execution}
                                            onChange={(e) => setEvaluationData(prev => ({
                                                ...prev,
                                                performance: { ...prev.performance, execution: e.target.value as any }
                                            }))}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="stronglyDisagree">Strongly Disagree</option>
                                            <option value="disagree">Disagree</option>
                                            <option value="neutral">Neutral</option>
                                            <option value="agree">Agree</option>
                                            <option value="stronglyAgree">Strongly Agree</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => toast.info('Execution measures how well the player performed the required tasks')}
                                            className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                                        >
                                            i
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                                <textarea
                                    value={evaluationData.additionalInfo}
                                    onChange={(e) => setEvaluationData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Additional Information"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                            <button
                                onClick={() => {
                                    setShowCoachEvaluationModal(false);
                                    resetEvaluationForm();
                                }}
                                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitCoachEvaluation}
                                disabled={isSubmittingEvaluation || !evaluationData.measurement || !evaluationData.goal}
                                className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmittingEvaluation ? 'Submitting...' : 'Submit Evaluation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reflection Modal */}
            {showReflectionModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={() => setShowReflectionModal(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Add Reflection</h3>
                            <button
                                onClick={() => setShowReflectionModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Purpose */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={reflectionData.P}
                                    onChange={(e) => setReflectionData(prev => ({ ...prev, P: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: 'linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%)',
                                        outline: 'none'
                                    }}
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Not at all relevant</span>
                                    <span>Extremely relevant</span>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {reflectionData.P === 1 ? 'Not at all relevant' :
                                         reflectionData.P === 2 ? 'Slightly relevant' :
                                         reflectionData.P === 3 ? 'Neutral' :
                                         reflectionData.P === 4 ? 'Slightly relevant' : 'Extremely relevant'}
                                    </span>
                                </div>
                            </div>

                            {/* Relevance */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Relevance</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={reflectionData.R}
                                    onChange={(e) => setReflectionData(prev => ({ ...prev, R: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: 'linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%)',
                                        outline: 'none'
                                    }}
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Not at all relevant</span>
                                    <span>Extremely relevant</span>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {reflectionData.R === 1 ? 'Not at all relevant' :
                                         reflectionData.R === 2 ? 'Slightly relevant' :
                                         reflectionData.R === 3 ? 'Neutral' :
                                         reflectionData.R === 4 ? 'Slightly relevant' : 'Extremely relevant'}
                                    </span>
                                </div>
                            </div>

                            {/* Interest */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Interest</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={reflectionData.I}
                                    onChange={(e) => setReflectionData(prev => ({ ...prev, I: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: 'linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%)',
                                        outline: 'none'
                                    }}
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Not at all interested</span>
                                    <span>Extremely interested</span>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {reflectionData.I === 1 ? 'Not at all interested' :
                                         reflectionData.I === 2 ? 'Slightly interested' :
                                         reflectionData.I === 3 ? 'Neutral' :
                                         reflectionData.I === 4 ? 'Slightly interested' : 'Extremely interested'}
                                    </span>
                                </div>
                            </div>

                            {/* Motivation */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Motivation</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    value={reflectionData.M}
                                    onChange={(e) => setReflectionData(prev => ({ ...prev, M: parseInt(e.target.value) }))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                        background: 'linear-gradient(to right, #e5e7eb 0%, #e5e7eb 100%)',
                                        outline: 'none'
                                    }}
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Not at all motivated</span>
                                    <span>Extremely motivated</span>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="text-sm font-medium text-gray-900">
                                        {reflectionData.M === 1 ? 'Not at all motivated' :
                                         reflectionData.M === 2 ? 'Slightly motivated' :
                                         reflectionData.M === 3 ? 'Neutral' :
                                         reflectionData.M === 4 ? 'Slightly motivated' : 'Extremely motivated'}
                                    </span>
                                </div>
                            </div>

                            {/* Steps Taken */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Steps Taken</label>
                                <textarea
                                    value={reflectionData.stepsTaken}
                                    onChange={(e) => setReflectionData(prev => ({ ...prev, stepsTaken: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Describe the steps you took to achieve your goal"
                                />
                            </div>

                            {/* Feel Towards Goal */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Feel Towards Goal</label>
                                <textarea
                                    value={reflectionData.feelTowardsGoal}
                                    onChange={(e) => setReflectionData(prev => ({ ...prev, feelTowardsGoal: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Describe how you felt towards your goal"
                                />
                            </div>

                            {/* Additional Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                                <textarea
                                    value={reflectionData.additionalInfo}
                                    onChange={(e) => setReflectionData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Any additional thoughts or feelings..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowReflectionModal(false)}
                                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitReflection}
                                disabled={isSubmittingReflection}
                                className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                {isSubmittingReflection ? 'Submitting...' : 'Submit Reflection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Self-Evaluation Modal */}
            {showSelfEvaluationModal && (
                <div className="fixed inset-0 z-60 flex items-center justify-center">
                    <div className="fixed inset-0 bg-transparent backdrop-blur-sm" onClick={() => setShowSelfEvaluationModal(false)}></div>
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Self-Evaluation</h3>
                            <button
                                onClick={() => setShowSelfEvaluationModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Engagement */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Engagement</label>
                                <select
                                    value={selfEvaluationData.performance.engagement}
                                    onChange={(e) => setSelfEvaluationData(prev => ({
                                        ...prev,
                                        performance: { ...prev.performance, engagement: e.target.value as any }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="stronglyDisagree">Strongly Disagree</option>
                                    <option value="disagree">Disagree</option>
                                    <option value="neutral">Neutral</option>
                                    <option value="agree">Agree</option>
                                    <option value="stronglyAgree">Strongly Agree</option>
                                </select>
                            </div>

                            {/* Effort */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Effort</label>
                                <select
                                    value={selfEvaluationData.performance.effort}
                                    onChange={(e) => setSelfEvaluationData(prev => ({
                                        ...prev,
                                        performance: { ...prev.performance, effort: e.target.value as any }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="stronglyDisagree">Strongly Disagree</option>
                                    <option value="disagree">Disagree</option>
                                    <option value="neutral">Neutral</option>
                                    <option value="agree">Agree</option>
                                    <option value="stronglyAgree">Strongly Agree</option>
                                </select>
                            </div>

                            {/* Execution */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Execution</label>
                                <select
                                    value={selfEvaluationData.performance.execution}
                                    onChange={(e) => setSelfEvaluationData(prev => ({
                                        ...prev,
                                        performance: { ...prev.performance, execution: e.target.value as any }
                                    }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="stronglyDisagree">Strongly Disagree</option>
                                    <option value="disagree">Disagree</option>
                                    <option value="neutral">Neutral</option>
                                    <option value="agree">Agree</option>
                                    <option value="stronglyAgree">Strongly Agree</option>
                                </select>
                            </div>

                            {/* Additional Information */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                                <textarea
                                    value={selfEvaluationData.additionalInfo}
                                    onChange={(e) => setSelfEvaluationData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Any additional thoughts about your performance..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                            <button
                                onClick={() => setShowSelfEvaluationModal(false)}
                                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitSelfEvaluation}
                                disabled={isSubmittingSelfEvaluation}
                                className="px-4 py-2 text-sm text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                            >
                                {isSubmittingSelfEvaluation ? 'Submitting...' : 'Submit Evaluation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Coach View Component - Full functionality
function CoachView({ 
    classDetails, 
    activeTab, 
    setActiveTab, 
    attendanceRecords, 
    isMarkingAttendance, 
    isCompletingClass, 
    isUpdatingReflection, 
    showPreGameChecklist, 
    showEvaluationForm, 
    selectedPlayerForEvaluation, 
    preGameChecklist, 
    onAttendanceChange, 
    onPlayerResponse, 
    onSaveAttendance, 
    onCompleteClass, 
    onTogglePlayersCanReflect, 
    onUpdateFeedback, 
    onChecklistItemToggle, 
    onShowItemInfo, 
    onShowSurvey, 
    onShowMindfulnessExercise, 
    onShowImageryWork, 
    onShowStretchingGuide, 
    onCreateEvaluation, 
    onAddPlayerReflection, 
    onAddPreSessionQuestions, 
    onUploadVideos, 
    onUploadPhotos, 
    onRemoveVideos, 
    onRemovePhotos,
    onOpenCoachEvaluationModal,
    onShowPlayerSelectionModal
}: any) {
    return (
        <div className="space-y-6">
            {/* Tab Content */}
            {activeTab === 'details' && (
                <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Class Details</h3>
                    
                    {/* Session Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm capitalize">
                            {classDetails.sessionType}
                        </span>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                            <p className="text-gray-900">{new Date(classDetails.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                            <div className="space-y-1">
                                <p className="text-gray-900">From: {new Date(classDetails.date).toLocaleTimeString()}</p>
                                <p className="text-gray-900">To: {new Date(classDetails.to).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Level Plan */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Level Plan</label>
                        <p className="text-gray-900">{classDetails.levelPlan}</p>
                    </div>

                    {/* Class Status */}
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">Class Status</label>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            classDetails.status === 'active' ? 'bg-green-100 text-green-800' :
                            classDetails.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {classDetails.status.charAt(0).toUpperCase() + classDetails.status.slice(1)}
                        </span>
                    </div>

                    {/* Players Can Reflect Toggle */}
                    <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">Players Can Reflect</label>
                        <button
                            onClick={onTogglePlayersCanReflect}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                classDetails.playersCanReflect 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                        >
                            {classDetails.playersCanReflect ? 'Yes' : 'No'}
                        </button>
                    </div>

                    {/* Feedback */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-gray-700">Feedback</label>
                            <button
                                onClick={() => {
                                    const newFeedback = prompt('Enter new feedback:', classDetails.feedback || '');
                                    if (newFeedback !== null) {
                                        onUpdateFeedback(newFeedback);
                                    }
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                            >
                                {classDetails.feedback ? 'Edit' : 'Add'}
                            </button>
                        </div>
                        {classDetails.feedback ? (
                            <p className="text-gray-900">{classDetails.feedback}</p>
                        ) : (
                            <p className="text-gray-500 italic">No feedback added yet</p>
                        )}
                    </div>
                </div>
            )}

            {/* Attendance Tab */}
            {activeTab === 'attendance' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Attendance Management</h3>
                        <button
                            onClick={onSaveAttendance}
                            disabled={isMarkingAttendance}
                            className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                            {isMarkingAttendance ? 'Saving...' : 'Save Attendance'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {attendanceRecords.map((record: any) => (
                            <div key={record.playerId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                        <span className="text-gray-600 font-medium">
                                            {record.playerName.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{record.playerName}</p>
                                        <p className="text-sm text-gray-500">
                                            Response: {record.response === 'confirmed' ? 'Confirmed' : record.response === 'rejected' ? 'Declined' : 'Pending'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <select
                                        value={record.status}
                                        onChange={(e) => onAttendanceChange(record.playerId, e.target.value as any)}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="present">Present</option>
                                        <option value="absent">Absent</option>
                                        <option value="late">Late</option>
                                        <option value="excused">Excused</option>
                                    </select>

                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        record.status === 'present' ? 'bg-green-100 text-green-800' :
                                        record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                        record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                        record.status === 'excused' ? 'bg-gray-100 text-gray-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Evaluation Tab */}
            {activeTab === 'evaluation' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Class Evaluation</h3>
                        <button
                            onClick={() => {
                                console.log('Add Evaluation button clicked');
                                
                                // Show player selection modal
                                if (classDetails.players && classDetails.players.length > 0) {
                                    // Show player selection modal
                                    onShowPlayerSelectionModal();
                                } else {
                                    // Since toast is not available in CoachView, we'll use a simple alert
                                    alert('No players available for evaluation');
                                }
                            }}
                            disabled={classDetails.status !== 'completed'}
                            className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {classDetails.status === 'completed' ? 'Add Evaluation' : 'Class Must Be Completed'}
                        </button>
                    </div>
                    
                    {/* Player Pre-Session Questions Section */}
                    {classDetails.preSessionQuestions && classDetails.preSessionQuestions.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Player Pre-Session Evaluations</h4>
                            
                            {classDetails.preSessionQuestions.map((playerQuestion: any, index: number) => {
                                const player = playerQuestion.player;
                                const playerName = typeof player === 'string' ? player : `${player.firstName} ${player.lastName}`;
                                
                                return (
                                    <div key={playerQuestion._id || index} className="border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Player Header - Always Visible */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => {
                                                 // Toggle accordion state for this player
                                                 const currentState = document.getElementById(`evaluation-${index}`)?.classList.contains('hidden');
                                                 const element = document.getElementById(`evaluation-${index}`);
                                                 if (element) {
                                                     if (currentState) {
                                                         element.classList.remove('hidden');
                                                     } else {
                                                         element.classList.add('hidden');
                                                     }
                                                 }
                                             }}>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                    <span className="text-gray-600 font-medium">
                                                        {playerName.charAt(0)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{playerName}</p>
                                                    <p className="text-sm text-gray-500">Pre-Session Assessment</p>
                                                </div>
                                            </div>
                                            
                                            {/* Expand/Collapse Icon */}
                                            <svg 
                                                className="w-5 h-5 text-gray-500 transform transition-transform" 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                        
                                        {/* Evaluation Details - Expandable */}
                                        <div id={`evaluation-${index}`} className="hidden border-t border-gray-200">
                                            <div className="p-4 bg-white space-y-4">
                                                {/* Emotional State */}
                                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-lg">😊</span>
                                                        <div>
                                                            <p className="font-medium text-gray-900">Emotional State</p>
                                                            <p className="text-sm text-gray-500">How are you feeling today?</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-bold text-blue-600">{playerQuestion.emotion}/5</span>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {playerQuestion.emotion === 1 && 'Very Low'}
                                                            {playerQuestion.emotion === 2 && 'Low'}
                                                            {playerQuestion.emotion === 3 && 'Neutral'}
                                                            {playerQuestion.emotion === 4 && 'Good'}
                                                            {playerQuestion.emotion === 5 && 'Excellent'}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Energy Level */}
                                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-lg">⚡</span>
                                                        <div>
                                                            <p className="font-medium text-gray-900">Energy Level</p>
                                                            <p className="text-sm text-gray-500">How much energy do you have?</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-bold text-green-600">{playerQuestion.energy}/5</span>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {playerQuestion.energy === 1 && 'Very Low'}
                                                            {playerQuestion.energy === 2 && 'Low'}
                                                            {playerQuestion.energy === 3 && 'Moderate'}
                                                            {playerQuestion.energy === 4 && 'High'}
                                                            {playerQuestion.energy === 5 && 'Very High'}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Engagement */}
                                                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-lg">🎯</span>
                                                        <div>
                                                            <p className="font-medium text-gray-900">Engagement</p>
                                                            <p className="text-sm text-gray-500">How engaged are you for this session?</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-bold text-purple-600">{playerQuestion.engagement}/5</span>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {playerQuestion.engagement === 1 && 'Not Engaged'}
                                                            {playerQuestion.engagement === 2 && 'Slightly Engaged'}
                                                            {playerQuestion.engagement === 3 && 'Moderately Engaged'}
                                                            {playerQuestion.engagement === 4 && 'Very Engaged'}
                                                            {playerQuestion.engagement === 5 && 'Fully Engaged'}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Additional Info */}
                                                {playerQuestion.additionalInfo && (
                                                    <div className="p-3 bg-gray-50 rounded-lg">
                                                        <p className="font-medium text-gray-900 mb-2">Additional Notes</p>
                                                        <p className="text-gray-700 text-sm">{playerQuestion.additionalInfo}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {/* Coach Evaluation Section */}
                    {classDetails.status === 'completed' && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Coach Evaluations</h4>
                            
                            {/* Existing Evaluations */}
                            {classDetails.evaluations && classDetails.evaluations.length > 0 ? (
                                <div className="space-y-4">
                                    {classDetails.evaluations.map((evaluation: any, index: number) => (
                                        <div key={evaluation._id || index} className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                        {evaluation.player?.avatar ? (
                                                            <img src={evaluation.player.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                                                        ) : (
                                                            <span className="text-gray-600 text-sm font-medium">
                                                                {evaluation.player?.firstName?.[0]}{evaluation.player?.lastName?.[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-gray-900">
                                                        {evaluation.player?.firstName} {evaluation.player?.lastName}
                                                    </span>
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {new Date(evaluation.createdAt || Date.now()).toLocaleDateString()}
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="font-medium text-gray-700">Goal: </span>
                                                    <span className="text-gray-900">{evaluation.coachEvaluation?.goal || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Measurement: </span>
                                                    <span className="text-gray-900">{evaluation.coachEvaluation?.measurement || 'N/A'}</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Achievable: </span>
                                                    <span className="text-gray-900">{evaluation.coachEvaluation?.achievable ? 'Yes' : 'No'}</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Relevant: </span>
                                                    <span className="text-gray-900">{evaluation.coachEvaluation?.isRelevant ? 'Yes' : 'No'}</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">Time-bound: </span>
                                                    <span className="text-gray-900">{evaluation.coachEvaluation?.isTimeBound ? 'Yes' : 'No'}</span>
                                                </div>
                                            </div>
                                            
                                            {evaluation.coachEvaluation?.performance && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <h5 className="font-medium text-gray-900 mb-2">Performance Assessment</h5>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                        <div>
                                                            <span className="font-medium text-gray-700">Engagement: </span>
                                                            <span className="text-gray-900 capitalize">{evaluation.coachEvaluation.performance.engagement}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-700">Effort: </span>
                                                            <span className="text-gray-900 capitalize">{evaluation.coachEvaluation.performance.effort}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-700">Execution: </span>
                                                            <span className="text-gray-900 capitalize">{evaluation.coachEvaluation.performance.execution}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {evaluation.coachEvaluation?.additionalInfo && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                    <h5 className="font-medium text-gray-900 mb-2">Additional Information</h5>
                                                    <p className="text-gray-700 text-sm">{evaluation.coachEvaluation.additionalInfo}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 mb-4">No coach evaluations yet.</p>
                                    <p className="text-sm text-gray-400">Click "Add Evaluation" above to evaluate players.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}



            {/* Uploads Tab */}
            {activeTab === 'uploads' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Session Photos & Videos</h3>
                        <div className="flex space-x-2">
                            <label className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors cursor-pointer">
                                Upload Videos
                                <input
                                    type="file"
                                    multiple
                                    accept="video/*"
                                    onChange={(e) => e.target.files && onUploadVideos(e.target.files)}
                                    className="hidden"
                                />
                            </label>
                            <label className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors cursor-pointer">
                                Upload Photos
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => e.target.files && onUploadPhotos(e.target.files)}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>
                    
                    {/* Videos Section */}
                    {classDetails.videos && classDetails.videos.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">Videos ({classDetails.videos.length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {classDetails.videos.map((videoUrl: string, index: number) => (
                                    <div key={index} className="relative group">
                                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                                            <video 
                                                className="w-full h-48 object-cover"
                                                controls
                                                preload="metadata"
                                            >
                                                <source src={videoUrl} type="video/mp4" />
                                                <source src={videoUrl} type="video/webm" />
                                                <source src={videoUrl} type="video/ogg" />
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onRemoveVideos([videoUrl])}
                                                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                                title="Remove video"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p className="text-sm text-gray-600">Video {index + 1}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Photos Section */}
                    {classDetails.photos && classDetails.photos.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">Photos ({classDetails.photos.length})</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {classDetails.photos.map((photoUrl: string, index: number) => (
                                    <div key={index} className="relative group">
                                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                                            <img 
                                                src={photoUrl} 
                                                alt={`Session photo ${index + 1}`}
                                                className="w-full h-32 object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                                onClick={() => {
                                                    // Open photo in full screen modal
                                                    window.open(photoUrl, '_blank');
                                                }}
                                            />
                                        </div>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => onRemovePhotos([photoUrl])}
                                                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                                title="Remove photo"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="mt-2 text-center">
                                            <p className="text-sm text-gray-600">Photo {index + 1}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Empty State */}
                    {(!classDetails.videos || classDetails.videos.length === 0) && 
                     (!classDetails.photos || classDetails.photos.length === 0) && (
                        <div className="text-center py-12">
                            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No media uploaded yet</h3>
                            <p className="text-gray-500 mb-4">Upload photos and videos from your session to share with players and track progress.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Checklist Tab */}
            {activeTab === 'checklist' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-900">Pre-Game Checklist Results</h3>
                    </div>
                    
                    {classDetails.checkList && Array.isArray(classDetails.checkList) && classDetails.checkList.length > 0 ? (
                        <div className="space-y-4">
                            {classDetails.checkList.map((playerChecklist: any, index: number) => {
                                const player = playerChecklist.player;
                                const playerName = `${player.firstName} ${player.lastName}`;
                                const isAllCompleted = playerChecklist.survey && playerChecklist.mindfulness && playerChecklist.imagery && playerChecklist.stretching;
                                
                                return (
                                    <div key={playerChecklist._id || index} className="border border-gray-200 rounded-lg overflow-hidden">
                                        {/* Player Header - Always Visible */}
                                        <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={() => {
                                                 // Toggle accordion state for this player
                                                 const currentState = document.getElementById(`checklist-${index}`)?.classList.contains('hidden');
                                                 const element = document.getElementById(`checklist-${index}`);
                                                 if (element) {
                                                     if (currentState) {
                                                         element.classList.remove('hidden');
                                                     } else {
                                                         element.classList.add('hidden');
                                                     }
                                                 }
                                             }}>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                                                    {player.avatar ? (
                                                        <img 
                                                            src={player.avatar} 
                                                            alt={playerName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEMyMi43NjE0IDIwIDI1IDE3Ljc2MTQgMjUgMTVDMjUgMTIuMjM4NiAyMi43NjE0IDEwIDIwIDEwQzE3LjIzODYgMTAgMTUgMTIuMjM4NiAxNSAxNUMxNSAxNy43NjE0IDE3LjIzODYgMjAgMjAgMjBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yMCAyMkMxNi42ODYzIDIyIDE0IDI0LjY4NjMgMTQgMjhIMjZDMjYgMjQuNjg2MyAyMy4zMTM3IDIyIDIwIDIyWiIgZmlsbD0iIzlCOUJBMCIvPgo8L3N2Zz4K';
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-600 font-medium text-lg">
                                                            {playerName.charAt(0)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{playerName}</p>
                                                    <p className="text-sm text-gray-500">{player.emailAddress?.email}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-3">
                                                {/* Overall Completion Status */}
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    isAllCompleted 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {isAllCompleted ? 'All Complete' : 'In Progress'}
                                                </span>
                                                
                                                {/* Expand/Collapse Icon */}
                                                <svg 
                                                    className="w-5 h-5 text-gray-500 transform transition-transform" 
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                    id={`icon-${index}`}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        
                                        {/* Checklist Items - Expandable */}
                                        <div id={`checklist-${index}`} className="hidden border-t border-gray-200">
                                            <div className="p-4 bg-white space-y-3">
                                                {[
                                                    { key: 'survey', label: 'Self Assessment Survey', icon: '📊' },
                                                    { key: 'mindfulness', label: 'Mindfulness Exercise', icon: '🧘' },
                                                    { key: 'imagery', label: 'Imagery Work', icon: '💭' },
                                                    { key: 'stretching', label: 'Dynamic Stretching', icon: '🏃' }
                                                ].map((item) => (
                                                    <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-lg">{item.icon}</span>
                                                            <div>
                                                                <p className="font-medium text-gray-900">{item.label}</p>
                                                                <p className="text-sm text-gray-500">
                                                                    {playerChecklist[item.key] ? 'Completed' : 'Not completed yet'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-4 h-4 rounded-full border-2 ${
                                                                playerChecklist[item.key] 
                                                                    ? 'bg-green-500 border-green-500' 
                                                                    : 'bg-red-500 border-red-500'
                                                            }`}>
                                                                {playerChecklist[item.key] && (
                                                                    <svg className="w-2 h-2 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                playerChecklist[item.key] 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {playerChecklist[item.key] ? 'Done' : 'Pending'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No checklist data available</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Player View Component - Simplified layout
function PlayerView({ 
    classDetails, 
    attendanceRecords, 
    preGameChecklist, 
    onPlayerResponse, 
    onChecklistItemToggle, 
    onShowItemInfo, 
    onShowSurvey, 
    onShowMindfulnessExercise, 
    onShowImageryWork, 
    onShowStretchingGuide, 
    onAddPlayerReflection, 
    onAddPreSessionQuestions,
    onShowReflectionModal,
    onShowSelfEvaluationModal
}: any) {
    const { user } = useAuthStore();
    const isClassCompleted = () => classDetails?.status === 'completed';
    const isClassActive = () => classDetails?.status === 'active';

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-2xl text-white shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Session Details</h2>
                        <p className="text-blue-100 text-lg">Your tennis training session</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            classDetails.status === 'active' ? 'bg-green-500 text-white shadow-lg' :
                            classDetails.status === 'completed' ? 'bg-blue-500 text-white shadow-lg' :
                            'bg-red-500 text-white shadow-lg'
                        }`}>
                            {classDetails.status.charAt(0).toUpperCase() + classDetails.status.slice(1)}
                        </span>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                    <div>
                                <p className="text-blue-100 text-sm">Date & Time</p>
                                <p className="font-semibold">{new Date(classDetails.date).toLocaleDateString()}</p>
                                <p className="text-blue-100 text-sm">{new Date(classDetails.date).toLocaleTimeString()} - {new Date(classDetails.to).toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                    <div>
                                <p className="text-blue-100 text-sm">Session Type</p>
                                <p className="font-semibold capitalize">{classDetails.sessionType}</p>
                                <p className="text-blue-100 text-sm capitalize">{classDetails.levelPlan}</p>
                            </div>
                        </div>
                    </div>

                    {classDetails.goal && (
                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                    <div>
                                    <p className="text-blue-100 text-sm">Session Goal</p>
                                    <p className="font-semibold capitalize">{classDetails.goal}</p>
                    </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Feedback Section - Read Only */}
            {classDetails.feedback && (
                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Coach's Feedback</h3>
                    <p className="text-gray-900">{classDetails.feedback}</p>
                </div>
            )}

            {/* Attendance Response */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-2xl border border-amber-200 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">Attendance Response</h3>
                            <p className="text-amber-700">Confirm your participation in this session</p>
                        </div>
                    </div>
                    {isClassCompleted() && (
                        <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold border border-red-200">
                            Class Completed - No Changes
                        </span>
                    )}
                </div>
                
                {isClassCompleted() ? (
                    <div className="text-center py-8 bg-white/60 rounded-xl border border-amber-200">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <p className="text-gray-700 text-lg mb-2">This class has been completed.</p>
                        <p className="text-gray-500">Your attendance response is now locked.</p>
                    </div>
                ) : (
                    <>
                        {/* Check if player has already responded */}
                        {attendanceRecords.find((record: any) => record.response === 'confirmed' || record.response === 'rejected') ? (
                            // Show selected choice with edit button
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-6 bg-white rounded-xl border-2 border-amber-200 shadow-md">
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-6 h-6 rounded-full ${
                                            attendanceRecords.find((record: any) => record.response === 'confirmed') ? 'bg-green-500' : 'bg-red-500'
                                        }`}></div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-lg">
                                                {attendanceRecords.find((record: any) => record.response === 'confirmed') ? 'Yes, I\'m Coming' : 'No, I Can\'t Make It'}
                                            </p>
                                            <p className="text-amber-700">
                                                {attendanceRecords.find((record: any) => record.response === 'confirmed') ? 'You confirmed your attendance' : 'You declined the invitation'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                            onClick={() => {
                                            onPlayerResponse('confirmed', 'pending');
                            }}
                                        className="px-6 py-3 text-sm text-blue-600 hover:text-blue-800 underline font-semibold hover:bg-blue-50 rounded-lg transition-colors"
                        >
                                        Edit Response
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Show choice buttons if no response yet
                            <div className="text-center">
                                <p className="text-gray-700 text-lg mb-6">Please confirm if you're coming to this class:</p>
                                
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={() => onPlayerResponse('confirmed', 'confirmed')}
                                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-lg"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Yes, I'm Coming</span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => onPlayerResponse('confirmed', 'rejected')}
                                        className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-lg"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            <span>No, I Can't Make It</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pre-Game Checklist */}
            <div className="bg-green-50 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Pre-Game Checklist</h3>
                    {isClassCompleted() && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            Class Completed - No More Submissions
                        </span>
                    )}
                </div>
                
                {isClassCompleted() ? (
                    <div className="text-center py-4">
                        <p className="text-gray-600 mb-2">This class has been completed.</p>
                        <p className="text-sm text-gray-500">All checklist items are now read-only.</p>
                    </div>
                ) : (
                    <p className="text-gray-700 mb-4">Complete these items before your session:</p>
                )}
                
                <div className="space-y-4">
                    {preGameChecklist.map((item: any) => (
                        <div key={item.id} className="flex items-start space-x-4 p-4 bg-white rounded-lg border">
                            <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => onChecklistItemToggle(item.id)}
                                disabled={!isClassActive() || isClassCompleted()}
                                className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                                    <button
                                        onClick={() => onShowItemInfo(item)}
                                        disabled={isClassCompleted()}
                                        className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        i
                                    </button>
                </div>
                                
                                <p className="text-gray-600 text-sm mb-3">{item.description}</p>
                                
                                {/* Action buttons based on item type - Disabled when class completed */}
                                {!item.completed && isClassActive() && !isClassCompleted() && (
                                    <div className="space-x-2">
                                        {item.type === 'survey' && (
                                            <button
                                                onClick={() => onShowSurvey(item.id)}
                                                className="px-4 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
                                            >
                                                Take Survey
                                            </button>
                                        )}
                                        
                                        {item.type === 'mindfulness' && (
                                            <button
                                                onClick={() => onShowMindfulnessExercise(item.id)}
                                                className="px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                                            >
                                                Start Exercise
                                            </button>
                                        )}
                                        
                                        {item.type === 'imagery' && (
                                            <button
                                                onClick={() => onShowImageryWork(item.id)}
                                                className="px-4 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600 transition-colors"
                                            >
                                                Start Imagery
                                            </button>
                                        )}
                                        
                                        {item.type === 'stretching' && (
                                            <button
                                                onClick={() => onShowStretchingGuide(item.id)}
                                                className="px-4 py-2 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                                            >
                                                View Stretches
                                            </button>
                                        )}
            </div>
                                )}
                                
                                {/* Show disabled message when class completed */}
                                {isClassCompleted() && !item.completed && (
                                    <div className="text-sm text-gray-500 italic">
                                        This item can no longer be completed as the class has ended.
                                    </div>
                                )}
                            </div>
                            
                            <div className="ml-4">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    item.completed 
                                        ? 'bg-green-100 text-green-800' 
                                        : isClassActive() && !isClassCompleted()
                                            ? 'bg-yellow-100 text-yellow-800' 
                                            : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {item.completed ? 'Completed' : isClassActive() && !isClassCompleted() ? 'Available' : 'Disabled'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reflection Field - Only if coach allows and class completed */}
            {classDetails.playersCanReflect && isClassCompleted() && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-2xl border border-purple-200 shadow-lg">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">Session Reflection</h3>
                            <p className="text-purple-700">Share your thoughts about this session</p>
                        </div>
                    </div>
                    
                    {/* Check if current player has already submitted a reflection */}
                    {classDetails.P && classDetails.P !== null ? (
                        <div className="space-y-4">
                            <p className="text-gray-700 text-lg mb-4">Your reflection for this session:</p>
                            <div className="p-6 bg-white rounded-xl border-2 border-purple-200 shadow-md">
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="text-2xl font-bold text-purple-600">{classDetails.P}</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">Purpose</p>
                                        <p className="text-xs text-gray-500">/5</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="text-2xl font-bold text-indigo-600">{classDetails.R}</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">Relevance</p>
                                        <p className="text-xs text-gray-500">/5</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="text-2xl font-bold text-pink-600">{classDetails.I}</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">Interest</p>
                                        <p className="text-xs text-gray-500">/5</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="text-2xl font-bold text-blue-600">{classDetails.M}</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-700">Motivation</p>
                                        <p className="text-xs text-gray-500">/5</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {classDetails.stepsTaken && (
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <span className="font-semibold text-gray-700">Steps Taken:</span>
                                            <p className="text-gray-900 mt-2">{classDetails.stepsTaken}</p>
                                        </div>
                                    )}
                                    
                                    {classDetails.feelTowardsGoal && (
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <span className="font-semibold text-gray-700">Feel Towards Goal:</span>
                                            <p className="text-gray-900 mt-2">{classDetails.feelTowardsGoal}</p>
                                        </div>
                                    )}
                                    
                                    {classDetails.additionalInfo && (
                                        <div className="p-4 bg-gray-50 rounded-lg">
                                            <span className="font-semibold text-gray-700">Additional Notes:</span>
                                            <p className="text-gray-900 mt-2">{classDetails.additionalInfo}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-700 text-lg mb-6">Share your thoughts about this session:</p>
                    <button
                                onClick={onShowReflectionModal}
                                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-lg"
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span>Add Reflection</span>
                                </div>
                    </button>
                        </div>
                    )}
                </div>
            )}

            {/* Coach's Evaluation - View Only when class completed */}
            {isClassCompleted() && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-8 rounded-2xl border border-blue-200 shadow-lg">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">Coach's Evaluation</h3>
                            <p className="text-blue-700">Your coach's feedback and assessment</p>
                        </div>
                    </div>
                    
                    {/* Check if current player has an evaluation */}
                    {classDetails.evaluations && classDetails.evaluations.length > 0 && classDetails.evaluations.find((evaluation: any) => evaluation.player === user?._id) ? (
                        <>
                            <p className="text-gray-700 text-lg mb-6">Here's what your coach evaluated for this session:</p>
                    
                    {classDetails.evaluations.map((evaluation: any, index: number) => (
                                <div key={index} className="p-6 bg-white rounded-xl border-2 border-blue-200 shadow-md">
                                    {/* Check if this evaluation is for the current player */}
                                    {evaluation.player === user?._id && (
                                        <>
                                            {/* Basic Info */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                <div className="p-4 bg-blue-50 rounded-lg">
                                                    <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Measurement</span>
                                                    <p className="text-lg font-medium text-gray-900 mt-1">{evaluation.coachEvaluation?.measurement || 'Not specified'}</p>
                                                </div>
                                                <div className="p-4 bg-blue-50 rounded-lg">
                                                    <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Goal</span>
                                                    <p className="text-lg font-medium text-gray-900 mt-1 capitalize">{evaluation.coachEvaluation?.goal || 'Not specified'}</p>
                                                </div>
                                            </div>
                                            
                                            {/* SMART Goal Criteria */}
                                            <div className="mb-6">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-4">SMART Goal Assessment</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                                                            evaluation.coachEvaluation?.achievable ? 'bg-green-100' : 'bg-red-100'
                                                        }`}>
                                                            <svg className={`w-6 h-6 ${evaluation.coachEvaluation?.achievable ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={evaluation.coachEvaluation?.achievable ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                                            </svg>
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-700">Achievable</p>
                                                        <p className={`text-sm font-semibold ${evaluation.coachEvaluation?.achievable ? 'text-green-600' : 'text-red-600'}`}>
                                                            {evaluation.coachEvaluation?.achievable ? 'Yes' : 'No'}
                                                        </p>
                                                    </div>
                                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                                                            evaluation.coachEvaluation?.isRelevant ? 'bg-green-100' : 'bg-red-100'
                                                        }`}>
                                                            <svg className={`w-6 h-6 ${evaluation.coachEvaluation?.isRelevant ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={evaluation.coachEvaluation?.isRelevant ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                                            </svg>
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-700">Relevant</p>
                                                        <p className={`text-sm font-semibold ${evaluation.coachEvaluation?.isRelevant ? 'text-green-600' : 'text-red-600'}`}>
                                                            {evaluation.coachEvaluation?.isRelevant ? 'Yes' : 'No'}
                                                        </p>
                                                    </div>
                                                    <div className="text-center p-4 bg-gray-50 rounded-lg md:col-span-2">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                                                            evaluation.coachEvaluation?.isTimeBound ? 'bg-green-100' : 'bg-red-100'
                                                        }`}>
                                                            <svg className={`w-6 h-6 ${evaluation.coachEvaluation?.isTimeBound ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={evaluation.coachEvaluation?.isTimeBound ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} />
                                                            </svg>
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-700">Time-Bound</p>
                                                        <p className={`text-sm font-semibold ${evaluation.coachEvaluation?.isTimeBound ? 'text-green-600' : 'text-red-600'}`}>
                                                            {evaluation.coachEvaluation?.isTimeBound ? 'Yes' : 'No'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Performance Metrics */}
                                            <div className="mb-6">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Assessment</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-700">Engagement</p>
                                                        <p className="text-lg font-semibold text-blue-600 capitalize">{evaluation.coachEvaluation?.performance?.engagement || 'Not rated'}</p>
                                                    </div>
                                                    <div className="p-4 bg-green-50 rounded-lg text-center">
                                                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-700">Effort</p>
                                                        <p className="text-lg font-semibold text-green-600 capitalize">{evaluation.coachEvaluation?.performance?.effort || 'Not rated'}</p>
                                                    </div>
                                                    <div className="p-4 bg-amber-50 rounded-lg text-center md:col-span-2">
                                                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-700">Execution</p>
                                                        <p className="text-lg font-semibold text-amber-600 capitalize">{evaluation.coachEvaluation?.performance?.execution || 'Not rated'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Additional Information */}
                                            {evaluation.coachEvaluation?.additionalInfo && (
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Notes</span>
                                                    <p className="text-gray-900 mt-2">{evaluation.coachEvaluation.additionalInfo}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="text-center py-8 bg-white/60 rounded-xl border border-blue-200">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <p className="text-gray-700 text-lg mb-2">No coach evaluation available for this session yet.</p>
                            <p className="text-gray-500">Your coach will provide feedback after reviewing your performance.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pre-Session Questions - When class completed */}
            {isClassCompleted() && classDetails.preSessionQuestions && Object.keys(classDetails.preSessionQuestions).length > 0 && (
                <div className="bg-orange-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Pre-Session Assessment</h3>
                    <p className="text-gray-700 mb-4">Your pre-session self-assessment:</p>
                    
                    <div className="p-4 bg-white rounded-lg border border-orange-200">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center">
                                <span className="font-medium text-gray-700">Emotional State</span>
                                <div className="mt-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        classDetails.preSessionQuestions.emotion >= 4 ? 'bg-green-100 text-green-800' :
                                        classDetails.preSessionQuestions.emotion >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {classDetails.preSessionQuestions.emotion || 'Not rated'}/5
                                    </span>
                                </div>
                            </div>
                            <div className="text-center">
                                <span className="font-medium text-gray-700">Energy Level</span>
                                <div className="mt-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        classDetails.preSessionQuestions.energy >= 4 ? 'bg-green-100 text-green-800' :
                                        classDetails.preSessionQuestions.energy >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {classDetails.preSessionQuestions.energy || 'Not rated'}/5
                                    </span>
                                </div>
                            </div>
                            <div className="text-center">
                                <span className="font-medium text-gray-700">Engagement</span>
                                <div className="mt-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        classDetails.preSessionQuestions.engagement >= 4 ? 'bg-green-100 text-green-800' :
                                        classDetails.preSessionQuestions.engagement >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {classDetails.preSessionQuestions.engagement || 'Not rated'}/5
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Debug info - remove this after testing */}
                        <div className="mt-4 pt-3 border-t border-orange-200 text-xs text-gray-500">
                            <p>Debug: preSessionQuestions data available</p>
                            <p>Emotion: {JSON.stringify(classDetails.preSessionQuestions.emotion)}</p>
                            <p>Energy: {JSON.stringify(classDetails.preSessionQuestions.energy)}</p>
                            <p>Engagement: {JSON.stringify(classDetails.preSessionQuestions.engagement)}</p>
                            <p>Full object: {JSON.stringify(classDetails.preSessionQuestions)}</p>
                        </div>
                    </div>
                </div>
            )}
            
           

            {/* Class Objectives and Results - When class completed */}
            {isClassCompleted() && classDetails.objectives && classDetails.objectives.length > 0 && (
                <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Session Objectives & Results</h3>
                    <p className="text-gray-700 mb-4">Here's what was planned and achieved in this session:</p>
                    
                    {classDetails.objectives.map((objective: any, index: number) => (
                        <div key={index} className="p-4 bg-white rounded-lg border border-green-200 mb-4">
                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                    <span className="font-medium text-gray-700">Objective:</span>
                                    <span className="ml-2 text-gray-900 capitalize">{objective.objective}</span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Sub-Objective:</span>
                                    <span className="ml-2 text-gray-900 capitalize">{objective.subObjective}</span>
                                </div>
                                {objective.nestedSubObjective && (
                                    <div>
                                        <span className="font-medium text-gray-700">Focus Area:</span>
                                        <span className="ml-2 text-gray-900 capitalize">{objective.nestedSubObjective}</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Additional Info */}
                            {objective.additionalInfo && (
                                <div className="mb-3">
                                    <span className="font-medium text-gray-700">Session Notes:</span>
                                    <p className="ml-2 text-gray-900 mt-1">{objective.additionalInfo}</p>
                                </div>
                            )}
                            
                            {/* Actual Results */}
                            {objective.actualResults && (
                                <div className="mt-3 pt-3 border-t border-green-200">
                                    <span className="font-medium text-gray-700">Actual Results:</span>
                                    
                                    {/* Placement Results */}
                                    {objective.actualResults.placementActual && (
                                        <div className="mt-2">
                                            <span className="text-sm font-medium text-gray-600">Placement Performance:</span>
                                            <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                                    Total: {objective.actualResults.placementActual.totalActual || 0}
                                    </span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Consistency Results */}
                                    {objective.actualResults.consistencyActual && (
                                        <div className="mt-2">
                                            <span className="text-sm font-medium text-gray-600">Consistency Performance:</span>
                                            <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    Total: {objective.actualResults.consistencyActual.totalActual || 0}
                                    </span>
                                </div>
                            </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Player Evaluation - When class completed */}
            {isClassCompleted() && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-200 shadow-lg">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">Your Self-Evaluation</h3>
                            <p className="text-indigo-700">Rate your own performance in this session</p>
                        </div>
                    </div>
                    
                    {/* Check if player has already submitted a self-evaluation */}
                    {classDetails.evaluations && classDetails.evaluations.length > 0 && classDetails.evaluations.find((evaluation: any) => 
                        evaluation.player === user?._id && evaluation.playerEvaluation
                    ) ? (
                        <div className="space-y-4">
                            <p className="text-gray-700 text-lg mb-6">Your self-evaluation for this session:</p>
                            {classDetails.evaluations.map((evaluation: any, index: number) => (
                                <div key={index} className="p-6 bg-white rounded-xl border-2 border-indigo-200 shadow-md">
                                    {evaluation.player === user?._id && evaluation.playerEvaluation && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                <div className="p-4 bg-indigo-50 rounded-lg text-center">
                                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-700">Engagement</p>
                                                    <p className="text-lg font-semibold text-indigo-600 capitalize">{evaluation.playerEvaluation.performance?.engagement}</p>
                                                </div>
                                                <div className="p-4 bg-purple-50 rounded-lg text-center">
                                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-700">Effort</p>
                                                    <p className="text-lg font-semibold text-purple-600 capitalize">{evaluation.playerEvaluation.performance?.effort}</p>
                                                </div>
                                                <div className="p-4 bg-pink-50 rounded-lg text-center md:col-span-2">
                                                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                        <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-700">Execution</p>
                                                    <p className="text-lg font-semibold text-pink-600 capitalize">{evaluation.playerEvaluation.performance?.execution}</p>
                                                </div>
                                            </div>
                                            
                                            {evaluation.playerEvaluation.additionalInfo && (
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Notes</span>
                                                    <p className="text-gray-900 mt-2">{evaluation.playerEvaluation.additionalInfo}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-gray-700 text-lg mb-6">Rate your own performance in this session:</p>
                    <button
                                onClick={onShowSelfEvaluationModal}
                                className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-lg"
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    <span>Rate My Performance</span>
                                </div>
                    </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

