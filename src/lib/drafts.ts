import { get, set, del } from 'idb-keyval';

export interface ReportDraft {
  text: string;
  updatedAt: string;
}

const DRAFT_KEY_PREFIX = 'jobReportDraft';

function getDraftKey(jobId: string): string {
  return `${DRAFT_KEY_PREFIX}:${jobId}`;
}

export async function saveReportDraft(jobId: string, draft: ReportDraft): Promise<void> {
  const key = getDraftKey(jobId);
  try {
    await set(key, draft);
  } catch (error) {
    console.warn('Failed to save report draft:', error);
  }
}

export async function loadReportDraft(jobId: string): Promise<ReportDraft | null> {
  const key = getDraftKey(jobId);
  try {
    const draft = await get(key);
    return draft || null;
  } catch (error) {
    console.warn('Failed to load report draft:', error);
    return null;
  }
}

export async function clearReportDraft(jobId: string): Promise<void> {
  const key = getDraftKey(jobId);
  try {
    await del(key);
  } catch (error) {
    console.warn('Failed to clear report draft:', error);
  }
}