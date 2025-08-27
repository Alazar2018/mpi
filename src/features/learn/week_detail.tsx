import { useParams, useNavigate } from "react-router";
import Button from "@/components/Button";
import DefaultPage from "@/components/DefaultPage";
import icons from "@/utils/icons";
import { useState, useEffect } from "react";
import { useLearn } from "@/hooks/useLearn";
import type { Week, ContentItem } from "@/service/learn.server";

export default function WeekDetail() {
    const params = useParams();
    const navigate = useNavigate();
    const { currentModule } = useLearn();
    const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
    const [selectedContentItem, setSelectedContentItem] = useState<ContentItem | null>(null);
    const [showVideo, setShowVideo] = useState(false);
    const [showQuiz, setShowQuiz] = useState(false);

    useEffect(() => {
        if (currentModule && params.weekId) {
            const week = currentModule.weeks.find(w => w._id === params.weekId);
            setSelectedWeek(week || null);
        }
    }, [currentModule, params.weekId]);

    if (!currentModule) {
        return (
            <DefaultPage className="!py-4 md:!py-6" title="Loading...">
                <div className="text-center py-8">Loading module details...</div>
            </DefaultPage>
        );
    }

    if (!selectedWeek) {
        return (
            <DefaultPage className="!py-4 md:!py-6" title="Week Not Found">
                <div className="text-center py-8">
                    <div className="text-red-600 mb-4">Week not found</div>
                    <Button onClick={() => navigate(`/admin/learn/${currentModule._id}`)} type="primary">
                        Back to Module
                    </Button>
                </div>
            </DefaultPage>
        );
    }

    const handleContentItemClick = (contentItem: ContentItem) => {
        setSelectedContentItem(contentItem);
        
        if (contentItem.type === 'video') {
            setShowVideo(true);
            setShowQuiz(false);
        } else if (contentItem.type === 'quiz') {
            setShowVideo(false);
            setShowQuiz(true);
        }
    };

    const canAccessContentItem = (contentItem: ContentItem) => {
        // Check if content item is published and not deleted
        if (!contentItem.isPublished || contentItem.deleted) {
            return false;
        }

        // Check required items
        if (contentItem.requiredItems && contentItem.requiredItems.length > 0) {
            // TODO: Implement required items check based on progress
            return true;
        }

        return true;
    };



    const isContentItemCompleted = (contentItem: ContentItem) => {
        return false;
    };

    const canTakeQuiz = (contentItem: ContentItem) => {
        if (contentItem.type !== 'quiz') return false;
        
        // TODO: Check attemptsAllowed vs assessmentAttempts length
        // For now, allow if not completed
        return !isContentItemCompleted(contentItem);
    };

    return (
        <DefaultPage className="!py-4 md:!py-6" title={selectedWeek.title}>
            {/* Week Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <Button 
                        onClick={() => navigate(`/admin/learn/${currentModule._id}`)} 
                        type="neutral"
                        className="flex items-center gap-2"
                    >
                        <i className="*:size-4" dangerouslySetInnerHTML={{ __html: icons.back }} />
                        Back to Module
                    </Button>
                    <span className="text-sm text-[var(--text-secondary)]">Week {selectedWeek.weekNumber}</span>
                </div>
                
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{selectedWeek.title}</h1>
                <p className="text-[var(--text-secondary)] mb-4">{selectedWeek.description}</p>
                
                {/* Week Progress */}
                <div className="bg-[var(--bg-card)] rounded-lg p-4 border border-[var(--border-primary)] transition-colors duration-300">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-[var(--text-primary)]">Week Progress</span>
                        <span className="font-medium text-[var(--text-primary)]">{selectedWeek.progress.percentageCompleted}%</span>
                    </div>
                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                        <div 
                            className="bg-[var(--text-primary)] dark:bg-white h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${selectedWeek.progress.percentageCompleted}%` }}
                        ></div>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] mt-2 text-center">
                        {selectedWeek.progress.completedItems}/{selectedWeek.progress.totalItems} content items completed
                    </div>
                </div>
            </div>

            {/* Content Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedWeek.contentItems
                    .sort((a, b) => a.order - b.order)
                    .map((contentItem) => (
                    <div 
                        key={contentItem._id} 
                        className={`border border-[var(--border-primary)] rounded-lg p-4 transition-all ${
                            canAccessContentItem(contentItem) 
                                ? 'hover:shadow-md cursor-pointer bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)]' 
                                : 'bg-[var(--bg-secondary)] cursor-not-allowed opacity-60'
                        }`}
                        onClick={() => canAccessContentItem(contentItem) && handleContentItemClick(contentItem)}
                    >
                        {/* Content Item Header */}
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                    contentItem.type === 'video' ? 'bg-red-500' : 'bg-purple-500'
                                }`}>
                                    {contentItem.type === 'video' ? '▶' : '?'}
                                </div>
                                <span className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-1 rounded">
                                    {contentItem.type.toUpperCase()}
                                </span>
                            </div>
                            <span className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-1 rounded">
                                {contentItem.order}
                            </span>
                        </div>

                        {/* Content Item Title and Description */}
                        <h3 className="font-medium text-[var(--text-primary)] mb-2">{contentItem.title}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">{contentItem.description}</p>

                        {/* Content Item Details */}
                        <div className="space-y-2">
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

                            {/* Status Indicator */}
                            <div className="flex items-center gap-2">
                                {isContentItemCompleted(contentItem) ? (
                                    <div className="flex items-center gap-1 text-green-600 text-xs">
                                        <i className="*:size-3" dangerouslySetInnerHTML={{ __html: icons.check }} />
                                        Completed
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-[var(--text-primary)] dark:text-white text-xs">
                                        <i className="*:size-3" dangerouslySetInnerHTML={{ __html: icons.check }} />
                                        Not Started
                                    </div>
                                )}
                            </div>

                            {/* Access Control */}
                            {!canAccessContentItem(contentItem) && (
                                <div className="text-xs text-red-600">
                                    Prerequisites not met
                                </div>
                            )}

                            {contentItem.type === 'quiz' && !canTakeQuiz(contentItem) && (
                                <div className="text-xs text-red-600">
                                    Quiz attempts exhausted
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Video Player Modal */}
            {showVideo && selectedContentItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[var(--bg-card)] rounded-lg p-6 max-w-4xl w-full mx-4 transition-colors duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{selectedContentItem.title}</h3>
                            <Button 
                                onClick={() => setShowVideo(false)} 
                                type="neutral"
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                                ✕
                            </Button>
                        </div>
                        
                        {selectedContentItem.videoId && (
                            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                                <iframe
                                    src={`https://www.youtube.com/embed/${selectedContentItem.videoId}`}
                                    title={selectedContentItem.title}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            </div>
                        )}
                        
                        <div className="mt-4">
                            <p className="text-[var(--text-secondary)]">{selectedContentItem.description}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz Modal */}
            {showQuiz && selectedContentItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-[var(--bg-card)] rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-colors duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{selectedContentItem.title}</h3>
                            <Button 
                                onClick={() => setShowQuiz(false)} 
                                type="neutral"
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                                ✕
                            </Button>
                        </div>
                        
                        {selectedContentItem.questions && (
                            <div className="space-y-6">
                                {selectedContentItem.questions.map((question, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                        <h4 className="font-medium mb-3">
                                            Question {index + 1}: {question.question}
                                        </h4>
                                        
                                        <div className="space-y-2">
                                            {question.options.map((option, optionIndex) => (
                                                <label key={optionIndex} className="flex items-center gap-2 cursor-pointer">
                                                                                            <input 
                                            type="radio" 
                                            name={`question-${index}`}
                                            value={option}
                                            className="text-[var(--text-primary)] dark:text-white"
                                        />
                                                    <span className="text-[var(--text-primary)]">{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                        
                                        {question.explanation && (
                                            <div className="mt-3 p-3 bg-[var(--bg-secondary)] dark:bg-[var(--bg-tertiary)] rounded-lg transition-colors duration-300">
                                                <p className="text-sm text-[var(--text-primary)] dark:text-white">
                                                    <strong>Explanation:</strong> {question.explanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="mt-6 flex justify-end gap-3">
                            <Button onClick={() => setShowQuiz(false)} type="neutral">
                                Cancel
                            </Button>
                            <Button type="primary">
                                Submit Quiz
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </DefaultPage>
    );
}
