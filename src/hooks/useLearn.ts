import { useState, useEffect, useCallback } from 'react';
import { learnService, type Module, type ContentItem, type VideoCompletionRequest, type AssessmentCompletionRequest } from '@/service/learn.server';

interface UseLearnReturn {
  // State
  modules: Module[];
  currentModule: Module | null;
  loading: boolean;
  error: string | null;
  
  // Progress state
  overallProgress: number;
  totalModules: number;
  completedModules: number;
  totalContent: number;
  completedContent: number;
  
  // Actions
  fetchPlayerModules: () => Promise<void>;
  getModuleDetails: (moduleId: string) => Promise<Module | null>;
  completeVideo: (videoId: string, data?: VideoCompletionRequest) => Promise<boolean>;
  passAssessment: (assessmentId: string, data: AssessmentCompletionRequest) => Promise<boolean>;
  
  // Utility functions
  calculateModuleProgress: (module: Module) => number;
  isModuleCompleted: (module: Module) => boolean;
  getNextIncompleteContent: (module: Module) => ContentItem | null;
  getTotalContentCount: (module: Module) => number;
  getCompletedContentCount: (module: Module) => number;
}

export const useLearn = (): UseLearnReturn => {
  const [modules, setModules] = useState<Module[]>([]);
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Progress state
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalModules, setTotalModules] = useState(0);
  const [completedModules, setCompletedModules] = useState(0);
  const [totalContent, setTotalContent] = useState(0);
  const [completedContent, setCompletedContent] = useState(0);

      // Calculate overall progress and statistics
    const calculateOverallProgress = useCallback((modulesData: Module[]) => {
        if (modulesData.length === 0) {
            setOverallProgress(0);
            setTotalModules(0);
            setCompletedModules(0);
            setTotalContent(0);
            setCompletedContent(0);
            return;
        }

        // Calculate overall progress
        const totalProgress = modulesData.reduce((sum, module) => sum + module.progress.completionPercentage, 0);
        const avgProgress = Math.round(totalProgress / modulesData.length);
        setOverallProgress(avgProgress);

        // Calculate modules progress
        setTotalModules(modulesData.length);
        const completedModulesCount = modulesData.filter(module => 
            learnService.isModuleCompleted(module)
        ).length;
        setCompletedModules(completedModulesCount);

        // Calculate content progress
        const totalContentCount = modulesData.reduce((sum, module) => 
            sum + learnService.getTotalContentCount(module), 0
        );
        setTotalContent(totalContentCount);

        const completedContentCount = modulesData.reduce((sum, module) => 
            sum + learnService.getCompletedContentCount(module), 0
        );
        setCompletedContent(completedContentCount);
    }, []);

  // Fetch all player modules
  const fetchPlayerModules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const modules = await learnService.getPlayerModules();
      setModules(modules);
      calculateOverallProgress(modules);
    } catch (err) {
      setError('An error occurred while fetching modules');
      console.error('Error fetching modules:', err);
    } finally {
      setLoading(false);
    }
  }, [calculateOverallProgress]);

  // Get specific module details
  const getModuleDetails = useCallback(async (moduleId: string): Promise<Module | null> => {
    try {
      const module = await learnService.getModuleDetails(moduleId);
      setCurrentModule(module);
      return module;
    } catch (err) {
      console.error('Error fetching module details:', err);
      return null;
    }
  }, []);

  // Complete video
  const completeVideo = useCallback(async (
    videoId: string, 
    data?: VideoCompletionRequest
  ): Promise<boolean> => {
    try {
      await learnService.completeVideo(videoId, data);
      // Refresh modules to update progress
      await fetchPlayerModules();
      return true;
    } catch (err) {
      console.error('Error completing video:', err);
      return false;
    }
  }, [fetchPlayerModules]);

  // Pass assessment
  const passAssessment = useCallback(async (
    assessmentId: string, 
    data: AssessmentCompletionRequest
  ): Promise<boolean> => {
    try {
      await learnService.passAssessment(assessmentId, data);
      // Refresh modules to update progress
      await fetchPlayerModules();
      return true;
    } catch (err) {
      console.error('Error passing assessment:', err);
      return false;
    }
  }, [fetchPlayerModules]);

  // Utility functions
  const calculateModuleProgress = useCallback((module: Module): number => {
    return learnService.calculateModuleProgress(module);
  }, []);

  const isModuleCompleted = useCallback((module: Module): boolean => {
    return learnService.isModuleCompleted(module);
  }, []);

  const getNextIncompleteContent = useCallback((module: Module): ContentItem | null => {
    return learnService.getNextIncompleteContent(module);
  }, []);

  const getTotalContentCount = useCallback((module: Module): number => {
    return learnService.getTotalContentCount(module);
  }, []);

  const getCompletedContentCount = useCallback((module: Module): number => {
    return learnService.getCompletedContentCount(module);
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchPlayerModules();
  }, [fetchPlayerModules]);

  return {
    // State
    modules,
    currentModule,
    loading,
    error,
    
    // Progress state
    overallProgress,
    totalModules,
    completedModules,
    totalContent,
    completedContent,
    
    // Actions
    fetchPlayerModules,
    getModuleDetails,
    completeVideo,
    passAssessment,
    
    // Utility functions
    calculateModuleProgress,
    isModuleCompleted,
    getNextIncompleteContent,
    getTotalContentCount,
    getCompletedContentCount,
  };
};
