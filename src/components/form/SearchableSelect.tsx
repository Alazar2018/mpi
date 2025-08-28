import { useMyForm } from "./Form";
import { useEffect, useRef, useState } from "react";
import type { InputProps } from "./Input";
import icons from "@/utils/icons";

export type SearchableOption = {
  label: string;
  value: string;
  flag?: string;
  searchTerms?: string[];
};

export default function SearchableSelect({
  label,
  validation,
  onUpdate,
  name,
  value,
  placeholder = "Select an option",
  options = [],
}: Omit<InputProps, "password" | "right" | "left"> & {
  options: SearchableOption[];
}) {
  const myForm = useMyForm();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedOption, setSelectedOption] = useState<SearchableOption | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Set initial value if provided
  useEffect(() => {
    if (value) {
      const option = options.find(opt => opt.value === value);
      if (option) {
        setSelectedOption(option);
      }
    }
  }, [value, options]);

  const watchInput = myForm.watch(name, value);

  useEffect(() => {
    onUpdate && watchInput != undefined && onUpdate(watchInput);
  }, [watchInput]);

  function handleOptionSelect(option: SearchableOption) {
    setSelectedOption(option);
    myForm.setValue && myForm.setValue(name, option.value, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setIsOpen(false);
    setSearch("");
  }

  // Filter options based on search
  const filteredOptions = options.filter((option) => {
    const searchLower = search.toLowerCase();
    const searchableText = [
      option.label.toLowerCase(),
      option.value.toLowerCase(),
      ...(option.searchTerms || []).map(term => term.toLowerCase())
    ];

    return searchableText.some(text => text.includes(searchLower));
  });

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <span className={`text-base text-[var(--text-primary)] ${validation?.required && "required"}`}>
          {label}
        </span>
      ) : null}

      <div className="relative" ref={dropdownRef}>
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 flex justify-between items-center overflow-hidden gap-2 bg-[var(--bg-secondary)] rounded-lg h-[3.25rem] cursor-pointer border border-[var(--border-primary)] transition-colors duration-300"
        >
          <div className="flex items-center gap-2">
            {selectedOption?.flag && (
              <span className="text-lg">{selectedOption.flag}</span>
            )}
            <span className={selectedOption ? "font-bold text-base" : "text-base opacity-50"}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <i
            className={`*:size-3.5 text-gray-2 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            dangerouslySetInnerHTML={{ __html: icons.down || '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' }}
          />
        </div>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-[var(--bg-dropdown)] rounded-2xl shadow-[var(--shadow-primary)] max-h-60 overflow-hidden border border-[var(--border-primary)] transition-colors duration-300">
            <div className="p-2 border-b border-[var(--border-primary)]">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                placeholder="Search..."
                className="w-full px-3 py-2 border border-[var(--border-primary)] rounded-lg focus:outline-none focus:border-primary"
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => handleOptionSelect(option)}
                    className={`px-4 py-3 hover:bg-[var(--bg-secondary)] cursor-pointer flex items-center gap-3 ${
                      selectedOption?.value === option.value
                        ? "bg-[var(--bg-secondary)] font-bold"
                        : ""
                    }`}
                  >
                    {option.flag && (
                      <span className="text-lg text-[var(--text-primary)]">{option.flag}</span>
                    )}    
                    <span className="flex-1 text-[var(--text-primary)]">{option.label}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-[var(--text-secondary)] text-center">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden input for form validation */}
      <input
        type="hidden"
        {...myForm.register(name, validation)}
      />

      {myForm?.errors?.[name]?.message && (
        <span className="text-danger ml-1 text-xs text-[var(--text-secondary)]">
          {String(myForm?.errors?.[name]?.message)} 
        </span>
      )}
    </div>
  );
}
