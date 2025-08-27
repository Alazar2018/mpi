import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classService } from '@/service/class.server';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'react-toastify';
import Button from '@/components/Button';
import type { 
    Class, 
    ClassObjective, 
    CoachEvaluation, 
    PlayerReflection, 
    PreSessionQuestions,
    PlacementDetails,
    ConsistencyResult,
    Performance
} from '@/service/class.server';

interface ClassDetails {
    _id: string;
    players: any[];
    date: string;
    to: string;
    levelPlan: string;
    goal?: string;
    sessionType: 'private' | 'semi' | 'group';
    status: 'active' | 'cancelled' | 'completed' | 'pending';
    playersCanReflect?: boolean;
    feedback?: string;
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
    }>;
    evaluations?: Array<{
        player: {
            _id: string;
            firstName: string;
            lastName: string;
            emailAddress?: {
                email: string;
            };
            avatar?: string;
        };
        coachEvaluation?: {
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
        playerEvaluation?: {
            performance: {
                engagement: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
                effort: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
                execution: 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree';
            };
            additionalInfo?: string;
        };
    }>;
    attendance?: Array<{
        player: string;
        status: 'present' | 'absent' | 'pending' | 'late' | 'excused';
    }>;
    photos?: string[];
    videos?: string[];
    createdAt: string;
    updatedAt: string;
}

interface Player {
    _id: string;
    firstName: string;
    lastName: string;
    emailAddress?: {
        email: string;
    };
    avatar?: string;
}

type TabType = 'evaluation' | 'feedbacks' | 'uploads' | 'classDetail';

export default function EditClassPage() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('classDetail');
    
    // Coach evaluation states
    const [selectedPlayerForEvaluation, setSelectedPlayerForEvaluation] = useState<any>(null);
    const [showCoachEvaluationModal, setShowCoachEvaluationModal] = useState(false);
    const [coachEvaluationData, setCoachEvaluationData] = useState({
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
    
    // Player-specific states
    const [showReflectionModal, setShowReflectionModal] = useState(false);
    const [showSelfEvaluationModal, setShowSelfEvaluationModal] = useState(false);
    const [showPreSessionQuestionsModal, setShowPreSessionQuestionsModal] = useState(false);
    const [reflectionData, setReflectionData] = useState({
        P: 3,
        R: 3,
        I: 3,
        M: 3,
        stepsTaken: '',
        feelTowardsGoal: '',
        additionalInfo: ''
    });
    const [selfEvaluationData, setSelfEvaluationData] = useState({
        performance: {
            engagement: 'neutral' as 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree',
            effort: 'neutral' as 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree',
            execution: 'neutral' as 'stronglyDisagree' | 'disagree' | 'neutral' | 'agree' | 'stronglyAgree'
        },
        additionalInfo: ''
    });
    const [preSessionQuestionsData, setPreSessionQuestionsData] = useState({
        emotion: 3,
        energy: 3,
        engagement: 3,
        additionalInfo: ''
    });
    
    // Role-based variables
    const isCurrentUserCoach = () => user?.role === 'coach';
    const isCurrentUserPlayer = () => user?.role === 'player';
    const isCurrentUserParent = () => user?.role === 'parent';
    const isClassCompleted = () => classDetails?.status === 'completed';
    const isClassActive = () => classDetails?.status === 'active';
    
    // Form data for editing
    const [formData, setFormData] = useState({
        sessionType: 'private' as 'private' | 'semi' | 'group',
        date: '',
        to: '',
        levelPlan: '',
        goal: '',
        status: 'active' as 'active' | 'cancelled' | 'completed',
        playersCanReflect: false,
        objectives: [{
            objective: 'physical' as 'physical' | 'technical' | 'tactics' | 'mental' | 'recovery',
            subObjective: '',
            nestedSubObjective: '',
            technicalStroke: '',
            technicalProblem: '',
            videoUrl: '',
            tacticsType: '',
            additionalInfo: ''
        }]
    });

    useEffect(() => {
        if (classId) {
            fetchClassDetails();
        }
    }, [classId]);

    const fetchClassDetails = async () => {
        try {
            setIsLoading(true);
            const response = await classService.getClass(classId!);
            
            if (response) {
                setClassDetails(response as any);
                
                // Initialize form data
                setFormData({
                    sessionType: response.sessionType || 'private',
                    date: response.date,
                    to: response.to,
                    levelPlan: response.levelPlan,
                    goal: response.goal || '',
                    status: response.status || 'active',
                    playersCanReflect: response.playersCanReflect || false,
                    objectives: response.objectives && response.objectives.length > 0 ? [{
                        objective: response.objectives[0].objective || 'physical',
                        subObjective: response.objectives[0].subObjective || '',
                        nestedSubObjective: response.objectives[0].nestedSubObjective || '',
                        technicalStroke: response.objectives[0].technicalStroke || '',
                        technicalProblem: response.objectives[0].technicalProblem || '',
                        videoUrl: response.objectives[0].videoUrl || '',
                        tacticsType: response.objectives[0].tacticsType || '',
                        additionalInfo: response.objectives[0].additionalInfo || ''
                    }] : [{
                        objective: 'physical' as const,
                        subObjective: '',
                        nestedSubObjective: '',
                        technicalStroke: '',
                        technicalProblem: '',
                        videoUrl: '',
                        tacticsType: '',
                        additionalInfo: ''
                    }]
                });
                
                if (response.players && response.players.length > 0) {
                    await fetchPlayerDetails(response.players);
                }
            } else {
                toast.error('Class not found');
                navigate('/admin/calendar');
            }
        } catch (error) {
            console.error('Error fetching class details:', error);
            toast.error('Failed to load class details');
            navigate('/admin/calendar');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPlayerDetails = async (playersData: any[]) => {
        try {
            if (playersData.length > 0 && typeof playersData[0] === 'object' && playersData[0]._id) {
                setPlayers(playersData);
            } else {
                const { playersService } = await import('@/service/players.server');
                const playerPromises = playersData.map(id => playersService.getPlayerById(id));
                const playerResponses = await Promise.all(playerPromises);
                
                const validPlayers = playerResponses
                    .filter(response => response.player)
                    .map(response => response.player);
                
                setPlayers(validPlayers);
            }
        } catch (error) {
            console.error('Error fetching player details:', error);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            
            // Prepare update data
            const updateData: any = {
                date: formData.date,
                to: formData.to,
                levelPlan: formData.levelPlan,
                goal: formData.goal,
                status: formData.status === 'completed' ? 'active' : formData.status,
                playersCanReflect: formData.playersCanReflect
            };
            
            // Add objectives if they exist
            if (formData.objectives && formData.objectives.length > 0) {
                updateData.objectives = formData.objectives[0];
            }
            
            // Update the class
            await classService.updateClass(classId!, updateData);
            
            toast.success('Class updated successfully');
            navigate(`/admin/class/${classId}`);
        } catch (error) {
            console.error('Error saving class:', error);
            toast.error('Failed to save class');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev as any)[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    // Coach evaluation functions
    const openCoachEvaluationModal = (player: any) => {
        setSelectedPlayerForEvaluation(player);
        setShowCoachEvaluationModal(true);
    };

    const submitCoachEvaluation = async () => {
        if (!selectedPlayerForEvaluation || !classId) return;
        
        try {
            setIsSaving(true);
            await classService.addCoachEvaluation(
                classId,
                selectedPlayerForEvaluation._id,
                coachEvaluationData
            );
            
            toast.success('Coach evaluation submitted successfully!');
            setShowCoachEvaluationModal(false);
            setSelectedPlayerForEvaluation(null);
            setCoachEvaluationData({
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
            
            // Refresh class details
            await fetchClassDetails();
        } catch (error) {
            console.error('Error submitting coach evaluation:', error);
            toast.error('Failed to submit coach evaluation');
        } finally {
            setIsSaving(false);
        }
    };

    // Player-specific functions
    const submitReflection = async () => {
        if (!classId) return;
        
        try {
            setIsSaving(true);
            await classService.addPlayerReflection(classId, reflectionData);
            
            toast.success('Reflection submitted successfully!');
            setShowReflectionModal(false);
            setReflectionData({
                P: 3,
                R: 3,
                I: 3,
                M: 3,
                stepsTaken: '',
                feelTowardsGoal: '',
                additionalInfo: ''
            });
            
            // Refresh class details
            await fetchClassDetails();
        } catch (error) {
            console.error('Error submitting reflection:', error);
            toast.error('Failed to submit reflection');
        } finally {
            setIsSaving(false);
        }
    };

    const submitSelfEvaluation = async () => {
        if (!classId) return;
        
        try {
            setIsSaving(true);
            await classService.addPlayerEvaluation(classId, selfEvaluationData);
            
            toast.success('Self-evaluation submitted successfully!');
            setShowSelfEvaluationModal(false);
            setSelfEvaluationData({
                performance: {
                    engagement: 'neutral',
                    effort: 'neutral',
                    execution: 'neutral'
                },
                additionalInfo: ''
            });
            
            // Refresh class details
            await fetchClassDetails();
        } catch (error) {
            console.error('Error submitting self-evaluation:', error);
            toast.error('Failed to submit self-evaluation');
        } finally {
            setIsSaving(false);
        }
    };

    const submitPreSessionQuestions = async () => {
        if (!classId) return;
        
        try {
            setIsSaving(true);
            await classService.addPreSessionQuestions(classId, preSessionQuestionsData);
            
            toast.success('Pre-session questions submitted successfully!');
            setShowPreSessionQuestionsModal(false);
            setPreSessionQuestionsData({
                emotion: 3,
                energy: 3,
                engagement: 3,
                additionalInfo: ''
            });
            
            // Refresh class details
            await fetchClassDetails();
        } catch (error) {
            console.error('Error submitting pre-session questions:', error);
            toast.error('Failed to submit pre-session questions');
        } finally {
            setIsSaving(false);
        }
    };

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

    const resetPreSessionQuestionsForm = () => {
        setPreSessionQuestionsData({
            emotion: 3,
            energy: 3,
            engagement: 3,
            additionalInfo: ''
        });
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'evaluation':
                if (isCurrentUserCoach()) {
                    return (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Player Evaluations</h2>
                                <p className="text-sm text-gray-600">Evaluate player performance and set goals</p>
                            </div>
                            
                            {/* Players List with Evaluation Options */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Players</h3>
                                <div className="space-y-4">
                                    {players.map((player) => {
                                        const existingEvaluation = classDetails?.evaluations?.find(
                                            (e: any) => e.player._id === player._id
                                        );
                                        
                                        return (
                                            <div key={player._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        {player.avatar ? (
                                                            <img 
                                                                src={player.avatar} 
                                                                alt={`${player.firstName} ${player.lastName}`}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-medium text-blue-600">
                                                                {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{player.firstName} {player.lastName}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {existingEvaluation ? 'Evaluated' : 'Not evaluated'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="action"
                                                    onClick={() => openCoachEvaluationModal(player)}
                                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                                >
                                                    {existingEvaluation ? 'Update Evaluation' : 'Evaluate Player'}
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            
                            {/* Existing Evaluations */}
                            {classDetails?.evaluations && classDetails.evaluations.length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Evaluations</h3>
                                    <div className="space-y-4">
                                        {classDetails.evaluations.map((evaluation: any, index: number) => (
                                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="font-medium text-gray-900">
                                                        {evaluation.player?.firstName} {evaluation.player?.lastName}
                                                    </h4>
                                                    <span className="text-sm text-gray-600">
                                                        {evaluation.coachEvaluation ? 'Coach Evaluation' : 'Player Self-Evaluation'}
                                                    </span>
                                                </div>
                                                
                                                {evaluation.coachEvaluation && (
                                                    <div className="space-y-2">
                                                        <p><span className="font-medium">Goal:</span> {evaluation.coachEvaluation.goal}</p>
                                                        <p><span className="font-medium">Measurement:</span> {evaluation.coachEvaluation.measurement}</p>
                                                        <div className="flex space-x-4 text-sm">
                                                            <span className={`px-2 py-1 rounded ${evaluation.coachEvaluation.achievable ? 'bg-green-100' : 'bg-red-100'}`}>
                                                                Achievable: {evaluation.coachEvaluation.achievable ? 'Yes' : 'No'}
                                                            </span>
                                                            <span className={`px-2 py-1 rounded ${evaluation.coachEvaluation.isRelevant ? 'bg-green-100' : 'bg-red-100'}`}>
                                                                Relevant: {evaluation.coachEvaluation.isRelevant ? 'Yes' : 'No'}
                                                            </span>
                                                            <span className={`px-2 py-1 rounded ${evaluation.coachEvaluation.isTimeBound ? 'bg-green-100' : 'bg-red-100'}`}>
                                                                Time-bound: {evaluation.coachEvaluation.isTimeBound ? 'Yes' : 'No'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                } else if (isCurrentUserPlayer()) {
                    return (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Your Session Evaluation</h2>
                                <p className="text-sm text-gray-600">View your coach's feedback and submit self-assessments</p>
                            </div>
                            
                            {/* Coach's Evaluation - View Only when class completed */}
                            {isClassCompleted() && classDetails?.evaluations && classDetails.evaluations.length > 0 && (
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
                                    
                                    {classDetails.evaluations.map((evaluation: any, index: number) => (
                                        <div key={index} className="p-6 bg-white rounded-xl border-2 border-blue-200 shadow-md">
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
                                            
                                            {/* Performance Metrics */}
                                            <div className="mb-6">
                                                <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Assessment</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                                                        <p className="text-sm font-medium text-gray-700">Engagement</p>
                                                        <p className="text-lg font-semibold text-blue-600 capitalize">{evaluation.coachEvaluation?.performance?.engagement || 'Not rated'}</p>
                                                    </div>
                                                    <div className="p-4 bg-green-50 rounded-lg text-center">
                                                        <p className="text-sm font-medium text-gray-700">Effort</p>
                                                        <p className="text-lg font-semibold text-green-600 capitalize">{evaluation.coachEvaluation?.performance?.effort || 'Not rated'}</p>
                                                    </div>
                                                    <div className="p-4 bg-amber-50 rounded-lg md:col-span-2">
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
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Self-Evaluation Section */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-200 shadow-lg">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Your Self-Evaluation</h3>
                                        <p className="text-green-700">Assess your own performance in this session</p>
                                    </div>
                                </div>
                                
                                <div className="text-center">
                                    <p className="text-gray-700 text-lg mb-6">How would you rate your performance in this session?</p>
                                    <Button
                                        type="action"
                                        onClick={() => setShowSelfEvaluationModal(true)}
                                        className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-lg"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            <span>Submit Self-Evaluation</span>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                } else if (isCurrentUserParent()) {
                    return (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Child's Session Evaluation</h2>
                                <p className="text-sm text-gray-600">View your child's performance and coach feedback</p>
                            </div>
                            
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                <h3 className="text-lg font-semibold text-blue-900 mb-4">Parent View</h3>
                                <p className="text-blue-800">As a parent, you can view your child's session evaluations and coach feedback here.</p>
                                <p className="text-blue-700 text-sm mt-2">Contact the coach directly for any questions about your child's progress.</p>
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900">Evaluation</h2>
                            <p className="text-gray-600">Please log in to view evaluation content.</p>
                        </div>
                    );
                }
            
            case 'feedbacks':
                if (isCurrentUserCoach()) {
                    return (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Player Feedbacks</h2>
                                <p className="text-sm text-gray-600">View all player feedback and evaluations</p>
                            </div>
                            
                            {/* Coach Evaluations */}
                            {classDetails?.evaluations && classDetails.evaluations.filter((e: any) => e.coachEvaluation).length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Coach Evaluations</h3>
                                    <div className="space-y-4">
                                        {classDetails.evaluations
                                            .filter((e: any) => e.coachEvaluation)
                                            .map((evaluation: any, index: number) => (
                                                <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-medium text-gray-900">
                                                            {evaluation.player?.firstName} {evaluation.player?.lastName}
                                                        </h4>
                                                        <span className="text-sm text-blue-600 font-medium">Coach Evaluation</span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Goal</p>
                                                            <p className="font-medium text-gray-900">{evaluation.coachEvaluation.goal}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Measurement</p>
                                                            <p className="font-medium text-gray-900">{evaluation.coachEvaluation.measurement}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex space-x-4 mb-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            evaluation.coachEvaluation.achievable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            Achievable: {evaluation.coachEvaluation.achievable ? 'Yes' : 'No'}
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            evaluation.coachEvaluation.isRelevant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            Relevant: {evaluation.coachEvaluation.isRelevant ? 'Yes' : 'No'}
                                                        </span>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            evaluation.coachEvaluation.isTimeBound ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            Time-bound: {evaluation.coachEvaluation.isTimeBound ? 'Yes' : 'No'}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Engagement</p>
                                                            <p className="font-medium text-gray-900 capitalize">{evaluation.coachEvaluation.performance.engagement}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Effort</p>
                                                            <p className="font-medium text-gray-900 capitalize">{evaluation.coachEvaluation.performance.effort}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Execution</p>
                                                            <p className="font-medium text-gray-900 capitalize">{evaluation.coachEvaluation.performance.execution}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {evaluation.coachEvaluation.additionalInfo && (
                                                        <div>
                                                            <p className="text-sm text-gray-600">Additional Info</p>
                                                            <p className="text-gray-900">{evaluation.coachEvaluation.additionalInfo}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* Player Self-Evaluations */}
                            {classDetails?.evaluations && classDetails.evaluations.filter((e: any) => e.playerEvaluation).length > 0 && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Player Self-Evaluations</h3>
                                    <div className="space-y-4">
                                        {classDetails.evaluations
                                            .filter((e: any) => e.playerEvaluation)
                                            .map((evaluation: any, index: number) => (
                                                <div key={index} className="p-4 bg-green-50 rounded-lg border border-green-200">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-medium text-gray-900">
                                                            {evaluation.player?.firstName} {evaluation.player?.lastName}
                                                        </h4>
                                                        <span className="text-sm text-green-600 font-medium">Self-Evaluation</span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Engagement</p>
                                                            <p className="font-medium text-gray-900 capitalize">{evaluation.playerEvaluation.performance.engagement}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Effort</p>
                                                            <p className="font-medium text-gray-900 capitalize">{evaluation.playerEvaluation.performance.effort}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Execution</p>
                                                            <p className="font-medium text-gray-900 capitalize">{evaluation.playerEvaluation.performance.execution}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {evaluation.playerEvaluation.additionalInfo && (
                                                        <div>
                                                            <p className="text-sm text-gray-600">Additional Info</p>
                                                            <p className="text-gray-900">{evaluation.playerEvaluation.additionalInfo}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                            
                            {(!classDetails?.evaluations || classDetails.evaluations.length === 0) && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                                    <p className="text-gray-500 text-lg">No feedback available yet.</p>
                                    <p className="text-gray-400 text-sm mt-2">Start by evaluating players in the Evaluation tab.</p>
                                </div>
                            )}
                        </div>
                    );
                } else if (isCurrentUserPlayer()) {
                    return (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Your Session Feedback</h2>
                                <p className="text-sm text-gray-600">View your coach's feedback and self-assessments</p>
                            </div>
                            
                            {/* Coach's Feedback */}
                            {classDetails?.feedback && (
                                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                    <h3 className="text-lg font-semibold text-blue-900 mb-4">Coach's General Feedback</h3>
                                    <p className="text-blue-800">{classDetails.feedback}</p>
                                </div>
                            )}
                            
                            {/* Your Self-Evaluation */}
                            {classDetails?.evaluations && classDetails.evaluations.find((e: any) => e.playerEvaluation) && (
                                <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                                    <h3 className="text-lg font-semibold text-green-900 mb-4">Your Self-Evaluation</h3>
                                    <div className="space-y-4">
                                        {classDetails.evaluations
                                            .filter((e: any) => e.playerEvaluation)
                                            .map((evaluation: any, index: number) => (
                                                <div key={index} className="p-4 bg-white rounded-lg border border-green-200">
                                                    <div className="grid grid-cols-3 gap-4 mb-3">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Engagement</p>
                                                            <p className="font-medium text-gray-900 capitalize">{evaluation.playerEvaluation.performance.engagement}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Effort</p>
                                                            <p className="font-medium text-gray-900 capitalize">{evaluation.playerEvaluation.performance.effort}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-gray-600">Execution</p>
                                                            <p className="font-medium text-gray-900 capitalize">{evaluation.playerEvaluation.performance.execution}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    {evaluation.playerEvaluation.additionalInfo && (
                                                        <div>
                                                            <p className="text-sm text-gray-600">Additional Info</p>
                                                            <p className="text-gray-900">{evaluation.playerEvaluation.additionalInfo}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                            
                            {(!classDetails?.feedback && (!classDetails?.evaluations || classDetails.evaluations.length === 0)) && (
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                                    <p className="text-gray-500 text-lg">No feedback available yet.</p>
                                    <p className="text-gray-400 text-sm mt-2">Your coach will provide feedback after the session.</p>
                                </div>
                            )}
                        </div>
                    );
                } else if (isCurrentUserParent()) {
                    return (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Child's Session Feedback</h2>
                                <p className="text-sm text-gray-600">View your child's session feedback and evaluations</p>
                            </div>
                            
                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                <h3 className="text-lg font-semibold text-blue-900 mb-4">Parent Information</h3>
                                <p className="text-blue-800">As a parent, you can view your child's session feedback and coach evaluations here.</p>
                                <p className="text-blue-700 text-sm mt-2">For detailed feedback and progress updates, please contact the coach directly.</p>
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900">Feedbacks</h2>
                            <p className="text-gray-600">Please log in to view feedback content.</p>
                        </div>
                    );
                }
            
            case 'uploads':
                if (isCurrentUserCoach()) {
                    return (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Media Management</h2>
                                <p className="text-sm text-gray-600">Manage class photos and videos</p>
                            </div>
                            
                            {/* Photos Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Class Photos</h3>
                                    <Button
                                        type="action"
                                        onClick={() => document.getElementById('photo-upload')?.click()}
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Upload Photos
                                    </Button>
                                </div>
                                
                                <input
                                    id="photo-upload"
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        // TODO: Implement photo upload functionality
                                        console.log('Photo upload:', e.target.files);
                                    }}
                                />
                                
                                {classDetails?.photos && classDetails.photos.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {classDetails.photos.map((photo: string, index: number) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={photo}
                                                    alt={`Class photo ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg"
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                                    <button
                                                        onClick={() => {
                                                            // TODO: Implement photo deletion
                                                            console.log('Delete photo:', photo);
                                                        }}
                                                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="mt-2 text-gray-500">No photos uploaded yet</p>
                                        <p className="text-sm text-gray-400">Upload photos to document the class session</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Videos Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Class Videos</h3>
                                    <Button
                                        type="action"
                                        onClick={() => document.getElementById('video-upload')?.click()}
                                        className="bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Upload Videos
                                    </Button>
                                </div>
                                
                                <input
                                    id="video-upload"
                                    type="file"
                                    multiple
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        // TODO: Implement video upload functionality
                                        console.log('Video upload:', e.target.files);
                                    }}
                                />
                                
                                {classDetails?.videos && classDetails.videos.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {classDetails.videos.map((video: string, index: number) => (
                                            <div key={index} className="relative group">
                                                <video
                                                    src={video}
                                                    controls
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                                <div className="absolute top-2 right-2 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                    <button
                                                        onClick={() => {
                                                            // TODO: Implement video deletion
                                                            console.log('Delete video:', video);
                                                        }}
                                                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <p className="mt-2 text-gray-500">No videos uploaded yet</p>
                                        <p className="text-sm text-gray-400">Upload videos to document techniques and gameplay</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Upload Instructions */}
                            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
                                <h3 className="text-lg font-semibold text-blue-900 mb-3">Upload Guidelines</h3>
                                <div className="space-y-2 text-sm text-blue-800">
                                    <p>• Photos: JPG, PNG, GIF (max 10MB each)</p>
                                    <p>• Videos: MP4, MOV, AVI (max 100MB each)</p>
                                    <p>• Upload multiple files at once for convenience</p>
                                    <p>• Use photos to document progress and techniques</p>
                                    <p>• Use videos to record gameplay and form analysis</p>
                                </div>
                            </div>
                        </div>
                    );
                } else if (isCurrentUserPlayer() || isCurrentUserParent()) {
                    return (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900">Session Media</h2>
                                <p className="text-sm text-gray-600">View photos and videos from your session</p>
                            </div>
                            
                            {/* Photos Section - Read Only */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Photos</h3>
                                
                                {classDetails?.photos && classDetails.photos.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {classDetails.photos.map((photo: string, index: number) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={photo}
                                                    alt={`Class photo ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(photo, '_blank')}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="mt-2 text-gray-500">No photos available yet</p>
                                        <p className="text-sm text-gray-400">Photos will be uploaded by your coach</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Videos Section - Read Only */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Videos</h3>
                                
                                {classDetails?.videos && classDetails.videos.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {classDetails.videos.map((video: string, index: number) => (
                                            <div key={index} className="relative">
                                                <video
                                                    src={video}
                                                    controls
                                                    className="w-full h-48 object-cover rounded-lg"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <p className="mt-2 text-gray-500">No videos available yet</p>
                                        <p className="text-sm text-gray-400">Videos will be uploaded by your coach</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900">Uploads</h2>
                            <p className="text-gray-600">Please log in to view media content.</p>
                        </div>
                    );
                }
            
            case 'classDetail':
            default:
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">Edit Class Details</h2>
                        
                        {/* Session Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                            <select
                                value={formData.sessionType}
                                onChange={(e) => handleInputChange('sessionType', e.target.value)}
                                className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="private">Private</option>
                                <option value="semi">Semi-Private</option>
                                <option value="group">Group</option>
                            </select>
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    value={formData.date.split('T')[0]}
                                    onChange={(e) => handleInputChange('date', e.target.value)}
                                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                                <input
                                    type="time"
                                    value={formData.to.split('T')[1]?.substring(0, 5)}
                                    onChange={(e) => handleInputChange('to', e.target.value)}
                                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>

                        {/* Level Plan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Level Plan</label>
                            <textarea
                                value={formData.levelPlan}
                                onChange={(e) => handleInputChange('levelPlan', e.target.value)}
                                rows={3}
                                className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter level plan..."
                            />
                        </div>

                        {/* Level Plan Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Level Plan Description</label>
                            <textarea
                                value={formData.goal}
                                onChange={(e) => handleInputChange('goal', e.target.value)}
                                rows={4}
                                className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter level plan description..."
                            />
                        </div>

                        {/* Objectives */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Objective</label>
                                <select
                                    value={formData.objectives[0]?.objective || 'physical'}
                                    onChange={(e) => handleInputChange('objectives.0.objective', e.target.value)}
                                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="physical">Physical</option>
                                    <option value="technical">Technical</option>
                                    <option value="tactics">Tactics</option>
                                    <option value="mental">Mental</option>
                                    <option value="recovery">Recovery</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sub Objective</label>
                                <input
                                    type="text"
                                    value={formData.objectives[0]?.subObjective || ''}
                                    onChange={(e) => handleInputChange('objectives.0.subObjective', e.target.value)}
                                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter sub objective..."
                                />
                            </div>
                        </div>

                        {/* Nested Sub Objective */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject / Nested Objective</label>
                            <input
                                type="text"
                                value={formData.objectives[0]?.nestedSubObjective || ''}
                                onChange={(e) => handleInputChange('objectives.0.nestedSubObjective', e.target.value)}
                                className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter nested sub objective..."
                            />
                        </div>

                        {/* Toggle Switches */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Players can reflect</span>
                                <div 
                                    className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${formData.playersCanReflect ? 'bg-blue-500' : 'bg-gray-300'}`}
                                    onClick={() => handleInputChange('playersCanReflect', !formData.playersCanReflect)}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${formData.playersCanReflect ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading class details...</p>
                </div>
            </div>
        );
    }

    if (!classDetails) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Class not found</p>
                    <Button
                        type="action"
                        onClick={() => navigate('/admin/calendar')}
                        className="mt-4"
                    >
                        Back to Calendar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-6">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate(`/admin/class/${classId}`)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Class Detail</h1>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex space-x-8 border-b border-gray-200">
                        {[
                            { id: 'evaluation', label: 'Evaluation' },
                            { id: 'feedbacks', label: 'Feedbacks' },
                            { id: 'uploads', label: 'Uploads' },
                            { id: 'classDetail', label: 'Class Detail' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2">
                        {renderTabContent()}
                    </div>

                    {/* Right Column - Players */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">List of players</h2>
                            <div className="space-y-3">
                                {players.map((player) => {
                                    const attendance = classDetails.attendance?.find(a => a.player === player._id);
                                    const status = attendance?.status || 'pending';
                                    
                                    const getStatusColor = (status: string) => {
                                        switch (status) {
                                            case 'confirmed':
                                            case 'present': return 'text-blue-600';
                                            case 'pending': return 'text-orange-600';
                                            case 'absent': return 'text-red-600';
                                            case 'late': return 'text-yellow-600';
                                            case 'excused': return 'text-gray-600';
                                            default: return 'text-orange-600';
                                        }
                                    };
                                    
                                    const getStatusText = (status: string) => {
                                        switch (status) {
                                            case 'confirmed':
                                            case 'present': return 'Confirmed';
                                            case 'pending': return 'Pending';
                                            case 'absent': return 'Absent';
                                            case 'late': return 'Late';
                                            case 'excused': return 'Excused';
                                            default: return 'Pending';
                                        }
                                    };
                                    
                                    return (
                                        <div key={player._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                {player.avatar ? (
                                                    <img 
                                                        src={player.avatar} 
                                                        alt={`${player.firstName} ${player.lastName}`}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-medium text-blue-600">
                                                        {player.firstName.charAt(0)}{player.lastName.charAt(0)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{player.firstName} {player.lastName}</p>
                                            </div>
                                            <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                                                {getStatusText(status)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Save Bar */}
                <div className="bg-white p-6 mt-8 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-end">
                        <Button
                            type="action"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Coach Evaluation Modal */}
            {showCoachEvaluationModal && selectedPlayerForEvaluation && (
                <>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowCoachEvaluationModal(false)}></div>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Coach Evaluation - {selectedPlayerForEvaluation.firstName} {selectedPlayerForEvaluation.lastName}
                                    </h3>
                                    <button
                                        onClick={() => setShowCoachEvaluationModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* SMART Goal Criteria */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-900">SMART Goal Criteria</h4>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Goal Description</label>
                                        <textarea
                                            value={coachEvaluationData.goal}
                                            onChange={(e) => setCoachEvaluationData(prev => ({ ...prev, goal: e.target.value }))}
                                            rows={3}
                                            className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Describe the specific goal for this player..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Measurement Criteria</label>
                                        <textarea
                                            value={coachEvaluationData.measurement}
                                            onChange={(e) => setCoachEvaluationData(prev => ({ ...prev, measurement: e.target.value }))}
                                            rows={2}
                                            className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="How will you measure success?"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="achievable"
                                                checked={coachEvaluationData.achievable}
                                                onChange={(e) => setCoachEvaluationData(prev => ({ ...prev, achievable: e.target.checked }))}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="achievable" className="text-sm font-medium text-gray-700">Achievable</label>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="isRelevant"
                                                checked={coachEvaluationData.isRelevant}
                                                onChange={(e) => setCoachEvaluationData(prev => ({ ...prev, isRelevant: e.target.checked }))}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="isRelevant" className="text-sm font-medium text-gray-700">Relevant</label>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="isTimeBound"
                                                checked={coachEvaluationData.isTimeBound}
                                                onChange={(e) => setCoachEvaluationData(prev => ({ ...prev, isTimeBound: e.target.checked }))}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="isTimeBound" className="text-sm font-medium text-gray-700">Time-bound</label>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Rating */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-900">Performance Rating</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Engagement</label>
                                            <select
                                                value={coachEvaluationData.performance.engagement}
                                                onChange={(e) => setCoachEvaluationData(prev => ({
                                                    ...prev,
                                                    performance: { ...prev.performance, engagement: e.target.value as any }
                                                }))}
                                                className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="stronglyDisagree">Strongly Disagree</option>
                                                <option value="disagree">Disagree</option>
                                                <option value="neutral">Neutral</option>
                                                <option value="agree">Agree</option>
                                                <option value="stronglyAgree">Strongly Agree</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Effort</label>
                                            <select
                                                value={coachEvaluationData.performance.effort}
                                                onChange={(e) => setCoachEvaluationData(prev => ({
                                                    ...prev,
                                                    performance: { ...prev.performance, effort: e.target.value as any }
                                                }))}
                                                className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="stronglyDisagree">Strongly Disagree</option>
                                                <option value="disagree">Disagree</option>
                                                <option value="neutral">Neutral</option>
                                                <option value="agree">Agree</option>
                                                <option value="stronglyAgree">Strongly Agree</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Execution</label>
                                            <select
                                                value={coachEvaluationData.performance.execution}
                                                onChange={(e) => setCoachEvaluationData(prev => ({
                                                    ...prev,
                                                    performance: { ...prev.performance, execution: e.target.value as any }
                                                }))}
                                                className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="stronglyDisagree">Strongly Disagree</option>
                                                <option value="disagree">Disagree</option>
                                                <option value="neutral">Neutral</option>
                                                <option value="agree">Agree</option>
                                                <option value="stronglyAgree">Strongly Agree</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                                    <textarea
                                        value={coachEvaluationData.additionalInfo}
                                        onChange={(e) => setCoachEvaluationData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                                        rows={4}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Any additional comments or observations..."
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                                <Button
                                    type="action"
                                    onClick={() => setShowCoachEvaluationModal(false)}
                                    className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="action"
                                    onClick={submitCoachEvaluation}
                                    disabled={isSaving}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    {isSaving ? 'Submitting...' : 'Submit Evaluation'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Player Reflection Modal */}
            {showReflectionModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowReflectionModal(false)}></div>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-gray-900">Session Reflection</h3>
                                    <button
                                        onClick={() => setShowReflectionModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="text-center mb-6">
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">PRIM Framework Reflection</h4>
                                    <p className="text-gray-600">Rate your session experience on a scale of 1-5</p>
                                </div>

                                {/* PRIM Ratings */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                                        <select
                                            value={reflectionData.P}
                                            onChange={(e) => setReflectionData(prev => ({ ...prev, P: parseInt(e.target.value) }))}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        >
                                            {[1, 2, 3, 4, 5].map(num => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Relevance</label>
                                        <select
                                            value={reflectionData.R}
                                            onChange={(e) => setReflectionData(prev => ({ ...prev, R: parseInt(e.target.value) }))}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        >
                                            {[1, 2, 3, 4, 5].map(num => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Interest</label>
                                        <select
                                            value={reflectionData.I}
                                            onChange={(e) => setReflectionData(prev => ({ ...prev, I: parseInt(e.target.value) }))}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        >
                                            {[1, 2, 3, 4, 5].map(num => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Motivation</label>
                                        <select
                                            value={reflectionData.M}
                                            onChange={(e) => setReflectionData(prev => ({ ...prev, M: parseInt(e.target.value) }))}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        >
                                            {[1, 2, 3, 4, 5].map(num => (
                                                <option key={num} value={num}>{num}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Additional Fields */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Steps Taken</label>
                                    <textarea
                                        value={reflectionData.stepsTaken}
                                        onChange={(e) => setReflectionData(prev => ({ ...prev, stepsTaken: e.target.value }))}
                                        rows={3}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="What steps did you take during this session?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Feel Towards Goal</label>
                                    <textarea
                                        value={reflectionData.feelTowardsGoal}
                                        onChange={(e) => setReflectionData(prev => ({ ...prev, feelTowardsGoal: e.target.value }))}
                                        rows={3}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="How do you feel about your progress towards your goal?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                                    <textarea
                                        value={reflectionData.additionalInfo}
                                        onChange={(e) => setReflectionData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                                        rows={4}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Any additional thoughts or observations..."
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                                <Button
                                    type="action"
                                    onClick={() => {
                                        resetReflectionForm();
                                        setShowReflectionModal(false);
                                    }}
                                    className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="action"
                                    onClick={submitReflection}
                                    disabled={isSaving}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    {isSaving ? 'Submitting...' : 'Submit Reflection'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Player Self-Evaluation Modal */}
            {showSelfEvaluationModal && (
                <>
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowSelfEvaluationModal(false)}></div>
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-semibold text-gray-900">Self-Evaluation</h3>
                                    <button
                                        onClick={() => setShowSelfEvaluationModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="text-center mb-6">
                                    <h4 className="text-lg font-medium text-gray-900 mb-2">Performance Assessment</h4>
                                    <p className="text-gray-600">Rate your performance in this session</p>
                                </div>

                                {/* Performance Ratings */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Engagement</label>
                                        <select
                                            value={selfEvaluationData.performance.engagement}
                                            onChange={(e) => setSelfEvaluationData(prev => ({
                                                ...prev,
                                                performance: { ...prev.performance, engagement: e.target.value as any }
                                            }))}
                                            className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="stronglyDisagree">Strongly Disagree</option>
                                            <option value="disagree">Disagree</option>
                                            <option value="neutral">Neutral</option>
                                            <option value="agree">Agree</option>
                                            <option value="stronglyAgree">Strongly Agree</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Effort</label>
                                        <select
                                            value={selfEvaluationData.performance.effort}
                                            onChange={(e) => setSelfEvaluationData(prev => ({
                                                ...prev,
                                                performance: { ...prev.performance, effort: e.target.value as any }
                                            }))}
                                            className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="stronglyDisagree">Strongly Disagree</option>
                                            <option value="disagree">Disagree</option>
                                            <option value="neutral">Neutral</option>
                                            <option value="agree">Agree</option>
                                            <option value="stronglyAgree">Strongly Agree</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Execution</label>
                                        <select
                                            value={selfEvaluationData.performance.execution}
                                            onChange={(e) => setSelfEvaluationData(prev => ({
                                                ...prev,
                                                performance: { ...prev.performance, execution: e.target.value as any }
                                            }))}
                                            className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="stronglyDisagree">Strongly Disagree</option>
                                            <option value="disagree">Disagree</option>
                                            <option value="neutral">Neutral</option>
                                            <option value="agree">Agree</option>
                                            <option value="stronglyAgree">Strongly Agree</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Additional Information */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                                    <textarea
                                        value={selfEvaluationData.additionalInfo}
                                        onChange={(e) => setSelfEvaluationData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                                        rows={4}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Any additional comments about your performance..."
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                                <Button
                                    type="action"
                                    onClick={() => {
                                        resetSelfEvaluationForm();
                                        setShowSelfEvaluationModal(false);
                                    }}
                                    className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="action"
                                    onClick={submitSelfEvaluation}
                                    disabled={isSaving}
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    {isSaving ? 'Submitting...' : 'Submit Self-Evaluation'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}