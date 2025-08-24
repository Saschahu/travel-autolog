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

/**
 * Split overtime hours into base overtime and surcharge components
 */
export function splitOvertime(ot50Minutes: number, ot100Minutes: number, saturdayMinutes: number, sundayMinutes: number, overtimeSettings: any): {
  ot50Split?: OvertimeSplit;
  ot100Split?: OvertimeSplit;
  saturdaySplit?: OvertimeSplit;
  sundaySplit?: OvertimeSplit;
} {
  const result: any = {};

  if (ot50Minutes > 0) {
    const surchargeMin = ot50Minutes * (overtimeSettings.overtimeRate1 / 100);
    result.ot50Split = {
      baseMinutes: ot50Minutes,
      surchargeMinutes: surchargeMin,
      creditMinutes: ot50Minutes * (1 + overtimeSettings.overtimeRate1 / 100),
      rate: overtimeSettings.overtimeRate1
    };
  }

  if (ot100Minutes > 0) {
    const surchargeMin = ot100Minutes * (overtimeSettings.overtimeRate2 / 100);
    result.ot100Split = {
      baseMinutes: ot100Minutes,
      surchargeMinutes: surchargeMin,
      creditMinutes: ot100Minutes * (1 + overtimeSettings.overtimeRate2 / 100),
      rate: overtimeSettings.overtimeRate2
    };
  }

  if (saturdayMinutes > 0) {
    const surchargeMin = saturdayMinutes * (overtimeSettings.saturdayRate / 100);
    result.saturdaySplit = {
      baseMinutes: saturdayMinutes,
      surchargeMinutes: surchargeMin,
      creditMinutes: saturdayMinutes * (1 + overtimeSettings.saturdayRate / 100),
      rate: overtimeSettings.saturdayRate
    };
  }

  if (sundayMinutes > 0) {
    const surchargeMin = sundayMinutes * (overtimeSettings.sundayRate / 100);
    result.sundaySplit = {
      baseMinutes: sundayMinutes,
      surchargeMinutes: surchargeMin,
      creditMinutes: sundayMinutes * (1 + overtimeSettings.sundayRate / 100),
      rate: overtimeSettings.sundayRate
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
  t: (key: string, options?: any) => string
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