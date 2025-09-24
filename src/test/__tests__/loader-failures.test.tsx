import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Suspense, useState } from 'react';

// Test components that simulate the 6 failure scenarios
const NetworkFailureComponent = () => {
  const error = new Error('Failed to load Mapbox GL. Map functionality will be unavailable.') as any;
  error.code = 'E_IMPORT_FAILED';
  throw error;
};

const CSSImportFailureComponent = () => {
  const error = new Error('Failed to load Mapbox GL CSS. Map styling may be broken.') as any;
  error.code = 'E_CSS_LOAD_FAILED';
  throw error;
};

const TimeoutFailureComponent = () => {
  const error = new Error('Failed to load ExcelJS. Excel export functionality will be unavailable.') as any;
  error.code = 'E_IMPORT_TIMEOUT';
  throw error;
};

const MSWMissingEndpointComponent = () => {
  const error = new Error('Failed to fetch sessions - MSW handler missing') as any;
  error.code = 'E_NETWORK_ERROR';
  throw error;
};

const RaceConditionComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    const error = new Error('Module loading race condition detected') as any;
    error.code = 'E_IMPORT_FAILED'; // Use loader error code
    throw error;
  }
  return <div>Race condition resolved</div>;
};

const TimerRetryComponent = ({ attempt }: { attempt: number }) => {
  if (attempt < 2) {
    const error = new Error('Non-deterministic timer failure') as any;
    error.code = 'E_IMPORT_TIMEOUT'; // Use loader error code
    throw error;
  }
  return <div>Timer retry succeeded</div>;
};

describe('Dynamic Import Failure Scenarios (6 Core Issues)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('FAILURE 1: Network/offline import rejection scenario', () => {
    render(
      <ErrorBoundary>
        <NetworkFailureComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Loading Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load Mapbox GL. Map functionality will be unavailable.')).toBeInTheDocument();
    expect(screen.getByText('Error Code: E_IMPORT_FAILED')).toBeInTheDocument();
    expect(screen.getByTestId('retry-load-lib')).toBeInTheDocument();
  });

  it('FAILURE 2: CSS side-effect import error (Mapbox)', () => {
    render(
      <ErrorBoundary>
        <CSSImportFailureComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Loading Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load Mapbox GL CSS. Map styling may be broken.')).toBeInTheDocument();
    expect(screen.getByText('Error Code: E_CSS_LOAD_FAILED')).toBeInTheDocument();
    expect(screen.getByTestId('retry-load-lib')).toBeInTheDocument();
  });

  it('FAILURE 3: Timeout scenario with proper error handling', () => {
    render(
      <ErrorBoundary>
        <TimeoutFailureComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Loading Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load ExcelJS. Excel export functionality will be unavailable.')).toBeInTheDocument();
    expect(screen.getByText('Error Code: E_IMPORT_TIMEOUT')).toBeInTheDocument();
    expect(screen.getByTestId('retry-load-lib')).toBeInTheDocument();
  });

  it('FAILURE 4: MSW handlers missing for endpoints', () => {
    render(
      <ErrorBoundary>
        <MSWMissingEndpointComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch sessions - MSW handler missing')).toBeInTheDocument();
    expect(screen.getByText('Error Code: E_NETWORK_ERROR')).toBeInTheDocument();
    expect(screen.getByTestId('retry-load-lib')).toBeInTheDocument();
  });

  it('FAILURE 5: Race conditions with Suspense and error boundaries', () => {
    const TestWrapper = () => {
      const [attempt, setAttempt] = useState(0);
      
      const handleRetry = () => {
        setAttempt(prev => prev + 1);
      };

      return (
        <ErrorBoundary onRetry={handleRetry}>
          <Suspense fallback={<div>Loading...</div>}>
            <RaceConditionComponent shouldThrow={attempt === 0} />
          </Suspense>
        </ErrorBoundary>
      );
    };

    render(<TestWrapper />);

    // Should show error initially
    expect(screen.getByText('Loading Error')).toBeInTheDocument();
    expect(screen.getByText('Module loading race condition detected')).toBeInTheDocument();
    expect(screen.getByText('Error Code: E_IMPORT_FAILED')).toBeInTheDocument();

    // Click retry - should resolve the race condition
    fireEvent.click(screen.getByTestId('retry-load-lib'));
    expect(screen.getByText('Race condition resolved')).toBeInTheDocument();
  });

  it('FAILURE 6: Non-deterministic timers/retries', () => {
    const TestWrapper = () => {
      const [attempt, setAttempt] = useState(0);
      
      const handleRetry = () => {
        setAttempt(prev => prev + 1);
      };

      return (
        <ErrorBoundary onRetry={handleRetry}>
          <TimerRetryComponent attempt={attempt} />
        </ErrorBoundary>
      );
    };

    render(<TestWrapper />);

    // Should show error initially (attempt 0)
    expect(screen.getByText('Loading Error')).toBeInTheDocument();
    expect(screen.getByText('Non-deterministic timer failure')).toBeInTheDocument();
    expect(screen.getByText('Error Code: E_IMPORT_TIMEOUT')).toBeInTheDocument();

    // First retry (attempt 1) - should still fail
    fireEvent.click(screen.getByTestId('retry-load-lib'));
    expect(screen.getByText('Non-deterministic timer failure')).toBeInTheDocument();

    // Second retry (attempt 2) - should succeed
    fireEvent.click(screen.getByTestId('retry-load-lib'));
    expect(screen.getByText('Timer retry succeeded')).toBeInTheDocument();
  });

  it('Error boundary retry mechanism works correctly', () => {
    let shouldThrow = true;
    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Retry test error');
      }
      return <div>Retry successful</div>;
    };

    const onRetry = vi.fn(() => {
      shouldThrow = false; // Stop throwing on retry
    });

    render(
      <ErrorBoundary onRetry={onRetry}>
        <TestComponent />
      </ErrorBoundary>
    );

    // Should show error initially
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click retry
    fireEvent.click(screen.getByTestId('retry-load-lib'));
    expect(onRetry).toHaveBeenCalledOnce();

    // After retry, should show success
    expect(screen.getByText('Retry successful')).toBeInTheDocument();
  });
});