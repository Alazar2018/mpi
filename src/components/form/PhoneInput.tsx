import { type FieldValues, type RegisterOptions } from "react-hook-form";
import { useMyForm } from "./Form";
import { useEffect, useRef, useState, useCallback } from "react";
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
  countryCodeName, // New prop for country code field name
  ...rest
}: Omit<InputProps, "password"> & { countryCodeName?: string }) {
  const myForm = useMyForm();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    countryCodes[0]
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<number | undefined>(undefined);

  // Function to update form values with proper country code formatting
  const updateFormValue = useCallback(
    (countryCode: string, number: string) => {
      if (myForm) {
        // Extract only digits from phone number
        const digitsOnly = number.replace(/\D/g, "");
        myForm.setValue("phoneNumber", digitsOnly);
        
        // Ensure country code includes "+" prefix for API
        const countryCodeWithPlus = `+${countryCode.replace("+", "")}`;
        if (countryCodeName) {
          myForm.setValue(countryCodeName, countryCodeWithPlus);
        }
      }
    },
    [myForm, countryCodeName]
  );

  // Debounced update function to prevent rapid-fire updates
  const debouncedUpdate = useCallback((countryCode: string, number: string) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      updateFormValue(countryCode, number);
    }, 300); // 300ms delay
  }, [updateFormValue]);

  // Initialize form values when component mounts
  useEffect(() => {
    if (myForm && countryCodeName) {
      // Set initial country code with "+" prefix
      const countryCodeWithPlus = `+${selectedCountry.code.replace("+", "")}`;
      myForm.setValue(countryCodeName, countryCodeWithPlus);
    }
  }, [myForm, countryCodeName, selectedCountry.code]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch(""); // Clear search when closing
      }
    }

    // Add event listener with higher priority
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [isOpen]);

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
          // Don't call updateFormValue here to prevent infinite loops
        } else {
          // If no country code in value, just set the phone number
          setPhoneNumber(value);
          // Don't call updateFormValue here to prevent infinite loops
        }
      } catch (e) {
        console.error("Error parsing phone number:", e);
        // Fallback: just set the value as phone number
        setPhoneNumber(value);
        // Don't call updateFormValue here to prevent infinite loops
      }
    }
  }, [value]);

  // Also watch for country code changes from the form
  const watchCountryCode = countryCodeName ? myForm.watch(countryCodeName) : null;
  useEffect(() => {
    if (watchCountryCode && watchCountryCode !== selectedCountry.code.replace("+", "")) {
      const country = countryCodes.find((c) => c.code.replace("+", "") === watchCountryCode);
      if (country) {
        console.log("Country code changed from form:", watchCountryCode);
        setSelectedCountry(country);
        // Don't call updateFormValue here to prevent infinite loops
      }
    }
  }, [watchCountryCode, selectedCountry.code]);

  const watchInput = myForm.watch(name, value);

  useEffect(() => {
    if (onUpdate && watchInput !== undefined) {
      onUpdate(watchInput);
    }
  }, [onUpdate, watchInput]);

  function handleCountrySelect(country: CountryCode) {
    console.log("Country selected:", {
      name: country.name,
      dialingCode: country.code,
      countryCode: country.country,
      flag: country.flag,
      phoneCountryCode: country.code.replace("+", "")
    });
    
    // Close dropdown immediately to prevent getting stuck
    setIsOpen(false);
    setSearch("");
    
    setSelectedCountry(country);
    // Update form values with proper country code formatting
    updateFormValue(country.code, phoneNumber);
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const sanitized = value.replace(/[^\d\s-]/g, "");
    setPhoneNumber(sanitized);
    // Update form values immediately with proper country code formatting
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
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                setSearch(""); // Clear search when opening
              }
            }}
            className="px-3 flex items-center gap-2 bg-text-clr text-white rounded-2xl h-[3.25rem] cursor-pointer border-r border-gray-2 hover:bg-opacity-90 transition-all duration-200"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="font-bold text-sm">+{selectedCountry.code.replace("+", "")}</span>
            <i
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              dangerouslySetInnerHTML={{ __html: icons.down }}
            />
          </div>

          {isOpen && (
            <div className="absolute z-50 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-auto">
              <input
                onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                value={search}
                autoFocus
                placeholder="Search..."
                className="sticky top-0 bg-white rounded-md border border-gray-2 px-4 py-2 m-2 w-[calc(100%-1rem)]"
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
                    className={`px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3 transition-colors duration-150 ${
                      selectedCountry.code === country.code
                        ? "bg-gray-100 font-bold"
                        : ""
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-gray-600 font-mono">+{country.code.replace("+", "")}</span>
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
          {/* Hidden input for phone number validation */}
          <input
            className="hidden"
            {...myForm.register(name, {
              ...(validation || {}),
              validate: (value) => {
                return (
                  selectedCountry.pattern.test(value) || "Invalid phone number"
                );
              },
            })}
          />
          
          {/* Hidden input for country code */}
          {countryCodeName && (
            <input
              className="hidden"
              {...myForm.register(countryCodeName, {
                required: "Country code is required",
              })}
            />
          )}
        </div>
      </div>

      {myForm?.errors?.[name]?.message && (
        <span className="text-danger ml-1 text-xs">
          {String(myForm?.errors?.[name]?.message)}
        </span>
      )}
    </div>
  );
}
