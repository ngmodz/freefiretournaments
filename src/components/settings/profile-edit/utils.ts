// Validation functions for profile edit form
export const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
export const isValidPhone = (phone: string) => /^\+?[0-9]{10,15}$/.test(phone);

// Custom styles for form inputs
export const customInputStyles = "flex-1 bg-[#1a1a1a] border-0 py-3 pr-3 text-white focus:outline-none focus:ring-0 placeholder:text-gray-500 w-full text-base"; 