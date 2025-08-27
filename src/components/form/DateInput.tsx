import { type FieldValues, type RegisterOptions } from "react-hook-form";
import { useMyForm } from "./Form";
import { useEffect, useState } from "react";
import type { InputProps } from "./Input";

interface DateValidation {
  required?: string;
  min?: string;
  max?: string;
  validate?: (value: any) => true | string;
  futureOnly?: boolean; // New prop to indicate if only future dates are allowed
  maxYearsAhead?: number; // New prop to limit how many years ahead can be selected
}

export default function DatePicker({
  label,
  validation,
  onUpdate,
  name,
  value,
  placeholder = "Select your date of birth",
  futureOnly = false,
  maxYearsAhead = 1,
  ...rest
}: Omit<InputProps, "password" | "right" | "left"> & { futureOnly?: boolean; maxYearsAhead?: number }) {
  const myForm = useMyForm();
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  // Generate days (1-31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Months with full names
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ];

  // Generate years based on futureOnly prop
  const currentYear = new Date().getFullYear();
  let years: number[];
  
  if (futureOnly) {
    // For future dates: current year to current year + maxYearsAhead
    years = Array.from({ length: maxYearsAhead + 1 }, (_, i) => currentYear + i);
  } else {
    // For birth dates: current year - 100 to current year - 13 (minimum age 13)
    years = Array.from({ length: 87 }, (_, i) => currentYear - 13 - i);
  }

  // Set initial value if provided
  useEffect(() => {
    if (value) {
      try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
          setSelectedDay(date.getDate().toString());
          setSelectedMonth((date.getMonth() + 1).toString().padStart(2, '0'));
          setSelectedYear(date.getFullYear().toString());
        }
      } catch (error) {
        console.error("Error parsing date value:", error);
      }
    }
  }, [value]);

  const watchInput = myForm.watch(name, value);

  useEffect(() => {
    onUpdate && watchInput != undefined && onUpdate(watchInput);
  }, [watchInput]);

  // Update form value when any selection changes
  const updateFormValue = (day: string, month: string, year: string) => {
    if (day && month && year) {
      const dateString = `${year}-${month}-${day.padStart(2, '0')}`;
      
      // Additional validation for future dates
      if (futureOnly) {
        const selectedDate = new Date(dateString);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < currentDate) {
          // Don't update form if past date is selected
          return;
        }
      }
      
      myForm.setValue &&
          myForm.setValue(name, dateString, {
          shouldValidate: true,
          shouldDirty: true,
        });
    }
  };

  // Handle day selection
  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    updateFormValue(day, selectedMonth, selectedYear);
  };

  // Handle month selection
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    updateFormValue(selectedDay, month, selectedYear);
  };

  // Handle year selection
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    updateFormValue(selectedDay, selectedMonth, year);
  };

  // Get available days for selected month and year (handles leap years and month lengths)
  const getAvailableDays = (month: string, year: string) => {
    if (!month || !year) return days;
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (monthNum === 2) {
      // February - check for leap year
      const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0);
      return Array.from({ length: isLeapYear ? 29 : 28 }, (_, i) => i + 1);
    } else if ([4, 6, 9, 11].includes(monthNum)) {
      // April, June, September, November - 30 days
      return Array.from({ length: 30 }, (_, i) => i + 1);
    } else {
      // January, March, May, July, August, October, December - 31 days
      return Array.from({ length: 31 }, (_, i) => i + 1);
    }
  };

  const availableDays = getAvailableDays(selectedMonth, selectedYear);

  return (
    <div className="flex flex-col gap-1">
      {/* Error message - moved to top */}
      {myForm?.errors?.[name]?.message && (
        <span className="text-red-500 text-xs mb-1">
          {String(myForm?.errors?.[name]?.message)}
        </span>
      )}

      {label ? (
        <span className={`text-base ${validation?.required && "required"}`}>
          {label}
        </span>
      ) : null}
      
      <div className="grid grid-cols-3 gap-3">
        {/* Day Selector */}
        <div className="relative">
          <select
            value={selectedDay}
            onChange={(e) => handleDayChange(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer"
          >
            <option value="">Day</option>
            {availableDays.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>

        {/* Month Selector */}
        <div className="relative">
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer"
          >
            <option value="">Month</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>

        {/* Year Selector */}
        <div className="relative">
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white cursor-pointer"
          >
            <option value="">Year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hidden input for form validation */}
      <input type="hidden" {...myForm.register(name, validation)} />

      {/* Selected date display */}
      {selectedDay && selectedMonth && selectedYear && (
        <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
          Selected: {months.find(m => m.value === selectedMonth)?.label} {selectedDay}, {selectedYear}
          {futureOnly && (
            <span className="ml-2 text-blue-600">
              ✓ Future date selected
            </span>
          )}
        </div>
      )}

      {/* Help text for future dates */}
      {futureOnly && (
        <p className="text-xs text-blue-600 mt-1">
          📅 Only future dates are allowed. Past dates cannot be selected.
        </p>
      )}
    </div>
  );
}
