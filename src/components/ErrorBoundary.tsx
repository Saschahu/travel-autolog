import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    this.props.onRetry?.();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isLoaderError = this.state.error?.message?.includes('Failed to load') || 
                           ['E_IMPORT_TIMEOUT', 'E_IMPORT_FAILED', 'E_CSS_LOAD_FAILED'].includes((this.state.error as any)?.code);
      const errorCode = (this.state.error as any)?.code;

      return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gray-50 rounded-lg border">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {isLoaderError ? 'Loading Error' : 'Something went wrong'}
            </h3>
            <p className="text-sm text-gray-600 max-w-sm">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            {errorCode && (
              <p className="text-xs text-gray-500 mt-1">
                Error Code: {errorCode}
              </p>
            )}
          </div>
          <Button
            onClick={this.handleRetry}
            size="sm"
            variant="outline"
            data-testid="retry-load-lib"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onRetry?: () => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onRetry={onRetry}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}