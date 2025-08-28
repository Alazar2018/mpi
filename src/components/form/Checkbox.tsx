import {
  Controller,
  type FieldValues,
  type RegisterOptions,
  useForm,
} from "react-hook-form";
import { useMyForm } from "./Form";
import { Children, useEffect, useRef, useState } from "react";
import type { InputProps } from "./Input";
import icons from "@/utils/icons";

export default function Checkbox({
  label,
  validation,
  onUpdate,
  name,
  value,
  ...rest
}: Omit<InputProps, "right" | "left" | "password" | "placeholder"> & {
  children?: React.ReactNode;
}) {
  const myForm = useMyForm();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    myForm.setValue &&
      myForm.setValue(
        name,
        (checked && !value && checked) ||
          (checked && value && value) ||
          (!checked && ""),
        {
          shouldDirty: true,
        }
      );
  }, [value]);
  
  const watchInput = myForm.watch(name, value);

  useEffect(() => {
    onUpdate && watchInput != undefined && onUpdate(watchInput);
  }, [watchInput]);

  function toggle() {
    setChecked(!checked);
    myForm.setValue &&
      myForm.setValue(
        name,
        (!checked && !value && !checked) ||
          (!checked && value && value) ||
          (checked && ""),
        {
          shouldValidate: true,
        }
      );
  }
  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <span className={`text-base text-gray-700 ${validation?.required && "required"}`}>
          {label}
        </span>
      ) : null}
      <div className="flex items-center gap-1">
        <div
          onClick={toggle}
          className={`border size-6 rounded grid place-items-center ${
            checked ? "bg-blue-600 border-transparent" : "border-gray-300"
          }`}
          {...myForm.register(name, validation)}
        >
          {checked ? (
            <i className="text-white" dangerouslySetInnerHTML={{ __html: icons.checkBoxCheck }} />
          ) : null}
        </div>
        {rest?.children && <span></span>}
        <span className="text-sm text-gray-700 font-semibold">
          {rest?.children}
        </span>
      </div>
      {myForm?.errors?.[name]?.message && (
        <span className="text-danger ml-1 text-xs">
          {myForm?.errors?.[name]?.message}
        </span>
      )}
    </div>
  );
}
