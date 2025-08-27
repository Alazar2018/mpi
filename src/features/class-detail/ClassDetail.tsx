import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { classService } from '@/service/class.server';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'react-toastify';
import Button from '@/components/Button';
import icons from '@utils/icons.ts';

interface ClassDetails {
    _id: string;
    players: any[]; // Can be either string[] (IDs) or Player[] (full objects)
    date: string;
    to: string;
    levelPlan: string;
    goal?: string;
    sessionType: 'private' | 'semi' | 'group';
    status: 'active' | 'cancelled' | 'completed' | 'pending';
    playersCanReflect?: boolean;
    preGameAssessment?: boolean;
    objectives: {
        objective: string;
        subObjective: string;
        nestedSubObjective?: string;
        technicalStroke?: string;
        technicalProblem?: string;
        videoUrl?: string;
        tacticsType?: string;
        placementDetails?: any;
        consistencyResult?: any;
        additionalInfo?: string;
    };
    attendance?: Array<{
        player: string;
        status: 'present' | 'absent' | 'pending' | 'late' | 'excused';
    }>;
    // Player-specific data
    P?: number;
    R?: number;
    I?: number;
    M?: number;
    stepsTaken?: string;
    feelTowardsGoal?: string;
    additionalInfo?: string;
    preSessionQuestions?: {
        emotion: number;
        energy: number;
        engagement: number;
        additionalInfo?: string;
    };
    evaluations?: Array<{
        player: string;
        coachEvaluation?: {
            measurement: string;
            achievable: boolean;
            isRelevant: boolean;
            isTimeBound: boolean;
            goal: string;
            performance: {
                engagement: string;
                effort: string;
                execution: string;
            };
            additionalInfo?: string;
        };
        playerEvaluation?: {
            performance: {
                engagement: string;
                effort: string;
                execution: string;
            };
            additionalInfo?: string;
        };
    }>;
    feedback?: string;
    videos?: string[];
    photos?: string[];
    createdAt: string;
    updatedAt: string;
}

export default function ClassDetail() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Player-specific states
    const [showReflectionModal, setShowReflectionModal] = useState(false);
    const [showSelfEvaluationModal, setShowSelfEvaluationModal] = useState(false);
    const [showPreSessionQuestionsModal, setShowPreSessionQuestionsModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
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
    const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);
    const [isSubmittingSelfEvaluation, setIsSubmittingSelfEvaluation] = useState(false);
    const [isSubmittingPreSessionQuestions, setIsSubmittingPreSessionQuestions] = useState(false);

    // Role-based utility functions
    const isCurrentUserCoach = () => user?.role === 'coach';
    const isCurrentUserPlayer = () => user?.role === 'player';
    const isCurrentUserParent = () => user?.role === 'parent';
    const isClassCompleted = () => classDetails?.status === 'completed';
    const isClassActive = () => classDetails?.status === 'active';

    // Player-specific functions
    const submitReflection = async () => {
        if (!classId || !user?._id) return;
        
        try {
            setIsSubmittingReflection(true);
            await classService.addPlayerReflection(classId, reflectionData);
            toast.success('Reflection submitted successfully!');
            setShowReflectionModal(false);
            // Refresh class details to show the new reflection
            await fetchClassDetails();
        } catch (error) {
            console.error('Error submitting reflection:', error);
            toast.error('Failed to submit reflection');
        } finally {
            setIsSubmittingReflection(false);
        }
    };

    const submitSelfEvaluation = async () => {
        if (!classId || !user?._id) return;
        
        try {
            setIsSubmittingSelfEvaluation(true);
            await classService.addPlayerEvaluation(classId, selfEvaluationData);
            toast.success('Self-evaluation submitted successfully!');
            setShowSelfEvaluationModal(false);
            // Refresh class details to show the new evaluation
            await fetchClassDetails();
        } catch (error) {
            console.error('Error submitting self-evaluation:', error);
            toast.error('Failed to submit self-evaluation');
        } finally {
            setIsSubmittingSelfEvaluation(false);
        }
    };

    const submitPreSessionQuestions = async () => {
        if (!classId || !user?._id) return;
        
        try {
            setIsSubmittingPreSessionQuestions(true);
            await classService.addPreSessionQuestions(classId, preSessionQuestionsData);
            toast.success('Pre-session questions submitted successfully!');
            setShowPreSessionQuestionsModal(false);
            // Refresh class details to show the new data
            await fetchClassDetails();
        } catch (error) {
            console.error('Error submitting pre-session questions:', error);
            toast.error('Failed to submit pre-session questions');
        } finally {
            setIsSubmittingPreSessionQuestions(false);
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

    useEffect(() => {
        if (classId) {
            fetchClassDetails();
        } else {
            setIsLoading(false);
        }
    }, [classId]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isMenuOpen && !(event.target as Element).closest('.menu-dropdown')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const fetchClassDetails = async () => {
        try {
            setIsLoading(true);
            
            const response = await classService.getClass(classId!);
            
            if (response) {
                setClassDetails(response as any);
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



    const handleStatusUpdate = async (newStatus: 'active' | 'cancelled' | 'completed') => {
        if (!classDetails) return;
        
        try {
            setIsUpdating(true);
            // You would need to implement an update method in your class service
            // const response = await classService.updateClassStatus(classDetails._id, newStatus);
            
            setClassDetails(prev => prev ? { ...prev, status: newStatus } : null);
            toast.success(`Class status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating class status:', error);
            toast.error('Failed to update class status');
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading class details...</p>
                    <p className="text-sm text-gray-500 mt-2">Class ID: {classId}</p>
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
                                onClick={() => navigate('/admin/calendar')}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Class Details</h1>
                                <p className="text-gray-600">View and manage class information</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(classDetails.status)}`}>
                                {classDetails.status.charAt(0).toUpperCase() + classDetails.status.slice(1)}
                            </span>
                            
                            {/* Menu Dropdown - Only for coaches */}
                            {isCurrentUserCoach() && (
                                <div className="relative menu-dropdown">
                                    <Button
                                        type="action"
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Menu
                                    </Button>
                                    
                                    {isMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    navigate(`/admin/class/${classId}/edit`);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Edit Class Detail
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    handleStatusUpdate('completed');
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                Mark as Complete Class
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    handleStatusUpdate('cancelled');
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Cancel Class
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            <Button
                                type="action"
                                onClick={() => navigate('/admin/calendar')}
                            >
                                Back to Calendar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Class Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Class Info - Show for coaches, players see this in Overview tab */}
                        {isCurrentUserCoach() && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Class Detail</h2>
                                <div className="space-y-4">
                                    {/* Session Type */}
                                    <div className="flex items-center space-x-3">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                            {classDetails.sessionType?.charAt(0).toUpperCase() + classDetails.sessionType?.slice(1) || 'Private'}
                                        </span>
                                    </div>
                                    
                                    {/* Date and Time */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                            <p className="text-gray-900 font-medium">{formatDate(classDetails.date)}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                                            <p className="text-gray-900 font-medium">
                                                {formatTime(classDetails.date)} - {formatTime(classDetails.to)}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Level Plan */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Level Plan</label>
                                        <p className="text-gray-900 font-medium">{classDetails.levelPlan}</p>
                                    </div>
                                    
                                    {/* Level Plan Description */}
                                    {classDetails.goal && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Level Plan Description</label>
                                            <p className="text-gray-900">{classDetails.goal}</p>
                                        </div>
                                    )}
                                    
                                    {/* Class Status */}
                                    <div className="flex items-center space-x-3">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(classDetails.status)}`}>
                                            {classDetails.status.charAt(0).toUpperCase() + classDetails.status.slice(1)}
                                        </span>
                                    </div>
                                    
                                    {/* Toggle Switches - Only for coaches */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Players can reflect</span>
                                            <div className={`w-12 h-6 rounded-full transition-colors ${classDetails.playersCanReflect ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${classDetails.playersCanReflect ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Pre-game Assessment</span>
                                            <div className={`w-12 h-6 rounded-full transition-colors ${classDetails.preGameAssessment ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${classDetails.preGameAssessment ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Objectives - Show for coaches, players see this in Overview tab */}
                        {isCurrentUserCoach() && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Class Objectives</h2>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Objective</label>
                                            <p className="text-gray-900 font-medium capitalize">{classDetails.objectives.objective}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Sub Objective</label>
                                            <p className="text-gray-900 font-medium">{classDetails.objectives.subObjective}</p>
                                        </div>
                                    </div>
                                    
                                    {classDetails.objectives.nestedSubObjective && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject / Nested Objective</label>
                                            <p className="text-gray-900 font-medium">{classDetails.objectives.nestedSubObjective}</p>
                                        </div>
                                    )}

                                    {classDetails.objectives.technicalStroke && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Technical Stroke</label>
                                                <p className="text-gray-900 font-medium capitalize">{classDetails.objectives.technicalStroke}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Technical Problem</label>
                                                <p className="text-gray-900 font-medium">{classDetails.objectives.technicalProblem}</p>
                                            </div>
                                        </div>
                                    )}

                                    {classDetails.objectives.videoUrl && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                                            <a 
                                                href={classDetails.objectives.videoUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 underline"
                                            >
                                                {classDetails.objectives.videoUrl}
                                            </a>
                                        </div>
                                    )}

                                    {classDetails.objectives.tacticsType && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tactics Type</label>
                                            <p className="text-gray-900 font-medium">{classDetails.objectives.tacticsType}</p>
                                        </div>
                                    )}

                                    {classDetails.objectives.additionalInfo && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                                            <p className="text-gray-900">{classDetails.objectives.additionalInfo}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Placement Details - Show for coaches, players see this in Overview tab */}
                        {isCurrentUserCoach() && classDetails.objectives.placementDetails && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Placement Details</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(classDetails.objectives.placementDetails).map(([key, value]) => {
                                        if (key === 'total') return null;
                                        return (
                                            <div key={key}>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                </label>
                                                <p className="text-gray-900 font-medium">{String(value)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
                                    <p className="text-gray-900 font-medium">{classDetails.objectives.placementDetails.total}</p>
                                </div>
                            </div>
                        )}

                        {/* Consistency Results - Show for coaches, players see this in Overview tab */}
                        {isCurrentUserCoach() && classDetails.objectives.consistencyResult && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Consistency Results</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(classDetails.objectives.consistencyResult).map(([key, value]) => {
                                        if (key === 'total') return null;
                                        return (
                                            <div key={key}>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                </label>
                                                <p className="text-gray-900 font-medium">{String(value)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
                                    <p className="text-lg font-medium">{classDetails.objectives.consistencyResult.total}</p>
                                </div>
                            </div>
                        )}

                        {/* Player-specific sections - Only show for players and parents */}
                        {(isCurrentUserPlayer() || isCurrentUserParent()) && (
                            <>
                                {/* Tab Navigation */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="border-b border-gray-200">
                                        <nav className="-mb-px flex space-x-8">
                                            <button
                                                onClick={() => setActiveTab('overview')}
                                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                                    activeTab === 'overview'
                                                        ? 'border-blue-500 text-blue-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                            >
                                                Overview
                                            </button>
                                            {/* Only show reflection and self-evaluation tabs for players, not parents */}
                                            {isCurrentUserPlayer() && (
                                                <button
                                                    onClick={() => setActiveTab('reflection')}
                                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                                        activeTab === 'reflection'
                                                            ? 'border-purple-500 text-purple-600'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    Session Reflection
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setActiveTab('evaluation')}
                                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                                    activeTab === 'evaluation'
                                                        ? 'border-blue-500 text-blue-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                }`}
                                            >
                                                Coach's Evaluation
                                            </button>
                                            {/* Only show pre-session assessment tab for players, not parents */}
                                            {isCurrentUserPlayer() && (
                                                <button
                                                    onClick={() => setActiveTab('assessment')}
                                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                                        activeTab === 'assessment'
                                                            ? 'border-orange-500 text-orange-600'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    Pre-Session Assessment
                                                </button>
                                            )}
                                            {/* Only show self-evaluation tab for players, not parents */}
                                            {isCurrentUserPlayer() && (
                                                <button
                                                    onClick={() => setActiveTab('self-evaluation')}
                                                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                                        activeTab === 'self-evaluation'
                                                            ? 'border-indigo-500 text-indigo-600'
                                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                    }`}
                                                >
                                                    Self-Evaluation
                                                </button>
                                            )}
                                        </nav>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="mt-6">
                                        {activeTab === 'overview' && (
                                            <div className="space-y-6">
                                                {/* Basic Class Info */}
                                                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
                                                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Session Overview</h3>
                                                    <div className="space-y-4">
                                                        {/* Session Type */}
                                                        <div className="flex items-center space-x-3">
                                                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                                                {classDetails.sessionType?.charAt(0).toUpperCase() + classDetails.sessionType?.slice(1) || 'Private'}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Date and Time */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-700">Date:</span>
                                                                <p className="text-gray-900 font-medium">{formatDate(classDetails.date)}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-700">Time:</span>
                                                                <p className="text-gray-900 font-medium">
                                                                    {formatTime(classDetails.date)} - {formatTime(classDetails.to)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Level Plan */}
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-700">Level Plan:</span>
                                                            <p className="text-gray-900 font-medium capitalize">{classDetails.levelPlan}</p>
                                                        </div>
                                                        
                                                        {/* Level Plan Description */}
                                                        {classDetails.goal && (
                                                            <div>
                                                                <span className="text-sm font-medium text-gray-700">Session Goal:</span>
                                                                <p className="text-gray-900">{classDetails.goal}</p>
                                                            </div>
                                                        )}
                                                        
                                                        {/* Class Status */}
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-sm font-medium text-gray-700">Status:</span>
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(classDetails.status)}`}>
                                                                {classDetails.status.charAt(0).toUpperCase() + classDetails.status.slice(1)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Class Objectives */}
                                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Class Objectives</h3>
                                                    <div className="space-y-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Objective</label>
                                                                <p className="text-gray-900 font-medium capitalize">{classDetails.objectives.objective}</p>
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Sub Objective</label>
                                                                <p className="text-gray-900 font-medium">{classDetails.objectives.subObjective}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        {classDetails.objectives.nestedSubObjective && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Subject / Nested Objective</label>
                                                                <p className="text-gray-900 font-medium">{classDetails.objectives.nestedSubObjective}</p>
                                                            </div>
                                                        )}

                                                        {classDetails.objectives.technicalStroke && (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Technical Stroke</label>
                                                                    <p className="text-gray-900 font-medium capitalize">{classDetails.objectives.technicalStroke}</p>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Technical Problem</label>
                                                                    <p className="text-gray-900 font-medium">{classDetails.objectives.technicalProblem}</p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {classDetails.objectives.videoUrl && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                                                                <a 
                                                                    href={classDetails.objectives.videoUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800 underline"
                                                                >
                                                                    {classDetails.objectives.videoUrl}
                                                                </a>
                                                            </div>
                                                        )}

                                                        {classDetails.objectives.tacticsType && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Tactics Type</label>
                                                                <p className="text-gray-900 font-medium">{classDetails.objectives.tacticsType}</p>
                                                            </div>
                                                        )}

                                                        {classDetails.objectives.additionalInfo && (
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                                                                <p className="text-gray-900">{classDetails.objectives.additionalInfo}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Placement Details */}
                                                {classDetails.objectives.placementDetails && (
                                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Placement Details</h3>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            {Object.entries(classDetails.objectives.placementDetails).map(([key, value]) => {
                                                                if (key === 'total') return null;
                                                                return (
                                                                    <div key={key}>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                                        </label>
                                                                        <p className="text-gray-900 font-medium">{String(value)}</p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
                                                            <p className="text-gray-900 font-medium">{classDetails.objectives.placementDetails.total}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Consistency Results */}
                                                {classDetails.objectives.consistencyResult && (
                                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Consistency Results</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {Object.entries(classDetails.objectives.consistencyResult).map(([key, value]) => {
                                                                if (key === 'total') return null;
                                                                return (
                                                                    <div key={key}>
                                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                                                        </label>
                                                                        <p className="text-gray-900 font-medium">{String(value)}</p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">Total</label>
                                                            <p className="text-lg font-medium">{classDetails.objectives.consistencyResult.total}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {classDetails.feedback && (
                                                    <div className="bg-gray-50 p-6 rounded-lg">
                                                        <h3 className="text-lg font-medium text-gray-900 mb-4">Coach's General Feedback</h3>
                                                        <p className="text-gray-900">{classDetails.feedback}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'reflection' && (
                                            <div className="space-y-6">
                                                {classDetails.playersCanReflect && isClassCompleted() ? (
                                                    <>
                                                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
                                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Session Reflection</h3>
                                                            <p className="text-purple-700 dark:text-purple-300">
                                                                {isCurrentUserPlayer() 
                                                                    ? "Share your thoughts about this session using the PRIM framework"
                                                                    : "Player's reflection for this session"
                                                                }
                                                            </p>
                                                        </div>
                                                        
                                                        {/* Check if current player has already submitted a reflection */}
                                                        {classDetails.P && classDetails.P !== null ? (
                                                            <div className="space-y-4">
                                                                <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                                                                    {isCurrentUserPlayer() ? "Your reflection for this session:" : "Player's reflection for this session:"}
                                                                </p>
                                                                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-200 dark:border-purple-700 shadow-md">
                                                                    <div className="grid grid-cols-2 gap-6 mb-6">
                                                                        <div className="text-center">
                                                                            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{classDetails.P}</span>
                                                                            </div>
                                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">/5</p>
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{classDetails.R}</span>
                                                                            </div>
                                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Relevance</p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">/5</p>
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                                <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">{classDetails.I}</span>
                                                                            </div>
                                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Interest</p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">/5</p>
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{classDetails.M}</span>
                                                                            </div>
                                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Motivation</p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400">/5</p>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="space-y-4">
                                                                        {classDetails.stepsTaken && (
                                                                            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Steps Taken:</span>
                                                                                <p className="text-gray-900 dark:text-white mt-2">{classDetails.stepsTaken}</p>
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {classDetails.feelTowardsGoal && (
                                                                            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Feel Towards Goal:</span>
                                                                                <p className="text-gray-900 dark:text-white mt-2">{classDetails.feelTowardsGoal}</p>
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {classDetails.additionalInfo && (
                                                                            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Additional Notes:</span>
                                                                                <p className="text-gray-900 dark:text-white mt-2">{classDetails.additionalInfo}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="text-center">
                                                                <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
                                                                    {isCurrentUserPlayer() 
                                                                        ? "Share your thoughts about this session:" 
                                                                        : "No reflection submitted yet for this session."
                                                                    }
                                                                </p>
                                                                {isCurrentUserPlayer() && (
                                                                    <button
                                                                        onClick={() => setShowReflectionModal(true)}
                                                                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-lg"
                                                                    >
                                                                        <div className="flex items-center space-x-2">
                                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                            </svg>
                                                                            <span>Add Reflection</span>
                                                                        </div>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-gray-700 dark:text-gray-300 text-lg mb-2">Reflection Not Available</p>
                                                        <p className="text-gray-500 dark:text-gray-400">Your coach has not enabled reflection for this session yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'evaluation' && (
                                            <div className="space-y-6">
                                                {isClassCompleted() ? (
                                                    <>
                                                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                                                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Coach's Evaluation</h3>
                                                            <p className="text-blue-700">Your coach's feedback and assessment</p>
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
                                                    </>
                                                ) : (
                                                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-gray-700 text-lg mb-2">Evaluation Not Available Yet</p>
                                                        <p className="text-gray-500">Coach evaluations will be available after the class is completed.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'assessment' && isCurrentUserPlayer() && (
                                            <div className="space-y-6">
                                                {isClassCompleted() && classDetails.preSessionQuestions && Object.keys(classDetails.preSessionQuestions).length > 0 ? (
                                                    <>
                                                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-200">
                                                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Pre-Session Assessment</h3>
                                                            <p className="text-orange-700">Your pre-session self-assessment</p>
                                                        </div>
                                                        
                                                        <div className="p-6 bg-white rounded-xl border border-orange-200 shadow-md">
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
                                                                            classDetails.preSessionQuestions.energy >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-red-100 text-red-800'
                                                                        }`}>
                                                                            {classDetails.preSessionQuestions.engagement || 'Not rated'}/5
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-gray-700 text-lg mb-2">Pre-Session Assessment Not Available</p>
                                                        <p className="text-gray-500">This feature will be available after the class is completed.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {activeTab === 'self-evaluation' && (
                                            <div className="space-y-6">
                                                {isClassCompleted() ? (
                                                    <>
                                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-6 rounded-xl border border-indigo-200 dark:border-indigo-700">
                                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                                                                {isCurrentUserPlayer() ? "Your Self-Evaluation" : "Player's Self-Evaluation"}
                                                            </h3>
                                                            <p className="text-indigo-700 dark:text-indigo-300">
                                                                {isCurrentUserPlayer() 
                                                                    ? "Rate your own performance in this session"
                                                                    : "Player's performance assessment for this session"
                                                                }
                                                            </p>
                                                        </div>
                                                        
                                                        {/* Check if player has already submitted a self-evaluation */}
                                                        {classDetails.evaluations && classDetails.evaluations.length > 0 && classDetails.evaluations.find((evaluation: any) => 
                                                            evaluation.player === user?._id && evaluation.playerEvaluation
                                                        ) ? (
                                                            <div className="space-y-4">
                                                                <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
                                                                    {isCurrentUserPlayer() ? "Your self-evaluation for this session:" : "Player's self-evaluation for this session:"}
                                                                </p>
                                                                {classDetails.evaluations.map((evaluation: any, index: number) => (
                                                                    <div key={index} className="p-6 bg-white dark:bg-gray-800 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 shadow-md">
                                                                        {evaluation.player === user?._id && evaluation.playerEvaluation && (
                                                                            <>
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-center">
                                                                                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                                            <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Engagement</p>
                                                                                        <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 capitalize">{evaluation.playerEvaluation.performance?.engagement}</p>
                                                                                    </div>
                                                                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-center">
                                                                                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                                            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Effort</p>
                                                                                        <p className="text-lg font-semibold text-purple-600 dark:text-purple-400 capitalize">{evaluation.playerEvaluation.performance?.effort}</p>
                                                                                    </div>
                                                                                    <div className="p-4 bg-pink-50 dark:bg-pink-900/30 rounded-lg text-center md:col-span-2">
                                                                                        <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                                            <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                                            </svg>
                                                                                        </div>
                                                                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Execution</p>
                                                                                        <p className="text-lg font-semibold text-pink-600 dark:text-pink-400 capitalize">{evaluation.playerEvaluation.performance?.execution}</p>
                                                                                    </div>
                                                                                </div>
                                                                                
                                                                                {evaluation.playerEvaluation.additionalInfo && (
                                                                                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Additional Notes</span>
                                                                                        <p className="text-gray-900 dark:text-white mt-2">{evaluation.playerEvaluation.additionalInfo}</p>
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center">
                                                                <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
                                                                    {isCurrentUserPlayer() 
                                                                        ? "Rate your own performance in this session:" 
                                                                        : "No self-evaluation submitted yet for this session."
                                                                    }
                                                                </p>
                                                                {isCurrentUserPlayer() && (
                                                                    <button
                                                                    onClick={() => setShowSelfEvaluationModal(true)}
                                                                    className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-lg"
                                                                >
                                                                    <div className="flex items-center space-x-2">
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                        <span>Rate My Performance</span>
                                                                    </div>
                                                                </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-gray-700 text-lg mb-2">Self-Evaluation Not Available Yet</p>
                                                        <p className="text-gray-500">You can evaluate your performance after the class is completed.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Right Column - Players and Actions */}
                    <div className="space-y-6">
                        {/* Players - Show for coaches only */}
                        {isCurrentUserCoach() && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">List of players</h2>
                                <div className="space-y-3">
                                    {classDetails.players && classDetails.players.length > 0 ? (
                                        classDetails.players.map((player: any) => {
                                            // Get attendance status for this player
                                            const attendance = classDetails.attendance?.find((a: any) => a.player === player._id || a.player === player);
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
                                            
                                            // Handle both string IDs and full player objects
                                            const playerName = typeof player === 'string' ? player : `${player.firstName} ${player.lastName}`;
                                            const playerAvatar = typeof player === 'string' ? null : player.avatar;
                                            
                                            return (
                                                <div key={typeof player === 'string' ? player : player._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        {playerAvatar ? (
                                                            <img 
                                                                src={playerAvatar} 
                                                                alt={playerName}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-medium text-blue-600">
                                                                {typeof player === 'string' ? player.charAt(0) : player.firstName.charAt(0)}{typeof player === 'string' ? '' : player.lastName.charAt(0)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900">{playerName}</p>
                                                    </div>
                                                    <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                                                        {getStatusText(status)}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">No players assigned to this class</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status Management - Only for coaches */}
                        {isCurrentUserCoach() && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Status</h2>
                                <div className="space-y-3">
                                    <Button
                                        type="action"
                                        onClick={() => handleStatusUpdate('active')}
                                        disabled={isUpdating || classDetails.status === 'active'}
                                        className="w-full"
                                    >
                                        Set to Active
                                    </Button>
                                    <Button
                                        type="action"
                                        onClick={() => handleStatusUpdate('cancelled')}
                                        disabled={isUpdating || classDetails.status === 'cancelled'}
                                        className="w-full"
                                    >
                                        Set to Cancelled
                                    </Button>
                                    <Button
                                        type="action"
                                        onClick={() => handleStatusUpdate('completed')}
                                        disabled={isUpdating || classDetails.status === 'completed'}
                                        className="w-full"
                                    >
                                        Set to Completed
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Class Metadata */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Class Metadata</h2>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <span className="text-gray-500">Created:</span>
                                    <p className="text-gray-900">{formatDate(classDetails.createdAt)}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Last Updated:</span>
                                    <p className="text-gray-900">{formatDate(classDetails.updatedAt)}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Class ID:</span>
                                    <p className="text-gray-900 font-mono text-xs">{classDetails._id}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals for Player Functionality */}
            {/* Reflection Modal - Only for Players */}
            {showReflectionModal && isCurrentUserPlayer() && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Session Reflection</h3>
                            <p className="text-sm text-gray-500 mt-1">Rate your session experience using the PRIM framework</p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* PRIM Ratings */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Purpose (1-5)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={reflectionData.P}
                                        onChange={(e) => setReflectionData(prev => ({ ...prev, P: parseInt(e.target.value) }))}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Relevance (1-5)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={reflectionData.R}
                                        onChange={(e) => setReflectionData(prev => ({ ...prev, R: parseInt(e.target.value) }))}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Interest (1-5)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={reflectionData.I}
                                        onChange={(e) => setReflectionData(prev => ({ ...prev, I: parseInt(e.target.value) }))}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivation (1-5)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={reflectionData.M}
                                        onChange={(e) => setReflectionData(prev => ({ ...prev, M: parseInt(e.target.value) }))}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Additional Fields */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Steps Taken</label>
                                <textarea
                                    value={reflectionData.stepsTaken}
                                    onChange={(e) => setReflectionData(prev => ({ ...prev, stepsTaken: e.target.value }))}
                                    rows={3}
                                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="What steps did you take during this session?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Feel Towards Goal</label>
                                <textarea
                                    value={reflectionData.feelTowardsGoal}
                                    onChange={(e) => setReflectionData(prev => ({ ...prev, feelTowardsGoal: e.target.value }))}
                                    rows={3}
                                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="How do you feel about your progress towards your goal?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                                <textarea
                                    value={reflectionData.additionalInfo}
                                    onChange={(e) => setReflectionData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                                    rows={3}
                                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    placeholder="Any additional thoughts or comments..."
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
                                disabled={isSubmittingReflection}
                                className="bg-purple-600 text-white hover:bg-purple-700"
                            >
                                {isSubmittingReflection ? 'Submitting...' : 'Submit Reflection'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Self-Evaluation Modal - Only for Players */}
            {showSelfEvaluationModal && isCurrentUserPlayer() && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Self-Evaluation</h3>
                            <p className="text-sm text-gray-500 mt-1">Rate your performance in this session</p>
                        </div>
                        
                        <div className="p-6 space-y-6">
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
                                disabled={isSubmittingSelfEvaluation}
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                {isSubmittingSelfEvaluation ? 'Submitting...' : 'Submit Self-Evaluation'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pre-Session Questions Modal - Only for Players */}
            {showPreSessionQuestionsModal && isCurrentUserPlayer() && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">Pre-Session Assessment</h3>
                            <p className="text-sm text-gray-500 mt-1">Rate your current state before the session</p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Rating Scales */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Emotional State (1-5)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={preSessionQuestionsData.emotion}
                                        onChange={(e) => setPreSessionQuestionsData(prev => ({ ...prev, emotion: parseInt(e.target.value) }))}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">1 = Very Low, 5 = Very High</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Energy Level (1-5)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={preSessionQuestionsData.energy}
                                        onChange={(e) => setPreSessionQuestionsData(prev => ({ ...prev, energy: parseInt(e.target.value) }))}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">1 = Very Low, 5 = Very High</p>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Engagement (1-5)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={preSessionQuestionsData.engagement}
                                        onChange={(e) => setPreSessionQuestionsData(prev => ({ ...prev, engagement: parseInt(e.target.value) }))}
                                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">1 = Very Low, 5 = Very High</p>
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
                                <textarea
                                    value={preSessionQuestionsData.additionalInfo}
                                    onChange={(e) => setPreSessionQuestionsData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                                    rows={4}
                                    className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Any additional comments about your current state..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                            <Button
                                type="action"
                                onClick={() => {
                                    resetPreSessionQuestionsForm();
                                    setShowPreSessionQuestionsModal(false);
                                }}
                                className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                            >
                                Reset
                            </Button>
                            <Button
                                type="action"
                                onClick={submitPreSessionQuestions}
                                disabled={isSubmittingPreSessionQuestions}
                                className="bg-orange-600 text-white hover:bg-orange-700"
                            >
                                {isSubmittingPreSessionQuestions ? 'Submitting...' : 'Submit Assessment'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
