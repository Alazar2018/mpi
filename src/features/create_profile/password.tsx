import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import Form from "@/components/form/Form";
import InputPassword from "@/components/form/InputPassword";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";
import { useProfileForm } from "@/context/profile_context";
import { useAuthStore } from "@/store/auth.store";
import { useApiRequest } from "@/hooks/useApiRequest";
import { register } from "@/features/auth/auth.api";
import { toast } from "@/utils/utils";
import { useNavigate } from "react-router";
import { Link } from "react-router-dom";
import {
    required,
    validatePassword,
    validateConfirmPassword,
} from "@/utils/utils";

// Define Role type locally
type Role = "player" | "coach" | "parent" | "admin";

export default function PasswordForm() {
    const form = useProfileForm();
    const authStore = useAuthStore();
    const registerReq = useApiRequest();
    const navigate = useNavigate();
    const [email, setEmail] = useState<string | null>(null);

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

    function handleSubmit(data: { password: string; confirmPassword: string }) {
        console.log("handleSubmit called with data:", data);
        console.log("Current form values:", form?.values);
        console.log("Current form active:", form?.active);
        
        if (form) {
            console.log("Setting password:", data.password);
            form.setFormValue("password", data.password);
            
            // If user is a player, continue to mindset step
            if (form.values?.role === "player") {
                console.log("User is a player, calling form.next()");
                form.next();
            } else {
                console.log("User is not a player, calling handleRegister");
                // For non-players, register immediately
                handleRegister(data.password);
            }
        } else {
            console.log("Form context is null!");
        }
    }

    function handleRegister(password: string) {
        if (registerReq.pending || !form?.values || !email) {
            console.log("Cannot register:", { pending: registerReq.pending, hasValues: !!form?.values, hasEmail: !!email });
            return;
        }

        const { user, address, role } = form.values;

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
            password: password,
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
                    password: password,
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

    const isPlayer = form?.values?.role === "player";
    const buttonText = isPlayer ? "Continue" : "Complete Registration";

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

    return (
        <FormParent className="w-full max-w-2xl mx-auto">
            <LogoHeaderWithTitle
                title="Create your password"
                description="Please create a strong password to secure your account."
            />
            <hr className="border-gray-6" />
            <Form<{ password: string; confirmPassword: string }>
                defaultValues={form?.values?.password ? { password: form.values.password, confirmPassword: form.values.password } : {}}
                form={({ onSubmit, setValue, watch, errors, isValid }) => {
                    // Initialize form values
                    const password = watch("password");
                    const confirmPassword = watch("confirmPassword");

                    console.log("Form render - errors:", errors, "isValid:", isValid);

                    return (
                        <div className="grid grid-cols-1 gap-6">
                            <InputPassword
                                label="Password"
                                validation={{
                                    required,
                                    validate: validatePassword
                                }}
                                name="password"
                            />
                            <InputPassword
                                label="Confirm Password"
                                validation={{
                                    required,
                                    validate: (value: string) => validateConfirmPassword(password)
                                }}
                                name="confirmPassword"
                            />
                            {Object.keys(errors).length > 0 && (
                                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                                    <h4 className="font-medium text-red-700 mb-2">Form Errors:</h4>
                                    <ul className="text-sm text-red-600 space-y-1">
                                        {Object.entries(errors).map(([field, error]) => (
                                            <li key={field}>• {field}: {error?.message || 'Invalid'}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2">Password Requirements:</h4>
                                <ul className="text-sm text-gray-600 space-y-1">
                                    <li>• At least 8 characters long</li>
                                    <li>• Contains at least one uppercase letter</li>
                                    <li>• Contains at least one lowercase letter</li>
                                    <li>• Contains at least one number</li>
                                    <li>• Contains at least one special character</li>
                                </ul>
                            </div>
                            <Button
                                onClick={() => {
                                    console.log("Button clicked!");
                                    console.log("Form values:", form?.values);
                                    console.log("Form active:", form?.active);
                                    console.log("Form errors:", errors);
                                    console.log("Form valid:", isValid);
                                    onSubmit(handleSubmit)();
                                }}
                                className="mt-6"
                                type="action"
                                size="lg"
                                pending={!isPlayer && registerReq.pending}
                            >
                                {buttonText}
                            </Button>
                        </div>
                    );
                }}
            />
        </FormParent>
    );
}