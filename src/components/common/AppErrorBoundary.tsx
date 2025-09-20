/**
 * Application Error Boundary with Sentry Integration
 * 
 * Catches React errors and reports them to Sentry while providing
 * a user-friendly fallback UI with retry functionality.
 */

import React from 'react';
import { Sentry } from '@/boot/monitoring';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

const ErrorBoundaryFallback: React.FC<ErrorBoundaryFallbackProps> = ({ 
  error, 
  resetError 
}) => {
  const handleRetry = () => {
    resetError();
    // Optionally reload the page as a last resort
    if (error.name === 'ChunkLoadError') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-orange-500" />
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-6">
          We're sorry, but something unexpected happened. Our team has been 
          notified and is working to fix the issue.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={handleRetry}
            className="w-full"
            variant="default"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/'}
            className="w-full"
            variant="outline"
          >
            Go to Home
          </Button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Technical Details (Development Only)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
}

/**
 * App Error Boundary Component
 * 
 * Wraps the application to catch and handle React errors gracefully.
 * Integrates with Sentry for error reporting when available.
 */
export const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({ 
  children, 
  fallback = ErrorBoundaryFallback 
}) => {
  // Use Sentry's ErrorBoundary if Sentry is initialized
  if (typeof Sentry?.ErrorBoundary === 'function') {
    return (
      <Sentry.ErrorBoundary 
        fallback={fallback}
        beforeCapture={(scope, error, errorInfo) => {
          // Add additional context without PII
          scope.setTag('component', 'AppErrorBoundary');
          scope.setContext('errorInfo', {
            componentStack: errorInfo.componentStack?.substring(0, 500), // Limit size
          });
        }}
      >
        {children}
      </Sentry.ErrorBoundary>
    );
  }

  // Fallback to a basic error boundary if Sentry is not available
  return (
    <BasicErrorBoundary fallback={fallback}>
      {children}
    </BasicErrorBoundary>
  );
};

/**
 * Basic Error Boundary (fallback when Sentry is not initialized)
 */
interface BasicErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class BasicErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<ErrorBoundaryFallbackProps> },
  BasicErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback: React.ComponentType<ErrorBoundaryFallbackProps> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): BasicErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback;
      return (
        <FallbackComponent 
          error={this.state.error}
          resetError={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;