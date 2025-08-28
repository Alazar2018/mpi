import {
  Controller,
  type FieldValues,
  type RegisterOptions,
  useForm,
} from "react-hook-form";
import { useMyForm } from "./Form";
import { useEffect, useRef } from "react";

export type InputProps = {
  value?: any;
  password?: boolean;
  onUpdate?: (arg: any) => void;
  name: string;
  placeholder?: string;
  label?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  validation?: RegisterOptions<FieldValues, string>;
};

export default function Input({
  label,
  validation,
  onUpdate,
  password,
  name,
  value,
  ...rest
}: InputProps) {
  const myForm = useMyForm();
  const input = useRef(null);

  useEffect(() => {
    myForm.setValue &&
      value &&
      myForm.setValue(name, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
  }, [value]);

  const watchInput = myForm.watch(name, value);

  useEffect(() => {
    onUpdate && watchInput != undefined && onUpdate(watchInput);
  }, [watchInput]);

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <span className={`text-base text-gray-700 ${validation?.required && "required"}`}>
          {label}
        </span>
      ) : null}
      <div tabIndex={-1} className="sys-focus px-4 flex overflow-hidden gap-2 bg-gray-50 rounded-lg h-[3.25rem] border border-gray-200">
        <input
          {...rest}
          type={password ? "password" : "text"}
          className="focus:shadow-none placeholder:opacity-50 placeholder:font-normal focus:outline-none h-full font-bold w-full rounded-2xl bg-transparent text-gray-800 placeholder-gray-500"
          defaultValue={value}
          {...myForm.register(name, validation)}
        />
        {rest?.right && <>{rest?.right}</>}
      </div>
      {myForm?.errors?.[name]?.message && (
        <span className="text-danger ml-1 text-xs">
          {myForm?.errors?.[name]?.message}
        </span>
      )}
    </div>
  );
}
