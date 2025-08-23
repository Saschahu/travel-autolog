// Email validation and handling utilities

export function splitEmails(input?: string | null): string[] {
  if (!input) return [];
  return input.split(/[;,]/).map(s => s.trim()).filter(Boolean);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function validateEmails(list: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const e of list) {
    (EMAIL_RE.test(e) ? valid : invalid).push(e);
  }
  return { valid, invalid };
}

export function validateEmailInput(input?: string | null): { valid: boolean; errors: string[] } {
  const emails = splitEmails(input);
  if (emails.length === 0) {
    return { valid: true, errors: [] };
  }
  
  const { invalid } = validateEmails(emails);
  return {
    valid: invalid.length === 0,
    errors: invalid.length > 0 ? [`Ungültige E-Mail-Adresse(n): ${invalid.join(', ')}`] : []
  };
}