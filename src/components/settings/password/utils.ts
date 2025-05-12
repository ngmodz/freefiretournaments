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
  const errors = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  
  if (!hasLowerCase.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!hasUpperCase.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!hasNumber.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!hasSpecialChar.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return errors;
}; 