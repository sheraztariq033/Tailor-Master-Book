import {t} from 'i18next'; // For translatable error messages

/**
 * Validates an email address.
 * @param email The email string to validate.
 * @returns True if valid, false otherwise.
 */
export const isValidEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  // Basic regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a phone number.
 * Basic validation: checks if it's not empty and contains only digits, possibly with a leading '+'.
 * More complex validation (e.g., length, specific country codes) would require a library.
 * @param phoneNumber The phone number string to validate.
 * @returns True if valid, false otherwise.
 */
export const isValidPhoneNumber = (phoneNumber: string | null | undefined): boolean => {
  if (!phoneNumber) return false;
  // Allows digits, optional leading '+', and common characters like spaces or hyphens (which should ideally be stripped before validation or backend storage)
  // This regex is permissive. For strict digit-only: /^\+?[0-9]+$/
  const phoneRegex = /^\+?[0-9\s-()]+$/; 
  return phoneRegex.test(phoneNumber);
};

/**
 * Checks if a value is a non-empty string.
 * @param value The value to check.
 * @returns True if value is a non-empty string, false otherwise.
 */
export const isNonEmptyString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Checks if a password meets basic complexity requirements.
 * Example: at least 6 characters.
 * @param password The password string to validate.
 * @returns True if valid, false otherwise.
 */
export const isValidPassword = (password: string | null | undefined, minLength: number = 6): boolean => {
  if (!password) return false;
  return password.length >= minLength;
};


// --- Form Validation Helper ---

export interface FieldValidationRule<T> {
  value: T;
  rules: Array<(value: T) => string | null>; // Array of validation functions; return error message string or null if valid
  fieldName?: string; // Optional: For generating generic error messages
}

export interface FormValidationErrors<FormShape> {
  [key: string]: string; // Field name -> error message
}

/**
 * Validates multiple fields based on a set of rules.
 * @param fields An object where keys are field names and values are FieldValidationRule objects.
 * @returns An error object. Empty if no errors.
 */
export const validateForm = <T extends Record<string, any>>(
    fields: Record<keyof T, FieldValidationRule<T[keyof T]>>
): FormValidationErrors<T> => {
  const errors: FormValidationErrors<T> = {};
  for (const key in fields) {
    const field = fields[key];
    for (const rule of field.rules) {
      const errorMessage = rule(field.value);
      if (errorMessage) {
        errors[key] = errorMessage;
        break; // Stop at first error for this field
      }
    }
  }
  return errors;
};

// --- Common Validation Rules (examples) ---

export const requiredRule = (value: any, fieldName?: string): string | null => {
  if (value === null || value === undefined || String(value).trim() === '') {
    return t('validation.required', { field: fieldName || t('validation.thisField', 'This field') });
  }
  return null;
};

export const minLengthRule = (minLength: number, fieldName?: string) => (value: string): string | null => {
  if (String(value).trim().length < minLength) {
    return t('validation.minLength', { field: fieldName || t('validation.thisField', 'This field'), count: minLength });
  }
  return null;
};

export const emailFormatRule = (fieldName?: string) => (value: string): string | null => {
  if (!isValidEmail(value)) {
    return t('validation.invalidEmail', { field: fieldName || t('validation.thisField', 'This field') });
  }
  return null;
};

export const phoneFormatRule = (fieldName?: string) => (value: string): string | null => {
    if(!isValidPhoneNumber(value)){
        return t('validation.invalidPhone', { field: fieldName || t('validation.thisField', 'This field') });
    }
    return null;
};

export const mustMatchRule = (otherValue: string, otherFieldName: string, fieldName?: string) => (value: string): string | null => {
    if (value !== otherValue) {
        return t('validation.mustMatch', { field1: fieldName || t('validation.thisField', 'This field'), field2: otherFieldName });
    }
    return null;
};

export const isNumberRule = (fieldName?: string) => (value: any): string | null => {
    if (isNaN(parseFloat(value)) || !isFinite(value)) {
        return t('validation.mustBeNumber', { field: fieldName || t('validation.thisField', 'This field') });
    }
    return null;
};

// Example usage of validateForm:
/*
const formData = {
  email: 'test@example.com',
  password: 'pass',
};

const errors = validateForm({
  email: { value: formData.email, rules: [requiredRule, emailFormatRule()], fieldName: t('loginScreen.emailLabel') },
  password: { value: formData.password, rules: [requiredRule, minLengthRule(6)], fieldName: t('loginScreen.passwordLabel') },
});

if (Object.keys(errors).length > 0) {
  console.log("Validation Errors:", errors);
} else {
  console.log("Form is valid!");
}
*/
