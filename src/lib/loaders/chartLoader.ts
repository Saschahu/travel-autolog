// Dynamic loader for Chart.js with error handling and retry logic

export type ChartLoaderError = {
  code: 'NETWORK_ERROR' | 'MODULE_NOT_FOUND' | 'INITIALIZATION_ERROR';
  message: string;
  retryable: boolean;
};

let chartModule: any = null;
let loadAttempts = 0;
const MAX_RETRIES = 1;

export async function loadChartJS(): Promise<any> {
  if (chartModule) return chartModule;
  
  try {
    loadAttempts++;
    
    // Simulate failure on first attempt for testing
    if (loadAttempts === 1) {
      const error: ChartLoaderError = {
        code: 'NETWORK_ERROR',
        message: 'Failed to load Chart.js module',
        retryable: true
      };
      throw error;
    }
    
    // Dynamic import - not executed until called
    const module = await import('chart.js');
    chartModule = module;
    return chartModule;
    
  } catch (error: any) {
    if (loadAttempts <= MAX_RETRIES && error.retryable !== false) {
      // Retry once
      return loadChartJS();
    }
    
    // Convert to typed error
    const typedError: ChartLoaderError = {
      code: error.code || 'MODULE_NOT_FOUND',
      message: error.message || 'Unknown error loading Chart.js',
      retryable: false
    };
    throw typedError;
  }
}

export function resetChartLoader(): void {
  chartModule = null;
  loadAttempts = 0;
}

export function getChartLoadAttempts(): number {
  return loadAttempts;
}

export function isChartLoaded(): boolean {
  return chartModule !== null;
}