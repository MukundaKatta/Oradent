/**
 * Validate an email address.
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate a US phone number (10 digits, with or without formatting).
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned.startsWith("1"));
}

/**
 * Validate a US Social Security Number (9 digits).
 */
export function isValidSSN(ssn: string): boolean {
  const cleaned = ssn.replace(/\D/g, "");
  if (cleaned.length !== 9) return false;
  // SSNs cannot start with 000, 666, or 9xx
  const area = parseInt(cleaned.slice(0, 3), 10);
  if (area === 0 || area === 666 || area >= 900) return false;
  // Group number (digits 4-5) cannot be 00
  if (cleaned.slice(3, 5) === "00") return false;
  // Serial number (digits 6-9) cannot be 0000
  if (cleaned.slice(5, 9) === "0000") return false;
  return true;
}

/**
 * Validate a National Provider Identifier (NPI).
 * An NPI is a 10-digit number that passes the Luhn check with prefix 80840.
 */
export function isValidNPI(npi: string): boolean {
  const cleaned = npi.replace(/\D/g, "");
  if (cleaned.length !== 10) return false;

  // NPI Luhn check: prefix with 80840, then validate
  const prefixed = "80840" + cleaned;
  let sum = 0;
  let alternate = false;

  for (let i = prefixed.length - 1; i >= 0; i--) {
    let n = parseInt(prefixed[i], 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

/**
 * Validate a US ZIP code (5 digits or ZIP+4 format).
 */
export function isValidZip(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip.trim());
}

export interface PasswordStrengthResult {
  valid: boolean;
  errors: string[];
}

/**
 * Check if a password meets strength requirements.
 * Requirements: min 8 chars, uppercase, lowercase, digit, special character.
 */
export function isStrongPassword(password: string): PasswordStrengthResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one digit");
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
