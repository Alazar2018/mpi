import { createContext, useContext, useEffect } from "react";
import {
    type FieldValues,
    type UseFormGetValues,
    type UseFormHandleSubmit,
    type UseFormRegister,
    type UseFormReset,
    type UseFormSetValue,
    type UseFormWatch,
    useForm,
    type DefaultValues,
    type FieldErrors,
} from "react-hook-form";

interface FormContextType<T extends FieldValues> {
    formId: string;
    register: UseFormRegister<T>;
    handleSubmit: UseFormHandleSubmit<T>;
    errors: FieldErrors<T>;
    getValues: UseFormGetValues<T>;
    setValue: UseFormSetValue<T>;
    watch: UseFormWatch<T>;
    reset: UseFormReset<T>;
    isValid: boolean;
}

type MyFormArgs<T extends FieldValues> = {
    onSubmit: UseFormHandleSubmit<T>;
    isValid: boolean;
    getValues: UseFormGetValues<T>;
    reset: UseFormReset<T>;
    setValue: UseFormSetValue<T>;
    watch: UseFormWatch<T>;
    errors: FieldErrors<T>;
};

type MyForm<T extends FieldValues> = (args: MyFormArgs<T>) => React.ReactNode;

type MyFormProps<T extends FieldValues> = {
    form: MyForm<T>;
    defaultValues?: DefaultValues<T>;
};

const FormContext = createContext<FormContextType<any>>(
    {} as FormContextType<any>
);

export const useMyForm = <T extends FieldValues>() =>
    useContext(FormContext) as FormContextType<T>;

export default function Form<T extends FieldValues>({
                                                        form,
                                                        defaultValues,
                                                    }: MyFormProps<T>) {
    const id = `form_id_${Math.floor(Math.random() * 10000)}`;

    const {
        register,
        handleSubmit,
        reset,
        getValues,
        setValue,
        watch,
        formState: { errors, isValid },
    } = useForm<T>({
        defaultValues: defaultValues as DefaultValues<T>,
    });

    // Reset form when defaultValues change
    useEffect(() => {
        if (defaultValues) {
            reset(defaultValues);
        }
    }, [defaultValues, reset]);

    return (
        <FormContext.Provider
            value={{
                formId: id,
                register,
                handleSubmit,
                errors,
                getValues,
                setValue,
                watch,
                reset,
                isValid,
            }}
        >
            <form id={id}>
                {form({
                    onSubmit: handleSubmit,
                    getValues,
                    watch,
                    isValid,
                    reset,
                    setValue,
                    errors,
                })}
            </form>
        </FormContext.Provider>
    );
}