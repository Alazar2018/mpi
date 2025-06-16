import { type FieldValues, type RegisterOptions } from "react-hook-form";
import { useMyForm } from "./Form";
import { useEffect, useRef, useState } from "react";
import type { InputProps } from "./Input";
import icons from "@/utils/icons";
import countryCodes from "@/utils/countryPhones";
import { intPhone } from "@/utils/utils";

type CountryCode = {
  code: string;
  country: string;
  flag: string;
  name: string;
  pattern: RegExp;
};

export default function PhoneInput({
  label,
  validation,
  onUpdate,
  name,
  value,
  placeholder = "Enter phone number",
  ...rest
}: Omit<InputProps, "password">) {
  const myForm = useMyForm();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    countryCodes[0]
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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
      try {
        const parts = value.split(" ");
        if (parts.length >= 2) {
          const countryCode = parts[0];
          const number = parts.slice(1).join(" ");

          const country = countryCodes.find((c) => c.code === countryCode);
          if (country) {
            setSelectedCountry(country);
          }

          setPhoneNumber(number);
          updateFormValue(countryCode, number);
        }
      } catch (e) {
        console.error("Error parsing phone number:", e);
      }
    }
  }, [value]);

  const watchInput = myForm.watch(name, value);

  useEffect(() => {
    onUpdate && watchInput != undefined && onUpdate(watchInput);
  }, [watchInput]);

  function updateFormValue(countryCode: string, number: string) {
    const fullNumber = `${countryCode} ${number}`;
    myForm.setValue &&
      fullNumber &&
      myForm.setValue(name, fullNumber, {
        shouldValidate: true,
        shouldDirty: true,
      });
  }

  function handleCountrySelect(country: CountryCode) {
    setSelectedCountry(country);
    updateFormValue(country.code, phoneNumber);
    setIsOpen(false);
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const sanitized = value.replace(/[^\d\s-]/g, "");
    setPhoneNumber(sanitized);
    updateFormValue(selectedCountry.code, sanitized);
  }

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <span className={`text-base ${validation?.required && "required"}`}>
          {label}
        </span>
      ) : null}
      <div className="flex items-center gap-2">
        <div className="relative" ref={dropdownRef}>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 flex items-center gap-2 bg-text-clr text-white rounded-2xl h-[3.25rem] cursor-pointer border-r border-gray-2"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="font-bold text-sm">{selectedCountry.code}</span>
            <i
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
              dangerouslySetInnerHTML={{ __html: icons.down }}
            />
          </div>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-64 bg-white rounded-lg shadow-lg max-h-60 overflow-auto">
              <input
                onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                value={search}
                autoFocus
                placeholder="Search..."
                className="sticky top-0 bg-white rounded-md border border-gray-2 px-4 py-1 m-2"
              />
              {countryCodes
                .filter((el) =>
                  [
                    el.name.toLowerCase(),
                    el.code.toLowerCase(),
                    el.country.toLowerCase(),
                  ].find((el) => el.includes(search.toLowerCase()))
                )
                .map((country) => (
                  <div
                    key={`${country.country}_${country.code}`}
                    onClick={() => handleCountrySelect(country)}
                    className={`px-4 py-3 hover:bg-gray-1 cursor-pointer flex items-center gap-3 ${
                      selectedCountry.code === country.code
                        ? "bg-gray-1 font-bold"
                        : ""
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span>{country.country}</span>
                    <span className="ml-auto">{country.code}</span>
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="flex-1">
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            className="w-full px-4 h-[3.25rem] bg-gray-1 rounded-2xl placeholder:opacity-50 placeholder:font-normal focus:outline-none font-bold text-base"
          />
          {/* not controlling the input just validating the data */}
          <input
            className="hidden"
            {...myForm.register(name, {
              ...(validation || {}),
              validate: (value) => {
                const parts = value.split(" ");
                let phone = parts.length < 2 ? value : parts.slice(1).join("");
                return (
                  selectedCountry.pattern.test(phone) || "Invalid phone number"
                );
              },
            })}
          />
        </div>
      </div>

      {myForm?.errors?.[name]?.message && (
        <span className="text-danger ml-1 text-xs">
          {myForm?.errors?.[name]?.message}
        </span>
      )}
    </div>
  );
}
