import axiosInstance from "@/config/axios.config";

// Types for Learn module based on actual API response
export interface VideoProgress {
  currentTime: number;
  completed: boolean;
  lastViewed: string;
}

export interface AssessmentAttempt {
  answers: any[];
}

export interface ContentItemProgress {
  _id: string;
  userId: string;
  moduleId: string;
  weekId: string;
  contentItemId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  videoProgress?: VideoProgress;
  currentAttempt: AssessmentAttempt;
  assessmentAttempts: any[] | null;
  completedAt?: string;
}

export interface Question {
  type: 'multipleChoice';
  question: string;
  options: string[];
  correctAnswers: string[];
  explanation: string;
}

export interface ContentItem {
  _id: string;
  weekId: string;
  deleted: boolean;
  description: string;
  duration: number;
  isPublished: boolean;
  order: number;
  requiredItems: string[];
  thumbnail: string;
  title: string;
  type: 'video' | 'quiz';
  unlocksNext?: string;
  videoId?: string;
  questions?: Question[];
  attemptsAllowed?: number;
}

export interface WeekProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  completedItems: number;
  totalItems: number;
  percentageCompleted: number;
}

export interface Week {
  _id: string;
  contentItems: ContentItem[];
  deleted: boolean;
  description: string;
  isPublished: boolean;
  title: string;
  weekNumber: number;
  moduleId: string;
  progress: WeekProgress;
}

export interface ModuleProgress {
  completedWeeks: number;
  totalWeeks: number;
  completedContentItems: number;
  totalContentItems: number;
  completionPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
}

export interface Module {
  _id: string;
  courses: string[];
  deleted: boolean;
  description: string;
  isPublished: boolean;
  nextModule?: string;
  order: number;
  previousModule?: string;
  startingModule: boolean;
  title: string;
  thumbnail: string;
  weeks: Week[];
  progress: ModuleProgress;
}

export interface VideoCompletionRequest {
  watchTime?: number;
  completedAt?: string;
}

export interface AssessmentCompletionRequest {
  score: number;
  answers: {
    questionId: string;
    answer: string;
  }[];
  timeSpent: number;
  completedAt?: string;
}

export interface VideoCompletionResponse {
  success: boolean;
  message: string;
  progress: {
    contentItemId: string;
    status: string;
    completedAt: string;
  };
}

export interface AssessmentCompletionResponse {
  success: boolean;
  message: string;
  progress: {
    contentItemId: string;
    status: string;
    score: number;
    completedAt: string;
  };
}

// Learn API Service
class LearnService {
  constructor() {
    // Authentication is now handled automatically by axiosInstance interceptors
  }

  /**
   * Get all player modules
   * GET /api/v1/modules/me
   */
  async getPlayerModules(): Promise<Module[]> {
    const response = await axiosInstance.get<Module[]>('/api/v1/modules/me');
    return response.data;
  }

  /**
   * Get detailed information about a specific module
   * GET /api/v1/modules/me/:id
   */
  async getModuleDetails(moduleId: string): Promise<Module> {
    const response = await axiosInstance.get<Module>(`/api/v1/modules/me/${moduleId}`);
    return response.data;
  }

  /**
   * Complete a video
   * PATCH /api/v1/modules/complete-video/:videoId
   */
  async completeVideo(
    videoId: string, 
    data?: VideoCompletionRequest
  ): Promise<VideoCompletionResponse> {
    const response = await axiosInstance.patch<VideoCompletionResponse>(`/api/v1/modules/complete-video/${videoId}`, data);
    return response.data;
  }

  /**
   * Pass an assessment
   * PATCH /api/v1/modules/assessment/:assessmentId
   */
  async passAssessment(
    assessmentId: string, 
    data: AssessmentCompletionRequest
  ): Promise<AssessmentCompletionResponse> {
    const response = await axiosInstance.patch<AssessmentCompletionResponse>(`/api/v1/modules/assessment/${assessmentId}`, data);
    return response.data;
  }

  /**
   * Calculate module progress percentage
   */
  calculateModuleProgress(module: Module): number {
    return module.progress.completionPercentage;
  }

  /**
   * Get next incomplete content item in module
   */
  getNextIncompleteContent(module: Module): ContentItem | null {
    for (const week of module.weeks) {
      const incompleteItem = week.contentItems.find(item => 
        !item.deleted && item.isPublished
      );
      if (incompleteItem) return incompleteItem;
    }
    return null;
  }

  /**
   * Check if module is completed
   */
  isModuleCompleted(module: Module): boolean {
    return module.progress.status === 'completed';
  }

  /**
   * Get total content count for a module
   */
  getTotalContentCount(module: Module): number {
    return module.weeks.reduce((total, week) => total + week.contentItems.length, 0);
  }

  /**
   * Get completed content count for a module
   */
  getCompletedContentCount(module: Module): number {
    return module.progress.completedContentItems;
  }

  /**
   * Get weeks sorted by week number
   */
  getSortedWeeks(module: Module): Week[] {
    return module.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
  }
}

// Create and export instance
export const learnService = new LearnService();


