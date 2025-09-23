// Helper functions for overtime calculation display
import { formatHours } from '@/lib/timeCalc';

export interface OvertimeSplit {
  baseMinutes: number;      // Base overtime minutes (actual time over 8h)
  surchargeMinutes: number; // Additional surcharge minutes  
  creditMinutes: number;    // Total creditable minutes (base * multiplier)
  rate: number;             // Surcharge rate (50, 100, etc.)
}

export interface PayableFormula {
  regularHours: string;     // "8h 00m" 
  ot50Split?: OvertimeSplit;
  ot100Split?: OvertimeSplit;
  saturdayPart?: string;
  sundayPart?: string;
  totalPayable: string;
}

type OvertimeSettingsLike = {
  overtimeRate1?: unknown;
  overtimeRate2?: unknown;
  saturdayRate?: unknown;
  sundayRate?: unknown;
};

const toNum = (v: unknown, defaultValue = 0): number => {
  return Number.isFinite(v as number) ? (v as number) : defaultValue;
};

/**
 * Split overtime hours into base overtime and surcharge components
 */
export function splitOvertime(ot50Minutes: number, ot100Minutes: number, saturdayMinutes: number, sundayMinutes: number, overtimeSettings: unknown): {
  ot50Split?: OvertimeSplit;
  ot100Split?: OvertimeSplit;
  saturdaySplit?: OvertimeSplit;
  sundaySplit?: OvertimeSplit;
} {
  if (!overtimeSettings || typeof overtimeSettings !== 'object') {
    return {};
  }
  
  const settings = overtimeSettings as OvertimeSettingsLike;
  const result: {
    ot50Split?: OvertimeSplit;
    ot100Split?: OvertimeSplit;
    saturdaySplit?: OvertimeSplit;
    sundaySplit?: OvertimeSplit;
  } = {};

  if (ot50Minutes > 0) {
    const rate1 = toNum(settings.overtimeRate1, 50);
    const surchargeMin = ot50Minutes * (rate1 / 100);
    result.ot50Split = {
      baseMinutes: ot50Minutes,
      surchargeMinutes: surchargeMin,
      creditMinutes: ot50Minutes * (1 + rate1 / 100),
      rate: rate1
    };
  }

  if (ot100Minutes > 0) {
    const rate2 = toNum(settings.overtimeRate2, 100);
    const surchargeMin = ot100Minutes * (rate2 / 100);
    result.ot100Split = {
      baseMinutes: ot100Minutes,
      surchargeMinutes: surchargeMin,
      creditMinutes: ot100Minutes * (1 + rate2 / 100),
      rate: rate2
    };
  }

  if (saturdayMinutes > 0) {
    const satRate = toNum(settings.saturdayRate, 50);
    const surchargeMin = saturdayMinutes * (satRate / 100);
    result.saturdaySplit = {
      baseMinutes: saturdayMinutes,
      surchargeMinutes: surchargeMin,
      creditMinutes: saturdayMinutes * (1 + satRate / 100),
      rate: satRate
    };
  }

  if (sundayMinutes > 0) {
    const sunRate = toNum(settings.sundayRate, 100);
    const surchargeMin = sundayMinutes * (sunRate / 100);
    result.sundaySplit = {
      baseMinutes: sundayMinutes,
      surchargeMinutes: surchargeMin,
      creditMinutes: sundayMinutes * (1 + sunRate / 100),
      rate: sunRate
    };
  }

  return result;
}

/**
 * Generate payable hours formula text
 */
export function generatePayableFormula(
  regularMinutes: number,
  splits: ReturnType<typeof splitOvertime>,
  t: (key: string, options?: unknown) => string
): string {
  const parts = [formatHours(regularMinutes)];

  if (splits.ot50Split) {
    parts.push(t('overtime.formula.ot50', {
      base: formatHours(splits.ot50Split.baseMinutes),
      surcharge: formatHours(splits.ot50Split.surchargeMinutes)
    }));
  }

  if (splits.ot100Split) {
    parts.push(t('overtime.formula.ot100', {
      base: formatHours(splits.ot100Split.baseMinutes),
      surcharge: formatHours(splits.ot100Split.surchargeMinutes)
    }));
  }

  if (splits.saturdaySplit) {
    parts.push(t('overtime.formula.saturday', {
      base: formatHours(splits.saturdaySplit.baseMinutes),
      surcharge: formatHours(splits.saturdaySplit.surchargeMinutes)
    }));
  }

  if (splits.sundaySplit) {
    parts.push(t('overtime.formula.sunday', {
      base: formatHours(splits.sundaySplit.baseMinutes),
      surcharge: formatHours(splits.sundaySplit.surchargeMinutes)
    }));
  }

  return parts.join(' + ');
}

/**
 * Convert decimal hours to minutes for calculations
 */
export function decimalHoursToMinutes(decimalHours: number): number {
  return Math.round(decimalHours * 60);
}