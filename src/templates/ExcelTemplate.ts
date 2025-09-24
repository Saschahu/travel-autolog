// DEPRECATED: This file is deprecated in favor of ExcelTemplateExcelJS.ts
// It remains here for backward compatibility but should not be used for new code

export interface JobTemplateData {
  customerName: string;
  jobId: string;
  evaticNo?: string;
  startDate: Date;
  endDate?: Date;
  dailyEntries: Array<{
    date: Date;
    travelStart?: string;
    travelEnd?: string;
    workStart?: string;
    workEnd?: string;
    departureStart?: string;
    departureEnd?: string;
    breakTime?: string;
    totalHours?: string;
    description?: string;
  }>;
  totalHours: string;
  status: string;
  estimatedDays: number;
  currentDay: number;
}

// This class is deprecated - use generateSingleJobTemplateBuffer instead
export class ExcelTemplate {
  private worksheet: any;
  private currentRow: number = 1;

  constructor() {
    console.warn('ExcelTemplate is deprecated. Use generateSingleJobTemplateBuffer from ExcelTemplateExcelJS.ts instead');
    this.worksheet = {};
  }

  public fillJobData(data: JobTemplateData): any {
    console.warn('ExcelTemplate.fillJobData is deprecated. Use generateSingleJobTemplateBuffer instead');
    return this.worksheet;
  }

  public getWorksheet(): any {
    return this.worksheet;
  }
}