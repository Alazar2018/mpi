import { useMyForm } from "./Form";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import type { InputProps } from "./Input";

export default function CodeInput({
  label,
  validation,
  onUpdate,
  name,
  value,
}: Omit<InputProps, "right" | "left" | "password" | "placeholder"> & {
  children?: React.ReactNode;
}) {
  const myForm = useMyForm();
  const [values, setValues] = useState<string[]>(Array(6).fill(null));

  const watchInput = myForm.watch(name, value);
  useEffect(() => {
    onUpdate && watchInput != undefined && (onUpdate(watchInput));
  }, [watchInput, onUpdate]);

  function onFocus(ev: FormEvent<HTMLInputElement>) {
    const target = ev.target as HTMLInputElement;
    const idx = target.dataset["idx"];
    const value = target.value;

    // Only allow numbers
    if (value && !/^\d$/.test(value)) {
      target.value = '';
      return;
    }

    const newValues = [...values];
    newValues[+(idx as string)] = value;
    setValues(newValues);
    myForm.setValue && myForm.setValue(name, newValues.join(""));

    if(!value) return
    
    if (+(idx as string) + 1 == values.length) {
      const form = window[myForm.formId as keyof Window] as HTMLFormElement;
      form && (form?.submit as any)?.click();
    } else {
      const input = document.querySelector(
        `input[data-idx="${+(idx as string) + 1}"]`
      );
      input && (input as HTMLInputElement).focus();
    }
  }

  function onPaste(ev: React.ClipboardEvent<HTMLInputElement>) {
    ev.preventDefault();
    const pastedData = ev.clipboardData.getData('text/plain');
    
    // Only allow numbers
    const numbers = pastedData.replace(/\D/g, '').split('').slice(0, 6);
    
    if (numbers.length > 0) {
      const newValues = [...values];
      
      // Fill the values array with pasted numbers
      numbers.forEach((num, index) => {
        if (index < 6) {
          newValues[index] = num;
        }
      });
      
      setValues(newValues);
      myForm.setValue && myForm.setValue(name, newValues.join(""));
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = newValues.findIndex(val => !val);
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : Math.min(numbers.length, 5);
      
      const input = document.querySelector(
        `input[data-idx="${focusIndex}"]`
      ) as HTMLInputElement;
      
      if (input) {
        input.focus();
        input.select();
      }
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <span className={`text-base ${validation?.required && "required"}`}>
          {label}
        </span>
      ) : null}
      <div
        {...myForm.register(name, validation)}
        className="gap-2 flex justify-between items-center"
      >
        {values.map((el, idx) => {
          return (
            <div key={idx} className="rounded-md  bg-gray-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoFocus={idx == 0}
                value={el ?? ""}
                data-idx={idx}
                onInput={onFocus}
                onPaste={onPaste}
                onKeyDown={(e) => {
                  // Handle backspace to go to previous input
                  if (e.key === 'Backspace' && !e.currentTarget.value && idx > 0) {
                    const prevInput = document.querySelector(
                      `input[data-idx="${idx - 1}"]`
                    ) as HTMLInputElement;
                    if (prevInput) {
                      prevInput.focus();
                      prevInput.select();
                    }
                  }
                }}
                className="flex-1 w-[3rem] flex h-[3.8rem] text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              />
            </div>
          );
        })}
      </div>
      {myForm?.errors?.[name]?.message && (
        <span className="text-danger ml-1 text-xs">
          {String(myForm?.errors?.[name]?.message)}
        </span>
      )}
    </div>
  );
}
