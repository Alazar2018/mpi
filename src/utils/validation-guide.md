# Form Validation Guide

This guide shows how to use the reusable validation functions in your forms.

## Basic Usage

Import the validation functions you need:

```typescript
import {
  required,
  validateFirstName,
  validateEmail,
  minLength,
  maxLength
} from "@/utils/utils";
```

Use them in your form validation:

```typescript
<Input
  label="First Name"
  validation={{
    required,
    validate: validateFirstName
  }}
  name="firstName"
  placeholder="Enter your first name"
/>
```

## Available Components

### SearchableSelect Component

A searchable dropdown component that supports:
- **Search functionality** - Type to filter options
- **Flag display** - Shows country flags for country selections
- **Keyboard navigation** - Navigate with arrow keys
- **Click outside to close** - Intuitive UX behavior
- **Custom search terms** - Additional searchable keywords

```typescript
import SearchableSelect from "@/components/form/SearchableSelect";
import { getPopularCountries } from "@/utils/countries";

<SearchableSelect
  label="Country"
  validation={{ required }}
  options={getPopularCountries()}
  placeholder="Search and select your country"
  name="country"
/>
```

### Country Utilities

- `getCountryOptions()` - All countries from phone data
- `getPopularCountries()` - Popular countries first, then alphabetical
- `getCountryByCode(code)` - Find country by code (e.g., "US")
- `getCountryByName(name)` - Find country by name or alternative name

## Available Validation Functions

### Basic Validations

- `required` - Field is required
- `minLength(value, message?)` - Minimum character length
- `maxLength(value, message?)` - Maximum character length

### Name Validations

- `validateName(value)` - General name validation (letters, spaces, max 1 special character)
- `validateFirstName(value)` - First name validation (min 2 chars + name rules)
- `validateLastName(value)` - Last name validation (min 2 chars + name rules)

**Name Rules:**
- 2-50 characters long
- Letters and spaces allowed
- Maximum of 1 special character (hyphen or apostrophe)
- Examples: "John", "Mary-Jane", "O'Connor", "Jean Paul" ✓
- Examples: "John-Paul-Smith", "O'Mc'Donald" ✗

### Address Validations

- `validateStreetAddress(value)` - Street address validation
- `validateCity(value)` - City name validation
- `validateStateProvince(value)` - State/Province validation
- `validateZipCode(value)` - ZIP/Postal code validation

### Contact Validations

- `email(value)` - Email address validation
- `intPhone(pattern)` - Phone number validation with custom pattern

### Date Validations

- `validateDateOfBirth(value)` - Date of birth validation (min age 13)
- `validateAge(value, minAge)` - Custom age validation

### Security Validations

- `validatePassword(value)` - Strong password validation
- `validateConfirmPassword(password)` - Password confirmation validation

### Advanced Validations

- `validateUrl(value)` - URL validation
- `validateNumber(value)` - Number validation
- `validateRange(min, max)` - Number range validation
- `validateAlphanumeric(value)` - Alphanumeric characters only
- `validatePattern(pattern, message)` - Custom regex pattern validation

### Utility Functions

- `combineValidations(...validators)` - Combine multiple validators

## Examples

### Profile Form Example

```typescript
<Input
  label="First Name"
  validation={{
    required,
    validate: validateFirstName
  }}
  name="firstName"
/>

<Input
  label="Email"
  validation={{
    required,
    validate: email
  }}
  name="email"
/>

<DatePicker
  label="Date of Birth"
  validation={{
    required,
    validate: validateDateOfBirth
  }}
  name="dateOfBirth"
/>
```

### Address Form Example

```typescript
<Input
  label="Street Address"
  validation={{
    required,
    validate: validateStreetAddress
  }}
  name="streetAddress"
/>

<Input
  label="City"
  validation={{
    required,
    validate: validateCity
  }}
  name="city"
/>

<SearchableSelect
  label="Country"
  validation={{ required }}
  options={getPopularCountries()}
  placeholder="Search and select your country"
  name="country"
/>

<Input
  label="ZIP Code"
  validation={{
    required,
    validate: validateZipCode
  }}
  name="zipCode"
/>
```

### Password Form Example

```typescript
<Input
  label="Password"
  type="password"
  validation={{
    required,
    validate: validatePassword
  }}
  name="password"
/>

<Input
  label="Confirm Password"
  type="password"
  validation={{
    required,
    validate: validateConfirmPassword(watchPassword)
  }}
  name="confirmPassword"
/>
```

### Combining Validations

```typescript
<Input
  label="Username"
  validation={{
    required,
    validate: combineValidations(
      validateAlphanumeric,
      (value) => value.length >= 3 ? true : "Username must be at least 3 characters"
    )
  }}
  name="username"
/>
```

### Custom Range Validation

```typescript
<Input
  label="Age"
  type="number"
  validation={{
    required,
    validate: validateRange(18, 100)
  }}
  name="age"
/>
```

## Error Messages

All validation functions return either:
- `true` if validation passes
- A string error message if validation fails

The error messages are user-friendly and specific to each validation type.

## Best Practices

1. **Always use `required`** for mandatory fields
2. **Combine validations** when you need multiple checks
3. **Use specific validators** rather than generic ones when available
4. **Provide clear error messages** for custom validations
5. **Test edge cases** like empty strings, special characters, etc.
