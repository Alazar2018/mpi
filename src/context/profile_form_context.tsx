import { useState, useEffect } from "react";
import { ProfileFormContext, type ProfileValues } from "./profile_context";
import YouAreOnMindset from "@/features/create_profile/you_are_on_mindset";
import { useAuthStore } from "@/store/auth.store";

// contexts/profile-form.context.tsx
export default function ProfileContext({
                                           children,
                                           active: ac,
                                           components,
                                       }: {
    children?: React.ReactNode;
    active: string;
    components: { name: string; com: React.ReactNode }[];
}) {
    const authStore = useAuthStore();
    const [active, setActiveState] = useState(ac);
    const [dynamicComponents, setDynamicComponents] = useState(components);
    const [values, setValue] = useState<ProfileValues | null>({
        role: "",
        password: "",
        user: {
            firstName: "",
            lastName: "",
            avatar: null,
            gender: "male",
            dateOfBirth: "",
            phoneNumber: "",
            phoneNumberCountryCode: "",
        },
        address: {
            streetAddress: "",
            streetAddress2: "",
            city: "",
            stateProvince: "",
            country: "",
            zipCode: "",
        },
    });

    // Update values when auth store becomes available
    useEffect(() => {
        if (authStore.user && values) {
            setValue(prev => ({
                ...prev!,
                role: authStore.user!.role || "",
                user: {
                    ...prev!.user,
                    firstName: authStore.user!.firstName || "",
                    lastName: authStore.user!.lastName || "",
                }
            }));
        }
    }, [authStore.user]);

    // Update components when role changes to add mindset step for players
    useEffect(() => {
        if (values?.role === "player") {
            // Check if mindset step is already added
            const hasMindset = dynamicComponents.some(comp => comp.name === "mindset");
            if (!hasMindset) {
                setDynamicComponents(prev => [...prev, { name: "mindset", com: <YouAreOnMindset /> }]);
            }
        }
    }, [values?.role, dynamicComponents]);

    const idx = dynamicComponents.findIndex((el) => el.name == active);

    function next() {
        console.log('next() called, current idx:', idx, 'components length:', dynamicComponents.length); // Debug log
        if (idx + 1 < dynamicComponents.length) {
            const nextComponentName = dynamicComponents[idx + 1].name;
            console.log('Moving to next component:', nextComponentName); // Debug log
            console.log('About to call setActiveState with:', nextComponentName); // Debug log
            setActiveState(nextComponentName);
            console.log('setActiveState called, new active should be:', nextComponentName); // Debug log
        } else {
            console.log('Already at last component'); // Debug log
        }
    }

    function prev() {
        if (idx - 1 >= 0) {
            setActiveState(dynamicComponents[idx - 1].name);
        }
    }

    function setFormValue(name: keyof ProfileValues, value: any) {
        setValue((prev) => {
            if (!prev) {
                // Initialize with default values if prev is null
                const defaultValues: ProfileValues = {
                    role: authStore.user?.role || "",
                    password: "",
                    user: {
                        firstName: authStore.user?.firstName || "",
                        lastName: authStore.user?.lastName || "",
                        avatar: null,
                        gender: "male",
                        dateOfBirth: "",
                        phoneNumber: "",
                        phoneNumberCountryCode: "",
                    },
                    address: {
                        streetAddress: "",
                        streetAddress2: "",
                        city: "",
                        stateProvince: "",
                        country: "",
                        zipCode: "",
                    },
                };
                return {
                    ...defaultValues,
                    [name]: value,
                };
            }
            return {
                ...prev,
                [name]: value,
            };
        });
    }

    const com = dynamicComponents.find((el) => el.name == active)?.com
    console.log('ProfileContext render - active:', active, 'component found:', !!com, 'available components:', dynamicComponents.map(c => c.name)); // Debug log
    return (
        <ProfileFormContext.Provider value={{ components: dynamicComponents, component: com, setActive: setActiveState, active, values, setFormValue, next, prev }}>
            <div className="w-full flex justify-center items-center">
                {children ?? com}
            </div>
        </ProfileFormContext.Provider>
    );
}