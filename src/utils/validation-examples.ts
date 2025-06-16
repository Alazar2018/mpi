// Example usage of validation functions
// This file demonstrates how to use the validation utilities
// Updated with single special character rule for names

import {
  required,
  minLength,
  maxLength,
  validateFirstName,
  validateLastName,
  validateStreetAddress,
  validateCity,
  validateStateProvince,
  validateZipCode,
  validateDateOfBirth,
  validatePassword,
  validateConfirmPassword,
  email,
  validateUrl,
  validateNumber,
  validateRange,
  combineValidations
} from './utils';

// Example validation configurations for different form fields

export const profileValidations = {
  // Name validation: 2-50 chars, letters/spaces, max 1 special char (hyphen or apostrophe)
  // Valid: "John", "Mary-Jane", "O'Connor" | Invalid: "John-Paul-Smith", "O'Mc'Donald"
  firstName: {
    required,
    validate: validateFirstName
  },

  lastName: {
    required,
    validate: validateLastName
  },

  email: {
    required,
    validate: email
  },

  dateOfBirth: {
    required,
    validate: validateDateOfBirth
  },

  // Optional field with max length
  bio: {
    maxLength: maxLength(500, "Bio must be no more than 500 characters")
  }
};

export const addressValidations = {
  streetAddress: {
    required,
    validate: validateStreetAddress
  },

  streetAddress2: {
    maxLength: maxLength(100)
  },

  city: {
    required,
    validate: validateCity
  },

  stateProvince: {
    required,
    validate: validateStateProvince
  },

  country: {
    required
  },

  zipCode: {
    required,
    validate: validateZipCode
  }
};

export const passwordValidations = {
  password: {
    required,
    validate: validatePassword
  },

  // Note: confirmPassword validation needs the password value
  // Use it like: validate: validateConfirmPassword(watchedPasswordValue)
  confirmPassword: (passwordValue: string) => ({
    required,
    validate: validateConfirmPassword(passwordValue)
  })
};

export const advancedValidations = {
  // Website URL
  website: {
    validate: validateUrl
  },

  // Age with custom range
  age: {
    required,
    validate: validateRange(18, 120)
  },

  // Score with number validation
  score: {
    required,
    validate: combineValidations(
      validateNumber,
      validateRange(0, 100)
    )
  },

  // Username with multiple rules
  username: {
    required,
    validate: combineValidations(
      (value: string) => value.length >= 3 ? true : "Username must be at least 3 characters",
      (value: string) => value.length <= 20 ? true : "Username must be no more than 20 characters",
      (value: string) => /^[a-zA-Z0-9_]+$/.test(value) ? true : "Username can only contain letters, numbers, and underscores"
    )
  }
};

// Example of how to use these in a form component:
/*
import { profileValidations } from "@/utils/validation-examples";

<Input
  label="First Name"
  validation={profileValidations.firstName}
  name="firstName"
  placeholder="Enter your first name"
/>

<Input
  label="Email"
  validation={profileValidations.email}
  name="email"
  placeholder="Enter your email"
/>
*/
