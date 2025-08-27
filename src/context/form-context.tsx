// src/context/form-context.tsx
import { createContext, useContext, useState } from "react";

type FormData = {
    role?: string;
    user?: {
        firstName: string;
        lastName: string;
        avatar?: File | null;
        gender: "male" | "female";
        dateOfBirth: string;
        phoneNumber: string;
    };
    address?: {
        country: string;
        city: string;
        stateProvince: string;
        zipCode: string;
        streetAddress: string;
        streetAddress2?: string;
    };
    password?: string;
};

type FormContextType = {
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    currentStep: number;
    setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
    next: () => void;
    prev: () => void;
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: React.ReactNode }) {
    const [formData, setFormData] = useState<FormData>({});
    const [currentStep, setCurrentStep] = useState(0);

    const next = () => setCurrentStep(prev => Math.min(prev + 1, 4));
    const prev = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    return (
        <FormContext.Provider value={{ formData, setFormData, currentStep, setCurrentStep, next, prev }}>
            {children}
        </FormContext.Provider>
    );
}

export function useFormContext() {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error("useFormContext must be used within a FormProvider");
    }
    return context;
}