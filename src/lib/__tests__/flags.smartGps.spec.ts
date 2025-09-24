import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Smart GPS Flag', () => {
  beforeEach(() => {
    vi.resetModules(); // Reset modules to ensure fresh imports
  });

  it('should return true when VITE_ENABLE_SMART_GPS is set to "true"', async () => {
    // Mock import.meta.env for this test
    vi.stubEnv('VITE_ENABLE_SMART_GPS', 'true');
    
    const { isSmartGpsEnabled } = await import('../flags');
    expect(isSmartGpsEnabled()).toBe(true);
  });

  it('should return false when VITE_ENABLE_SMART_GPS is set to "false"', async () => {
    vi.stubEnv('VITE_ENABLE_SMART_GPS', 'false');
    
    const { isSmartGpsEnabled } = await import('../flags');
    expect(isSmartGpsEnabled()).toBe(false);
  });

  it('should return false when VITE_ENABLE_SMART_GPS is undefined', async () => {
    vi.unstubAllEnvs();
    
    const { isSmartGpsEnabled } = await import('../flags');
    expect(isSmartGpsEnabled()).toBe(false);
  });

  it('should return false when VITE_ENABLE_SMART_GPS is set to any other value', async () => {
    const testCases = ['TRUE', 'True', '1', 'yes', 'on', 'enabled', ''];
    
    for (const value of testCases) {
      vi.stubEnv('VITE_ENABLE_SMART_GPS', value);
      
      // We need to reset modules to get fresh imports
      vi.resetModules();
      const { isSmartGpsEnabled } = await import('../flags');
      expect(isSmartGpsEnabled()).toBe(false);
    }
  });

  it('should be case sensitive - only lowercase "true" should work', async () => {
    const testCases = [
      { value: 'true', expected: true },
      { value: 'TRUE', expected: false },
      { value: 'True', expected: false },
      { value: 'tRuE', expected: false }
    ];

    for (const { value, expected } of testCases) {
      vi.stubEnv('VITE_ENABLE_SMART_GPS', value);
      
      vi.resetModules();
      const { isSmartGpsEnabled } = await import('../flags');
      expect(isSmartGpsEnabled()).toBe(expected);
    }
  });
});