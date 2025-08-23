// Email provider utilities for web-based compose URLs

export interface EmailProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export const EMAIL_PROVIDERS: EmailProvider[] = [
  {
    id: 'mailto',
    name: 'System (mailto)',
    icon: '📧',
    description: 'Öffnet die Standard-E-Mail-App des Systems'
  },
  {
    id: 'gmail',
    name: 'Gmail Web',
    icon: '📮',
    description: 'Gmail im Browser öffnen'
  },
  {
    id: 'outlook',
    name: 'Outlook Web',
    icon: '📨',
    description: 'Outlook/Office 365 im Browser öffnen'
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    icon: '📩',
    description: 'Yahoo Mail im Browser öffnen'
  },
  {
    id: 'proton',
    name: 'Proton Mail',
    icon: '🔒',
    description: 'ProtonMail im Browser öffnen'
  }
];

export interface ComposeOptions {
  to?: string;
  subject: string;
  body: string;
}

export const buildComposeUrl = (providerId: string, options: ComposeOptions): string => {
  const { to = '', subject, body } = options;
  
  switch (providerId) {
    case 'mailto':
      return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    case 'gmail':
      return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    case 'outlook':
      return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    case 'yahoo':
      return `https://compose.mail.yahoo.com/?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    case 'proton':
      return `https://mail.proton.me/u/0/compose?to=${encodeURIComponent(to)}&title=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    default:
      // Fallback to mailto
      return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
};

export const openCompose = (providerId: string, options: ComposeOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const url = buildComposeUrl(providerId, options);
      
      if (providerId === 'mailto') {
        // For mailto, use location.href instead of window.open
        window.location.href = url;
        resolve(true);
      } else {
        // For web providers, open in new tab
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        
        if (newWindow) {
          resolve(true);
        } else {
          // Popup was blocked
          resolve(false);
        }
      }
    } catch (error) {
      console.error('Failed to open compose window:', error);
      resolve(false);
    }
  });
};

export const getTestMessage = (): ComposeOptions => ({
  subject: 'ServiceTracker Test',
  body: `Dies ist eine Testnachricht aus ServiceTracker.

Mit freundlichen Grüßen,
Ihr ServiceTracker Team

---
Gesendet von ServiceTracker
${window.location.origin}`
});

export const getProviderById = (id: string): EmailProvider | undefined => {
  return EMAIL_PROVIDERS.find(provider => provider.id === id);
};