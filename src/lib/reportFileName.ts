import type { Job } from '@/hooks/useJobs';

export function firstJobDate(job: Job): Date | null {
  const entries: Date[] = [];
  
  // Extract dates from days array if available
  if (job.days && Array.isArray(job.days)) {
    job.days.forEach((day: { date?: string }) => {
      if (day.date) {
        entries.push(new Date(day.date));
      }
    });
  } else {
    // Extract from top-level job properties
    if (job.workStartDate) entries.push(new Date(job.workStartDate));
    if (job.travelStartDate) entries.push(new Date(job.travelStartDate));
    if (job.departureStartDate) entries.push(new Date(job.departureStartDate));
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
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/[_-]{2,}/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '');
}

export function getReportFileName(job: Job, opts?: { customerLookup?: (id: string) => string | null; date?: Date }): string {

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