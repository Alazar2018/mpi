import Button from "@/components/Button";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";
import { useProfileForm } from "@/context/profile_context";
import { useAuthStore } from "@/store/auth.store";
import { useApiRequest } from "@/hooks/useApiRequest";
import { register } from "@/features/auth/auth.api";
import { toast } from "@/utils/utils";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Assessment from "@/features/learn/Assessment";
import { initialAssessmentService } from "@/service/initial_assessment.server";

// Define Role type locally
type Role = "player" | "coach" | "parent" | "admin";

// Illinois Competition Test questions (27 questions)
const ILLINOIS_QUESTIONS = [
    "I am concerned about this competition.",
    "I feel nervous.",
    "I feel at ease.",
    "I have self-doubts.",
    "I feel jittery.",
    "I feel comfortable.",
    "I am concerned I may not do as well in this competition as I could.",
    "My body feels tense.",
    "I feel self-confident.",
    "I am concerned about losing.",
    "I feel tense in my stomach.",
    "I feel secure.",
    "My body feels relaxed.",
    "I'm confident I can meet the challenge.",
    "I'm concerned about performing poorly.",
    "My heart is racing.",
    "I'm confident about performing well.",
    "I'm worried about reaching my goal.",
    "I feel my stomach sinking.",
    "I feel mentally relaxed.",
    "I'm concerned that others will be disappointed with my performance.",
    "My hands are clammy.",
    "I'm confident because I mentally picture myself reaching my goal.",
    "I'm concerned I won't be able to concentrate.",
    "My body feels tight.",
    "I'm confident of coming through under pressure."
];

// Five Facet Mindfulness Questionnaire (FFMQ) questions (39 questions)
const FFMQ_QUESTIONS = [
    "When I'm walking, I deliberately notice the sensations of my body moving.",
    "I'm good at finding words to describe my feelings.",
    "I criticize myself for having irrational or inappropriate emotions.",
    "I perceive my feelings and emotions without having to react to them.",
    "When I do things, my mind wanders off and I'm easily distracted.",
    "When I take a shower or bath, I stay alert to the sensations of water on my body.",
    "I can easily put my beliefs, opinions, and expectations into words.",
    "I don't pay attention to what I'm doing because I'm daydreaming, worrying, or otherwise distracted.",
    "I watch my feelings without getting lost in them.",
    "I tell myself I shouldn't be feeling the way I'm feeling.",
    "I notice how foods and drinks affect my thoughts, bodily sensations, and emotions.",
    "It's hard for me to find the words to describe what I'm thinking.",
    "I am easily distracted.",
    "I believe some of my thoughts are abnormal or bad and I shouldn't think that way.",
    "I pay attention to sensations, such as the wind in my hair or sun on my face.",
    "I have trouble thinking of the right words to express how I feel about things.",
    "I make judgments about whether my thoughts are good or bad.",
    "I find it difficult to stay focused on what's happening in the present.",
    "When I have distressing thoughts or images, I \"step back\" and am aware of the thought or image without getting taken over by it.",
    "I pay attention to sounds, such as clocks ticking, birds chirping, or cars passing.",
    "In difficult situations, I can pause without immediately reacting.",
    "When I have a sensation in my body, it's difficult for me to describe it because I can't find the right words.",
    "It seems I am \"running on automatic\" without much awareness of what I'm doing.",
    "When I have distressing thoughts or images, I feel calm soon after.",
    "I tell myself that I shouldn't be thinking the way I'm thinking.",
    "I notice the smells and aromas of things.",
    "Even when I'm feeling terribly upset, I can find a way to put it into words.",
    "I rush through activities without being really attentive to them.",
    "When I have distressing thoughts or images, I am able just to notice them without reacting.",
    "I think some of my emotions are bad or inappropriate and I shouldn't feel them.",
    "I notice visual elements in art or nature, such as colors, shapes, textures, or patterns of light and shadow.",
    "My natural tendency is to put my experiences into words.",
    "When I have distressing thoughts or images, I just notice them and let them go.",
    "I do jobs or tasks automatically without being aware of what I'm doing.",
    "When I have distressing thoughts or images, I judge myself as good or bad depending what the thought or image is about.",
    "I pay attention to how my emotions affect my thoughts and behavior.",
    "I can usually describe how I feel at the moment in considerable detail.",
    "I find myself doing things without paying attention.",
    "I disapprove of myself when I have irrational ideas."
];

// Illinois Competition Test options
const ILLINOIS_OPTIONS = [
    "Not at all",
    "Somewhat", 
    "Moderately so",
    "Very much so"
];

// FFMQ options
const FFMQ_OPTIONS = [
    "Never or very rarely",
    "Rarely",
    "Sometimes", 
    "Often",
    "Very often or always"
];

// Combine all questions for the assessment
const DEFAULT_MINDSET_QUESTIONS = [
    // Illinois Competition Test questions (1-27)
    ...ILLINOIS_QUESTIONS.map((question, index) => ({
        _id: `illinois_${index + 1}`,
        question: `${index + 1}. ${question}`,
        options: ILLINOIS_OPTIONS,
        correctAnswers: ILLINOIS_OPTIONS, // All answers are valid
        explanation: "Rate how you feel right now during a competitive situation.",
        type: "illinois"
    })),
    // FFMQ questions (28-66)
    ...FFMQ_QUESTIONS.map((question, index) => ({
        _id: `ffmq_${index + 1}`,
        question: `${index + 28}. ${question}`,
        options: FFMQ_OPTIONS,
        correctAnswers: FFMQ_OPTIONS, // All answers are valid
        explanation: "Rate what is generally true for you.",
        type: "ffmq"
    }))
];

export default function YouAreOnMindset() {
    const form = useProfileForm();
    const authStore = useAuthStore();
    const registerReq = useApiRequest();
    const navigate = useNavigate();
    const [email, setEmail] = useState<string | null>(null);
    const [showAssessment, setShowAssessment] = useState(false);
    const [isFromLogin, setIsFromLogin] = useState(false);
    const [assessmentData, setAssessmentData] = useState<{
        answers: Record<string, string>;
        score: number;
        timeSpent: number;
        startTime: number;
    } | null>(null);

    // Check if user is coming from login (already registered)
    useEffect(() => {
        if (authStore.user?.nextStep === 'profile_completion') {
            setIsFromLogin(true);
            console.log("User is coming from login, already registered");
        }
    }, [authStore.user?.nextStep]);

    // Get email from auth store first, then fall back to localStorage
    useEffect(() => {
        // Try to get email from auth store first (login flow)
        if (authStore.user && authStore.user.email) {
            setEmail(authStore.user.email);
            console.log("Email found in auth store user object:", authStore.user.email);
        } else if (authStore.user && authStore.user.emailAddress?.email) {
            setEmail(authStore.user.emailAddress.email);
            console.log("Email found in auth store emailAddress:", authStore.user.emailAddress.email);
        } else {
            // Fall back to localStorage (signup flow)
            const storedEmail = localStorage.getItem('signup_email');
            if (storedEmail) {
                setEmail(storedEmail);
                console.log("Email found in localStorage:", storedEmail);
            } else {
                console.log("No email found in auth store or localStorage");
            }
        }
    }, [authStore.user]);

    function handleRegister() {
        if (registerReq.pending || !email) {
            console.log("Cannot register:", { pending: registerReq.pending, hasEmail: !!email });
            return;
        }

        // If user is coming from login, they're already registered, just redirect to login
        if (isFromLogin) {
            console.log("User is already registered, redirecting to login...");
            toast("s", "Assessment completed!", "You can now login with your credentials.");
            navigate("/login");
            return;
        }

        // For signup flow, check if we have form values
        if (!form?.values) {
            console.log("No form values available for registration");
            return;
        }

        const { user, address, role, password } = form.values;

        console.log("Attempting to register with:", {
            email,
            role,
            firstName: user.firstName,
            lastName: user.lastName,
            password: password,
        });

        // Get pending assessment data if available
        const pendingAssessmentData = localStorage.getItem('pending_assessment_data');
        let assessmentData = null;
        
        if (pendingAssessmentData) {
            try {
                assessmentData = JSON.parse(pendingAssessmentData);
                console.log("Including assessment data in registration:", assessmentData);
            } catch (error) {
                console.warn("Failed to parse pending assessment data:", error);
            }
        }

        // Log the exact data being sent to backend
        const registrationData = {
            email: email,
            password: password as string,
            firstName: user.firstName as string,
            lastName: user.lastName as string,
            role: role as Role,
            dateOfBirth: user.dateOfBirth as string,
            gender: user.gender as string,
            phoneNumber: user.phoneNumber as string,
            phoneNumberCountryCode: user.phoneNumberCountryCode as string,
            streetAddress: address.streetAddress as string,
            city: address.city as string,
            stateProvince: address.stateProvince as string,
            country: address.country as string,
            zipCode: address.zipCode as string,
            ...(assessmentData && { initialAssessment: assessmentData }),
        };
        
        console.log("Full registration data being sent:", registrationData);
        console.log("Phone number details:", {
            phoneNumber: user.phoneNumber,
            phoneNumberCountryCode: user.phoneNumberCountryCode,
            fullPhone: `${user.phoneNumberCountryCode} ${user.phoneNumber}`
        });

        registerReq.send(
            () =>
                register(registrationData),
            (res) => {
                console.log("Registration response received:", res);
                if (res.success) {
                    console.log("Registration successful, redirecting to login...");
                    // Clear stored signup data and pending assessment data
                    localStorage.removeItem('signup_email');
                    localStorage.removeItem('pending_assessment_data');
                    toast("s", "Successfully Registered!", "");
                    navigate("/login");
                } else {
                    console.log("Registration failed:", res);
                    toast("e", "Registration failed!", res.error);
                }
            }
        );
    }

    function handleSkip() {
        // Skip assessment and register immediately
        console.log("Skipping assessment, registering user...");
        handleRegister();
    }

    async function handleAssessmentComplete(answers?: Record<string, string>, score?: number) {
        console.log("Assessment completed, handling submission...");
        
        try {
            if (assessmentData && answers && score !== undefined) {
                // Update assessment data with final answers and score
                const finalAssessmentData = {
                    ...assessmentData,
                    answers,
                    score,
                    timeSpent: Math.round((Date.now() - assessmentData.startTime) / 1000) // Convert to seconds
                };
                
                setAssessmentData(finalAssessmentData);
                
                if (isFromLogin) {
                    // User is authenticated (login flow) - submit assessment to API
                    console.log("User is authenticated, submitting assessment to API...");
                    
                    // Format and submit assessment data
                    const formattedData = initialAssessmentService.formatAssessmentData(
                        DEFAULT_MINDSET_QUESTIONS,
                        answers,
                        finalAssessmentData.timeSpent
                    );
                    
                    console.log("Submitting assessment data:", formattedData);
                    
                    // Submit assessment to API
                    const response = await initialAssessmentService.submitInitialAssessment(formattedData);
                    
                    if (response.success) {
                        console.log("Assessment submitted successfully:", response);
                        toast("s", "Assessment Completed!", "Your mindset assessment has been submitted successfully.");
                        // For login flow, redirect to dashboard after assessment completion
                        navigate("/");
                        return;
                    } else {
                        console.warn("Assessment submission response:", response);
                        toast("w", "Assessment Submitted", "Assessment completed but there was an issue saving the data.");
                        // Still redirect even if submission failed
                        navigate("/");
                        return;
                    }
                } else {
                    // User is not authenticated (signup flow) - store assessment data locally
                    console.log("User not authenticated, storing assessment data locally...");
                    
                    // Store assessment data in localStorage for later submission during registration
                    const assessmentDataForRegistration = {
                        questions: DEFAULT_MINDSET_QUESTIONS,
                        answers: Object.entries(answers).map(([questionId, answer]) => ({
                            questionId,
                            answer,
                            question: DEFAULT_MINDSET_QUESTIONS.find(q => q._id === questionId)?.question || ''
                        })),
                        score,
                        timeSpent: finalAssessmentData.timeSpent,
                        completedAt: new Date().toISOString(),
                        assessmentType: 'mindset'
                    };
                    
                    localStorage.setItem('pending_assessment_data', JSON.stringify(assessmentDataForRegistration));
                    toast("s", "Assessment Completed!", "Assessment completed! Proceeding with registration...");
                }
            } else {
                console.warn("Missing assessment data, proceeding with registration");
                toast("w", "Assessment Completed", "Assessment completed but data could not be saved.");
            }
        } catch (error) {
            console.error("Error handling assessment completion:", error);
            toast("w", "Assessment Completed", "Assessment completed but there was an issue. Proceeding with registration.");
        }
        
        // Continue with registration process (only for signup flow)
        if (!isFromLogin) {
            handleRegister();
        }
    }

    function handleTakeAssessment() {
        console.log("Taking assessment...");
        setAssessmentData({
            answers: {},
            score: 0,
            timeSpent: 0,
            startTime: Date.now()
        });
        setShowAssessment(true);
    }

    // Show loading if email is not available
    if (!email) {
        return (
            <FormParent className="w-full max-w-2xl mx-auto">
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                    <p className="text-red-500 mt-2">Email not found. Please go back to signup or login.</p>
                    <div className="flex gap-3 justify-center mt-4">
                        <Link
                            to="/signup"
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Go to Signup
                        </Link>
                        <Link
                            to="/login"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </FormParent>
        );
    }

    // Show Assessment component if user chose to take it
    if (showAssessment) {
        return (
            <FormParent className="w-full max-w-4xl mx-auto">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Psychological Assessment</h2>
                    <p className="text-gray-600 mt-2">Complete the Illinois Competition Test and Five Facet Mindfulness Questionnaire</p>
                </div>
                <Assessment 
                    questions={DEFAULT_MINDSET_QUESTIONS}
                    onSubmit={(answers, score) => handleAssessmentComplete(answers, score)}
                    onProgress={(progress) => console.log("Assessment progress:", progress)}
                />
            </FormParent>
        );
    }

    return (
            <FormParent className="w-full max-w-2xl mx-auto">
            <LogoHeaderWithTitle
                title={isFromLogin ? "Complete Your Assessment" : "Psychological Assessment"}
                description={
                    isFromLogin 
                        ? "You're almost there! Complete this assessment to finish your profile setup."
                        : "Complete this psychological assessment to help us understand your competitive mindset and mindfulness levels."
                }
            />
            <hr className="border-gray-6" />
            
            {isFromLogin && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-800">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Welcome back, {authStore.user?.firstName}!</span>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                        Your profile is already set up. Just complete this assessment to finish the process.
                    </p>
                </div>
            )}
            
            <div className="grid grid-cols-2 gap-9">
                <Button
                    size="lg"
                    type="neutral"
                    className="!rounded-lg !justify-center"
                    onClick={handleSkip}
                >
                    {isFromLogin ? "Skip Assessment" : "Skip"}
                </Button>
                <Button
                    size="lg"
                    type="action"
                    onClick={handleTakeAssessment}
                >
                    {isFromLogin ? "Complete Assessment" : "Take Assessment"}
                </Button>
            </div>
        </FormParent>
    );
}