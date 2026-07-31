import validator from "validator";

/**
 * Validates email format.
 * @param {string} email 
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email) return false;
  return validator.isEmail(email);
}

/**
 * Validates password strength:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one number
 * @param {string} password 
 * @returns {boolean}
 */
export function validatePassword(password) {
  if (!password) return false;
  
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasMinLength && hasUppercase && hasNumber;
}

/**
 * Sanitizes input string to remove dangerous characters.
 * @param {string} str 
 * @returns {string}
 */
export function sanitizeInput(str) {
  if (typeof str !== "string") return str;
  // Escape HTML entities to prevent XSS
  return validator.escape(str.trim());
}
