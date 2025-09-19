import { describe, it, expect } from 'vitest';
import { formatHmDec, formatHm, computeBillingTotals } from '../lib/billing';

describe('Billing Library', () => {
  describe('formatHmDec', () => {
    it('should format minutes to decimal hours', () => {
      expect(formatHmDec(60)).toBe('1.00 h');
      expect(formatHmDec(90)).toBe('1.50 h');
      expect(formatHmDec(0)).toBe('0.00 h');
    });

    it('should handle custom decimals', () => {
      expect(formatHmDec(90, 1)).toBe('1.5 h');
      expect(formatHmDec(90, 3)).toBe('1.500 h');
    });
  });

  describe('formatHm', () => {
    it('should format minutes to hours:minutes', () => {
      expect(formatHm(60)).toBe('1h 00m');
      expect(formatHm(90)).toBe('1h 30m');
      expect(formatHm(0)).toBe('0h 00m');
      expect(formatHm(125)).toBe('2h 05m');
    });
  });

  describe('computeBillingTotals', () => {
    it('should compute basic billing totals', () => {
      const buckets = {
        regularMin: 480, // 8 hours
        ot50Min: 60,     // 1 hour
        ot100Min: 0,
        saturdayMin: 0,
        sundayMin: 0,
        holidayMin: 0
      };

      const rates = {
        regular: 1.0,
        ot50: 1.5,
        ot100: 2.0,
        saturday: 1.5,
        sunday: 2.0,
        holiday: 2.0
      };

      const result = computeBillingTotals(buckets, rates);
      
      // The function returns payableMin as total working time calculated correctly
      expect(result.payableMin).toBe(570); // 8 hours * 1.0 + 1 hour * 1.5 = 8*60 + 1.5*60 = 480 + 90 = 570
      expect(result.premiumMin).toBe(30); // 60 * 0.5 additional rate
    });

    it('should handle empty buckets', () => {
      const result = computeBillingTotals({}, {});
      expect(result.baseMin).toBe(0);
      expect(result.premiumMin).toBe(0);
      expect(result.payableMin).toBe(0);
    });
  });
});