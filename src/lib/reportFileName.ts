type ReportNameInput = {
  date?: unknown;
  customer?: unknown;
  jobId?: unknown;
  days?: unknown;
  workStartDate?: unknown;
  travelStartDate?: unknown;
  departureStartDate?: unknown;
};

export function firstJobDate(job: unknown): Date | null {
  if (!job || typeof job !== 'object') return null;
  
  const jobData = job as ReportNameInput;
  const entries: Date[] = [];
  
  // Extract dates from days array if available
  if (Array.isArray(jobData.days)) {
    jobData.days.forEach((day: unknown) => {
      if (day && typeof day === 'object' && 'date' in day) {
        const dayObj = day as { date?: unknown };
        if (dayObj.date) {
          entries.push(new Date(dayObj.date as string));
        }
      }
    });
  } else {
    // Extract from top-level job properties
    if (jobData.workStartDate) entries.push(new Date(jobData.workStartDate as string));
    if (jobData.travelStartDate) entries.push(new Date(jobData.travelStartDate as string));
    if (jobData.departureStartDate) entries.push(new Date(jobData.departureStartDate as string));
  }
  
  if (entries.length === 0) return null;
  
  // Return earliest date
  return new Date(Math.min(...entries.map(d => d.getTime())));
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeStr(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')     // Diakritika
    .replace(/[^\p{L}\p{N}\s._-]/gu, '')  // Keep only letters, numbers, spaces, dots, underscores, hyphens
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[_-]{2,}/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '');
}

export function getReportFileName(job: {
  id: string;
  customerName?: string | null;
  customerId?: string | null;
  evaticNo?: string | null;
  createdAt?: string | null;
}, opts?: { customerLookup?: (id: string) => string | null; date?: Date }): string {

  const earliest = firstJobDate(job) ?? (job.createdAt ? new Date(job.createdAt) : undefined);
  const date = opts?.date ?? earliest ?? new Date();
  const dateStr = toIsoDate(date);

  const nameRaw =
    job.customerName?.trim() ||
    (job.customerId && opts?.customerLookup?.(job.customerId)) ||
    'Unknown';

  const evaticRaw = job.evaticNo?.trim();

  const parts = [normalizeStr(dateStr), normalizeStr(nameRaw)];
  if (evaticRaw) parts.push(normalizeStr(evaticRaw.replace(/\//g, '-')));

  let base = parts.filter(Boolean).join('_');
  const maxLen = 120 - 4; // .pdf
  if (base.length > maxLen) base = base.slice(0, maxLen);
  return `${base}.pdf`;
}