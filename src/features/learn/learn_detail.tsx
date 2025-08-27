import { useNavigate, useParams } from "react-router";
import Button from "@/components/Button";
import DefaultPage from "@/components/DefaultPage";
import icons from "@/utils/icons";
import Assessment from "./Assessment";
import { useState, useEffect, useCallback } from "react";
import { useLearn } from "@/hooks/useLearn";

import { learnService } from "@/service/learn.server";
import { toast } from "react-toastify";

export default function LearnDetail() {
    const params = useParams();
    const navigate = useNavigate();
    const { getModuleDetails, currentModule, loading, error } = useLearn();
    const [selectedWeek, setSelectedWeek] = useState<any>(null);
    const [showAssessmentId, setShowAssessmentId] = useState<string | null>(null);
    const [assessmentProgress, setAssessmentProgress] = useState<{ [id: string]: number }>({});
    const [assessmentCompleted, setAssessmentCompleted] = useState<{ [id: string]: boolean }>({});

    const [collapsedItems, setCollapsedItems] = useState<{ [id: string]: boolean }>({});
    const [assessmentAttempts, setAssessmentAttempts] = useState<{ [id: string]: number }>({});
    const [showRetryPrompt, setShowRetryPrompt] = useState<{ [id: string]: boolean }>({});
    const [forceUpdate, setForceUpdate] = useState(0);
    const [updatedModuleData, setUpdatedModuleData] = useState<any>(null);

    // Header component with breadcrumb
    const LearnHeader = () => (
        <div className="bg-[var(--bg-card)] border-b border-[var(--border-primary)] mb-6 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
                    <div className="mb-4 sm:mb-0">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/admin/learn?showList=true')}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                            >
                                ← Back to Learn
                            </button>
                        </div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)] mt-2">
                            {currentModule?.title || 'Learning Module'}
                        </h1>
                        <p className="text-[var(--text-secondary)] mt-1">Master tennis skills with structured learning</p>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1">
                        <button
                            onClick={() => navigate('/admin/learn?showList=true')}
                            className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            My Courses
                        </button>
                        <button
                            onClick={() => navigate('/admin/learn?tab=marketplace')}
                            className="px-4 py-2 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            Find Coach
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Fetch module details when component mounts
    useEffect(() => {
        if (params.moduleId) {
            getModuleDetails(params.moduleId);
        }
    }, [params.moduleId, getModuleDetails]);

    // Reset updated module data when module changes
    useEffect(() => {
        if (currentModule) {
            setUpdatedModuleData(null);
        }
    }, [currentModule?._id]);

    // Auto-collapse completed items when week is selected
    useEffect(() => {
        if (selectedWeek && selectedWeek.contentItems) {
            const initialCollapsedState: { [id: string]: boolean } = {};
            
            selectedWeek.contentItems.forEach((item: any) => {
                const isCompleted = item.progress?.status === 'completed' || 
                                  item.completed || 
                                  assessmentCompleted[item._id];
                
                // Auto-collapse completed items
                if (isCompleted) {
                    initialCollapsedState[item._id] = true;
                }
            });
            
            setCollapsedItems(prev => ({ ...prev, ...initialCollapsedState }));
        }
    }, [selectedWeek, assessmentCompleted]);

    // Function to recalculate week progress based on current state
    const recalculateWeekProgress = useCallback((week: any) => {
        if (!week.contentItems) return week;
        
        const totalItems = week.contentItems.length;
        const completedItems = week.contentItems.filter((item: any) => 
            item.progress?.status === 'completed' || 
            item.completed || 
            assessmentCompleted[item._id]
        ).length;
        const percentageCompleted = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        
        return {
            ...week,
            progress: {
                ...week.progress,
                completedItems,
                totalItems,
                percentageCompleted
            }
        };
    }, [assessmentCompleted]);

    // Function to calculate real-time module progress
    const calculateRealTimeModuleProgress = useCallback(() => {
        const weeks = updatedModuleData?.weeks || currentModule?.weeks;
        if (!weeks) return { totalWeeks: 0, completedWeeks: 0, totalContentItems: 0, completedContentItems: 0, completionPercentage: 0 };
        
        let totalContentItems = 0;
        let completedContentItems = 0;
        let completedWeeks = 0;
        
        weeks.forEach((week: any) => {
            const recalculatedWeek = recalculateWeekProgress(week);
            totalContentItems += recalculatedWeek.progress.totalItems;
            completedContentItems += recalculatedWeek.progress.completedItems;
            
            if (recalculatedWeek.progress.percentageCompleted === 100) {
                completedWeeks++;
            }
        });
        
        const completionPercentage = totalContentItems > 0 ? Math.round((completedContentItems / totalContentItems) * 100) : 0;
        
        const result = {
            totalWeeks: weeks.length,
            completedWeeks,
            totalContentItems,
            completedContentItems,
            completionPercentage
        };
        
      
        
        return result;
    }, [updatedModuleData, currentModule, recalculateWeekProgress]);

    // Force re-render when assessment completion state changes
    useEffect(() => {
        if (currentModule?.weeks) {
            // This will trigger a re-render and recalculate week progress
            setForceUpdate(prev => prev + 1);
        }
    }, [assessmentCompleted, currentModule?.weeks]);

    // Handler to update assessment progress from Assessment component
    const handleAssessmentProgress = useCallback((id: string, percent: number) => {
        setAssessmentProgress((prev) => {
            // Only update if the score actually changed to prevent infinite loops
            if (prev[id] !== percent) {
                return { ...prev, [id]: percent };
            }
            return prev;
        });
    }, []);
    
    const handleAssessmentSubmit = async (id: string) => {
        try {
            
            // Get assessment data from the Assessment component
            const assessmentData = {
                score: assessmentProgress[id] || 0,
                answers: [], // This would come from the Assessment component
                timeSpent: 0, // This would be tracked in the Assessment component
            };

          

            // Check if score meets minimum requirement (80%)
            if (assessmentData.score < 80) {
               

                // Show retry prompt for low scores using toast
                toast.warning(
                    `Your score is ${assessmentData.score}%. You need at least 80% to pass.`,
                    {
                        position: "top-center",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        toastId: `assessment-${id}-low-score`,
                    }
                );
                
                // Show retry interface instead of closing
                setShowRetryPrompt((prev) => ({ ...prev, [id]: true }));
                // Close assessment view to show retry prompt
                setShowAssessmentId(null);
                return; // Don't submit, let user retry
            }

           

            // Score is 80% or higher, submit assessment
            try {
                

                await passAssessment(id, assessmentData.score, assessmentData.answers, assessmentData.timeSpent);

              

                // Update local state
                setAssessmentCompleted((prev) => ({ ...prev, [id]: true }));
                setAssessmentProgress((prev) => ({ ...prev, [id]: 100 }));

                // Mark content as complete and collapse it
               

                await handleContentComplete(id, 'quiz');
                
            

                // Close the assessment view
                setShowAssessmentId(null);
                
                // Reset retry prompt for this assessment
                setShowRetryPrompt((prev) => ({ ...prev, [id]: false }));
                
                // Reset attempt counter on success
                setAssessmentAttempts((prev) => ({ ...prev, [id]: 0 }));
                
                // Refresh module data to ensure progression is reflected
                if (params.moduleId) {
                  
                    await getModuleDetails(params.moduleId);
                }
                
                // Force re-render by updating the module state
                // This ensures the week accessibility logic recalculates
                if (currentModule?.weeks) {
                    // Trigger a re-render by updating the module state
                    // The recalculateWeekProgress function will handle the rest
                }
                
                // Show success message using toast
                toast.success(
                    `Congratulations! You passed the assessment with ${assessmentData.score}%!`,
                    {
                        position: "top-center",
                        autoClose: 4000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    }
                );
                
            } catch (apiError: any) {
                // Handle specific API errors
                if (apiError.response?.status === 400) {
                    const errorMessage = apiError.response.data?.message || 'Assessment submission failed';
                    
                    if (errorMessage.includes('80%')) {
                        // Score requirement not met
                        toast.error(
                            `${errorMessage}\n\nYour current score: ${assessmentData.score}%`,
                            {
                                position: "top-center",
                                autoClose: 6000,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: true,
                                progress: undefined,
                                toastId: `assessment-${id}-api-error`,
                            }
                        );
                        
                        // Show retry interface
                        setShowRetryPrompt((prev) => ({ ...prev, [id]: true }));
                        // Close assessment view to show retry prompt
                        setShowAssessmentId(null);
                    } else {
                        // Other 400 error
                        toast.error(`Assessment Error: ${errorMessage}`, {
                            position: "top-center",
                            autoClose: 5000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                        setShowAssessmentId(null);
                    }
                } else {
                    // Other errors
                    toast.error(`Assessment Error: ${apiError.message || 'Something went wrong'}`, {
                        position: "top-center",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                    });
                    setShowAssessmentId(null);
                }
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            toast.error('An unexpected error occurred. Please try again.', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };
    


    // API function to complete video using learnService
    const completeVideo = async (videoId: string, watchTime?: number) => {
        try {
            

            const response = await learnService.completeVideo(videoId, {
                watchTime: watchTime || 0,
                completedAt: new Date().toISOString()
            });

            
            return response;
        } catch (error) {
            console.error('❌ Error completing video:', {
                videoId,
                error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    };

    // API function to pass assessment using learnService
    const passAssessment = async (assessmentId: string, score: number, answers: any[], timeSpent: number) => {
        try {
            

            const response = await learnService.passAssessment(assessmentId, {
                score,
                answers: answers.map((answer, index) => ({
                    questionId: `question_${index}`,
                    answer: answer
                })),
                timeSpent,
                completedAt: new Date().toISOString()
            });

            
            return response;
        } catch (error) {
            console.error('❌ Error passing assessment:', {
                assessmentId,
                score,
                error,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    };

    // Handler to retry assessment
    const handleAssessmentRetry = (id: string) => {
        // Reset assessment progress
        setAssessmentProgress((prev) => ({ ...prev, [id]: 0 }));
        // Hide retry prompt
        setShowRetryPrompt((prev) => ({ ...prev, [id]: false }));
        // Increment attempt counter
        setAssessmentAttempts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
        // Show assessment interface again
        setShowAssessmentId(id);
        
        toast.info('Assessment reset. You can try again!', {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
        });
    };

    // Handler to mark content items as complete
    const handleContentComplete = async (contentId: string, contentType: string) => {
        try {
            

            if (contentType === 'video') {
                // Complete video via API
                await completeVideo(contentId);
            } else if (contentType === 'quiz') {
                // Assessment completion is handled separately via handleAssessmentSubmit
                return;
            }

            // Update local state
            if (selectedWeek && currentModule) {
                const updatedContentItems = selectedWeek.contentItems.map((item: any) => 
                    item._id === contentId ? { ...item, completed: true } : item
                );
                
                const updatedWeek = { ...selectedWeek, contentItems: updatedContentItems };
                setSelectedWeek(updatedWeek);
                
                // Update the current module's weeks
                if (currentModule.weeks) {
                    const updatedWeeks = currentModule.weeks.map((week: any) => 
                        week._id === selectedWeek._id ? updatedWeek : week
                    );
                    
                    // Update progress calculations - check all completion indicators
                    const totalItems = updatedWeek.contentItems.length;
                    const completedItems = updatedWeek.contentItems.filter((item: any) => 
                        item.progress?.status === 'completed' || 
                        item.completed || 
                        assessmentCompleted[item._id]
                    ).length;
                    const percentageCompleted = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                    
                    updatedWeek.progress = {
                        ...updatedWeek.progress,
                        completedItems,
                        totalItems,
                        percentageCompleted
                    };
                    
                   
                    
                    // Update the current module with new weeks data

                    
                    // Update the module state to reflect the new progress
                    // This ensures the UI shows the updated progress
                    if (currentModule.weeks) {
                        const updatedWeeksWithProgress = currentModule.weeks.map((week: any) => 
                            week._id === selectedWeek._id ? updatedWeek : week
                        );
                        
                        // Create updated module with new progress
                        const updatedModuleWithProgress = {
                            ...currentModule,
                            weeks: updatedWeeksWithProgress
                        };
                        
                        // Update the local module state to reflect changes
                        setUpdatedModuleData(updatedModuleWithProgress);
                        
                        // Force a re-render by updating the module state
                        // This will trigger the week accessibility logic to recalculate
                       
                    }
                    
                    // Update the current module
                   
                    
                    // Check if week is now complete
                    if (percentageCompleted === 100) {
                        

                        toast.success('Week completed! Next week is now accessible.', {
                            position: "top-center",
                            autoClose: 4000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true,
                            progress: undefined,
                        });
                        
                        // Auto-select next week if available
                        if (currentModule.weeks) {
                            const currentWeekIndex = currentModule.weeks.findIndex((w: any) => w._id === selectedWeek._id);
                            const nextWeek = currentModule.weeks[currentWeekIndex + 1];
                            if (nextWeek) {
                               

                                // Wait a moment then auto-select next week
                                setTimeout(() => {
                                   
                                    setSelectedWeek(nextWeek);
                                    toast.info(`Auto-selected next week: ${nextWeek.title}`, {
                                        position: "top-center",
                                        autoClose: 3000,
                                        hideProgressBar: false,
                                        closeOnClick: true,
                                        pauseOnHover: true,
                                        draggable: true,
                                        progress: undefined,
                                    });
                                }, 2000);
                            } else {
                                toast.info('ℹ️ No next week available for auto-selection');
                            }
                        }
                    } 
                }

                // Collapse the completed item by default
                setCollapsedItems(prev => ({ ...prev, [contentId]: true }));
                
                // Show success message
                toast.success(`${contentType === 'video' ? 'Video' : 'Content'} completed successfully!`, {
                    position: "top-center",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                });
                
                // Refresh module data to ensure progression is reflected
                if (params.moduleId) {
                    await getModuleDetails(params.moduleId);
                }
            }
        } catch (error) {
            console.error('Error completing content:', error);
            toast.error('Failed to complete content. Please try again.', {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    if (loading) {
        return (
            <DefaultPage className="!py-4 md:!py-6" title="Loading...">
                <LearnHeader />
                <div className="text-center py-8">Loading module details...</div>
            </DefaultPage>
        );
    }

    if (error || !currentModule) {
        return (
            <DefaultPage className="!py-4 md:!py-6" title="Error">
                <LearnHeader />
                <div className="text-center py-8">
                    <div className="text-red-600 mb-4">{error || 'Module not found'}</div>
                    <Button onClick={() => navigate('/admin/learn?showList=true')} type="primary">
                        Back to Modules
                    </Button>
                </div>
            </DefaultPage>
        );
    }

    return (
        <DefaultPage className="!py-4 md:!py-6" title={currentModule.title || 'Module Details'}>
            <LearnHeader />
            
            {/* Top Navigation Bar */}
            <div className="mb-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => navigate('/admin/learn?showList=true')} 
                        type="neutral"
                        className="flex items-center gap-2"
                    >
                        <i className="*:size-4" dangerouslySetInnerHTML={{ __html: icons.back }} />
                        Back to Modules
                    </Button>
                    <span className="text-[var(--text-tertiary)]">|</span>
                    <span className="text-sm text-[var(--text-secondary)]">Currently viewing: <strong className="text-[var(--text-primary)]">{currentModule.title}</strong></span>
                </div>
                <Button 
                    onClick={() => navigate('/admin/learn?showList=true')} 
                    type="primary"
                    className="flex items-center gap-2"
                >
                    <i className="*:size-4" dangerouslySetInnerHTML={{ __html: icons.menu }} />
                    See All Modules
                </Button>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Content Area */}
                <div className="lg:col-span-2">
                    {/* Content Display Area */}
                    <div className="bg-[var(--bg-card)] rounded-lg min-h-[500px] transition-colors duration-300">
                        {selectedWeek ? (
                            <div className="p-6">
                                {/* Week Header */}
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{selectedWeek.title}</h2>
                                    <p className="text-[var(--text-secondary)]">{selectedWeek.description}</p>
                                </div>
                                
                                {/* Content Items */}
                                {selectedWeek.contentItems && selectedWeek.contentItems.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedWeek.contentItems
                                            .sort((a: any, b: any) => a.order - b.order)
                                            .map((contentItem: any, index: number) => {
                                                // Check if this item is accessible (previous item completed or first item)
                                                const isFirstItem = index === 0;
                                                const previousItem = index > 0 ? selectedWeek.contentItems[index - 1] : null;
                                                
                                                // Check completion status from progress or local state
                                                const isCompleted = contentItem.progress?.status === 'completed' || 
                                                                  contentItem.completed || 
                                                                  assessmentCompleted[contentItem._id];
                                                
                                                const isAccessible = isFirstItem || (previousItem && (
                                                    previousItem.progress?.status === 'completed' || 
                                                    previousItem.completed || 
                                                    assessmentCompleted[previousItem._id]
                                                ));
                                                
                                                // Debug logging for completion status
                                               
                                                return (
                                                <div key={contentItem._id} className={`bg-[var(--bg-secondary)] rounded-lg transition-all duration-200 relative ${
                                                    !isAccessible ? 'opacity-60 cursor-not-allowed grayscale' : ''
                                                } ${isCompleted ? 'ring-2 ring-green-200 dark:ring-green-800 bg-[var(--bg-card)]' : ''}`}>
                                                    {/* Lock Overlay for Inaccessible Content */}
                                                    {!isAccessible && (
                                                        <div className="absolute inset-0 bg-[var(--bg-tertiary)] bg-opacity-20 rounded-lg flex items-center justify-center">
                                                            <div className="bg-[var(--bg-card)] bg-opacity-90 rounded-full p-3 shadow-lg">
                                                                <span className="text-2xl text-[var(--text-tertiary)]">🔒</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {/* Header with Collapse/Expand */}
                                                    <div className="p-4">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                                                isCompleted ? 'bg-green-500' :
                                                                contentItem.type === 'video' ? 'bg-red-500' : 'bg-purple-500'
                                                            }`}>
                                                                {isCompleted ? '✓' : contentItem.type === 'video' ? '▶' : '?'}
                                                            </div>
                                                            <div className="flex-1">
                                                                <h3 className={`font-medium ${isCompleted ? 'text-green-800 dark:text-green-200' : isAccessible ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                                                                    {isAccessible ? contentItem.title : `🔒 ${contentItem.title}`}
                                                                    {isCompleted && collapsedItems[contentItem._id] && (
                                                                        <span className="ml-2 text-xs text-[var(--text-secondary)]">(Collapsed)</span>
                                                                    )}
                                                                </h3>
                                                                {isAccessible ? (
                                                                    <p className="text-sm text-[var(--text-secondary)]">{contentItem.description}</p>
                                                                ) : (
                                                                    <div className="text-sm text-[var(--text-tertiary)] italic">
                                                                        Content locked - complete previous item to unlock
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-1 rounded">
                                                                    {contentItem.order}
                                                                </span>
                                                                {contentItem.type === 'quiz' && (
                                                                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                                                                        Quiz
                                                                    </span>
                                                                )}
                                                                {!isAccessible && (
                                                                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                                                                        Locked
                                                                    </span>
                                                                )}
                                                                {isCompleted && (
                                                                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                                                        Completed
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Collapse/Expand Button for Completed Items */}
                                                        {isCompleted && (
                                                            <div className="flex justify-center mb-3">
                                                                <Button
                                                                    onClick={() => setCollapsedItems(prev => ({ 
                                                                        ...prev, 
                                                                        [contentItem._id]: !prev[contentItem._id] 
                                                                    }))}
                                                                    type="neutral"
                                                                    className="text-sm px-3 py-1"
                                                                >
                                                                    {collapsedItems[contentItem._id] ? '📖 Show Details' : '📚 Hide Details'}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Content Details - Only show if accessible and not collapsed */}
                                                    {isAccessible && !collapsedItems[contentItem._id] && (
                                                        <div className="px-4 pb-4 space-y-2">
                                                            {contentItem.type === 'video' && contentItem.duration > 0 && (
                                                                <div className="text-xs text-[var(--text-tertiary)]">
                                                                    Duration: {Math.floor(contentItem.duration / 60)}:{(contentItem.duration % 60).toString().padStart(2, '0')}
                                                                </div>
                                                            )}
                                                            
                                                            {contentItem.type === 'quiz' && contentItem.questions && (
                                                                <div className="text-xs text-[var(--text-tertiary)]">
                                                                    {contentItem.questions.length} questions
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Video Player for Videos - Only show if accessible and not collapsed */}
                                                    {contentItem.type === 'video' && contentItem.videoId && isAccessible && !collapsedItems[contentItem._id] && (
                                                        <div className="px-4 pb-4">
                                                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                                                <iframe
                                                                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                                                                    src={`https://www.youtube.com/embed/${contentItem.videoId}`}
                                                                    title={contentItem.title}
                                                                    frameBorder="0"
                                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                    allowFullScreen
                                                                ></iframe>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Assessment Component for Quizzes - Only show if accessible and not collapsed */}
                                                    {contentItem.type === 'quiz' && isAccessible && !collapsedItems[contentItem._id] && (
                                                        <div className="mt-4">
                                            {showAssessmentId === contentItem._id ? (
                                                <div className="space-y-4">
                                                    {/* Attempt Counter */}
                                                    {assessmentAttempts[contentItem._id] > 0 && (
                                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                            <div className="flex items-center gap-2 text-sm text-yellow-800">
                                                                <span>🔄</span>
                                                                <span>Attempt {assessmentAttempts[contentItem._id] + 1}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <Assessment
                                                        questions={contentItem.questions}
                                                        onProgress={(percent) => handleAssessmentProgress(contentItem._id, percent)}
                                                        onSubmit={() => handleAssessmentSubmit(contentItem._id)}
                                                    />
                                                    
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            onClick={() => {
                                                                setShowAssessmentId(null);
                                                                // Reset retry prompt when closing assessment
                                                                setShowRetryPrompt((prev) => ({ ...prev, [contentItem._id]: false }));
                                                                // Reset attempt counter when closing
                                                                setAssessmentAttempts((prev) => ({ ...prev, [contentItem._id]: 0 }));
                                                            }}
                                                            type="neutral"
                                                            className="flex-1"
                                                        >
                                                            Close Assessment
                                                        </Button>
                                                        <Button 
                                                            onClick={() => handleAssessmentSubmit(contentItem._id)}
                                                            type="primary"
                                                            className="flex-1"
                                                            disabled={!assessmentProgress[contentItem._id] || assessmentProgress[contentItem._id] < 80}
                                                        >
                                                            Submit Assessment
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : showRetryPrompt[contentItem._id] ? (
                                                /* Retry Prompt Interface */
                                                <div className="space-y-3">
                                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors duration-300">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                                                <span className="text-red-600 font-bold">⚠️</span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <h4 className="font-medium text-red-800">Assessment Not Passed</h4>
                                                                <p className="text-sm text-red-600">
                                                                    Your score was {assessmentProgress[contentItem._id] || 0}%. You need at least 80% to pass.
                                                                </p>
                                                                {assessmentAttempts[contentItem._id] > 0 && (
                                                                    <p className="text-xs text-red-500 mt-1">
                                                                        Previous attempts: {assessmentAttempts[contentItem._id]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button 
                                                            onClick={() => handleAssessmentRetry(contentItem._id)}
                                                            type="primary"
                                                            className="flex-1"
                                                        >
                                                            Try Again
                                                        </Button>
                                                        <Button 
                                                            onClick={() => {
                                                                setShowRetryPrompt((prev) => ({ ...prev, [contentItem._id]: false }));
                                                                setShowAssessmentId(null);
                                                                // Reset progress when closing without retry
                                                                setAssessmentProgress((prev) => ({ ...prev, [contentItem._id]: 0 }));
                                                                // Reset attempt counter when giving up
                                                                setAssessmentAttempts((prev) => ({ ...prev, [contentItem._id]: 0 }));
                                                            }}
                                                            type="neutral"
                                                            className="flex-1"
                                                        >
                                                            Close
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="p-4 bg-[var(--bg-secondary)] dark:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg transition-colors duration-300">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-[var(--bg-tertiary)] dark:bg-[var(--bg-secondary)] rounded-full flex items-center justify-center">
                                                                <span className="text-[var(--text-primary)] dark:text-white font-bold">?</span>
                                                            </div>
                                                            <div className="flex-1">
                                                                                                <h4 className="font-medium text-[var(--text-primary)] dark:text-white">Quiz Available</h4>
                                <p className="text-sm text-[var(--text-secondary)] dark:text-white">
                                    {contentItem.questions?.length || 0} questions to test your knowledge
                                </p>
                                {assessmentAttempts[contentItem._id] > 0 && (
                                    <p className="text-xs text-[var(--text-tertiary)] dark:text-white mt-1">
                                        Previous attempts: {assessmentAttempts[contentItem._id]}
                                    </p>
                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        onClick={() => {
                                                            setShowAssessmentId(contentItem._id);
                                                            // Reset retry prompt when starting new assessment
                                                            setShowRetryPrompt((prev) => ({ ...prev, [contentItem._id]: false }));
                                                            // Reset attempt counter when starting fresh
                                                            setAssessmentAttempts((prev) => ({ ...prev, [contentItem._id]: 0 }));
                                                        }}
                                                        type="primary"
                                                        className="w-full"
                                                    >
                                                        Start Quiz
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                                    {/* Locked Content Message */}
                                                    {!isAccessible && (
                                                        <div className="mt-4 p-4 bg-gradient-to-r from-[var(--bg-secondary)] to-[var(--bg-tertiary)] border-2 border-[var(--border-primary)] rounded-lg relative overflow-hidden transition-colors duration-300">
                                                            <div className="absolute inset-0 bg-[var(--bg-tertiary)] opacity-80"></div>
                                                            <div className="relative flex items-center justify-center gap-3 text-[var(--text-secondary)]">
                                                                <span className="text-2xl">🔒</span>
                                                                <div className="text-center">
                                                                    <div className="font-semibold text-[var(--text-primary)] mb-1">
                                                                        Content Locked
                                                                    </div>
                                                                    <div className="text-sm text-[var(--text-tertiary)]">
                                                                        Complete the previous item to unlock this content
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Completion Button - Only show for incomplete videos */}
                                                    {isAccessible && !isCompleted && contentItem.type === 'video' && !collapsedItems[contentItem._id] && (
                                                        <div className="px-4 pb-4">
                                                            <Button 
                                                                onClick={() => handleContentComplete(contentItem._id, 'video')}
                                                                type="primary"
                                                                className="w-full"
                                                            >
                                                                Mark as Complete
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )})}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-[var(--text-secondary)]">
                                        No content items available for this week
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <i className="*:size-12 text-green-600 dark:text-green-400" dangerouslySetInnerHTML={{ __html: icons.chevronRight }} />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)]">Select a Week to View Content</h3>
                                    <p className="text-[var(--text-secondary)]">Choose a week from the right panel to see videos, quizzes, and other learning materials.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Weeks List & Module Info */}
                <div className="lg:col-span-1">
                    <div className="space-y-6">
                        

                       

                        {/* Weeks List */}
                        {(updatedModuleData?.weeks || currentModule.weeks) && (updatedModuleData?.weeks || currentModule.weeks).length > 0 && (
                            <div className="bg-[var(--bg-card)] rounded-lg transition-colors duration-300">
                                <div className="p-4 bg-[var(--bg-secondary)]">
                                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">Playlist</h3>
                                </div>
                                <div className="p-2">
                                    {(updatedModuleData?.weeks || currentModule.weeks)
                                        .sort((a: any, b: any) => a.weekNumber - b.weekNumber)
                                        .map((week: any, index: number) => {
                                            // Force re-calculation when forceUpdate changes
                                            
                                            
                                            
                                            // Check if this week is accessible (previous week completed or first week)
                                            const isFirstWeek = index === 0;
                                            const previousWeek = index > 0 ? currentModule.weeks[index - 1] : null;
                                            
                                            // Recalculate week progress to ensure accuracy
                                            const recalculatedWeek = recalculateWeekProgress(week);
                                            const recalculatedPreviousWeek = previousWeek ? recalculateWeekProgress(previousWeek) : null;
                                            
                                            // Check if previous week is completed (from recalculated progress)
                                            const isPreviousWeekCompleted = previousWeek && (
                                                recalculatedPreviousWeek.progress?.percentageCompleted === 100 ||
                                                recalculatedPreviousWeek.progress?.status === 'completed' ||
                                                recalculatedPreviousWeek.contentItems?.every((item: any) => 
                                                    item.progress?.status === 'completed' || 
                                                    item.completed || 
                                                    assessmentCompleted[item._id]
                                                )
                                            );
                                            
                                            const isWeekAccessible = isFirstWeek || isPreviousWeekCompleted;
                                            
                                         
                                            const isWeekCompleted = recalculatedWeek.progress?.percentageCompleted === 100 || 
                                                                   recalculatedWeek.progress?.status === 'completed' ||
                                                                   recalculatedWeek.contentItems?.every((item: any) => 
                                                                       item.progress?.status === 'completed' || 
                                                                       item.completed || 
                                                                       assessmentCompleted[item._id]
                                                                   );
                                            
                                            return (
                                            <div 
                                                key={week._id} 
                                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                                    !isWeekAccessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[var(--bg-tertiary)]'
                                                } ${
                                                    selectedWeek && selectedWeek._id === week._id 
                                                        ? 'bg-[var(--bg-secondary)] dark:bg-[var(--bg-tertiary)] border-l-4 border-l-[var(--border-primary)]' 
                                                        : ''
                                                }`}
                                                onClick={isWeekAccessible ? () => setSelectedWeek(week) : undefined}
                                            >
                                                {/* Week Number/Icon */}
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                    isWeekCompleted ? 'bg-green-100 dark:bg-green-900/30' : 
                                                    isWeekAccessible ? 'bg-[var(--bg-tertiary)] dark:bg-[var(--bg-secondary)]' : 'bg-[var(--bg-tertiary)]'
                                                }`}>
                                                    <span className={`text-sm font-medium ${
                                                        isWeekCompleted ? 'text-green-600' : 
                                                        isWeekAccessible ? 'text-[var(--text-primary)] dark:text-white' : 'text-[var(--text-tertiary)]'
                                                    }`}>
                                                        {isWeekCompleted ? '✓' : week.weekNumber}
                                                    </span>
                                                </div>
                                                
                                                {/* Week Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`font-medium text-sm truncate ${
                                                        isWeekCompleted ? 'text-green-800 dark:text-green-200' : 'text-[var(--text-primary)]'
                                                    }`}>
                                                        {week.title}
                                                    </h4>
                                                    <p className="text-xs text-[var(--text-secondary)] truncate">
                                                        {recalculatedWeek.progress.completedItems}/{recalculatedWeek.progress.totalItems} items
                                                    </p>
                                                </div>
                                                
                                                {/* Progress Indicator */}
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-300 ${
                                                                isWeekCompleted ? 'bg-green-500' : 'bg-[var(--text-primary)] dark:bg-white'
                                                            }`}
                                                            style={{ width: `${recalculatedWeek.progress.percentageCompleted}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-[var(--text-secondary)] w-8 text-right">
                                                        {recalculatedWeek.progress.percentageCompleted}%
                                                    </span>
                                                </div>

                                                {/* Lock Icon for Inaccessible Weeks */}
                                                {!isWeekAccessible && (
                                                    <div className="w-5 h-5 text-[var(--text-tertiary)]">
                                                        🔒
                                                    </div>
                                                )}
                                            </div>
                                        )})}
                                </div>
                            </div>
                        )}

                        {/* Module Stats */}
                        <div className="bg-[var(--bg-card)] rounded-lg p-6 transition-colors duration-300">
                            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Module Overview</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[var(--text-secondary)]">Total Weeks</span>
                                    <span className="font-medium text-[var(--text-primary)]">{calculateRealTimeModuleProgress().totalWeeks}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[var(--text-secondary)]">Content Items</span>
                                    <span className="font-medium text-[var(--text-primary)]">{calculateRealTimeModuleProgress().totalContentItems}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[var(--text-secondary)]">Progress</span>
                                    <span className="font-medium text-[var(--text-primary)] dark:text-white">{calculateRealTimeModuleProgress().completionPercentage}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[var(--text-secondary)]">Status</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        currentModule.progress?.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                                        currentModule.progress?.status === 'in_progress' ? 'bg-[var(--bg-tertiary)] dark:bg-[var(--bg-secondary)] text-[var(--text-primary)] dark:text-white' :
                                        'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                                    }`}>
                                        {currentModule.progress?.status === 'completed' ? 'Completed' :
                                         currentModule.progress?.status === 'in_progress' ? 'In Progress' :
                                         'Not Started'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Module Header at Bottom */}
            <div className="mt-8">
                <div className="bg-[var(--bg-card)] rounded-lg p-6 transition-colors duration-300">
                    <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">{currentModule.title}</h1>
                    <p className="text-lg text-[var(--text-secondary)] mb-6">{currentModule.description}</p>
                    
                    {/* Module Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                                                            <div className="text-2xl font-bold text-[var(--text-primary)] dark:text-white">{calculateRealTimeModuleProgress().totalWeeks}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Total Weeks</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{calculateRealTimeModuleProgress().completedContentItems}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Completed Items</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{calculateRealTimeModuleProgress().completionPercentage}%</div>
                            <div className="text-sm text-[var(--text-secondary)]">Progress</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{currentModule.order}</div>
                            <div className="text-sm text-[var(--text-secondary)]">Module Order</div>
                        </div>
                    </div>
                     {/* Instructor Section */}
                        <div className="bg-[var(--bg-card)] rounded-lg p-6 transition-colors duration-300">
                            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">Instructor</h3>
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center">
                                    <i className="*:size-8 text-[var(--text-tertiary)]" dangerouslySetInnerHTML={{ __html: icons.user }} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-[var(--text-primary)]">Module Instructor</h4>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                                        Expert instructor guiding you through this learning journey.
                                    </p>
                                </div>
                            </div>
                        </div>
                </div>
            </div>
        </DefaultPage>
    );
}
