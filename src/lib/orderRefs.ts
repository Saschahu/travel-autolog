export interface OrderRefs {
  label: string;
  value: string;
}

export function getOrderRefs(job: { id: string; evaticNo?: string | null }): OrderRefs[] {
  const refs: OrderRefs[] = [];
  
  // Add EVATIC number if it exists
  if (job.evaticNo && job.evaticNo.trim().length > 0) {
    refs.push({ label: 'EVATIC Nr.', value: job.evaticNo.trim() });
  }
  
  return refs;
}

export function formatOrderRefsForDisplay(refs: OrderRefs[]): string {
  return refs.map(ref => `${ref.label}: ${ref.value}`).join(' • ');
}

export function formatOrderRefsForFilename(refs: OrderRefs[]): string {
  // For filenames, normalize special characters
  const normalized = refs.map(ref => {
    const value = ref.value.replace(/[/\\:*?"<>|]/g, '-');
    return `${ref.label.replace(/\./g, '')}-${value}`;
  });
  return normalized.join('_');
}