import { createContext, useContext } from "react";
import {
  type Control,
  type FieldValues,
  type UseFormGetValues,
  type UseFormHandleSubmit,
  type UseFormRegister,
  type UseFormReset,
  type UseFormSetValue,
  type UseFormWatch,
  useForm,
} from "react-hook-form";
interface FormContextType<T extends FieldValues> {
  formId: string,
  register: UseFormRegister<T>,
  handleSubmit: UseFormHandleSubmit<T>;
  errors: any;
  getValues: UseFormGetValues<T>;
  setValue: UseFormSetValue<T>;
  watch: UseFormWatch<T>;
}

type MyFormArgs<T extends FieldValues> = {
  onSubmit: UseFormHandleSubmit<T>
  isValid: boolean;
  getValues: UseFormGetValues<T>;
  reset: UseFormReset<T>;
  setValue: UseFormSetValue<T>;
  watch: UseFormWatch<T>;
};

type MyForm<T extends FieldValues> = (args: MyFormArgs<T>) => React.ReactNode;

type MyFormProps<T extends FieldValues> = {
  form: MyForm<T>;
};

const FormContext = createContext<FormContextType<any>>(
  {} as FormContextType<any>
);

export const useMyForm = <T extends FieldValues>() =>
  useContext(FormContext) as FormContextType<T>;

export default function Form<T extends FieldValues>({ form }: MyFormProps<T>) {
  const id = `form_id_${parseInt(`${Math.random()}`.split('').slice(2).join('')) % 10000}`

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<T>();

  return (
    <FormContext.Provider value={{ formId: id, getValues, watch, register, setValue, handleSubmit, errors }}>
      <form id={id}>
        {form({ onSubmit: handleSubmit, getValues, watch, isValid, reset, setValue })}
      </form>
    </FormContext.Provider>
  );
}
