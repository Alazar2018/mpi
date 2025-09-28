import { useState, useEffect, useCallback, useRef } from "react";
import Button from "@/components/Button";

interface Question {
    _id?: string;
    id?: string;
    question: string;
    options: string[];
    correctAnswer?: string;
    correctAnswers?: string[];
    answer?: string;
    correct_answer?: string;
    explanation?: string;
}

interface AssessmentProps {
    questions?: Question[];
    onProgress?: (percent: number) => void;
    onSubmit?: (answers?: Record<string, string>, score?: number) => void;
}

export default function Assessment({ questions = [], onProgress, onSubmit }: AssessmentProps) {
    const [answers, setAnswers] = useState<{ [id: string]: string }>({});
    const [submitted, setSubmitted] = useState(false);
    const [current, setCurrent] = useState(0);
    const [showResults, setShowResults] = useState(false);
    const prevScoreRef = useRef<number>(0);

    // Debug: Log questions when component mounts or questions change
    useEffect(() => {
        console.log('Assessment component received questions:', questions);
        if (questions.length > 0) {
            console.log('First question structure:', questions[0]);
        }
    }, [questions]);

    const handleSelect = (qid: string, option: string) => {
        if (!submitted) {
            console.log('Setting answer for question', qid, 'to', option);
            setAnswers((prev) => {
                const newAnswers = { ...prev, [qid]: option };
                console.log('New answers state:', newAnswers);
                return newAnswers;
            });
        }
    };

    const handleSubmit = () => {
        setSubmitted(true);
        setShowResults(true);
        const finalScore = calculateScore();
        if (onSubmit) onSubmit(answers, finalScore);
    };

    const handleNext = () => {
        if (current < questions.length - 1 && !submitted) {
            setCurrent(current + 1);
        }
    };

    const handlePrev = () => {
        if (current > 0 && !submitted) {
            setCurrent(current - 1);
        }
    };

    // Calculate actual score based on correct answers
    const calculateScore = useCallback(() => {
        if (questions.length === 0) return 0;
        
        console.log('Calculating score for questions:', questions);
        console.log('Current answers:', answers);
        
        let correctCount = 0;
        questions.forEach((question, index) => {
            // Get question ID (handle both _id and id fields)
            const questionId = question._id || question.id || `question_${index}`;
            
            // Handle different possible field names for correct answer
            // Note: correctAnswers is an array, so we need to check if user answer is in it
            let isCorrect = false;
            if (question.correctAnswers && Array.isArray(question.correctAnswers)) {
                // If correctAnswers is an array, check if user answer is in it
                isCorrect = question.correctAnswers.includes(answers[questionId]);
            } else {
                // If it's a single correct answer
                const correctAnswer = question.correctAnswer || question.answer || question.correct_answer;
                isCorrect = answers[questionId] === correctAnswer;
            }
            
            console.log(`Question ${questionId}:`, {
                question: question.question,
                userAnswer: answers[questionId],
                correctAnswers: question.correctAnswers,
                correctAnswer: question.correctAnswer || question.answer || question.correct_answer,
                availableFields: Object.keys(question),
                isCorrect: isCorrect
            });
            
            if (isCorrect) {
                correctCount++;
            }
        });
        
        const score = Math.round((correctCount / questions.length) * 100);
        console.log(`Score calculation: ${correctCount}/${questions.length} = ${score}%`);
        
        return score;
    }, [questions, answers]);

    const score = calculateScore();
    const progress = useCallback(() => {
        return Math.round((Object.keys(answers).length / questions.length) * 100);
    }, [answers, questions.length]);
    // Safety check for questions array
    if (!questions || questions.length === 0) {
        return (
            <div className="h-full w-full flex flex-col justify-center items-center bg-[var(--bg-card)] rounded-2xl p-4 sm:p-6 transition-colors duration-300">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">No Assessment Questions Available</h3>
                    <p className="text-[var(--text-secondary)] mb-6">
                        There are currently no questions available for this assessment.
                    </p>
                    <Button
                        type="action"
                        onClick={() => onSubmit && onSubmit()}
                        className="min-w-[120px]"
                    >
                        Continue
                    </Button>
                </div>
            </div>
        );
    }

    const q = questions[current];
    const currentQuestionId = q._id || q.id || `question_${current}`;

    useEffect(() => {
        console.log('useEffect triggered with:', {
            onProgress: !!onProgress,
            questionsLength: questions.length,
            answersCount: Object.keys(answers).length,
            currentScore: score,
            prevScore: prevScoreRef.current
        });
        
        if (onProgress && questions.length > 0 && Object.keys(answers).length > 0) {
            // Only call onProgress if score actually changed to prevent infinite loops
            if (score !== prevScoreRef.current) {
                console.log('Score changed from', prevScoreRef.current, 'to', score);
                prevScoreRef.current = score;
                console.log('Calling onProgress with score:', score);
                onProgress(score);
            } else {
                console.log('Score unchanged, not calling onProgress');
            }
        } else {
            console.log('Conditions not met for onProgress call');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [answers, onProgress, questions.length]);

    return (
        <div className="h-full w-full flex flex-col justify-center items-center bg-[var(--bg-card)] rounded-2xl p-4 sm:p-6 transition-colors duration-300">
            <div className="w-full max-w-xl flex flex-col items-center justify-center flex-1 mx-auto py-4 sm:py-8">
                {/* Assessment Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] text-center mb-4 sm:mb-6">
                    Question {current + 1} of {questions.length}
                </h2>

                {/* Divider */}
                <div className="w-full border-t border-[var(--border-primary)] mb-4 sm:mb-6"></div>

                {/* Question */}
                <div className="w-full flex flex-col items-center mb-4 sm:mb-6">
                    <div className="text-base sm:text-lg text-[var(--text-primary)] text-center px-2">
                        {q.question}
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full border-t border-[var(--border-primary)] mb-4 sm:mb-8"></div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mb-6 sm:mb-12">
                    {q.options.map((opt) => (
                        <button
                            key={opt}
                            className={`w-full px-4 py-3 rounded-lg text-sm sm:text-base font-medium border transition-all duration-150 focus:outline-none
                                 ${answers[currentQuestionId] === opt
                                 ? "bg-blue-600 text-white border-blue-600 shadow"
                                 : "bg-[var(--bg-secondary)] text-[var(--text-primary)] dark:text-white border-blue-100 hover:bg-[var(--bg-tertiary)]"}
                ${submitted ? "opacity-60 cursor-not-allowed" : ""}
              `}
                            onClick={() => handleSelect(currentQuestionId, opt)}
                            disabled={submitted}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="w-full flex flex-col items-center mt-auto mb-4 sm:mb-6">
                    <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full relative">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                                score >= 80 ? 'bg-green-500' : 'bg-[var(--text-primary)] dark:bg-white'
                            }`}
                            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
                        ></div>
                        {/* Progress Dot */}
                        <div
                            className="absolute top-1/2 -translate-y-1/2"
                            style={{ left: `calc(${((current + 1) / questions.length) * 100}% - 12px)` }}
                        >
                            <div className={`w-4 h-4 rounded-full border-4 border-white shadow -mt-1 ${
                                score >= 80 ? 'bg-green-500' : 'bg-[var(--text-primary)] dark:bg-white'
                            }`}></div>
                        </div>
                    </div>
                    {/* Score Display */}
                    <div className="text-xs text-[var(--text-secondary)] mt-2">
                        Score: {score}% | Progress: {progress()}%
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className="w-full flex justify-between gap-2 mt-4 sm:mt-8">
                    <Button
                        type="neutral"
                        onClick={handlePrev}
                        disabled={current === 0 || submitted}
                        className="min-w-[90px]"
                    >
                        Back
                    </Button>

                    {current < questions.length - 1 ? (
                        <Button
                            type="action"
                            onClick={handleNext}
                            disabled={!answers[currentQuestionId] || submitted}
                            className="min-w-[90px]"
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            type="action"
                            onClick={handleSubmit}
                            disabled={submitted || Object.keys(answers).length < questions.length}
                            className="min-w-[90px]"
                        >
                            {submitted ? "Submitted" : "Submit"}
                        </Button>
                    )}
                </div>

                {submitted && showResults && (
                    <div className="mt-4 sm:mt-6 p-4 bg-[var(--bg-secondary)] dark:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg transition-colors duration-300">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-[var(--text-primary)] dark:text-white mb-2">
                                Score: {score}%
                            </div>
                            <div className="text-sm text-[var(--text-secondary)] dark:text-white">
                                {score >= 80 ? (
                                    <span className="text-green-600 dark:text-green-400 font-semibold">🎉 Congratulations! You passed!</span>
                                ) : (
                                    <span className="text-red-600 dark:text-red-400 font-semibold">❌ You need at least 80% to pass</span>
                                )}
                            </div>
                            <div className="text-xs text-[var(--text-tertiary)] dark:text-white mt-2">
                                {Object.keys(answers).length} of {questions.length} questions answered
                            </div>
                        </div>
                        
                        {/* Show correct answers for failed attempts */}
                        {score < 80 && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors duration-300">
                                <div className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">Review your answers:</div>
                                <div className="space-y-2 text-xs">
                                    {questions.map((question, index) => (
                                        <div key={question._id || question.id || `question_${index}`} className="flex justify-between items-center">
                                            <span className="text-red-700 dark:text-red-300">Q{index + 1}:</span>
                                            <span className={`font-medium ${
                                                (question.correctAnswers && Array.isArray(question.correctAnswers) && question.correctAnswers.includes(answers[question._id || question.id || `question_${index}`])) ||
                                                answers[question._id || question.id || `question_${index}`] === (question.correctAnswer || question.answer || question.correct_answer)
                                                    ? 'text-green-600 dark:text-green-400' 
                                                    : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {(question.correctAnswers && Array.isArray(question.correctAnswers) && question.correctAnswers.includes(answers[question._id || question.id || `question_${index}`])) ||
                                                answers[question._id || question.id || `question_${index}`] === (question.correctAnswer || question.answer || question.correct_answer) ? '✓' : '✗'}
                                            </span>
                                            <span className="text-red-600 dark:text-red-400 text-xs">
                                                Correct: {question.correctAnswers && Array.isArray(question.correctAnswers) ? question.correctAnswers.join(', ') : (question.correctAnswer || question.answer || question.correct_answer)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}