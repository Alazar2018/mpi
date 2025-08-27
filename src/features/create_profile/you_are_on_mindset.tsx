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

// Define Role type locally
type Role = "player" | "coach" | "parent" | "admin";

export default function YouAreOnMindset() {
    const form = useProfileForm();
    const authStore = useAuthStore();
    const registerReq = useApiRequest();
    const navigate = useNavigate();
    const [email, setEmail] = useState<string | null>(null);
    const [showAssessment, setShowAssessment] = useState(false);
    const [isFromLogin, setIsFromLogin] = useState(false);

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
        };
        
        console.log("Full registration data being sent:", registrationData);
        console.log("Phone number details:", {
            phoneNumber: user.phoneNumber,
            phoneNumberCountryCode: user.phoneNumberCountryCode,
            fullPhone: `${user.phoneNumberCountryCode} ${user.phoneNumber}`
        });

        registerReq.send(
            () =>
                register({
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
                }),
            (res) => {
                console.log("Registration response received:", res);
                if (res.success) {
                    console.log("Registration successful, redirecting to login...");
                    // Clear stored signup data
                    localStorage.removeItem('signup_email');
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

    function handleAssessmentComplete() {
        console.log("Assessment completed, registering user...");
        // Assessment is complete, now register the user
        handleRegister();
    }

    function handleTakeAssessment() {
        console.log("Taking assessment...");
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
                    <h2 className="text-2xl font-bold text-gray-800">Mindset Assessment</h2>
                    <p className="text-gray-600 mt-2">Complete the assessment to personalize your experience</p>
                </div>
                <Assessment 
                    onSubmit={handleAssessmentComplete}
                    onProgress={(progress) => console.log("Assessment progress:", progress)}
                />
            </FormParent>
        );
    }

    return (
        <FormParent className="w-full max-w-2xl mx-auto">
            <LogoHeaderWithTitle
                title={isFromLogin ? "Complete Your Assessment" : "You're on Mindset!"}
                description={
                    isFromLogin 
                        ? "You're almost there! Complete this assessment to finish your profile setup."
                        : "We've put together a quick assessment to help you kick things off right where you fit in."
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