import { useCallback, useEffect, useState } from "react";
import Button from "@/components/Button";
import DatePicker from "@/components/form/DateInput";
import Input from "@/components/form/Input";
import PhoneInput from "@/components/form/PhoneInput";
import Select from "@/components/form/Select";
import FormParent from "@/components/FormParent";
import LogoHeaderWithTitle from "@/components/LogoHeaderWithTitle";
import { useProfileForm } from "@/context/profile_context";
import { useAuthStore } from "@/store/auth.store";
import {
    required,
    validateDateOfBirth,
    validateName
} from "@/utils/utils";
import { type CreateUser } from "@/context/profile_context";
import FileInput from "@/components/form/FileInput";
import { Link } from "react-router-dom";

export default function ProfileForm() {
    const form = useProfileForm();
    const authStore = useAuthStore();
    const [email, setEmail] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get email from auth store first, then fall back to localStorage
    useEffect(() => {
        try {
            if (authStore.user && authStore.user.email) {
                setEmail(authStore.user.email);
            } else if (authStore.user && authStore.user.emailAddress?.email) {
                setEmail(authStore.user.emailAddress.email);
            } else {
                const storedEmail = localStorage.getItem('signup_email');
                if (storedEmail) {
                    setEmail(storedEmail);
                }
            }
        } catch (err) {
            setError("Failed to get email");
        }
    }, [authStore.user]);

    // Pre-populate form with user data from auth store if available
    useEffect(() => {
        if (authStore.user && form && form.values) {
            const currentUser = form.values.user || {};
            const updatedUser = { ...currentUser };
            
            if (authStore.user.firstName && !currentUser.firstName) {
                updatedUser.firstName = authStore.user.firstName;
            }
            if (authStore.user.lastName && !currentUser.lastName) {
                updatedUser.lastName = authStore.user.lastName;
            }
            
            if (Object.keys(updatedUser).some(key => updatedUser[key as keyof typeof updatedUser] !== currentUser[key as keyof typeof currentUser])) {
                form.setFormValue("user", updatedUser);
            }
        }
    }, [authStore.user, form]);

    const handleSubmit = useCallback(async (data: CreateUser) => {
        if (form && !isSubmitting) {
            try {
                setIsSubmitting(true);
                console.log("Submitting user data:", data);
                
                if (!data.firstName?.trim() || !data.lastName?.trim() || !data.dateOfBirth || !data.gender) {
                    console.error("Missing required fields");
                    return;
                }

                const phoneData = {
                    phoneNumber: data.phoneNumber?.trim() || "",
                    phoneNumberCountryCode: data.phoneNumberCountryCode?.trim() || ""
                };

                if (!phoneData.phoneNumber || !phoneData.phoneNumberCountryCode) {
                    console.error("Phone number or country code missing");
                    return;
                }

                form.setFormValue("user", {
                    ...data,
                    ...phoneData
                });

                console.log("Form data saved successfully, moving to next step");
                form.next();
            } catch (error) {
                console.error("Error submitting form:", error);
            } finally {
                setIsSubmitting(false);
            }
        }
    }, [form, isSubmitting]);

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

    // Show error if there's an error state
    if (error) {
        return (
            <FormParent className="w-full max-w-2xl mx-auto">
                <div className="text-center py-8">
                    <div className="text-red-500 text-xl mb-4">⚠️ Error</div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <div className="flex gap-3 justify-center mt-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Reload Page
                        </button>
                        <Link
                            to="/login"
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Go to Login
                        </Link>
                    </div>
                </div>
            </FormParent>
        );
    }

    // Check if form is available
    if (!form) {
        return (
            <FormParent className="w-full max-w-2xl mx-auto">
                <div className="text-center py-8">
                    <div className="text-red-500 text-xl mb-4">⚠️ Form Not Available</div>
                    <p className="text-red-600 mb-4">The profile form is not properly initialized.</p>
                    <div className="flex gap-3 justify-center mt-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Reload Page
                        </button>
                        <Link
                            to="/login"
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
                title="Setup your profile"
                description="To get started, please set up your profile by providing your personal information and preferences."
            />
            <hr className="border-gray-6" />
            
            <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = {
                    firstName: formData.get('firstName') as string,
                    lastName: formData.get('lastName') as string,
                    gender: formData.get('gender') as "male" | "female",
                    dateOfBirth: formData.get('dateOfBirth') as string,
                    phoneNumber: formData.get('phoneNumber') as string,
                    phoneNumberCountryCode: formData.get('phoneNumberCountryCode') as string,
                    avatar: null,
                };
                handleSubmit(data);
            }} className="space-y-6 w-full">
                {/* Avatar Section */}
                <div className="text-center">
                    <FileInput
                        seed={email}
                        name="avatar"
                        label="Avatar"
                        value={form?.values?.user?.avatar}
                    />
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        validation={{ required, validate: validateName }}
                        name="firstName"
                        placeholder="Enter your first name"
                    />
                    <Input
                        label="Last Name"
                        validation={{ required, validate: validateName }}
                        name="lastName"
                        placeholder="Enter your last name"
                    />
                </div>

                {/* Gender and Date of Birth */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                        name="gender"
                        label="Gender"
                        validation={{ required }}
                        value={form?.values?.user?.gender || "male"}
                        options={[
                            { label: "Male", value: "male" },
                            { label: "Female", value: "female" },
                        ]}
                        placeholder="Select Your Gender"
                    />
                    <DatePicker
                        placeholder="Select Your Date Of Birth"
                        validation={{
                            required,
                            validate: validateDateOfBirth
                        }}
                        label="Date of Birth"
                        name="dateOfBirth"
                        value={form?.values?.user?.dateOfBirth || ""}
                    />
                </div>

                {/* Phone Number */}
                <div>
                    <PhoneInput
                        validation={{ required }}
                        label="Phone Number"
                        name="phoneNumber"
                        countryCodeName="phoneNumberCountryCode"
                        value={form?.values?.user?.phoneNumber || ""}
                    />
                </div>

                {/* Submit Button */}
                <Button
                    type="action"
                    size="lg"
                    className="w-full"
                    pending={isSubmitting}
                >
                    Continue
                </Button>
            </form>
        </FormParent>
    );
}