import { describe, it, expect, vi } from 'vitest';
import { EMAIL_PROVIDERS, getProviderById, openCompose, getTestMessage } from './emailProviders';

describe('emailProviders', () => {
  describe('EMAIL_PROVIDERS', () => {
    it('should have all required providers', () => {
      expect(EMAIL_PROVIDERS).toHaveLength(5);
      
      const providerIds = EMAIL_PROVIDERS.map(p => p.id);
      expect(providerIds).toContain('mailto');
      expect(providerIds).toContain('gmail');
      expect(providerIds).toContain('outlook');
      expect(providerIds).toContain('yahoo');
      expect(providerIds).toContain('proton');
    });

    it('should have proper provider structure', () => {
      EMAIL_PROVIDERS.forEach(provider => {
        expect(provider).toHaveProperty('id');
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('icon');
        expect(provider).toHaveProperty('description');
        expect(typeof provider.id).toBe('string');
        expect(typeof provider.name).toBe('string');
        expect(typeof provider.icon).toBe('string');
        expect(typeof provider.description).toBe('string');
      });
    });
  });

  describe('getProviderById', () => {
    it('should return correct provider for valid id', () => {
      const gmailProvider = getProviderById('gmail');
      expect(gmailProvider).toBeDefined();
      expect(gmailProvider?.id).toBe('gmail');
      expect(gmailProvider?.name).toBe('Gmail Web');
    });

    it('should return undefined for invalid id', () => {
      const provider = getProviderById('invalid-id');
      expect(provider).toBeUndefined();
    });
  });

  describe('getTestMessage', () => {
    it('should return proper test message format', () => {
      const message = getTestMessage();
      
      expect(message).toHaveProperty('subject');
      expect(message).toHaveProperty('body');
      expect(typeof message.subject).toBe('string');
      expect(typeof message.body).toBe('string');
      expect(message.subject).toContain('ServiceTracker Test');
      expect(message.body).toContain('ServiceTracker');
    });
  });

  describe('openCompose', () => {
    beforeEach(() => {
      // Mock window.open and location
      const mockLocation = {
        origin: 'http://localhost:3000',
        href: ''
      };
      
      vi.stubGlobal('window', {
        ...window,
        open: vi.fn().mockReturnValue({}),
        location: mockLocation
      });
    });

    it('should handle mailto provider', async () => {
      const mockLocation = {
        origin: 'http://localhost:3000',
        href: ''
      };
      
      vi.stubGlobal('window', {
        ...window,
        open: vi.fn(),
        location: mockLocation
      });

      const result = await openCompose('mailto', {
        subject: 'Test',
        body: 'Test body'
      });

      expect(result).toBe(true);
      expect(window.location.href).toContain('mailto:');
    });

    it('should handle web providers', async () => {
      const mockOpen = vi.fn().mockReturnValue({});
      vi.stubGlobal('window', {
        ...window,
        open: mockOpen,
        location: { origin: 'http://localhost:3000' }
      });

      const result = await openCompose('gmail', {
        subject: 'Test',
        body: 'Test body'
      });

      expect(result).toBe(true);
      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://mail.google.com'),
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('should handle popup blocked scenario', async () => {
      const mockOpen = vi.fn().mockReturnValue(null);
      vi.stubGlobal('window', {
        ...window,
        open: mockOpen,
        location: { origin: 'http://localhost:3000' }
      });

      const result = await openCompose('gmail', {
        subject: 'Test',
        body: 'Test body'
      });

      expect(result).toBe(false);
    });
  });
});