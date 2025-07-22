// Password validation regex patterns
const hasLowerCase = /[a-z]/;
const hasUpperCase = /[A-Z]/;
const hasNumber = /[0-9]/;
const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

/**
 * Validates a password against security requirements
 * @param password Password string to validate
 * @returns Array of error messages; empty array if all requirements are met
 */
export const validatePassword = (password: string): string[] => {
  // No requirements: any password is allowed
  return [];
}; 