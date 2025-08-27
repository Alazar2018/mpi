import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import DefaultPage from "@/components/DefaultPage";

import { useLearn } from "@/hooks/useLearn";
import Marketplace from "@/components/Marketplace";

export default function Learn() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [showModuleList, setShowModuleList] = useState(false);
    const [activeTab, setActiveTab] = useState<'courses' | 'marketplace'>('courses');
    const {
        modules,
        loading,
        error,
        overallProgress,
        totalModules,
        completedModules,
        totalContent,
        completedContent,
        fetchPlayerModules
    } = useLearn();

    // Check if user wants to see module list from query parameter
    useEffect(() => {
        const showList = searchParams.get('showList');
        if (showList === 'true') {
            setShowModuleList(true);
        }
    }, [searchParams]);

    // Check if user wants to see marketplace from query parameter
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'marketplace') {
            setActiveTab('marketplace');
        }
    }, [searchParams]);

    // Auto-redirect to first module if available (only if not explicitly showing module list)
    useEffect(() => {
        if (modules.length > 0 && !loading && !showModuleList && activeTab === 'courses') {
            // Only redirect if user hasn't explicitly chosen to view all modules
            const hasExplicitlyChosen = searchParams.get('showList') === 'true';
            if (!hasExplicitlyChosen) {
                navigate(`/admin/learn/${modules[0]._id}`);
            }
        }
    }, [modules, loading, navigate, showModuleList, activeTab, searchParams]);

    // Header component with tabs
    const LearnHeader = () => (
        <div className="bg-[var(--bg-card)] border-b border-[var(--border-primary)] mb-6 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
                    <div className="mb-4 sm:mb-0">
                        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Learn</h1>
                        <p className="text-[var(--text-secondary)] mt-1">Master tennis skills with structured learning modules</p>
                    </div>
                    
                    {/* Tab Navigation */}
                    <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('courses')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'courses'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            My Courses
                        </button>
                        <button
                            onClick={() => setActiveTab('marketplace')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === 'marketplace'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            Find Coach
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // If marketplace tab is active, show marketplace component
    if (activeTab === 'marketplace') {
        return (
            <DefaultPage showHeader={false}>
                <LearnHeader />
                <Marketplace />
            </DefaultPage>
        );
    }

    if (loading) {
        return (
            <DefaultPage showHeader={false}>
                <LearnHeader />
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-[var(--text-primary)]">Loading modules...</div>
                </div>
            </DefaultPage>
        );
    }

    // Show redirecting message if modules are available (only if not showing module list)
    if (modules.length > 0 && !showModuleList) {
        return (
            <DefaultPage showHeader={false}>
                <LearnHeader />
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-lg mb-2 text-[var(--text-primary)]">Redirecting to your first module...</div>
                        <div className="text-sm text-[var(--text-secondary)]">Please wait while we take you to "{modules[0].title}"</div>
                    </div>
                </div>
            </DefaultPage>
        );
    }

    if (error) {
        return (
            <DefaultPage showHeader={false}>
                <LearnHeader />
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="text-lg text-red-600">{error}</div>
                    <Button onClick={fetchPlayerModules} type="primary">
                        Retry
                    </Button>
                </div>
            </DefaultPage>
        );
    }

    return (
        <DefaultPage showHeader={false}>
            <LearnHeader />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Progress Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 py-2 mb-8">
                    <div className="h-[4.75rem] px-4 sm:px-6 py-3.5 bg-secondary text-white rounded-lg flex items-center justify-between">
                        <span className="font-bold text-2xl sm:text-[32px]">{overallProgress}%</span>
                        <span className="text-sm sm:text-base leading-[150%]">Overall Progress</span>
                    </div>
                    <div className="h-[4.75rem] px-4 sm:px-6 py-3.5 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-lg flex items-center justify-between border border-[var(--border-primary)] transition-colors duration-300">
                        <span className="font-bold text-2xl sm:text-[32px]">{completedModules}/{totalModules}</span>
                        <span className="text-sm sm:text-base leading-[150%]">Modules</span>
                    </div>
                    <div className="h-[4.75rem] px-4 sm:px-6 py-3.5 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-lg flex items-center justify-between border border-[var(--border-primary)] transition-colors duration-300">
                        <span className="font-bold text-2xl sm:text-[32px]">{completedContent}/{totalContent}</span>
                        <span className="text-sm sm:text-base leading-[150%]">Content</span>
                    </div>
                </div>

                {showModuleList && (
                    <div className="mb-6 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">All Learning Modules</h2>
                        <Button 
                            onClick={() => {
                                setShowModuleList(false);
                                // Clear the showList parameter from URL
                                const newSearchParams = new URLSearchParams(searchParams);
                                newSearchParams.delete('showList');
                                navigate(`?${newSearchParams.toString()}`, { replace: true });
                            }} 
                            type="primary" 
                            className="text-sm md:text-base"
                        >
                            Start Learning
                        </Button>
                    </div>
                )}
                
                {!showModuleList && (
                    <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Welcome to Learning</h2>
                        <p className="text-[var(--text-secondary)]">You'll be automatically redirected to your first module to start learning</p>
                    </div>
                )}
                
                <div className="py-4 md:py-6 flex flex-col gap-4 md:gap-6">
                    {!showModuleList && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm md:text-base text-[var(--text-primary)]">Modules</span>
                            <Button 
                                onClick={() => {
                                    setShowModuleList(true);
                                    // Update URL to reflect the current state
                                    const newSearchParams = new URLSearchParams(searchParams);
                                    newSearchParams.set('showList', 'true');
                                    navigate(`?${newSearchParams.toString()}`, { replace: true });
                                }} 
                                type="neutral" 
                                className="text-sm md:text-base"
                            >
                                View All
                            </Button>
                        </div>
                    )}

                    {modules.length === 0 ? (
                        <div className="text-center py-8 text-[var(--text-secondary)]">
                            No modules assigned yet. Check back later!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {modules.map((module) => (
                                <Link to={`/admin/learn/${module._id}`} key={module._id}>
                                    <div className="hover:bg-[var(--bg-secondary)] dark:hover:bg-green-900/20 transition-colors flex flex-col gap-4 p-4 sm:p-6 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-card)]">
                                        <div className="border-b border-[var(--border-secondary)] pb-2 flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-2">
                                            <span className="text-base font-bold text-[var(--text-primary)]">{module.title}</span>
                                            <span className="text-xs text-[var(--text-tertiary)]">
                                                {module.weeks ? module.weeks.length : 0} Week{module.weeks && module.weeks.length !== 1 ? 's' : ''} • {module.progress?.totalContentItems || 0} Content Items
                                            </span>
                                        </div>

                                        <span className="text-sm text-[var(--text-secondary)] line-clamp-2">{module.description}</span>

                                        {/* Progress bar */}
                                        <div className="h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${
                                                    getModuleStatus(module) === 'completed' ? 'bg-green-500' : 
                                                    getModuleStatus(module) === 'in-progress' ? 'bg-blue-500' : 'bg-[var(--text-tertiary)]'
                                                }`}
                                                style={{ width: `${module.progress.completionPercentage}%` }}
                                            />
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <div className="flex gap-2 items-center bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs rounded-md px-3 py-1.5">
                                                {module.progress.completionPercentage}% Complete
                                            </div>

                                            <Button
                                                className="h-8 sm:h-9 w-full sm:flex-1 justify-center rounded-md font-medium text-sm"
                                                type={getModuleStatus(module) === 'completed' ? 'primary' : 'action'}
                                            >
                                                {getModuleStatus(module) === 'completed' ? 'Review' : 'Open Course'}
                                            </Button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DefaultPage>
    );
}

// Helper functions
const getModuleStatus = (module: any): 'not-started' | 'in-progress' | 'completed' => {
    if (module.progress.status === 'completed') return 'completed';
    if (module.progress.completionPercentage > 0) return 'in-progress';
    return 'not-started';
};