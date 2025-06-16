import { type FieldValues, type RegisterOptions } from "react-hook-form";
import { useMyForm } from "./Form";
import { useEffect, useRef, useState } from "react";
import type { InputProps } from "./Input";
import icons from "@/utils/icons";

export default function DatePicker({
  label,
  validation,
  onUpdate,
  name,
  value,
  placeholder = "Select a date",
  ...rest
}: Omit<InputProps, "password" | "right" | "left">) {
  const myForm = useMyForm();
  const [isOpen, setIsOpen] = useState(false);
  const [isYearSelectorOpen, setIsYearSelectorOpen] = useState(false);
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [displayValue, setDisplayValue] = useState<string>("");
  const datePickerRef = useRef<HTMLDivElement>(null);
  const yearSelectorRef = useRef<HTMLDivElement>(null);
  const monthSelectorRef = useRef<HTMLDivElement>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Close calendar when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsYearSelectorOpen(false);
        setIsMonthSelectorOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Generate years for selector (current year ± 10 years)
  const generateYears = () => {
    const currentYear = currentMonth.getFullYear();
    const years = [];
    for (let i = currentYear - 30; i <= currentYear + 30; i++) {
      years.push(i);
    }
    return years;
  };

  const years = generateYears();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Handle year selection
  function selectYear(year: number) {
    setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
    setIsYearSelectorOpen(false);
  }

  function selectMonth(monthIndex: number) {
    setCurrentMonth(new Date(currentMonth.getFullYear(), monthIndex, 1));
    setIsMonthSelectorOpen(false);
  }

  // Set initial value if provided
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        setDisplayValue(formatDate(date));
        myForm.setValue &&
          myForm.setValue(name, formatDateForValue(date), {
            shouldValidate: true,
            shouldDirty: true,
          });
      }
    }
  }, [value]);

  const watchInput = myForm.watch(name, value);

  useEffect(() => {
    onUpdate && watchInput != undefined && onUpdate(watchInput);
  }, [watchInput]);

  function formatDate(date: Date): string {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatDateForValue(date: Date): string {
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  function handleSelect(date: Date) {
    setSelectedDate(date);
    setDisplayValue(formatDate(date));
    setIsOpen(false);
    myForm.setValue &&
      myForm.setValue(name, formatDateForValue(date), {
        shouldValidate: true,
        shouldDirty: true,
      });
  }

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay();
  }

  function generateCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }

  function prevMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  function isToday(date: Date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function isSelected(date: Date) {
    return (
      selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  }

  const calendar = generateCalendar();
  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  useEffect(() => {
    if (isYearSelectorOpen && yearSelectorRef.current) {
      const currentYearElement = yearSelectorRef.current.querySelector(
        `.year-${currentMonth.getFullYear()}`
      );
      if (currentYearElement) {
        currentYearElement.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }
    }

    if (isMonthSelectorOpen && monthSelectorRef.current) {
      const currentMonthElement = monthSelectorRef.current.querySelector(
        `.month-${currentMonth.getMonth()}`
      );
      if (currentMonthElement) {
        currentMonthElement.scrollIntoView({
          block: "center",
          behavior: "smooth",
        });
      }
    }
  }, [isYearSelectorOpen, isMonthSelectorOpen]);

  return (
    <div className="flex flex-col gap-1" ref={datePickerRef}>
      {label ? (
        <span className={`text-base ${validation?.required && "required"}`}>
          {label}
        </span>
      ) : null}
      <div className="relative">
        <div
          tabIndex={0}
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 flex justify-between items-center overflow-hidden gap-2 bg-gray-1 rounded-lg h-[3.25rem] cursor-pointer"
        >
          <span
            className={
              displayValue ? "font-bold text-base" : "text-base opacity-50"
            }
          >
            {displayValue || placeholder}
          </span>
          <i
            className="*:size-3.5 text-gray-2"
            dangerouslySetInnerHTML={{ __html: icons.calender }}
          />
        </div>

        <input type="hidden" {...myForm.register(name, validation)} />

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1 rounded-full hover:bg-gray-1"
              >
                <i
                  dangerouslySetInnerHTML={{
                    __html:
                      icons.back ||
                      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                  }}
                />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsMonthSelectorOpen(!isMonthSelectorOpen);
                    setIsYearSelectorOpen(false);
                  }}
                  className="ml-2 font-bold hover:bg-gray-1 px-2 py-1 rounded-md"
                >
                  {currentMonth.toLocaleDateString("en-US", { month: "long" })}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsYearSelectorOpen(!isYearSelectorOpen);
                    setIsMonthSelectorOpen(false);
                  }}
                  onMouseDown={(e) => {
                    // Prevent focus loss when clicking
                    e.preventDefault();
                    setIsMonthSelectorOpen(!isMonthSelectorOpen);
                    setIsYearSelectorOpen(false);
                  }}
                  className="font-bold hover:bg-gray-1 px-2 py-1 rounded-md"
                >
                  {currentMonth.toLocaleDateString("en-US", {
                    year: "numeric",
                  })}
                </button>

                {isYearSelectorOpen && (
                  <div
                    ref={yearSelectorRef}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-white rounded-xl shadow-lg h-32 overflow-y-scroll w-24 z-20 snap-y snap-mandatory scrollbar-thin"
                  >
                    <div className="py-4">
                      {years.map((year) => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => selectYear(year)}
                          className={`year-${year} w-full py-2 text-center snap-center ${
                            year === currentMonth.getFullYear()
                              ? "bg-secondary text-green-9 font-bold"
                              : "hover:bg-gray-1"
                          }`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {isMonthSelectorOpen && (
                  <div
                    ref={monthSelectorRef}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 bg-white rounded-xl shadow-lg h-32 overflow-y-scroll w-32 z-20 snap-y snap-mandatory scrollbar-thin"
                  >
                    <div className="py-4">
                      {months.map((month, idx) => (
                        <button
                          key={month}
                          type="button"
                          onClick={() => selectMonth(idx)}
                          className={`month-${idx} w-full py-2 text-center hover:bg-gray-1 snap-center ${
                            idx === currentMonth.getMonth()
                              ? "bg-secondary text-green-9 font-bold"
                              : ""
                          }`}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded-full hover:bg-gray-1"
              >
                <i
                  dangerouslySetInnerHTML={{
                    __html:
                      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
                  }}
                />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdays.map((day) => (
                <div key={day} className="text-xs font-bold text-gray-2 py-1">
                  {day}
                </div>
              ))}

              {calendar.map((date, index) => (
                <div key={index} className="text-center">
                  {date ? (
                    <button
                      type="button"
                      onClick={() => handleSelect(date)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                        ${
                          isSelected(date)
                            ? "bg-secondary text-green-9 font-bold"
                            : ""
                        }
                        ${
                          isToday(date) && !isSelected(date)
                            ? "border border-secondary"
                            : ""
                        }
                        ${!isSelected(date) ? "hover:bg-gray-1" : ""}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  ) : (
                    <div className="w-8 h-8"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {myForm?.errors?.[name]?.message && (
        <span className="text-danger ml-1 text-xs">
          {myForm?.errors?.[name]?.message}
        </span>
      )}
    </div>
  );
}
