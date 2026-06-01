export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15;
}

export function isValidNPI(npi: string): boolean {
  return /^\d{10}$/.test(npi);
}

export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+\-() ]/g, '');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
