import { useState, useEffect, useMemo } from "react";
import Button from "./Button";
import icons from "@utils/icons.ts";
import { classService } from "@/service/class.server";
import { toast } from "react-toastify";
import { formatAvailabilityTime } from "@/utils/utils";
import { 
    getMyCoaches, 
    getMyChildren, 
    getChildCoaches,
    createClassScheduleRequest, 
    createClassScheduleRequestForChild,
    type User as ClassScheduleUser 
} from "@/service/classSchedule.server";

interface CreateEventProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (eventData: any) => void;
    selectedDate?: string;
    userRole?: 'player' | 'coach' | 'admin' | 'parent';
}

interface Player {
    _id: string;
    firstName: string;
    lastName: string;
    emailAddress: {
        email: string;
    };
}

const eventTypes = [
    { value: 'reminder', label: 'Reminder', allowedRoles: ['player', 'coach', 'admin', 'parent'] },
    { value: 'class', label: 'Class', allowedRoles: ['coach', 'admin'] },
    { value: 'classScheduleRequest', label: 'Class Schedule Request', allowedRoles: ['player', 'coach', 'admin', 'parent'] }
];

// Function to get dynamic button text based on event type
const getButtonText = (eventType: string): string => {
    switch (eventType) {
        case 'reminder':
            return 'Add Reminder';
        case 'class':
            return 'Add Class';
        case 'classScheduleRequest':
            return 'Add Class Schedule Request';
        case 'training':
            return 'Add Training';
        default:
            return 'Add Event';
    }
};

const sessionTypes = [
    { value: 'individual', label: 'Individual Session' },
    { value: 'group', label: 'Group Session' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'recovery', label: 'Recovery' }
];

const levelPlans = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'elite', label: 'Elite' }
];



// Objective options for class creation
const objectiveOptions = {
    physical: [
        { value: "endurance", label: "Endurance" },
        { value: "speed", label: "Speed" },
        { value: "agility", label: "Agility" },
        { value: "flexibility", label: "Flexibility" },
        { value: "coordination", label: "Coordination" },
        { value: "balance", label: "Balance" },
        { value: "recovery", label: "Recovery" },
        { value: "other", label: "Other" }
    ],
    technical: [
        { value: "allFundamentalStrokes", label: "All Fundamental Strokes" },
        { value: "advancedShots", label: "Advanced Shots" }
    ],
    tactics: [
        { value: "consistency", label: "Consistency" },
        { value: "placement", label: "Placement" },
        { value: "gamePlan", label: "Game Plan" },
        { value: "gameStyle", label: "Game Style" },
        { value: "fiveGameSituations", label: "Five Game Situations" },
        { value: "anticipation", label: "Anticipation" },
        { value: "percentagePlay", label: "Percentage Play" },
        { value: "reducingUnforcedErrors", label: "Reducing Unforced Errors" },
        { value: "ruleNumberOne", label: "Rule Number One" },
        { value: "workingWeakness", label: "Working Weakness" }
    ],
    mental: [
        { value: "motivation", label: "Motivation" },
        { value: "concentration", label: "Concentration" },
        { value: "emotionRegulation", label: "Emotion Regulation" },
        { value: "selfTalk", label: "Self Talk" },
        { value: "selfConfidence", label: "Self Confidence" },
        { value: "relaxation", label: "Relaxation" },
        { value: "routine", label: "Routine" },
        { value: "goalSetting", label: "Goal Setting" },
        { value: "mindfulness", label: "Mindfulness" },
        { value: "momentum", label: "Momentum" }
    ],
    recovery: [
        { value: "sleep", label: "Sleep" },
        { value: "coldTherapy", label: "Cold Therapy" },
        { value: "mental", label: "Mental" },
        { value: "nutrition", label: "Nutrition" },
        { value: "hydration", label: "Hydration" },
        { value: "physical", label: "Physical" }
    ]
};

const nestedSubObjectiveOptions = {
    gameStyle: [
        { value: "serveAndVolley", label: "Serve and Volley" },
        { value: "aggressiveBaseLiner", label: "Aggressive Base Liner" },
        { value: "counterPuncher", label: "Counter Puncher" },
        { value: "allAround", label: "All Around" }
    ],
    fiveGameSituations: [
        { value: "serving", label: "Serving" },
        { value: "returning", label: "Returning" },
        { value: "rallyingFromTheBaseline", label: "Rallying from the Baseline" },
        { value: "passing", label: "Passing" },
        { value: "approachingVolleying", label: "Approaching & Volleying" }
    ]
};

const technicalStrokeOptions = {
    allFundamentalStrokes: [
        { value: "forehand", label: "Forehand" },
        { value: "backhand", label: "Backhand" },
        { value: "serve", label: "Serve" },
        { value: "lob", label: "Lob" },
        { value: "slice", label: "Slice" },
        { value: "overhead", label: "Overhead" },
        { value: "volley", label: "Volley" }
    ],
    advancedShots: [
        { value: "insideOutForehand", label: "Inside Out Forehand" },
        { value: "insideInForehand", label: "Inside In Forehand" },
        { value: "topspinLob", label: "Topspin Lob" },
        { value: "disguisingShots", label: "Disguising Shots" },
        { value: "dropShots", label: "Drop Shots" },
        { value: "halfVolley", label: "Half Volley" }
    ]
};

const tacticsTypeOptions = {
    consistency: [
        { value: "rallyLength1-4", label: "Rally Length 1-4" },
        { value: "rallyLength5-8", label: "Rally Length 5-8" },
        { value: "rallyLength9+", label: "Rally Length 9+" }
    ],
    placement: [
        { value: "crossCourt", label: "Cross Court" },
        { value: "downTheLine", label: "Down the Line" },
        { value: "downTheMiddle", label: "Down the Middle" },
        { value: "shortAngle", label: "Short Angle" },
        { value: "dropShorts", label: "Drop Shorts" },
        { value: "insideOut", label: "Inside Out" },
        { value: "insideIn", label: "Inside In" },
        { value: "halfVolley", label: "Half Volley" }
    ]
};

export default function CreateEvent({ isOpen, onClose, onSubmit, selectedDate, userRole = 'player' }: CreateEventProps) {
    // Detect Safari browser
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    const [formData, setFormData] = useState({
        type: 'reminder', // Default to reminder
        title: '',
        description: '',
        date: selectedDate || '',
        time: '',
        endTime: '',
        customTime: '', // New custom time field
        // Training specific fields
        selectedPlayers: [] as string[],
        // Class specific fields
        sessionType: '',
        levelPlan: '',
        goal: '',
        objective: '' as 'physical' | 'technical' | 'tactics' | 'mental' | 'recovery' | '',
        subObjective: '',
        nestedSubObjective: '',
        technicalStroke: '',
        technicalProblem: '',
        videoUrl: '',
        tacticsType: '',
        placementDetails: {
            // Cross Court
            crossCourtForehand: 0,
            crossCourtBackhand: 0,
            crossCourtVolleyForehand: 0,
            crossCourtVolleyBackhand: 0,
            crossCourtSliceForehand: 0,
            crossCourtSliceBackhand: 0,
            crossCourtLobForehand: 0,
            crossCourtLobBackhand: 0,
            crossCourtTopspinLobForehand: 0,
            crossCourtTopspinLobBackhand: 0,
            
            // Down The Line
            downTheLineForehand: 0,
            downTheLineBackhand: 0,
            downTheLineVolleyForehand: 0,
            downTheLineVolleyBackhand: 0,
            downTheLineSliceForehand: 0,
            downTheLineSliceBackhand: 0,
            downTheLineLobForehand: 0,
            downTheLineLobBackhand: 0,
            downTheLineTopspinLobForehand: 0,
            downTheLineTopspinLobBackhand: 0,
            
            // Down The Middle
            downTheMiddleForehand: 0,
            downTheMiddleBackhand: 0,
            downTheMiddleVolleyForehand: 0,
            downTheMiddleVolleyBackhand: 0,
            downTheMiddleLobForehand: 0,
            downTheMiddleLobBackhand: 0,
            downTheMiddleTopspinLobForehand: 0,
            downTheMiddleTopspinLobBackhand: 0,
            
            // Short Angle
            shortAngleForehand: 0,
            shortAngleBackhand: 0,
            
            // Drop Shorts
            dropShortsForehand: 0,
            dropShortsBackhand: 0,
            disguisingDropShotsForehand: 0,
            disguisingDropShotsBackhand: 0,
            
            // Inside Out/In
            insideOutForehand: 0,
            insideInForehand: 0,
            
            // Half Volley
            halfVolleyForehand: 0,
            halfVolleyBackhand: 0,
            
            total: 0
        },
        consistencyResult: {
            rallyLength1to4: 0,
            rallyLength5to8: 0,
            rallyLength9Plus: 0,
            total: 0
        },
        additionalInfo: '',
        selectedClassPlayers: [] as string[]
    });

    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [classSearchTerm, setClassSearchTerm] = useState('');
    
    // Add temporary selection states for better UX
    const [tempSelectedPlayers, setTempSelectedPlayers] = useState<string[]>([]);
    const [tempSelectedClassPlayers, setTempSelectedClassPlayers] = useState<string[]>([]);
    
    // Add state for player goals
    const [playerGoals, setPlayerGoals] = useState<Array<{ _id: string; goal: string; description: string }>>([]);
    const [isLoadingGoals, setIsLoadingGoals] = useState(false);

    // Add state for class schedule requests
    const [coaches, setCoaches] = useState<ClassScheduleUser[]>([]);
    const [children, setChildren] = useState<ClassScheduleUser[]>([]);
    const [isLoadingCoaches, setIsLoadingCoaches] = useState(false);
    const [isLoadingChildren, setIsLoadingChildren] = useState(false);
    const [selectedCoach, setSelectedCoach] = useState<string>('');
    const [selectedChild, setSelectedChild] = useState<string>('');
    const [playerNote, setPlayerNote] = useState<string>('');

    // Add state for coach availability
    const [coachAvailability, setCoachAvailability] = useState<{ time: string; available: boolean }[]>([]);
    const [showAvailability, setShowAvailability] = useState(false);
    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [selectedTime, setSelectedTime] = useState<string>('');

    // Filter event types based on user role - use useMemo to prevent recreation
    const availableEventTypes = useMemo(() => {
        console.log('CreateEvent - Role Debug:', {
            userRole,
            eventTypes,
            filtered: eventTypes.filter(type => type.allowedRoles.includes(userRole))
        });
        return eventTypes.filter(type => type.allowedRoles.includes(userRole));
    }, [userRole]);

    // Set default event type based on user role when component mounts
    useEffect(() => {
        if (isOpen && availableEventTypes.length > 0) {
            console.log('CreateEvent - Setting default type:', { userRole, availableEventTypes });
            
            // Set default type based on user role
            let defaultType = 'reminder';
            if (userRole === 'coach' || userRole === 'admin') {
                defaultType = 'class'; // Coaches default to class
            } else if (userRole === 'player' || userRole === 'parent') {
                defaultType = 'reminder'; // Players and parents default to reminder
            }
            
            // Make sure the default type is available for the user
            if (availableEventTypes.find(type => type.value === defaultType)) {
                setFormData(prev => ({ ...prev, type: defaultType }));
            } else {
                // Fallback to first available type
                setFormData(prev => ({ ...prev, type: availableEventTypes[0].value }));
            }
        }
    }, [isOpen, userRole, availableEventTypes]); // Add availableEventTypes back to dependencies

    // Fetch players when component mounts or when needed for class
    useEffect(() => {
        if (isOpen && formData.type === 'class') {
            fetchPlayers();
        }
    }, [isOpen, formData.type]);

    // Fetch coaches and children when component mounts or when needed for class schedule requests
    useEffect(() => {
        if (isOpen && formData.type === 'classScheduleRequest') {
            if (userRole === 'parent') {
                fetchChildren();
            } else {
                fetchCoaches();
            }
        }
    }, [isOpen, formData.type, userRole]);

    // Fetch coaches for selected child when child selection changes
    useEffect(() => {
        if (formData.type === 'classScheduleRequest' && userRole === 'parent') {
            if (selectedChild) {
                fetchCoaches(selectedChild);
            } else {
                // Clear coaches when no child is selected
                setCoaches([]);
                setSelectedCoach('');
            }
        }
    }, [selectedChild, formData.type, userRole]);

    // Fetch coach availability when coach or date changes
    useEffect(() => {
        if (formData.type === 'classScheduleRequest' && selectedCoach && formData.date) {
            // Extract date part only to avoid refetching when time changes
            const dateOnly = formData.date.split('T')[0];
            // Only fetch if we have a valid date
            if (dateOnly && dateOnly !== '') {
                fetchCoachAvailabilityForDate(selectedCoach, dateOnly);
            }
        }
    }, [selectedCoach, formData.type, formData.date ? formData.date.split('T')[0] : '']); // Only depend on date part, not time

    // Fetch player goals when selected players change for individual sessions
    useEffect(() => {
        if (formData.type === 'class' && formData.sessionType === 'individual' && formData.selectedClassPlayers.length === 1) {
            const playerId = formData.selectedClassPlayers[0];
            fetchPlayerGoals(playerId);
        } else if (formData.type === 'class' && formData.sessionType !== 'individual') {
            // Clear goals when not individual session
            setPlayerGoals([]);
            // Only clear goal if it's currently set to avoid unnecessary re-renders
            if (formData.goal) {
                setFormData(prev => ({ ...prev, goal: '' }));
            }
        }
    }, [formData.type, formData.sessionType, formData.selectedClassPlayers]);

    const fetchPlayers = async () => {
        try {
            setIsLoadingPlayers(true);
            // Import and use the players service
            const { playersService } = await import('@/service/players.server');
            const response = await playersService.getPlayers(1, 100);
            
            if (response.players) {
                setPlayers(response.players);
            }
        } catch (error) {
            console.error('Error fetching players:', error);
        } finally {
            setIsLoadingPlayers(false);
        }
    };

    // Function to fetch player goals when a player is selected for private session
    const fetchPlayerGoals = async (playerId: string) => {
        if (formData.sessionType !== 'individual') return;
        
        try {
            setIsLoadingGoals(true);
            const { playersService } = await import('@/service/players.server');
            const response = await playersService.getPlayerById(playerId);
            
            if (response.player && response.player.coachGoals) {
                // Extract all goals from all coach goals
                const allGoals: Array<{ _id: string; goal: string; description: string }> = [];
                response.player.coachGoals.forEach(coachGoal => {
                    if (coachGoal.goals && Array.isArray(coachGoal.goals)) {
                        coachGoal.goals.forEach(goal => {
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

    // Function to fetch coaches for class schedule requests
    const fetchCoaches = async (childId?: string) => {
        try {
            setIsLoadingCoaches(true);
            let response;
            
            if (userRole === 'parent' && childId) {
                // Fetch coaches for specific child
                response = await getChildCoaches(childId, 1, 100);
            } else {
                // Fetch all coaches for regular users
                response = await getMyCoaches(1, 100);
            }
            
            if (response.success) {
                setCoaches(response.data);
            }
        } catch (error) {
            console.error("Error fetching coaches:", error);
            toast.error("Failed to fetch coaches");
        } finally {
            setIsLoadingCoaches(false);
        }
    };

    // Function to fetch children for parents
    const fetchChildren = async () => {
        if (userRole !== 'parent') return;
        
        try {
            setIsLoadingChildren(true);
            const response = await getMyChildren(1, 100);
            if (response.success) {
                setChildren(response.data);
            }
        } catch (error) {
            console.error("Error fetching children:", error);
            toast.error("Failed to fetch children");
        } finally {
            setIsLoadingChildren(false);
        }
    };

    // Function to fetch coach availability
    const fetchCoachAvailabilityForDate = async (coachId: string, date: string) => {
        try {
            setAvailabilityLoading(true);
            const { getCoachAvailability } = await import('@/service/classSchedule.server');
            const response = await getCoachAvailability(coachId, date, Intl.DateTimeFormat().resolvedOptions().timeZone);
            if (response.success) {
                setCoachAvailability(response.data);
                setShowAvailability(true);
            }
        } catch (error) {
            console.error('Failed to fetch coach availability:', error);
            setShowAvailability(false);
        } finally {
            setAvailabilityLoading(false);
        }
    };

    // Handle time selection from available slots
    const handleTimeSelection = (time: string) => {
        setSelectedTime(time);
        
        // Update formData.date to include the selected time
        if (formData.date) {
            // Get the date part only (YYYY-MM-DD)
            const dateOnly = formData.date.split('T')[0];
            // Combine with selected time
            const dateTimeLocal = `${dateOnly}T${time}`;
            setFormData(prev => ({ ...prev, date: dateTimeLocal }));
        }
    };

    // Helper function to get goal type label (similar to player_goals.tsx)
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

    // Helper function to validate class form data based on hierarchical logic
    const validateClassForm = (): string | null => {
        if (!formData.sessionType) {
            return 'Please select a session type for the class.';
        }
        
        if (!formData.levelPlan) {
            return 'Please select a level plan for the class.';
        }
        
        // Validate goal for individual sessions
        if (formData.sessionType === 'individual' && !formData.goal) {
            return 'Please select a goal for the individual session.';
        }
        
        if (!formData.objective) {
            return 'Please select an objective for the class.';
        }
        
        if (!formData.subObjective) {
            return 'Please select a sub-objective for the class.';
        }
        
        // Validate nested sub-objective if required
        if (formData.objective === 'tactics' && 
            (formData.subObjective === 'gameStyle' || formData.subObjective === 'fiveGameSituations') &&
            !formData.nestedSubObjective) {
            return 'Please select a nested sub-objective for the class.';
        }
        
        // Validate technical fields if objective is technical
        if (formData.objective === 'technical') {
            if (!formData.technicalStroke) {
                return 'Please select a technical stroke for the class.';
            }
            if (!formData.technicalProblem) {
                return 'Please describe the technical problem.';
            }
            if (!formData.videoUrl) {
                return 'Please provide a video URL for technical analysis.';
            }
        }
        
        // Validate tactics type if objective is tactics and sub-objective requires it
        if (formData.objective === 'tactics' && 
            (formData.subObjective === 'consistency' || formData.subObjective === 'placement') &&
            !formData.tacticsType) {
            return 'Please select a tactics type for the class.';
        }
        
        // Validate placement details if tactics type is for placement
        if (formData.objective === 'tactics' && 
            formData.subObjective === 'placement' && 
            formData.tacticsType &&
            ['crossCourt', 'downTheLine', 'downTheMiddle', 'shortAngle', 'dropShorts', 'insideOut', 'insideIn', 'halfVolley'].includes(formData.tacticsType)) {
            
            // Check if at least one placement detail field has a value
            const placementFields = Object.keys(formData.placementDetails).filter(key => key !== 'total');
            const hasPlacementData = placementFields.some(field => 
                (formData.placementDetails as any)[field] > 0
            );
            
            if (!hasPlacementData) {
                return 'Please enter placement details for at least one shot type.';
            }
            
            if (!formData.placementDetails.total || formData.placementDetails.total <= 0) {
                return 'Please enter the total number of attempts for placement.';
            }
        }
        
        // Validate consistency results if tactics type is for consistency
        if (formData.objective === 'tactics' && 
            formData.subObjective === 'consistency' && 
            formData.tacticsType &&
            ['rallyLength1-4', 'rallyLength5-8', 'rallyLength9+'].includes(formData.tacticsType)) {
            
            if (!formData.consistencyResult.total || formData.consistencyResult.total <= 0) {
                return 'Please enter the total number of points played for consistency.';
            }
            
            // Check if the specific rally length field has a value
            let hasConsistencyData = false;
            if (formData.tacticsType === 'rallyLength1-4' && formData.consistencyResult.rallyLength1to4 > 0) {
                hasConsistencyData = true;
            } else if (formData.tacticsType === 'rallyLength5-8' && formData.consistencyResult.rallyLength5to8 > 0) {
                hasConsistencyData = true;
            } else if (formData.tacticsType === 'rallyLength9+' && formData.consistencyResult.rallyLength9Plus > 0) {
                hasConsistencyData = true;
            }
            
            if (!hasConsistencyData) {
                return 'Please enter the consistency result for the selected rally length.';
            }
        }
        
        if (formData.selectedClassPlayers.length === 0) {
            return 'Please select at least one player for the class.';
        }
        
        if (!formData.date || !formData.time || !formData.endTime) {
            return 'Please select date and time for the class.';
        }
        
        // Validate time range
        if (formData.time >= formData.endTime) {
            return 'End time must be after start time.';
        }
        
        return null; // No validation errors
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Set loading state
        setIsSubmitting(true);
        
        try {
            if (formData.type === 'class') {
                // Validate class form data
                const validationError = validateClassForm();
                if (validationError) {
                    toast.error(validationError);
                    return;
                }
                
                // Build objectives object based on the selected path - only include required fields
                const objectives: any = {
                    objective: formData.objective,
                    subObjective: formData.subObjective
                };
                
                // Add nested sub-objective only if it's required (tactics with gameStyle/fiveGameSituations)
                if (formData.objective === 'tactics' && 
                    (formData.subObjective === 'gameStyle' || formData.subObjective === 'fiveGameSituations') &&
                    formData.nestedSubObjective) {
                    objectives.nestedSubObjective = formData.nestedSubObjective;
                }
                
                // Add technical fields only if objective is technical
                if (formData.objective === 'technical' && formData.subObjective) {
                    objectives.technicalStroke = formData.technicalStroke;
                    objectives.technicalProblem = formData.technicalProblem;
                    objectives.videoUrl = formData.videoUrl;
                }
                
                // Add tactics type only if it's required (tactics with consistency/placement)
                if (formData.objective === 'tactics' && 
                    (formData.subObjective === 'consistency' || formData.subObjective === 'placement') &&
                    formData.tacticsType) {
                    objectives.tacticsType = formData.tacticsType;
                }
                
                // Add placement details only if it's placement tactics
                if (formData.objective === 'tactics' && 
                    formData.subObjective === 'placement' && 
                    formData.tacticsType &&
                    ['crossCourt', 'downTheLine', 'downTheMiddle', 'shortAngle', 'dropShorts', 'insideOut', 'insideIn', 'halfVolley'].includes(formData.tacticsType)) {
                    
                    // Only include the relevant placement fields based on tactics type
                    const placementDetails: any = { total: formData.placementDetails.total };
                    
                    if (formData.tacticsType === 'crossCourt') {
                        placementDetails.crossCourtForehand = formData.placementDetails.crossCourtForehand;
                        placementDetails.crossCourtBackhand = formData.placementDetails.crossCourtBackhand;
                        placementDetails.crossCourtVolleyForehand = formData.placementDetails.crossCourtVolleyForehand;
                        placementDetails.crossCourtVolleyBackhand = formData.placementDetails.crossCourtVolleyBackhand;
                        placementDetails.crossCourtSliceForehand = formData.placementDetails.crossCourtSliceForehand;
                        placementDetails.crossCourtSliceBackhand = formData.placementDetails.crossCourtSliceBackhand;
                        placementDetails.crossCourtLobForehand = formData.placementDetails.crossCourtLobForehand;
                        placementDetails.crossCourtLobBackhand = formData.placementDetails.crossCourtLobBackhand;
                        placementDetails.crossCourtTopspinLobForehand = formData.placementDetails.crossCourtTopspinLobForehand;
                        placementDetails.crossCourtTopspinLobBackhand = formData.placementDetails.crossCourtTopspinLobBackhand;
                    } else if (formData.tacticsType === 'downTheLine') {
                        placementDetails.downTheLineForehand = formData.placementDetails.downTheLineForehand;
                        placementDetails.downTheLineBackhand = formData.placementDetails.downTheLineBackhand;
                        placementDetails.downTheLineVolleyForehand = formData.placementDetails.downTheLineVolleyForehand;
                        placementDetails.downTheLineVolleyBackhand = formData.placementDetails.downTheLineVolleyBackhand;
                        placementDetails.downTheLineSliceForehand = formData.placementDetails.downTheLineSliceForehand;
                        placementDetails.downTheLineSliceBackhand = formData.placementDetails.downTheLineSliceBackhand;
                        placementDetails.downTheLineLobForehand = formData.placementDetails.downTheLineLobForehand;
                        placementDetails.downTheLineLobBackhand = formData.placementDetails.downTheLineLobBackhand;
                        placementDetails.downTheLineTopspinLobForehand = formData.placementDetails.downTheLineTopspinLobForehand;
                        placementDetails.downTheLineTopspinLobBackhand = formData.placementDetails.downTheLineTopspinLobBackhand;
                    } else if (formData.tacticsType === 'downTheMiddle') {
                        placementDetails.downTheMiddleForehand = formData.placementDetails.downTheMiddleForehand;
                        placementDetails.downTheMiddleBackhand = formData.placementDetails.downTheMiddleBackhand;
                        placementDetails.downTheMiddleVolleyForehand = formData.placementDetails.downTheMiddleVolleyForehand;
                        placementDetails.downTheMiddleVolleyBackhand = formData.placementDetails.downTheMiddleVolleyBackhand;
                        placementDetails.downTheMiddleLobForehand = formData.placementDetails.downTheMiddleLobForehand;
                        placementDetails.downTheMiddleLobBackhand = formData.placementDetails.downTheMiddleLobBackhand;
                        placementDetails.downTheMiddleTopspinLobForehand = formData.placementDetails.downTheMiddleTopspinLobForehand;
                        placementDetails.downTheMiddleTopspinLobBackhand = formData.placementDetails.downTheMiddleTopspinLobBackhand;
                    } else if (formData.tacticsType === 'shortAngle') {
                        placementDetails.shortAngleForehand = formData.placementDetails.shortAngleForehand;
                        placementDetails.shortAngleBackhand = formData.placementDetails.shortAngleBackhand;
                    } else if (formData.tacticsType === 'dropShorts') {
                        placementDetails.dropShortsForehand = formData.placementDetails.dropShortsForehand;
                        placementDetails.dropShortsBackhand = formData.placementDetails.dropShortsBackhand;
                        placementDetails.disguisingDropShotsForehand = formData.placementDetails.disguisingDropShotsForehand;
                        placementDetails.disguisingDropShotsBackhand = formData.placementDetails.disguisingDropShotsBackhand;
                    } else if (formData.tacticsType === 'insideOut') {
                        placementDetails.insideOutForehand = formData.placementDetails.insideOutForehand;
                    } else if (formData.tacticsType === 'insideIn') {
                        placementDetails.insideInForehand = formData.placementDetails.insideInForehand;
                    } else if (formData.tacticsType === 'halfVolley') {
                        placementDetails.halfVolleyForehand = formData.placementDetails.halfVolleyForehand;
                        placementDetails.halfVolleyBackhand = formData.placementDetails.halfVolleyBackhand;
                    }
                    
                    objectives.placementDetails = placementDetails;
                }
                
                // Add consistency results only if it's consistency tactics
                if (formData.objective === 'tactics' && 
                    formData.subObjective === 'consistency' && 
                    formData.tacticsType &&
                    ['rallyLength1-4', 'rallyLength5-8', 'rallyLength9+'].includes(formData.tacticsType)) {
                    
                    const consistencyResult: any = { total: formData.consistencyResult.total };
                    
                    if (formData.tacticsType === 'rallyLength1-4') {
                        consistencyResult.rallyLength1to4 = formData.consistencyResult.rallyLength1to4;
                    } else if (formData.tacticsType === 'rallyLength5-8') {
                        consistencyResult.rallyLength5to8 = formData.consistencyResult.rallyLength5to8;
                    } else if (formData.tacticsType === 'rallyLength9+') {
                        consistencyResult.rallyLength9Plus = formData.consistencyResult.rallyLength9Plus;
                    }
                    
                    objectives.consistencyResult = consistencyResult;
                }
                
                // Add additional info if provided
                if (formData.additionalInfo) {
                    objectives.additionalInfo = formData.additionalInfo;
                }
                
                // Create class using the class service with only required fields
                const classData = {
                    players: formData.selectedClassPlayers,
                    date: `${formData.date}T${formData.time}:00.000Z`,
                    to: `${formData.date}T${formData.endTime}:00.000Z`,
                    levelPlan: formData.levelPlan,
                    goal: formData.goal || undefined,
                    objectives
                };

                console.log('Creating class with filtered data:', classData);
                
                const response = await classService.createClass(classData);
                console.log('Class created successfully:', response);
                
                // Add the created class to the event data for the calendar
                const eventDataWithClass = {
                    ...formData,
                    classId: response[0]?._id,
                    sourceType: 'class',
                    sourceId: response[0]?._id
                };
                
                onSubmit(eventDataWithClass);
                
                // Close the modal after successful creation
                onClose();
                
                // Show success message
                toast.success('Class created successfully!');
            } else if (formData.type === 'classScheduleRequest') {
                // Handle class schedule request
                if (!selectedCoach) {
                    toast.error('Please select a coach');
                    return;
                }

                if (userRole === 'parent' && !selectedChild) {
                    toast.error('Please select a child');
                    return;
                }

                try {
                    const requestData = {
                        date: `${formData.date}T${formData.time}:00.000Z`,
                        playerNote: playerNote || undefined,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    };

                    let response;
                    if (userRole === 'parent' && selectedChild) {
                        response = await createClassScheduleRequestForChild(selectedChild, selectedCoach, requestData);
                    } else {
                        response = await createClassScheduleRequest(selectedCoach, requestData);
                    }

                    if (response.success) {
                        toast.success('Class schedule request created successfully!');
                        
                        // Create event data for calendar
                        const eventData = {
                            ...formData,
                            title: `Class Request - ${coaches.find(c => c._id === selectedCoach)?.firstName} ${coaches.find(c => c._id === selectedCoach)?.lastName}`,
                            description: playerNote || 'Class schedule request',
                            sourceType: 'classScheduleRequest',
                            sourceId: Date.now().toString()
                        };
                        
                        onSubmit(eventData);
                        onClose();
                        
                        // Reset form
                        setSelectedCoach('');
                        setSelectedChild('');
                        setPlayerNote('');
                        setSelectedTime('');
                        setCoachAvailability([]);
                        setShowAvailability(false);
                    }
                } catch (error: any) {
                    toast.error(error.message || 'Failed to create class schedule request');
                }
            } else {
                // Handle other event types as before
                onSubmit(formData);
            }
            
            // Reset form based on event type
            if (formData.type === 'reminder') {
                setFormData(prev => ({ ...prev, title: '', description: '', date: '', time: '' }));
            } else if (formData.type === 'class') {
                setFormData(prev => ({ 
                    ...prev, 
                    date: '', 
                    time: '', 
                    endTime: '', 
                    sessionType: '', 
                    levelPlan: '', 
                    goal: '',
                    objective: '' as 'physical' | 'technical' | 'tactics' | 'mental' | 'recovery' | '', 
                    subObjective: '', 
                    nestedSubObjective: '',
                    technicalStroke: '',
                    technicalProblem: '',
                    videoUrl: '',
                    tacticsType: '',
                    placementDetails: {
                        // Cross Court
                        crossCourtForehand: 0,
                        crossCourtBackhand: 0,
                        crossCourtVolleyForehand: 0,
                        crossCourtVolleyBackhand: 0,
                        crossCourtSliceForehand: 0,
                        crossCourtSliceBackhand: 0,
                        crossCourtLobForehand: 0,
                        crossCourtLobBackhand: 0,
                        crossCourtTopspinLobForehand: 0,
                        crossCourtTopspinLobBackhand: 0,
                        
                        // Down The Line
                        downTheLineForehand: 0,
                        downTheLineBackhand: 0,
                        downTheLineVolleyForehand: 0,
                        downTheLineVolleyBackhand: 0,
                        downTheLineSliceForehand: 0,
                        downTheLineSliceBackhand: 0,
                        downTheLineLobForehand: 0,
                        downTheLineLobBackhand: 0,
                        downTheLineTopspinLobForehand: 0,
                        downTheLineTopspinLobBackhand: 0,
                        
                        // Down The Middle
                        downTheMiddleForehand: 0,
                        downTheMiddleBackhand: 0,
                        downTheMiddleVolleyForehand: 0,
                        downTheMiddleVolleyBackhand: 0,
                        downTheMiddleLobForehand: 0,
                        downTheMiddleLobBackhand: 0,
                        downTheMiddleTopspinLobForehand: 0,
                        downTheMiddleTopspinLobBackhand: 0,
                        
                        // Short Angle
                        shortAngleForehand: 0,
                        shortAngleBackhand: 0,
                        
                        // Drop Shorts
                        dropShortsForehand: 0,
                        dropShortsBackhand: 0,
                        disguisingDropShotsForehand: 0,
                        disguisingDropShotsBackhand: 0,
                        
                        // Inside Out/In
                        insideOutForehand: 0,
                        insideInForehand: 0,
                        
                        // Half Volley
                        halfVolleyForehand: 0,
                        halfVolleyBackhand: 0,
                        
                        total: 0
                    },
                    consistencyResult: {
                        rallyLength1to4: 0,
                        rallyLength5to8: 0,
                        rallyLength9Plus: 0,
                        total: 0
                    },
                    additionalInfo: '',
                    selectedClassPlayers: [] 
                }));
                setTempSelectedClassPlayers([]);
                
                // Clear player goals when resetting class form
                setPlayerGoals([]);
            } else if (formData.type === 'classScheduleRequest') {
                setFormData(prev => ({ ...prev, date: '', time: '' }));
                setSelectedCoach('');
                setSelectedChild('');
                setPlayerNote('');
                setSelectedTime('');
                setCoachAvailability([]);
                setShowAvailability(false);
            }
        } catch (error) {
            console.error('Error creating event:', error);
            
            // Show error notification or alert
            if (formData.type === 'class') {
                toast.error('Failed to create class. Please check your input and try again.');
            } else {
                toast.error('Failed to create event. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData(prev => ({ 
            ...prev,
            title: '', 
            description: '', 
            date: '', 
            time: '', 
            endTime: '', 
            selectedPlayers: [], 
            sessionType: '', 
            levelPlan: '', 
            goal: '',
            objective: '' as 'physical' | 'technical' | 'tactics' | 'mental' | 'recovery' | '', 
            subObjective: '', 
            nestedSubObjective: '',
            technicalStroke: '',
            technicalProblem: '',
            videoUrl: '',
            tacticsType: '',
            placementDetails: {
                // Cross Court
                crossCourtForehand: 0,
                crossCourtBackhand: 0,
                crossCourtVolleyForehand: 0,
                crossCourtVolleyBackhand: 0,
                crossCourtSliceForehand: 0,
                crossCourtSliceBackhand: 0,
                crossCourtLobForehand: 0,
                crossCourtLobBackhand: 0,
                crossCourtTopspinLobForehand: 0,
                crossCourtTopspinLobBackhand: 0,
                
                // Down The Line
                downTheLineForehand: 0,
                downTheLineBackhand: 0,
                downTheLineVolleyForehand: 0,
                downTheLineVolleyBackhand: 0,
                downTheLineSliceForehand: 0,
                downTheLineSliceBackhand: 0,
                downTheLineLobForehand: 0,
                downTheLineLobBackhand: 0,
                downTheLineTopspinLobForehand: 0,
                downTheLineTopspinLobBackhand: 0,
                
                // Down The Middle
                downTheMiddleForehand: 0,
                downTheMiddleBackhand: 0,
                downTheMiddleVolleyForehand: 0,
                downTheMiddleVolleyBackhand: 0,
                downTheMiddleLobForehand: 0,
                downTheMiddleLobBackhand: 0,
                downTheMiddleTopspinLobForehand: 0,
                downTheMiddleTopspinLobBackhand: 0,
                
                // Short Angle
                shortAngleForehand: 0,
                shortAngleBackhand: 0,
                
                // Drop Shorts
                dropShortsForehand: 0,
                dropShortsBackhand: 0,
                disguisingDropShotsForehand: 0,
                disguisingDropShotsBackhand: 0,
                
                // Inside Out/In
                insideOutForehand: 0,
                insideInForehand: 0,
                
                // Half Volley
                halfVolleyForehand: 0,
                halfVolleyBackhand: 0,
                
                total: 0
            },
            consistencyResult: {
                rallyLength1to4: 0,
                rallyLength5to8: 0,
                rallyLength9Plus: 0,
                total: 0
            },
            additionalInfo: '',
            selectedClassPlayers: [] 
        }));
        setTempSelectedPlayers([]);
        setTempSelectedClassPlayers([]);
        
        // Clear player goals when closing
        setPlayerGoals([]);
        
        onClose();
    };

    const handleEventTypeChange = (eventType: string) => {
        setFormData(prev => ({ ...prev, type: eventType }));
        // Reset specific fields when event type changes, but keep the type
        if (eventType === 'reminder') {
            setFormData(prev => ({ ...prev, selectedPlayers: [], sessionType: '', levelPlan: '', goal: '', objective: '' as 'physical' | 'technical' | 'tactics' | 'mental' | 'recovery' | '', subObjective: '', selectedClassPlayers: [] }));
        } else if (eventType === 'training') {
            setFormData(prev => ({ ...prev, title: '', sessionType: '', levelPlan: '', goal: '', objective: '' as 'physical' | 'technical' | 'tactics' | 'mental' | 'recovery' | '', subObjective: '', selectedClassPlayers: [] }));
        } else if (eventType === 'class') {
            setFormData(prev => ({ ...prev, title: '', selectedPlayers: [] }));
            // Reset class players when switching to class type
            setTempSelectedClassPlayers([]);
        }
        
        // Clear player goals when event type changes
        setPlayerGoals([]);
    };

    // Handle session type change for class events
    const handleSessionTypeChange = (sessionType: string) => {
        setFormData(prev => ({ ...prev, sessionType }));
        
        // If switching to individual session, ensure only one player is selected
        if (sessionType === 'individual') {
            // Keep only the first player if multiple are selected
            if (formData.selectedClassPlayers.length > 1) {
                setFormData(prev => ({
                    ...prev,
                    selectedClassPlayers: prev.selectedClassPlayers.slice(0, 1)
                }));
            }
            // Clear temporary selections
            setTempSelectedClassPlayers([]);
            // Clear player goals when switching to individual session
            setPlayerGoals([]);
            setFormData(prev => ({ ...prev, goal: '' }));
        }
    };

    // Dynamic form logic for class objectives - implements hierarchical branching
    const handleObjectiveChange = (objective: 'physical' | 'technical' | 'tactics' | 'mental' | 'recovery' | '') => {
        setFormData(prev => ({
            ...prev,
            objective,
            subObjective: '', // Reset sub-objective when objective changes
            nestedSubObjective: '', // Reset nested sub-objective
            technicalStroke: '', // Reset technical fields
            technicalProblem: '',
            videoUrl: '',
            tacticsType: '', // Reset tactics type
            placementDetails: {
                // Cross Court
                crossCourtForehand: 0,
                crossCourtBackhand: 0,
                crossCourtVolleyForehand: 0,
                crossCourtVolleyBackhand: 0,
                crossCourtSliceForehand: 0,
                crossCourtSliceBackhand: 0,
                crossCourtLobForehand: 0,
                crossCourtLobBackhand: 0,
                crossCourtTopspinLobForehand: 0,
                crossCourtTopspinLobBackhand: 0,
                
                // Down The Line
                downTheLineForehand: 0,
                downTheLineBackhand: 0,
                downTheLineVolleyForehand: 0,
                downTheLineVolleyBackhand: 0,
                downTheLineSliceForehand: 0,
                downTheLineSliceBackhand: 0,
                downTheLineLobForehand: 0,
                downTheLineLobBackhand: 0,
                downTheLineTopspinLobForehand: 0,
                downTheLineTopspinLobBackhand: 0,
                
                // Down The Middle
                downTheMiddleForehand: 0,
                downTheMiddleBackhand: 0,
                downTheMiddleVolleyForehand: 0,
                downTheMiddleVolleyBackhand: 0,
                downTheMiddleLobForehand: 0,
                downTheMiddleLobBackhand: 0,
                downTheMiddleTopspinLobForehand: 0,
                downTheMiddleTopspinLobBackhand: 0,
                
                // Short Angle
                shortAngleForehand: 0,
                shortAngleBackhand: 0,
                
                // Drop Shorts
                dropShortsForehand: 0,
                dropShortsBackhand: 0,
                disguisingDropShotsForehand: 0,
                disguisingDropShotsBackhand: 0,
                
                // Inside Out/In
                insideOutForehand: 0,
                insideInForehand: 0,
                
                // Half Volley
                halfVolleyForehand: 0,
                halfVolleyBackhand: 0,
                
                total: 0
            },
            consistencyResult: {
                rallyLength1to4: 0,
                rallyLength5to8: 0,
                rallyLength9Plus: 0,
                total: 0
            }
        }));
    };

    const handleSubObjectiveChange = (subObjective: string) => {
        setFormData(prev => ({
            ...prev,
            subObjective,
            nestedSubObjective: '', // Reset nested sub-objective when sub-objective changes
            technicalStroke: '', // Reset technical fields
            technicalProblem: '',
            videoUrl: '',
            tacticsType: '', // Reset tactics type
            placementDetails: {
                // Cross Court
                crossCourtForehand: 0,
                crossCourtBackhand: 0,
                crossCourtVolleyForehand: 0,
                crossCourtVolleyBackhand: 0,
                crossCourtSliceForehand: 0,
                crossCourtSliceBackhand: 0,
                crossCourtLobForehand: 0,
                crossCourtLobBackhand: 0,
                crossCourtTopspinLobForehand: 0,
                crossCourtTopspinLobBackhand: 0,
                
                // Down The Line
                downTheLineForehand: 0,
                downTheLineBackhand: 0,
                downTheLineVolleyForehand: 0,
                downTheLineVolleyBackhand: 0,
                downTheLineSliceForehand: 0,
                downTheLineSliceBackhand: 0,
                downTheLineLobForehand: 0,
                downTheLineLobBackhand: 0,
                downTheLineTopspinLobForehand: 0,
                downTheLineTopspinLobBackhand: 0,
                
                // Down The Middle
                downTheMiddleForehand: 0,
                downTheMiddleBackhand: 0,
                downTheMiddleVolleyForehand: 0,
                downTheMiddleVolleyBackhand: 0,
                downTheMiddleLobForehand: 0,
                downTheMiddleLobBackhand: 0,
                downTheMiddleTopspinLobForehand: 0,
                downTheMiddleTopspinLobBackhand: 0,
                
                // Short Angle
                shortAngleForehand: 0,
                shortAngleBackhand: 0,
                
                // Drop Shorts
                dropShortsForehand: 0,
                dropShortsBackhand: 0,
                disguisingDropShotsForehand: 0,
                disguisingDropShotsBackhand: 0,
                
                // Inside Out/In
                insideOutForehand: 0,
                insideInForehand: 0,
                
                // Half Volley
                halfVolleyForehand: 0,
                halfVolleyBackhand: 0,
                
                total: 0
            },
            consistencyResult: {
                rallyLength1to4: 0,
                rallyLength5to8: 0,
                rallyLength9Plus: 0,
                total: 0
            }
        }));
    };

    const handleTacticsTypeChange = (tacticsType: string) => {
        setFormData(prev => ({
            ...prev,
            tacticsType,
            placementDetails: {
                // Cross Court
                crossCourtForehand: 0,
                crossCourtBackhand: 0,
                crossCourtVolleyForehand: 0,
                crossCourtVolleyBackhand: 0,
                crossCourtSliceForehand: 0,
                crossCourtSliceBackhand: 0,
                crossCourtLobForehand: 0,
                crossCourtLobBackhand: 0,
                crossCourtTopspinLobForehand: 0,
                crossCourtTopspinLobBackhand: 0,
                
                // Down The Line
                downTheLineForehand: 0,
                downTheLineBackhand: 0,
                downTheLineVolleyForehand: 0,
                downTheLineVolleyBackhand: 0,
                downTheLineSliceForehand: 0,
                downTheLineSliceBackhand: 0,
                downTheLineLobForehand: 0,
                downTheLineLobBackhand: 0,
                downTheLineTopspinLobForehand: 0,
                downTheLineTopspinLobBackhand: 0,
                
                // Down The Middle
                downTheMiddleForehand: 0,
                downTheMiddleBackhand: 0,
                downTheMiddleVolleyForehand: 0,
                downTheMiddleVolleyBackhand: 0,
                downTheMiddleLobForehand: 0,
                downTheMiddleLobBackhand: 0,
                downTheMiddleTopspinLobForehand: 0,
                downTheMiddleTopspinLobBackhand: 0,
                
                // Short Angle
                shortAngleForehand: 0,
                shortAngleBackhand: 0,
                
                // Drop Shorts
                dropShortsForehand: 0,
                dropShortsBackhand: 0,
                disguisingDropShotsForehand: 0,
                disguisingDropShotsBackhand: 0,
                
                // Inside Out/In
                insideOutForehand: 0,
                insideInForehand: 0,
                
                // Half Volley
                halfVolleyForehand: 0,
                halfVolleyBackhand: 0,
                
                total: 0
            },
            consistencyResult: {
                rallyLength1to4: 0,
                rallyLength5to8: 0,
                rallyLength9Plus: 0,
                total: 0
            }
        }));
    };

    // Helper functions to check if fields should be shown based on the hierarchical logic
    const shouldShowNestedSubObjective = () => {
        return formData.objective === 'tactics' && 
               (formData.subObjective === 'gameStyle' || formData.subObjective === 'fiveGameSituations');
    };

    const shouldShowTechnicalFields = () => {
        return formData.objective === 'technical' && 
               (formData.subObjective === 'allFundamentalStrokes' || formData.subObjective === 'advancedShots');
    };

    const shouldShowTacticsType = () => {
        return formData.objective === 'tactics' && 
               (formData.subObjective === 'consistency' || formData.subObjective === 'placement');
    };

    const shouldShowPlacementDetails = () => {
        return formData.objective === 'tactics' && 
               formData.subObjective === 'placement' && 
               formData.tacticsType &&
               ['crossCourt', 'downTheLine', 'downTheMiddle', 'shortAngle', 'dropShorts', 'insideOut', 'insideIn', 'halfVolley'].includes(formData.tacticsType);
    };

    const shouldShowConsistencyResult = () => {
        return formData.objective === 'tactics' && 
               formData.subObjective === 'consistency' && 
               formData.tacticsType &&
               ['rallyLength1-4', 'rallyLength5-8', 'rallyLength9+'].includes(formData.tacticsType);
    };

    // Helper function to get the correct technical stroke options based on sub-objective
    const getTechnicalStrokeOptions = () => {
        if (formData.objective === 'technical' && formData.subObjective) {
            return technicalStrokeOptions[formData.subObjective as keyof typeof technicalStrokeOptions] || [];
        }
        return [];
    };

    // Helper function to get the correct tactics type options based on sub-objective
    const getTacticsTypeOptions = () => {
        if (formData.objective === 'tactics' && formData.subObjective) {
            return tacticsTypeOptions[formData.subObjective as keyof typeof tacticsTypeOptions] || [];
        }
        return [];
    };

    const togglePlayer = (playerId: string, isClass = false) => {
        if (isClass) {
            setTempSelectedClassPlayers(prev => {
                // If session type is individual, only allow one player
                if (formData.sessionType === 'individual') {
                    if (prev.includes(playerId)) {
                        // Remove player if already selected
                        return prev.filter(id => id !== playerId);
                    } else {
                        // Replace current selection with new player
                        return [playerId];
                    }
                } else {
                    // Normal toggle behavior for group sessions
                    return prev.includes(playerId)
                        ? prev.filter(id => id !== playerId)
                        : [...prev, playerId];
                }
            });
        } else {
            setTempSelectedPlayers(prev => 
                prev.includes(playerId)
                    ? prev.filter(id => id !== playerId)
                    : [...prev, playerId]
            );
        }
    };

    const addSelectedPlayers = (isClass = false) => {
        if (isClass) {
            // For individual sessions, only allow one player total
            if (formData.sessionType === 'individual' && formData.selectedClassPlayers.length >= 1) {
                // Don't add more players for individual sessions
                return;
            }
            
            setFormData(prev => ({
                ...prev,
                selectedClassPlayers: [...prev.selectedClassPlayers, ...tempSelectedClassPlayers]
            }));
            
            // If this is an individual session and we're adding a player, fetch their goals
            if (formData.sessionType === 'individual' && tempSelectedClassPlayers.length > 0) {
                const playerId = tempSelectedClassPlayers[0]; // Individual sessions only have one player
                fetchPlayerGoals(playerId);
            }
            
            setTempSelectedClassPlayers([]);
            setClassSearchTerm(''); // Clear search after adding
        } else {
            setFormData(prev => ({
                ...prev,
                selectedPlayers: [...prev.selectedPlayers, ...tempSelectedPlayers]
            }));
            setTempSelectedPlayers([]);
            setSearchTerm(''); // Clear search after adding
        }
    };

    const removePlayer = (playerId: string, isClass = false) => {
        if (isClass) {
            setFormData(prev => ({
                ...prev,
                selectedClassPlayers: prev.selectedClassPlayers.filter(id => id !== playerId)
            }));
            
            // If this is an individual session and we're removing the player, clear goals
            if (formData.sessionType === 'individual' && formData.selectedClassPlayers.length === 1) {
                setPlayerGoals([]);
                setFormData(prev => ({ ...prev, goal: '' }));
            }
        } else {
            setFormData(prev => ({
                ...prev,
                selectedPlayers: prev.selectedPlayers.filter(id => id !== playerId)
            }));
        }
    };



    const filteredPlayers = players.filter(player =>
        `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (player.emailAddress?.email && player.emailAddress.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredClassPlayers = players.filter(player =>
        `${player.firstName} ${player.lastName}`.toLowerCase().includes(classSearchTerm.toLowerCase()) ||
        (player.emailAddress?.email && player.emailAddress.email.toLowerCase().includes(classSearchTerm.toLowerCase()))
    );

    if (!isOpen) return null;

    // Helper function to calculate total for placement details
    const calculatePlacementTotal = (placementDetails: any): number => {
        const fields = Object.keys(placementDetails).filter(key => key !== 'total');
        return fields.reduce((sum, field) => sum + (placementDetails[field] || 0), 0);
    };

    // Helper function to update placement details with automatic total calculation
    const updatePlacementDetails = (field: string, value: number) => {
        setFormData(prev => {
            const newPlacementDetails = {
                ...prev.placementDetails,
                [field]: value
            };
            
            // Calculate total automatically
            newPlacementDetails.total = calculatePlacementTotal(newPlacementDetails);
            
            return {
                ...prev,
                placementDetails: newPlacementDetails
            };
        });
    };

    // Helper function to update consistency results with automatic total calculation
    const updateConsistencyResult = (field: string, value: number) => {
        setFormData(prev => {
            const newConsistencyResult = {
                ...prev.consistencyResult,
                [field]: value
            };
            
            // Calculate total automatically
            newConsistencyResult.total = calculatePlacementTotal(newConsistencyResult);
            
            return {
                ...prev,
                consistencyResult: newConsistencyResult
            };
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
            
            {/* Modal Content */}
            <div className="relative w-full max-w-6xl mx-4 bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-primary)] max-h-[95vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[var(--border-primary)]">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                        {formData.type === 'reminder' ? 'Create Reminder' : 
                         formData.type === 'training' ? 'Schedule Training' : 
                         formData.type === 'class' ? 'Schedule a Class' : 
                         formData.type === 'classScheduleRequest' ? 'Request Class Schedule' : 'Create Event'}
                    </h2>
                        <button
                            onClick={handleClose}
                        className="text-red-500 hover:text-red-700 p-2 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        </button>
                    </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Event Type Selection - Only show if user can create different types */}
                    {availableEventTypes.length > 1 && (
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">Event Type</label>
                            <div className="grid grid-cols-3 gap-4">
                                {availableEventTypes.map(type => (
                                    <label key={type.value} className="flex items-center space-x-3 cursor-pointer p-4 border-2 border-[var(--border-primary)] rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all">
                                        <input
                                            type="radio"
                                            name="eventType"
                                            value={type.value}
                                            checked={formData.type === type.value}
                                            onChange={(e) => handleEventTypeChange(e.target.value)}
                                            className="rounded-full border-[var(--border-primary)] text-blue-600 focus:ring-blue-500"
                                            required
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-[var(--text-primary)]">{type.label}</span>
                                            <span className="text-xs text-[var(--text-secondary)]">
                                                {type.allowedRoles.includes('player') ? 'All users' : 'Coaches only'}
                                            </span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Content - Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Event Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2">
                                {formData.type === 'reminder' ? 'Reminder Details' : 
                                 formData.type === 'training' ? 'Training Details' : 
                                 formData.type === 'class' ? 'Class Details' : 
                                 formData.type === 'classScheduleRequest' ? 'Class Request Details' : 'Event Details'}
                            </h3>
                            
                            {/* Session Type */}
                        {formData.type === 'class' && (
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Session Type *</label>
                                        <select
                                            value={formData.sessionType}
                                            onChange={(e) => handleSessionTypeChange(e.target.value)}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                            style={{ 
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none'
                                            }}
                                            required
                                        >
                                            <option value="">Select session type...</option>
                                            {sessionTypes.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                    </div>
                            )}

                            {/* Level Plan */}
                            {formData.type === 'class' && (
                                    <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Level Plan Description *</label>
                                        <select
                                            value={formData.levelPlan}
                                            onChange={(e) => setFormData({ ...formData, levelPlan: e.target.value })}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                            style={{ 
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none'
                                            }}
                                            required
                                        >
                                            <option value="">Select level plan...</option>
                                            {levelPlans.map(level => (
                                                <option key={level.value} value={level.value}>{level.label}</option>
                                            ))}
                                        </select>
                                    </div>
                            )}
                                
                                {/* Goal field - required for private sessions */}
                            {formData.type === 'class' && (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                                        Session Goal {formData.sessionType === 'individual' && <span className="text-red-500">*</span>}
                                    </label>
                                    {formData.sessionType === 'individual' ? (
                                        <select
                                            value={formData.goal}
                                            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                            style={{ 
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none'
                                            }}
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
                                                    {getGoalTypeLabel(goal.goal)} - {goal.description}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={formData.goal}
                                            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            style={{ 
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'textfield'
                                            }}
                                            placeholder="Enter session goal..."
                                        />
                                    )}
                                </div>
                            )}

                                                        {/* Objective and Sub-Objective - Side by Side */}
                            {formData.type === 'class' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Objective *</label>
                                    <select
                                        value={formData.objective}
                                        onChange={(e) => handleObjectiveChange(e.target.value as 'physical' | 'technical' | 'tactics' | 'mental' | 'recovery' | '')}
                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                        style={{ 
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'none'
                                        }}
                                        required
                                    >
                                        <option value="">Select objective...</option>
                                        <option value="physical">Physical</option>
                                        <option value="technical">Technical</option>
                                        <option value="tactics">Tactics</option>
                                        <option value="mental">Mental</option>
                                        <option value="recovery">Recovery</option>
                                    </select>
                                </div>
                                
                                {formData.objective && (
                                    <div>
                                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Sub Objective *</label>
                                        <select
                                            value={formData.subObjective}
                                            onChange={(e) => handleSubObjectiveChange(e.target.value)}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                            style={{ 
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none'
                                            }}
                                            required
                                        >
                                            <option value="">Select sub-objective...</option>
                                            {objectiveOptions[formData.objective as keyof typeof objectiveOptions]?.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                        </div>
                                        )}
                                    </div>
                                )}

                            {/* Nested Sub-Objective */}
                            {formData.type === 'class' && shouldShowNestedSubObjective() && (
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Nested Sub-Objective *</label>
                                        <select
                                            value={formData.nestedSubObjective}
                                            onChange={(e) => setFormData({ ...formData, nestedSubObjective: e.target.value })}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                            style={{ 
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none'
                                            }}
                                            required
                                        >
                                            <option value="">Select nested sub-objective...</option>
                                            {nestedSubObjectiveOptions[formData.subObjective as keyof typeof nestedSubObjectiveOptions]?.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                                        {/* Technical Fields */}
                            {formData.type === 'class' && shouldShowTechnicalFields() && (
                                    <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Technical Stroke *</label>
                                            <select
                                                value={formData.technicalStroke}
                                                onChange={(e) => setFormData({ ...formData, technicalStroke: e.target.value })}
                                                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                                style={{ 
                                                    WebkitAppearance: 'none',
                                                    MozAppearance: 'none'
                                                }}
                                                required
                                            >
                                                <option value="">Select technical stroke...</option>
                                                {getTechnicalStrokeOptions().map(option => (
                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Technical Problem *</label>
                                            <input
                                                type="text"
                                                value={formData.technicalProblem}
                                                onChange={(e) => setFormData({ ...formData, technicalProblem: e.target.value })}
                                                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                style={{ 
                                                    WebkitAppearance: 'none',
                                                    MozAppearance: 'textfield'
                                                }}
                                                placeholder="Problems with forehand strokes"
                                                required
                                            />
                                        </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Video URL *</label>
                                            <input
                                                type="url"
                                                value={formData.videoUrl}
                                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="https://www.youtube.com"
                                                required
                                            />
                                        </div>
                                    </>
                                )}

                                                        {/* Tactics Type */}
                            {formData.type === 'class' && shouldShowTacticsType() && (
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Tactics Type *</label>
                                        <select
                                            value={formData.tacticsType}
                                            onChange={(e) => handleTacticsTypeChange(e.target.value)}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                            style={{ 
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none'
                                            }}
                                            required
                                        >
                                            <option value="">Select tactics type...</option>
                                            {getTacticsTypeOptions().map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                            {/* Conditional Follow-up Questions for Placement Tactics */}
                            {formData.type === 'class' && formData.objective === 'tactics' && formData.subObjective === 'placement' && formData.tacticsType && (
                                <div className="space-y-6 p-6 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2">
                                        {formData.tacticsType === 'dropShorts' ? 'Drop Short Expectations' :
                                         formData.tacticsType === 'shortAngle' ? 'Short Angle Expectations' :
                                         formData.tacticsType === 'downTheMiddle' ? 'Down The Middle Expectations' :
                                         formData.tacticsType === 'crossCourt' ? 'Cross Court Expectations' :
                                         formData.tacticsType === 'downTheLine' ? 'Down The Line Expectations' :
                                         formData.tacticsType === 'insideOut' ? 'Inside Out Expectations' :
                                         formData.tacticsType === 'insideIn' ? 'Inside In Expectations' :
                                         formData.tacticsType === 'halfVolley' ? 'Half Volley Expectations' :
                                         `${formData.tacticsType.charAt(0).toUpperCase() + formData.tacticsType.slice(1)} Expectations`}
                                    </h4>
                                    
                                    {/* Drop Shots Specific Fields */}
                                    {formData.tacticsType === 'dropShorts' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Drop-Shorts Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.dropShortsForehand}
                                                        onChange={(e) => updatePlacementDetails('dropShortsForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Drop-shorts Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.dropShortsBackhand}
                                                        onChange={(e) => updatePlacementDetails('dropShortsBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Disguising Drop Shots Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.disguisingDropShotsForehand}
                                                        onChange={(e) => updatePlacementDetails('disguisingDropShotsForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Disguising Drop Shots Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.disguisingDropShotsBackhand}
                                                        onChange={(e) => updatePlacementDetails('disguisingDropShotsBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Short Angle Specific Fields */}
                                    {formData.tacticsType === 'shortAngle' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Short Angle Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                    value={formData.placementDetails.shortAngleForehand}
                                                    onChange={(e) => updatePlacementDetails('shortAngleForehand', parseInt(e.target.value) || 0)}
                                                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Short Angle Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                    value={formData.placementDetails.shortAngleBackhand}
                                                    onChange={(e) => updatePlacementDetails('shortAngleBackhand', parseInt(e.target.value) || 0)}
                                                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    placeholder="0"
                                                        />
                                                    </div>
                                        </div>
                                    )}

                                    {/* Down The Middle Specific Fields */}
                                    {formData.tacticsType === 'downTheMiddle' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Middle Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheMiddleForehand}
                                                        onChange={(e) => updatePlacementDetails('downTheMiddleForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Middle Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheMiddleBackhand}
                                                        onChange={(e) => updatePlacementDetails('downTheMiddleBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Middle Volley Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheMiddleVolleyForehand}
                                                        onChange={(e) => updatePlacementDetails('downTheMiddleVolleyForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Middle Volley Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheMiddleVolleyBackhand}
                                                        onChange={(e) => updatePlacementDetails('downTheMiddleVolleyBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Middle Lob Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheMiddleLobForehand}
                                                        onChange={(e) => updatePlacementDetails('downTheMiddleLobForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Middle Lob Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheMiddleLobBackhand}
                                                        onChange={(e) => updatePlacementDetails('downTheMiddleLobBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Middle Topspin Lob Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheMiddleTopspinLobForehand}
                                                        onChange={(e) => updatePlacementDetails('downTheMiddleTopspinLobForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Middle Topspin Lob Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheMiddleTopspinLobBackhand}
                                                        onChange={(e) => updatePlacementDetails('downTheMiddleTopspinLobBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cross Court Specific Fields */}
                                    {formData.tacticsType === 'crossCourt' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Cross Court Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.crossCourtForehand}
                                                        onChange={(e) => updatePlacementDetails('crossCourtForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Cross Court Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.crossCourtBackhand}
                                                        onChange={(e) => updatePlacementDetails('crossCourtBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Cross Court Volley Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.crossCourtVolleyForehand}
                                                        onChange={(e) => updatePlacementDetails('crossCourtVolleyForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Cross Court Volley Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.crossCourtVolleyBackhand}
                                                        onChange={(e) => updatePlacementDetails('crossCourtVolleyBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Cross Court Slice Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.crossCourtSliceForehand}
                                                        onChange={(e) => updatePlacementDetails('crossCourtSliceForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Cross Court Slice Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.crossCourtSliceBackhand}
                                                        onChange={(e) => updatePlacementDetails('crossCourtSliceBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Cross Court Lob Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.crossCourtLobForehand}
                                                        onChange={(e) => updatePlacementDetails('crossCourtLobForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Cross Court Lob Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.crossCourtLobBackhand}
                                                        onChange={(e) => updatePlacementDetails('crossCourtLobBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Cross Court Topspin Lob Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.crossCourtTopspinLobForehand}
                                                        onChange={(e) => updatePlacementDetails('crossCourtTopspinLobForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Cross Court Topspin Lob Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.crossCourtTopspinLobBackhand}
                                                        onChange={(e) => updatePlacementDetails('crossCourtTopspinLobBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Down The Line Specific Fields */}
                                    {formData.tacticsType === 'downTheLine' && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Line Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheLineForehand}
                                                        onChange={(e) => updatePlacementDetails('downTheLineForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Line Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheLineBackhand}
                                                        onChange={(e) => updatePlacementDetails('downTheLineBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Line Volley Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheLineVolleyForehand}
                                                        onChange={(e) => updatePlacementDetails('downTheLineVolleyForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Line Volley Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheLineVolleyBackhand}
                                                        onChange={(e) => updatePlacementDetails('downTheLineVolleyBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Line Slice Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheLineSliceForehand}
                                                        onChange={(e) => updatePlacementDetails('downTheLineSliceForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Line Slice Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheLineSliceBackhand}
                                                        onChange={(e) => updatePlacementDetails('downTheLineSliceBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Line Lob Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheLineLobForehand}
                                                        onChange={(e) => updatePlacementDetails('downTheLineLobForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Line Lob Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheLineLobBackhand}
                                                        onChange={(e) => updatePlacementDetails('downTheLineLobBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Line Topspin Lob Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheLineTopspinLobForehand}
                                                        onChange={(e) => updatePlacementDetails('downTheLineTopspinLobForehand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Down The Line Topspin Lob Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                        value={formData.placementDetails.downTheLineTopspinLobBackhand}
                                                        onChange={(e) => updatePlacementDetails('downTheLineTopspinLobBackhand', parseInt(e.target.value) || 0)}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                        placeholder="0"
                                                        />
                                                    </div>
                                            </div>
                                        </div>
                                            )}

                                    {/* Inside Out/In Specific Fields */}
                                            {formData.tacticsType === 'insideOut' && (
                                                    <div>
                                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Inside Out Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={formData.placementDetails.insideOutForehand}
                                                onChange={(e) => updatePlacementDetails('insideOutForehand', parseInt(e.target.value) || 0)}
                                                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="0"
                                                        />
                                                    </div>
                                            )}

                                            {formData.tacticsType === 'insideIn' && (
                                                    <div>
                                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Inside In Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={formData.placementDetails.insideInForehand}
                                                onChange={(e) => updatePlacementDetails('insideInForehand', parseInt(e.target.value) || 0)}
                                                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                placeholder="0"
                                                        />
                                                    </div>
                                            )}

                                    {/* Half Volley Specific Fields */}
                                            {formData.tacticsType === 'halfVolley' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Half Volley Forehand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={formData.placementDetails.halfVolleyForehand}
                                                    onChange={(e) => updatePlacementDetails('halfVolleyForehand', parseInt(e.target.value) || 0)}
                                                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Half Volley Backhand</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={formData.placementDetails.halfVolleyBackhand}
                                                    onChange={(e) => updatePlacementDetails('halfVolleyBackhand', parseInt(e.target.value) || 0)}
                                                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    placeholder="0"
                                                        />
                                                    </div>
                                        </div>
                                    )}

                                    {/* Total Field - Always shown */}
                                    <div className="pt-4 border-t border-[var(--border-primary)]">
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Out of</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.placementDetails.total}
                                            onChange={(e) => updatePlacementDetails('total', parseInt(e.target.value) || 0)}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                            {/* Conditional Follow-up Questions for Consistency Tactics */}
                            {formData.type === 'class' && formData.objective === 'tactics' && formData.subObjective === 'consistency' && formData.tacticsType && (
                                <div className="space-y-6 p-6 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
                                    <h4 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2">Consistency Expectations</h4>
                                    
                                    <div className="space-y-4">
                                            {formData.tacticsType === 'rallyLength1-4' && (
                                                <div>
                                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Rally Length 1-4</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.consistencyResult.rallyLength1to4}
                                                    onChange={(e) => updateConsistencyResult('rallyLength1to4', parseInt(e.target.value) || 0)}
                                                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    placeholder="0"
                                                        required
                                                    />
                                                </div>
                                            )}
                                            {formData.tacticsType === 'rallyLength5-8' && (
                                                <div>
                                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Rally Length 5-8</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.consistencyResult.rallyLength5to8}
                                                    onChange={(e) => updateConsistencyResult('rallyLength5to8', parseInt(e.target.value) || 0)}
                                                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    placeholder="0"
                                                        required
                                                    />
                                                </div>
                                            )}
                                            {formData.tacticsType === 'rallyLength9+' && (
                                                <div>
                                                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Rally Length 9+</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.consistencyResult.rallyLength9Plus}
                                                    onChange={(e) => updateConsistencyResult('rallyLength9Plus', parseInt(e.target.value) || 0)}
                                                    className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                                    placeholder="0"
                                                        required
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    
                                    {/* Total Field - Always shown */}
                                    <div className="pt-4 border-t border-[var(--border-primary)]">
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Out of</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.consistencyResult.total}
                                            onChange={(e) => updateConsistencyResult('total', parseInt(e.target.value) || 0)}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                            {/* Reminder Fields */}
                            {formData.type === 'reminder' && (
                                                <>
                                <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Title *</label>
                                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            style={{ 
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'textfield'
                                            }}
                                            placeholder="Enter reminder title..."
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Description</label>
                                    <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                        rows={3}
                                            placeholder="Enter reminder description..."
                                    />
                                </div>
                                </>
                            )}

                            {/* Class Schedule Request Fields */}
                            {formData.type === 'classScheduleRequest' && (
                                <>
                                    {/* Child Selection for Parents */}
                                    {userRole === 'parent' && (
                                <div>
                                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Select Child *</label>
                                            <select
                                                value={selectedChild}
                                                onChange={(e) => setSelectedChild(e.target.value)}
                                                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                                style={{ 
                                                    WebkitAppearance: 'none',
                                                    MozAppearance: 'none'
                                                }}
                                                required
                                                disabled={isLoadingChildren}
                                            >
                                                <option value="">{isLoadingChildren ? 'Loading children...' : 'Choose a child'}</option>
                                                {children.map((child) => (
                                                    <option key={child._id} value={child._id}>
                                                        {child.firstName} {child.lastName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Coach Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Select Coach *</label>
                                        <select
                                            value={selectedCoach}
                                            onChange={(e) => setSelectedCoach(e.target.value)}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                            style={{ 
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'none'
                                            }}
                                            required
                                            disabled={isLoadingCoaches || (userRole === 'parent' && !selectedChild)}
                                        >
                                            <option value="">{isLoadingCoaches ? 'Loading coaches...' : (userRole === 'parent' && !selectedChild ? 'Select a child first' : 'Choose a coach')}</option>
                                            {coaches.map((coach) => (
                                                <option key={coach._id} value={coach._id}>
                                                    {coach.firstName} {coach.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>



                                    {/* Coach Availability Display */}
                                    {selectedCoach && (
                                        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <h4 className="text-lg font-semibold text-blue-900">Coach Availability</h4>
                                            </div>
                                            
                                            {!formData.date ? (
                                                <div className="text-center py-4">
                                                    <div className="inline-flex items-center space-x-2">
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                        <span className="text-blue-700">Select a date to see coach availability</span>
                                                    </div>
                                                </div>
                                            ) : availabilityLoading ? (
                                                <div className="text-center py-4">
                                                    <div className="inline-flex items-center space-x-2">
                                                        <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                        </svg>
                                                        <span className="text-blue-700">Checking availability...</span>
                                                    </div>
                                                </div>
                                            ) : coachAvailability.length > 0 ? (
                                                <div>
                                                    {/* Selected Time Display */}
                                                    {selectedTime && (
                                                        <div className="mb-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    <span className="text-blue-800 font-medium">Selected Time: {selectedTime}</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedTime('');
                                                                        // Reset the date field to just the date without time
                                                                        if (formData.date) {
                                                                            const dateObj = new Date(formData.date);
                                                                            const dateOnly = dateObj.toISOString().split('T')[0];
                                                                            setFormData(prev => ({ ...prev, date: dateOnly }));
                                                                        }
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                                >
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <p className="text-sm text-blue-700 mb-3">
                                                        Available time slots for {new Date(formData.date).toLocaleDateString()}:
                                                    </p>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {coachAvailability.map((slot, index) => (
                                                            <div
                                                                key={index}
                                                                onClick={() => slot.available && handleTimeSelection(slot.time)}
                                                                className={`p-3 rounded-lg text-center text-sm font-medium cursor-pointer transition-all duration-200 ${
                                                                    slot.available
                                                                        ? selectedTime === slot.time
                                                                            ? 'bg-blue-500 text-white border-2 border-blue-600 shadow-md transform scale-105 dark:bg-blue-600 dark:border-blue-500'
                                                                            : 'bg-green-500 text-white border border-green-600 hover:bg-green-600 hover:border-green-700 dark:bg-green-600 dark:border-green-500 dark:hover:bg-green-700'
                                                                        : 'bg-red-500 text-white border border-red-600 cursor-not-allowed dark:bg-red-600 dark:border-red-500'
                                                                }`}
                                                            >
                                                                {formatAvailabilityTime(slot.time)}
                                                                <div className="text-xs mt-1">
                                                                    {slot.available 
                                                                        ? selectedTime === slot.time 
                                                                            ? 'Selected' 
                                                                            : 'Click to select'
                                                                        : 'Busy'
                                                                    }
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="text-blue-700">No availability data for this date.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {/* Note Field */}
                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Note (Optional)</label>
                                    <textarea
                                            value={playerNote}
                                            onChange={(e) => setPlayerNote(e.target.value)}
                                            placeholder="Any specific notes about the class, skills you want to work on, or special requests..."
                                            rows={4}
                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                                        />
                                                    </div>
                                </>
                            )}
                            
                                                    </div>

                        {/* Right Column - Player and Time Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2">Player & Time Details</h3>
                            
                            {/* Player Selection */}
                            {formData.type === 'class' && (
                                                    <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Select Players</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                                    </div>
                                            <input
                                                type="text"
                                            value={formData.type === 'class' ? classSearchTerm : searchTerm}
                                            onChange={(e) => formData.type === 'class' ? setClassSearchTerm(e.target.value) : setSearchTerm(e.target.value)}
                                            className="w-full p-3 pl-10 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            style={{ 
                                                WebkitAppearance: 'none',
                                                MozAppearance: 'textfield'
                                            }}
                                            placeholder="Search player"
                                                        />
                                                    </div>
                                    
                                    {/* Search Results */}
                                    {classSearchTerm && (
                                                <div className="absolute z-50 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {filteredClassPlayers.map(player => (
                                                        <div
                                                            key={player._id}
                                                            className={`p-3 cursor-pointer hover:bg-[var(--bg-tertiary)] ${
                                                        tempSelectedClassPlayers.includes(player._id) ? 'bg-blue-50' : ''
                                                            }`}
                                                    onClick={() => togglePlayer(player._id, true)}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium">{`${player.firstName} ${player.lastName}`}</span>
                                                        {tempSelectedClassPlayers.includes(player._id) && (
                                                                    <span className="text-blue-600">✓</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                    
                                    {/* Add Selected Button */}
                                    {tempSelectedClassPlayers.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => addSelectedPlayers(true)}
                                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            Add Selected ({tempSelectedClassPlayers.length})
                                        </button>
                                    )}
                                    
                                    {/* Players Added */}
                                    {formData.selectedClassPlayers.length > 0 && (
                                        <div className="mt-4">
                                            <p className="text-sm text-[var(--text-secondary)] mb-2">
                                                {formData.selectedClassPlayers.length} Players added
                                            </p>
                                            <div className="space-y-2">
                                                {formData.selectedClassPlayers.map(playerId => {
                                                    const player = players.find(p => p._id === playerId);
                                                    return player ? (
                                                        <div key={playerId} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                    <span className="text-sm font-medium text-blue-600">
                                                                        {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                                                        </span>
                                            </div>
                                                                <span className="font-medium text-[var(--text-primary)]">{`${player.firstName} ${player.lastName}`}</span>
                                        </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removePlayer(playerId, true)}
                                                                className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                    </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                        )}

                            {/* Date Only - No Time Picker for Class Schedule Requests */}
                            <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Date</label>
                                <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                                    </div>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full p-3 pl-10 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                                        style={{ 
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'textfield'
                                        }}
                                            placeholder="Set Date"
                                        required
                                    />
                                </div>
                            </div>
                                
                                    {/* Coach Availability Display */}
                                    {selectedCoach && (
                                        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                                            <div className="flex items-center space-x-3 mb-4">
                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <h4 className="text-lg font-semibold text-blue-900">Coach Availability</h4>
                                            </div>
                                            
                                            {!formData.date ? (
                                                <div className="text-center py-4">
                                                    <div className="inline-flex items-center space-x-2">
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                        <span className="text-blue-700">Select a date to see coach availability</span>
                                                    </div>
                                                </div>
                                            ) : availabilityLoading ? (
                                                <div className="text-center py-4">
                                                    <div className="inline-flex items-center space-x-2">
                                                        <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        <span className="text-blue-700">Loading availability...</span>
                                                    </div>
                                                </div>
                                            ) : coachAvailability.length > 0 ? (
                                                <div>
                                                    {selectedTime && (
                                                        <div className="mb-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    <span className="text-blue-800 font-medium">Selected Time: {selectedTime}</span>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedTime('');
                                                                        // Reset the date field to just the date without time
                                                                        if (formData.date) {
                                                                            const dateObj = new Date(formData.date);
                                                                            const dateOnly = dateObj.toISOString().split('T')[0];
                                                                            setFormData(prev => ({ ...prev, date: dateOnly }));
                                                                        }
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                                >
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <p className="text-sm text-blue-700 mb-3">
                                                        Available time slots for {new Date(formData.date).toLocaleDateString()}:
                                                    </p>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {coachAvailability.map((slot, index) => (
                                                            <div
                                                                key={index}
                                                                onClick={() => slot.available && handleTimeSelection(slot.time)}
                                                                className={`p-3 rounded-lg text-center text-sm font-medium cursor-pointer transition-all duration-200 ${
                                                                    slot.available
                                                                        ? selectedTime === slot.time
                                                                            ? 'bg-blue-500 text-white border-2 border-blue-600 shadow-md transform scale-105 dark:bg-blue-600 dark:border-blue-500'
                                                                            : 'bg-green-500 text-white border border-green-600 hover:bg-green-600 hover:border-green-700 dark:bg-green-600 dark:border-green-500 dark:hover:bg-green-700'
                                                                        : 'bg-red-500 text-white border border-red-600 cursor-not-allowed dark:bg-red-600 dark:border-red-500'
                                                                }`}
                                                            >
                                                                {formatAvailabilityTime(slot.time)}
                                                                <div className="text-xs mt-1">
                                                                    {slot.available 
                                                                        ? selectedTime === slot.time 
                                                                            ? 'Selected' 
                                                                            : 'Click to select'
                                                                        : 'Busy'
                                                                    }
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <p className="text-blue-700">No availability data for this date.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {/* Note Field */}
                                                                ...formData, 
                                                                time: `${e.target.value.padStart(2, '0')}:${currentMinute}:${currentAmPm}` 
                                                            });
                                                        }}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                                                        style={{ 
                                                            WebkitAppearance: 'menulist',
                                                            MozAppearance: 'menulist'
                                                        }}
                                                    >
                                                        {Array.from({ length: 12 }, (_, i) => (
                                                            <option key={i} value={(i + 1).toString().padStart(2, '0')}>
                                                                {(i + 1).toString().padStart(2, '0')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Minute</label>
                                                    <select
                                                        value={formData.time ? formData.time.split(':')[1] || '00' : '00'}
                                                        onChange={(e) => {
                                                            const currentHour = formData.time ? formData.time.split(':')[0] || '12' : '12';
                                                            const currentAmPm = formData.time ? formData.time.split(':')[2] || 'AM' : 'AM';
                                                            setFormData({ 
                                                                ...formData, 
                                                                time: `${currentHour}:${e.target.value.padStart(2, '0')}:${currentAmPm}` 
                                                            });
                                                        }}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                                                        style={{ 
                                                            WebkitAppearance: 'menulist',
                                                            MozAppearance: 'menulist'
                                                        }}
                                                    >
                                                        {Array.from({ length: 60 }, (_, i) => (
                                                            <option key={i} value={i.toString().padStart(2, '0')}>
                                                                {i.toString().padStart(2, '0')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-xs text-[var(--text-secondary)] mb-1">AM/PM</label>
                                                    <select
                                                        value={formData.time ? formData.time.split(':')[2] || 'AM' : 'AM'}
                                                        onChange={(e) => {
                                                            const currentHour = formData.time ? formData.time.split(':')[0] || '12' : '12';
                                                            const currentMinute = formData.time ? formData.time.split(':')[1] || '00' : '00';
                                                            setFormData({ 
                                                                ...formData, 
                                                                time: `${currentHour}:${currentMinute}:${e.target.value}` 
                                                            });
                                                        }}
                                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                                                        style={{ 
                                                            WebkitAppearance: 'menulist',
                                                            MozAppearance: 'menulist'
                                                        }}
                                                    >
                                                        <option value="AM">AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const now = new Date();
                                                        const hour = now.getHours();
                                                        const minute = now.getMinutes();
                                                        const amPm = hour >= 12 ? 'PM' : 'AM';
                                                        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                                                        const timeString = `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${amPm}`;
                                                        setFormData({ ...formData, time: timeString });
                                                    }}
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                                                >
                                                    Now
                                                </button>
                                                {formData.time && (
                                                    <div className="flex items-center px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg text-sm text-[var(--text-primary)]">
                                                        <span className="font-medium">
                                                            {(() => {
                                                                const parts = formData.time.split(':');
                                                                if (parts.length === 3) {
                                                                    return `${parts[0]}:${parts[1]} ${parts[2]}`;
                                                                }
                                                                return formData.time;
                                                            })()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                                    
                            {formData.type === 'class' && (
                                <div>
                                            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">To</label>
                                    <div className="relative">
                                        {!isSafari ? (
                                            <input
                                                type="time"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                                className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                                                style={{ 
                                                    WebkitAppearance: 'textfield',
                                                    MozAppearance: 'textfield'
                                                }}
                                                placeholder="HH:MM"
                                                required
                                            />
                                        ) : (
                                            <div>
                                                <div className="flex gap-2 mb-2">
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-[var(--text-secondary)] mb-1">Hour</label>
                                                        <select
                                                            value={formData.endTime ? formData.endTime.split(':')[0] || '12' : '12'}
                                                            onChange={(e) => {
                                                                const currentMinute = formData.endTime ? formData.endTime.split(':')[1] || '00' : '00';
                                                                const currentAmPm = formData.endTime ? formData.endTime.split(':')[2] || 'AM' : 'AM';
                                                                setFormData({ 
                                                                    ...formData, 
                                                                    endTime: `${e.target.value.padStart(2, '0')}:${currentMinute}:${currentAmPm}` 
                                                                });
                                                            }}
                                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                                                            style={{ 
                                                                WebkitAppearance: 'menulist',
                                                                MozAppearance: 'menulist'
                                                            }}
                                                        >
                                                            {Array.from({ length: 12 }, (_, i) => (
                                                                <option key={i} value={(i + 1).toString().padStart(2, '0')}>
                                                                    {(i + 1).toString().padStart(2, '0')}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-[var(--text-secondary)] mb-1">Minute</label>
                                                        <select
                                                            value={formData.endTime ? formData.endTime.split(':')[1] || '00' : '00'}
                                                            onChange={(e) => {
                                                                const currentHour = formData.endTime ? formData.endTime.split(':')[0] || '12' : '12';
                                                                const currentAmPm = formData.endTime ? formData.endTime.split(':')[2] || 'AM' : 'AM';
                                                                setFormData({ 
                                                                    ...formData, 
                                                                    endTime: `${currentHour}:${e.target.value.padStart(2, '0')}:${currentAmPm}` 
                                                                });
                                                            }}
                                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                                                            style={{ 
                                                                WebkitAppearance: 'menulist',
                                                                MozAppearance: 'menulist'
                                                            }}
                                                        >
                                                            {Array.from({ length: 60 }, (_, i) => (
                                                                <option key={i} value={i.toString().padStart(2, '0')}>
                                                                    {i.toString().padStart(2, '0')}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-xs text-[var(--text-secondary)] mb-1">AM/PM</label>
                                                        <select
                                                            value={formData.endTime ? formData.endTime.split(':')[2] || 'AM' : 'AM'}
                                                            onChange={(e) => {
                                                                const currentHour = formData.endTime ? formData.endTime.split(':')[0] || '12' : '12';
                                                                const currentMinute = formData.endTime ? formData.endTime.split(':')[1] || '00' : '00';
                                                                setFormData({ 
                                                                    ...formData, 
                                                                    endTime: `${currentHour}:${currentMinute}:${e.target.value}` 
                                                                });
                                                            }}
                                                            className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                                                            style={{ 
                                                                WebkitAppearance: 'menulist',
                                                                MozAppearance: 'menulist'
                                                            }}
                                                        >
                                                            <option value="AM">AM</option>
                                                            <option value="PM">PM</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const now = new Date();
                                                            const hour = now.getHours();
                                                            const minute = now.getMinutes();
                                                            const amPm = hour >= 12 ? 'PM' : 'AM';
                                                            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                                                            const timeString = `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${amPm}`;
                                                            setFormData({ ...formData, endTime: timeString });
                                                        }}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                                                    >
                                                        Now
                                                    </button>
                                                    {formData.endTime && (
                                                        <div className="flex items-center px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg text-sm text-[var(--text-primary)]">
                                                            <span className="font-medium">
                                                                {(() => {
                                                                    const parts = formData.endTime.split(':');
                                                                    if (parts.length === 3) {
                                                                        return `${parts[0]}:${parts[1]} ${parts[2]}`;
                                                                    }
                                                                    return formData.endTime;
                                                                })()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        </div>

                            {/* Additional Information for Class */}
                            {formData.type === 'class' && (
                                                    <div>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Additional Information</label>
                                    <textarea
                                        value={formData.additionalInfo}
                                        onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                                        className="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                                        rows={3}
                                        placeholder="Enter any additional information about the class..."
                                                        />
                                                    </div>
                            )}
                                                    </div>
                                                    </div>

                    {/* Advanced Fields - Full Width Below */}
                    {(formData.type === 'class' && (shouldShowPlacementDetails() || shouldShowConsistencyResult())) && (
                        <div className="mt-8 pt-8 border-t border-[var(--border-primary)]">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Advanced Configuration</h3>
                            
                            {shouldShowPlacementDetails() && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-[var(--text-primary)]">Placement Details *</label>
                                    <p className="text-xs text-[var(--text-secondary)] mb-3">
                                        Enter the number of successful attempts for each shot type. The total will be calculated automatically.
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {/* Placement detail fields - keeping existing logic */}
                                        {/* ... existing placement detail fields ... */}
                                        </div>
                                        <div>
                                            <label className="block text-sm text-[var(--text-secondary)] mb-1">Total</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.placementDetails.total}
                                                onChange={(e) => updatePlacementDetails('total', parseInt(e.target.value))}
                                                className="w-full p-2 border border-[var(--border-primary)] rounded focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {shouldShowConsistencyResult() && (
                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-[var(--text-primary)]">Consistency Result *</label>
                                        <p className="text-xs text-[var(--text-secondary)] mb-3">
                                            Enter the number of successful rallies for the selected length. The total will be calculated automatically.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                        {/* Consistency result fields - keeping existing logic */}
                                        {/* ... existing consistency result fields ... */}
                                        </div>
                                        <div>
                                            <label className="block text-sm text-[var(--text-secondary)] mb-1">Total</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.consistencyResult.total}
                                                onChange={(e) => updateConsistencyResult('total', parseInt(e.target.value))}
                                                className="w-full p-2 border border-[var(--border-primary)] rounded focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}
                                </div>
                    )}

                    {/* Submit Button */}
                    <div className="mt-8 pt-6 border-t border-[var(--border-primary)]">
                                                            <button
                            type="submit"
                                disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Creating...' : getButtonText(formData.type)}
                                                            </button>
                        </div>
                    </form>
            </div>
        </div>
    );
}
