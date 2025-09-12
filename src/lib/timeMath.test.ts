import { describe, it, expect } from 'vitest';
import {
  parseTimeHHMM,
  minutesBetweenAcrossMidnight,
  sumMinutes,
  isSundayUTC,
  formatMinutesToHours,
} from './timeMath';

describe('timeMath', () => {
  it('parseTimeHHMM parses valid HH:MM', () => {
    expect(parseTimeHHMM('00:00')).toBe(0);
    expect(parseTimeHHMM('02:10')).toBe(130);
    expect(parseTimeHHMM('22:50')).toBe(22 * 60 + 50);
  });

  it('parseTimeHHMM rejects invalid', () => {
    expect(() => parseTimeHHMM('24:00')).toThrow();
    expect(() => parseTimeHHMM('09:60')).toThrow();
    expect(() => parseTimeHHMM('9-30')).toThrow();
  });

  it('minutesBetweenAcrossMidnight handles same-day and overnight', () => {
    expect(minutesBetweenAcrossMidnight('08:00', '12:30')).toBe(270);
    expect(minutesBetweenAcrossMidnight('22:10', '00:20')).toBe(130);
  });

  it('sumMinutes adds and skips null/undefined', () => {
    expect(sumMinutes([60, null, 30, undefined])).toBe(90);
  });

  it('isSundayUTC detects Sunday deterministically (UTC)', () => {
    expect(isSundayUTC('2025-09-07')).toBe(true);  // 7. Sep 2025 ist Sonntag
    expect(isSundayUTC('2025-09-08')).toBe(false);
  });

  it('formatMinutesToHours formats with sign and negatives', () => {
    expect(formatMinutesToHours(0)).toBe('0:00');
    expect(formatMinutesToHours(130)).toBe('2:10');
    expect(formatMinutesToHours(-75)).toBe('-1:15');
    expect(formatMinutesToHours(5, { includeSign: true })).toBe('+0:05');
  });
});
