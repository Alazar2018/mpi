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

    values[+(idx as string)] = value;

    setValues(values);
    myForm.setValue && myForm.setValue(name, values.join(""));

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
                maxLength={1}
                autoFocus={idx == 0}
                value={el ?? ""}
                data-idx={idx}
                onInput={onFocus}
                className="flex-1 w-[3rem] flex h-[3.8rem] text-center"
              />
            </div>
          );
        })}
      </div>
      {myForm?.errors?.[name]?.message && (
        <span className="text-danger ml-1 text-xs">
          {myForm?.errors?.[name]?.message}
        </span>
      )}
    </div>
  );
}
