import { type FieldValues, type RegisterOptions } from "react-hook-form";
import { useMyForm } from "./Form";
import { useEffect, useRef, useState } from "react";
import type { InputProps } from "./Input";
import icons from "@/utils/icons";

export type SelectOption = {
  label: string;
  value: string | number;
};

export default function Select({
  label,
  validation,
  onUpdate,
  name,
  value,
  options = [],
  placeholder = "Select an option",
  ...rest
}: Omit<InputProps, "password"> & {
  options: SelectOption[];
}) {
  const myForm = useMyForm();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(
    null
  );
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (value) {
      const option = options.find((opt) => opt.value === value);
      if (option) {
        setSelectedOption(option);
      }
    }
  }, [value, options]);

  const watchInput = myForm.watch(name, value);

  useEffect(() => {
    onUpdate && watchInput != undefined && onUpdate(watchInput);
  }, [watchInput]);

  function handleSelect(option: SelectOption) {
    setSelectedOption(option);
    setIsOpen(false);
    myForm.setValue &&
      myForm.setValue(name, option.value, {
        shouldValidate: true,
        shouldDirty: true,
      });
  }

  return (
    <div className="flex flex-col gap-1" ref={selectRef}>
      {label ? (
        <span className={`text-base text-[var(--text-primary)] ${validation?.required && "required"}`}>
          {label}
        </span>
      ) : null}
      <div className="relative" {...myForm.register(name, validation)}>
        <div
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsOpen(!isOpen);
            }
          }}
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 flex justify-between items-center overflow-hidden gap-2 bg-[var(--bg-secondary)] rounded-lg h-[3.25rem] cursor-pointer border border-[var(--border-primary)] transition-colors duration-300"
        >
          <span
            className={
              selectedOption ? "font-bold text-base" : "text-base font-normal opacity-50"
            }
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <i
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
            dangerouslySetInnerHTML={{
              __html:
                '<svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            }}
          />
        </div>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-[var(--bg-dropdown)] rounded-2xl shadow-[var(--shadow-primary)] max-h-60 overflow-auto border border-[var(--border-primary)] transition-colors duration-300">
            {options.map((option) => (
              <div
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSelect(option);
                  }
                }}
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`px-4 py-3 hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors duration-300 ${
                  selectedOption?.value === option.value
                    ? "bg-[var(--bg-secondary)] font-bold"
                    : ""
                }`}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
      {myForm?.errors?.[name]?.message && (
        <span className="text-danger ml-1 text-xs text-[var(--text-secondary)]">
          {String(myForm?.errors?.[name]?.message)}
        </span>
      )}
    </div>
  );
}
