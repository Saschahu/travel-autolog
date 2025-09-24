import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';
import { Suspense, useState } from 'react';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow = true, error }: { shouldThrow?: boolean, error?: Error }) => {
  if (shouldThrow) {
    throw error || new Error('Test error');
  }
  return <div>Success!</div>;
};

// Component that can be controlled to throw or not
const ControllableComponent = ({ throwError }: { throwError: boolean }) => {
  if (throwError) {
    const error = new Error('Controlled error') as any;
    error.code = 'E_CONTROLLED_ERROR';
    throw error;
  }
  return <div>Success!</div>;
};

// Component that simulates dynamic import error
const DynamicImportError = () => {
  const error = new Error('Failed to load ExcelJS. Excel export functionality will be unavailable.') as any;
  error.code = 'E_IMPORT_FAILED';
  throw error;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress error boundary console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should handle race conditions with Suspense and error boundaries', async () => {
    const TestWrapper = () => {
      const [hasError, setHasError] = useState(true);
      
      const handleRetry = () => {
        setHasError(false);
      };

      return (
        <ErrorBoundary onRetry={handleRetry}>
          <Suspense fallback={<div>Loading...</div>}>
            <ControllableComponent throwError={hasError} />
          </Suspense>
        </ErrorBoundary>
      );
    };

    render(<TestWrapper />);

    // Should show error UI initially
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByTestId('retry-load-lib')).toBeInTheDocument();

    // Click retry button
    fireEvent.click(screen.getByTestId('retry-load-lib'));

    // After retry, should show success
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('should display loader-specific error messages with error codes', () => {
    render(
      <ErrorBoundary>
        <DynamicImportError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Loading Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load ExcelJS. Excel export functionality will be unavailable.')).toBeInTheDocument();
    expect(screen.getByText('Error Code: E_IMPORT_FAILED')).toBeInTheDocument();
    expect(screen.getByTestId('retry-load-lib')).toBeInTheDocument();
  });

  it('should show custom fallback when provided', () => {
    const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
  });
});