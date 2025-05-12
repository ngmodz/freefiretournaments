// Password validation regex patterns
const hasLowerCase = /[a-z]/;
const hasUpperCase = /[A-Z]/;
const hasNumber = /[0-9]/;
const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validates password strength against security requirements
 */
export const validatePasswordStrength = (password: string): PasswordValidationResult => {
  if (password.length < 8) {
    return { 
      isValid: false, 
      message: "Password must be at least 8 characters"
    };
  }
  
  if (!hasLowerCase.test(password)) {
    return { 
      isValid: false, 
      message: "Password must include a lowercase letter"
    };
  }
  
  if (!hasUpperCase.test(password)) {
    return { 
      isValid: false, 
      message: "Password must include an uppercase letter"
    };
  }
  
  if (!hasNumber.test(password)) {
    return { 
      isValid: false, 
      message: "Password must include a number"
    };
  }
  
  if (!hasSpecialChar.test(password)) {
    return { 
      isValid: false, 
      message: "Password must include a special character"
    };
  }
  
  return { isValid: true };
}; 