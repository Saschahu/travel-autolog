export type OTRateKey = 'regular' | 'ot50' | 'ot100' | 'saturday' | 'sunday' | 'holiday';

export interface OTRates {
  regular: number;   // 1.0
  ot50?: number;     // 1.5
  ot100?: number;    // 2.0
  saturday?: number; // e.g. 1.5
  sunday?: number;   // e.g. 2.0
  holiday?: number;  // e.g. 2.0
}

export interface WorkBucketsMin {
  regularMin: number;
  ot50Min: number;
  ot100Min: number;
  saturdayMin: number;
  sundayMin: number;
  holidayMin: number;
}

export interface BillingTotals {
  baseMin: number;         // Sum of all minutes (without factors)
  premiumMin: number;      // Σ minutes*(factor-1)
  payableMin: number;      // baseMin + premiumMin
  byCat: Record<OTRateKey, { 
    min: number; 
    factor: number; 
    premiumMin: number; 
    payableMin: number; 
  }>;
}

export function computeBillingTotals(
  buckets: Partial<WorkBucketsMin>,
  rates: Partial<OTRates>,
  roundingStepMin?: number // optional: 15
): BillingTotals {
  const r = { 
    regular: 1.0, 
    ot50: 1.5, 
    ot100: 2.0, 
    saturday: 1.5, 
    sunday: 2.0, 
    holiday: 2.0, 
    ...rates 
  };
  
  const b = { 
    regularMin: 0, 
    ot50Min: 0, 
    ot100Min: 0, 
    saturdayMin: 0, 
    sundayMin: 0, 
    holidayMin: 0, 
    ...buckets 
  };

  const cats: OTRateKey[] = ['regular', 'ot50', 'ot100', 'saturday', 'sunday', 'holiday'];
  let base = 0;
  let premium = 0;

  const byCat: BillingTotals['byCat'] = {} as any;

  for (const k of cats) {
    const min = (b as any)[`${k}Min`] ?? 0;
    const factor = (r as any)[k] ?? 1.0;
    // Premium is only the additional portion (factor - 1), not the full factor
    const catPremium = k === 'regular' ? 0 : Math.round(min * (factor - 1));
    const catPayable = k === 'regular' ? min : min + catPremium;

    byCat[k] = { 
      min, 
      factor, 
      premiumMin: catPremium, 
      payableMin: catPayable 
    };

    base += min;
    premium += catPremium;
  }

  let payable = base + premium;

  // Rounding ONLY here, after aggregation
  if (roundingStepMin && roundingStepMin > 1) {
    const round = (m: number) => Math.round(m / roundingStepMin) * roundingStepMin;
    payable = round(payable);
    premium = round(premium);
    base = round(base);
  }

  return { 
    baseMin: base, 
    premiumMin: premium, 
    payableMin: payable, 
    byCat 
  };
}

// Format helpers
export function formatHmDec(min: number, decimals = 2): string {
  const hours = min / 60;
  return `${hours.toFixed(decimals)} h`;
}

export function formatHm(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
}