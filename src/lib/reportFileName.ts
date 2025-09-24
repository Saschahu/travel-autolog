export function buildReportFileName(input: unknown): string {
  // Guard for job object
  if (!input || typeof input !== 'object') {
    return 'unknown-job.pdf';
  }
  
  const job = input as Record<string, unknown>;
  const id = typeof job.id === 'string' ? job.id : 'no-id';
  const customerName = typeof job.customerName === 'string' ? job.customerName : null;
  const customerId = typeof job.customerId === 'string' ? job.customerId : null;
  const evaticNo = typeof job.evaticNo === 'string' ? job.evaticNo : null;
  const createdAt = typeof job.createdAt === 'string' ? job.createdAt : null;
  
  return getReportFileName({ id, customerName, customerId, evaticNo, createdAt });
}

export function firstJobDate(job: unknown): Date | null {
  if (!job || typeof job !== 'object') return null;
  
  const jobObj = job as Record<string, unknown>;
  const entries: Date[] = [];
  
  // Extract dates from days array if available
  if (Array.isArray(jobObj.days)) {
    jobObj.days.forEach((day: unknown) => {
      if (day && typeof day === 'object' && 'date' in day) {
        const dayObj = day as { date: unknown };
        if (typeof dayObj.date === 'string' || dayObj.date instanceof Date) {
          const date = new Date(dayObj.date);
          if (!isNaN(date.getTime())) {
            entries.push(date);
          }
        }
      }
    });
  } else {
    // Extract from top-level job properties
    const dateFields = ['workStartDate', 'travelStartDate', 'departureStartDate'];
    dateFields.forEach(field => {
      if (field in jobObj && (typeof jobObj[field] === 'string' || jobObj[field] instanceof Date)) {
        const date = new Date(jobObj[field] as string | Date);
        if (!isNaN(date.getTime())) {
          entries.push(date);
        }
      }
    });
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
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}\s._-]/gu, '-') // Unicode-aware character class
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