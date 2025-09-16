import ApiService from "@/service/ApiService";
import { toast as T, type ToastOptions } from 'react-toastify'
import type { Match } from "@/interface";
import { sort } from "fast-sort";

export const required = "This is required";

export function mysort(arr: string[]) {
  return sort(arr).by({
    asc: true,
    comparer: new Intl.Collator(undefined, {  sensitivity: 'base' }).compare,
  })
}

function* counterId() {
  let i = 0;
  while (true) {
    yield `generated_id_${i++}`;
  }
}

export const genId = counterId();

// Length validations
export function minLength(value: number, message?: string) {
  return { value, message: message ?? `Must be at least ${value} characters` }
}

export function getCookies() {
  return document.cookie.split('; ').reduce((cookies: { [key: string]: string }, cookie) => {
    cookies[cookie.split('=')[0]] = cookie.split('=')[1]
    return cookies
  }, {})
}
export function maxLength(value: number, message?: string) {
  return { value, message: message ?? `Must be no more than ${value} characters` }
}

export function formatDateToYYMMDD(date: string, includeTime = false) {
  if (!date) return undefined;
  
  const d = new Date(date);

  const year = d.getFullYear().toString();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  
  if (!includeTime) {
    return `${year}-${month}-${day}`;
  }
  
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Name validations
export function validateName(value: string) {
  // Check basic pattern (letters, spaces, and at most one special character)
  const basicPattern = /^[a-zA-Z\s'-]{2,50}$/;
  if (!basicPattern.test(value)) {
    return "Name can only contain letters, spaces, hyphens, and apostrophes";
  }

  // Count special characters (hyphens and apostrophes)
  const specialCharCount = (value.match(/['-]/g) || []).length;
  if (specialCharCount > 1) {
    return "Name can contain at most one special character (hyphen or apostrophe)";
  }

  return true;
}

export function validateFirstName(value: string) {
  if (!value || value.trim().length < 2) {
    return "First name must be at least 2 characters";
  }
  return validateName(value);
}

export function validateLastName(value: string) {
  if (!value || value.trim().length < 2) {
    return "Last name must be at least 2 characters";
  }
  return validateName(value);
}

export function validateStreetAddress(value: string) {
  if (!value || value.trim().length < 5) {
    return "Street address must be at least 5 characters";
  }
  if (value.length > 100) {
    return "Street address must be no more than 100 characters";
  }
  const addressPattern = /^[a-zA-Z0-9\s,.#/-]+$/;
  if (!addressPattern.test(value)) {
    return "Street address contains invalid characters";
  }
  return true;
}

export function validateCity(value: string) {
  if (!value || value.trim().length < 2) {
    return "City must be at least 2 characters";
  }
  if (value.length > 50) {
    return "City must be no more than 50 characters";
  }
  const cityPattern = /^[a-zA-Z\s'-.,]+$/;
  if (!cityPattern.test(value)) {
    return "City can only contain letters, spaces, hyphens, apostrophes, periods, and commas";
  }
  return true;
}

export function validateStateProvince(value: string) {
  if (!value || value.trim().length < 2) {
    return "State/Province must be at least 2 characters";
  }
  if (value.length > 50) {
    return "State/Province must be no more than 50 characters";
  }
  const statePattern = /^[a-zA-Z\s'-.,]+$/;
  if (!statePattern.test(value)) {
    return "State/Province can only contain letters, spaces, hyphens, apostrophes, periods, and commas";
  }
  return true;
}

export function validateZipCode(value: string) {
  if (!value || value.trim().length < 3) {
    return "ZIP/Postal code must be at least 3 characters";
  }
  if (value.length > 10) {
    return "ZIP/Postal code must be no more than 10 characters";
  }
  const zipPattern = /^[a-zA-Z0-9\s-]+$/;
  if (!zipPattern.test(value)) {
    return "ZIP/Postal code can only contain letters, numbers, spaces, and hyphens";
  }
  return true;
}

// Date validations
export function validateAge(value: string | Date, minAge: number = 13) {
  const birthDate = typeof value === 'string' ? new Date(value) : value;
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    const actualAge = age - 1;
    if (actualAge < minAge) {
      return `You must be at least ${minAge} years old`;
    }
  } else if (age < minAge) {
    return `You must be at least ${minAge} years old`;
  }

  if (birthDate > today) {
    return "Birth date cannot be in the future";
  }

  return true;
}

export function validateDateOfBirth(value: string | Date) {
  return validateAge(value, 13);
}

// Phone validation
export function intPhone(pattern: RegExp) {
  return (value: string) => {
    const test = pattern.test(value);
    if (test) return true;
    return "Invalid phone number format";
  };
}

// Email validation
export function email(value: string) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(value)) {
    return "Please enter a valid email address";
  }
  return true;
}

// Generic pattern validation
export function validatePattern(pattern: RegExp, message: string) {
  return (value: string) => {
    if (!pattern.test(value)) {
      return message;
    }
    return true;
  };
}

// Alphanumeric validation
export function validateAlphanumeric(value: string) {
  const alphanumericPattern = /^[a-zA-Z0-9\s]+$/;
  if (!alphanumericPattern.test(value)) {
    return "Only letters, numbers, and spaces are allowed";
  }
  return true;
}

// Password validation
export function validatePassword(value: string) {
  if (!value || value.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/(?=.*[a-z])/.test(value)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/(?=.*[A-Z])/.test(value)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/(?=.*\d)/.test(value)) {
    return "Password must contain at least one number";
  }
  if (!/(?=.*[@$!%*?&])/.test(value)) {
    return "Password must contain at least one special character (@$!%*?&)";
  }
  return true;
}

// Confirm password validation
export function validateConfirmPassword(password: string) {
  return (value: string) => {
    if (value !== password) {
      return "Passwords do not match";
    }
    return true;
  };
}

// URL validation
export function validateUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return "Please enter a valid URL";
  }
}

// Number validation
export function validateNumber(value: string | number) {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) {
    return "Please enter a valid number";
  }
  return true;
}

// Range validation
export function validateRange(min: number, max: number) {
  return (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return "Please enter a valid number";
    }
    if (num < min || num > max) {
      return `Value must be between ${min} and ${max}`;
    }
    return true;
  };
}

// Custom validation combiner
export function combineValidations(...validators: Array<(value: any) => true | string>) {
  return (value: any) => {
    for (const validator of validators) {
      const result = validator(value);
      if (result !== true) {
        return result;
      }
    }
    return true;
  };
}
export function formButton(func: any) {
  return (ev: MouseEvent) => {
    ev.preventDefault();
    func();
  };
}

export function debounce(fn: any, delay = 150) {
  let tid: number
  return (...args: any[]) => {
    clearTimeout(tid)
    tid = setTimeout(() => fn(...args), delay)
  }
}

export function getApi(url: string, baseUrl?: string) {
  const api = new ApiService(`${baseUrl ?? import.meta.env.v_API_URL}${url}`);
  return api;
}

export function secondDateFormat(d: string, year: boolean = true) {
  if (!d) return " ";
  try {
    const date = new Date(d);
    const dateFormat = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: year ? "numeric" : undefined,
    }).format(date);
    return dateFormat;
  } catch (err) {
    return "";
  }
}

export function getAceCounts(match: Match): { p1Aces: number; p2Aces: number } {
  if (!match || !match.sets || match.sets.length === 0) {
    return { p1Aces: 0, p2Aces: 0 };
  }

  return {
    p1Aces: match.sets.reduce((total, set) => total + (set.p1SetReport?.service.aces || 0), 0),
    p2Aces: match.sets.reduce((total, set) => total + (set.p2SetReport?.service.aces || 0), 0)
  };
}

export function formatTime(dateString: string): string {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch (err) {
    console.error('Error formatting time:', err);
    return "";
  }
}
export function toast(
  type: "s" | "e" | "w",
  successMsg?: string,
  errorMsg?: string,
  options: ToastOptions = { position: "bottom-left" }
) {
  switch (type) {
    case "s":
      T.success(successMsg ?? '', options);
      break;
    case "e":
      T.error(errorMsg ?? '', options);
      break;
    case "w":
      T.warning(errorMsg ?? '', options);
      break;
  }
}


