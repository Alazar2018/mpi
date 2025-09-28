import axiosInstance from "@/config/axios.config";
import { API_CONFIG } from "@/config/api.config";
import { useAuthStore } from "@/store/auth.store";

// Types for Initial Assessment based on the mindset assessment questions
export interface MindsetAssessmentAnswer {
    questionId: string;
    answer: string;
    question: string;
}

export interface InitialAssessmentSubmission {
    questions: Array<{
        _id: string;
        question: string;
        options: string[];
        correctAnswers: string[];
        explanation: string;
    }>;
    answers: MindsetAssessmentAnswer[];
    score: number;
    timeSpent: number; // in seconds
    completedAt: string;
    assessmentType: 'mindset';
}

export interface InitialAssessmentResponse {
    success: boolean;
    message: string;
    data?: {
        assessmentId: string;
        score: number;
        completedAt: string;
        insights?: {
            motivation: string;
            strategy: string;
            pressureHandling: string;
            developmentFocus: string;
            feedbackPreference: string;
        };
    };
    error?: string;
}

// Initial Assessment API Service
class InitialAssessmentService {
    constructor() {
        // Authentication is handled automatically by axiosInstance interceptors
    }

    /**
     * Submit initial mindset assessment (for authenticated users only)
     * POST /api/v1/users/profile/assessment/initial
     */
    async submitInitialAssessment(
        assessmentData: InitialAssessmentSubmission
    ): Promise<InitialAssessmentResponse> {
        try {
            console.log('Submitting initial assessment:', assessmentData);
            
            // Check if user is authenticated by looking at the auth store
            const authStore = useAuthStore.getState();
            if (!authStore.user || !authStore.tokens?.accessToken) {
                console.warn('User not authenticated, cannot submit assessment');
                return {
                    success: false,
                    message: 'Authentication required',
                    error: 'User must be logged in to submit assessment'
                };
            }
            
            const response = await axiosInstance.post<InitialAssessmentResponse>(
                API_CONFIG.ENDPOINTS.USER.INITIAL_ASSESSMENT,
                assessmentData
            );
            
            console.log('Initial assessment submitted successfully:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error submitting initial assessment:', error);
            
            // Handle different error types
            if (error.response) {
                // Server responded with error status
                const errorMessage = error.response.data?.message || error.response.data?.error || 'Failed to submit assessment';
                return {
                    success: false,
                    message: 'Assessment submission failed',
                    error: errorMessage
                };
            } else if (error.request) {
                // Request was made but no response received
                return {
                    success: false,
                    message: 'Network error',
                    error: 'Unable to connect to server. Please check your internet connection.'
                };
            } else {
                // Something else happened
                return {
                    success: false,
                    message: 'Unexpected error',
                    error: error.message || 'An unexpected error occurred'
                };
            }
        }
    }

    /**
     * Get assessment insights based on answers
     */
    generateAssessmentInsights(answers: MindsetAssessmentAnswer[]): {
        motivation: string;
        strategy: string;
        pressureHandling: string;
        developmentFocus: string;
        feedbackPreference: string;
    } {
        const insights = {
            motivation: '',
            strategy: '',
            pressureHandling: '',
            developmentFocus: '',
            feedbackPreference: ''
        };

        answers.forEach(answer => {
            switch (answer.questionId) {
                case 'mindset_1': // Motivation question
                    if (answer.answer.includes('compete and win')) {
                        insights.motivation = 'competitive';
                    } else if (answer.answer.includes('physically fit')) {
                        insights.motivation = 'fitness';
                    } else if (answer.answer.includes('fun and socialize')) {
                        insights.motivation = 'social';
                    } else if (answer.answer.includes('mental toughness')) {
                        insights.motivation = 'development';
                    }
                    break;
                    
                case 'mindset_2': // Strategy question
                    if (answer.answer.includes('Analyze their weaknesses')) {
                        insights.strategy = 'analytical';
                    } else if (answer.answer.includes('Focus on my own game')) {
                        insights.strategy = 'focused';
                    } else if (answer.answer.includes('Try different strategies')) {
                        insights.strategy = 'adaptive';
                    } else if (answer.answer.includes('Stay calm and trust')) {
                        insights.strategy = 'confident';
                    }
                    break;
                    
                case 'mindset_3': // Pressure handling
                    if (answer.answer.includes('thrive under pressure')) {
                        insights.pressureHandling = 'thrives';
                    } else if (answer.answer.includes('feel nervous but try to stay focused')) {
                        insights.pressureHandling = 'manages';
                    } else if (answer.answer.includes('sometimes make mistakes')) {
                        insights.pressureHandling = 'struggles';
                    } else if (answer.answer.includes('breathing techniques')) {
                        insights.pressureHandling = 'techniques';
                    }
                    break;
                    
                case 'mindset_4': // Development focus
                    if (answer.answer.includes('Technical skill')) {
                        insights.developmentFocus = 'technical';
                    } else if (answer.answer.includes('Physical fitness')) {
                        insights.developmentFocus = 'physical';
                    } else if (answer.answer.includes('Mental game')) {
                        insights.developmentFocus = 'mental';
                    } else if (answer.answer.includes('Match experience')) {
                        insights.developmentFocus = 'competitive';
                    }
                    break;
                    
                case 'mindset_5': // Feedback preference
                    if (answer.answer.includes('Direct and honest')) {
                        insights.feedbackPreference = 'direct';
                    } else if (answer.answer.includes('Encouraging and positive')) {
                        insights.feedbackPreference = 'positive';
                    } else if (answer.answer.includes('Detailed technical analysis')) {
                        insights.feedbackPreference = 'detailed';
                    } else if (answer.answer.includes('Video review')) {
                        insights.feedbackPreference = 'visual';
                    }
                    break;
            }
        });

        return insights;
    }

    /**
     * Format assessment data for submission
     */
    formatAssessmentData(
        questions: Array<any>,
        answers: Record<string, string>,
        timeSpent: number
    ): InitialAssessmentSubmission {
        const formattedAnswers: MindsetAssessmentAnswer[] = Object.entries(answers).map(([questionId, answer]) => {
            const question = questions.find(q => (q._id || q.id) === questionId);
            return {
                questionId,
                answer,
                question: question?.question || ''
            };
        });

        return {
            questions,
            answers: formattedAnswers,
            score: 100, // Since all answers are considered correct for mindset assessment
            timeSpent,
            completedAt: new Date().toISOString(),
            assessmentType: 'mindset'
        };
    }
}

// Create and export instance
export const initialAssessmentService = new InitialAssessmentService();

// Export the service class for testing purposes
export { InitialAssessmentService };
