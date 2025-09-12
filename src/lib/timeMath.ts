export function parseTimeHHMM(input: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(input.trim());
  if (!m) throw new Error(`Invalid time format: ${input}`);
  const hh = Number(m[1]), mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) throw new Error(`Out of range: ${input}`);
  return hh * 60 + mm;
}

export function minutesBetweenAcrossMidnight(startHHMM: string, endHHMM: string): number {
  const a = parseTimeHHMM(startHHMM);
  const b = parseTimeHHMM(endHHMM);
  return b >= a ? (b - a) : (1440 - a + b);
}

export function sumMinutes(values: Array<number | null | undefined>): number {
  return values.reduce((acc, v) => acc + (v ?? 0), 0);
}

export function isSundayUTC(dateLike: string | Date): boolean {
  const d = (dateLike instanceof Date) ? new Date(dateLike) : new Date(`${dateLike}T00:00:00Z`);
  return d.getUTCDay() === 0;
}

export function formatMinutesToHours(mins: number, opts?: { includeSign?: boolean }): string {
  const sign = mins < 0 ? "-" : (opts?.includeSign ? "+" : "");
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}:${String(m).padStart(2, "0")}`;
}
