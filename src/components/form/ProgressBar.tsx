import { useEffect, useState } from "react";
import { useMyForm } from "./Form";
import type { InputProps } from "./Input";

export type ProgressBarProps = Omit<
  InputProps,
  "right" | "left" | "password" | "placeholder"
> & {
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  trackClassName?: string;
  barClassName?: string;
  className?: string;
};

export default function ProgressBar({
  label,
  validation,
  onUpdate,
  name,
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  className = "",
  trackClassName = "bg-green-0.5 h-[7px] rounded-full",
  barClassName = "bg-primary h-full rounded-full",
  ...rest
}: ProgressBarProps) {
  const myForm = useMyForm();
  const [progress, setProgress] = useState(value);

  // Update form value when value prop changes
  useEffect(() => {
    if (myForm.setValue) {
      myForm.setValue(name, value, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    setProgress(value);
  }, [value]);

  // Watch for form value changes
  const watchInput = myForm.watch(name, value);

  useEffect(() => {
    onUpdate && watchInput !== undefined && onUpdate(watchInput);
  }, [watchInput, onUpdate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
    
    const newValue = Number(e.target.value);
    setProgress(newValue);
    
    if (myForm.setValue) {
      myForm.setValue(name, newValue, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
    
    onUpdate?.(newValue);
  };

  const percentage = ((progress - min) / (max - min)) * 100;

  return (
    <div className={`flex flex-col border border-gray-5 rounded-xl p-4 gap-5 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <span className={`text-base ${validation?.required ? "required" : ""}`}>
            {label}
          </span>
          {showValue && (
            <span className="text-sm font-medium text-gray-700">
              {progress}%
            </span>
          )}
        </div>
      )}
      
      <div className="relative" >
        <div className={`absolute left-[50%] top-1/2 translate-x-[-50%] translate-y-[-50%] w-full ${trackClassName}`}>
          <div
            className={`h-full ${barClassName}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={progress}
          className="custom-slider absolute left-[50%] top-1/2 translate-x-[-50%] translate-y-[-50%] w-full appearance-none h-2.5 rounded-2xl accent-yellow-200"
          {...myForm.register(name, {
            ...validation,
            onChange: handleChange,
          })}
          {...rest}
        />
      </div>
      
      {myForm?.errors?.[name]?.message && (
        <span className="text-danger ml-1 text-xs">
          {myForm.errors[name].message}
        </span>
      )}
    </div>
  );
}
