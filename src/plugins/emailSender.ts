import { registerPlugin } from '@capacitor/core';

export interface EmailComposeOptions {
  to?: string[];           // Empfänger
  subject: string;
  body: string;            // Plaintext (wir encoden selbst für Web)
  attachmentUri?: string;  // content://... (nur Android)
  mime?: string;           // default application/pdf
  packageName?: string;    // bevorzugte Mail-App (optional)
}

export interface EmailSenderPlugin {
  compose(options: EmailComposeOptions): Promise<void>;
}

export const EmailSender = registerPlugin<EmailSenderPlugin>('EmailSender');