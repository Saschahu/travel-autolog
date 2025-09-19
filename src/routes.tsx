import { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';

// Loading skeleton for lazy-loaded components
const LoadingSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

// Lazy-loaded route components
const Index = lazy(() => import('./pages/Index'));
const Auth = lazy(() => import('./pages/Auth'));
const NotFound = lazy(() => import('./pages/NotFound'));
const DirectoryPickerBridge = lazy(() => import('./pages/DirectoryPickerBridge'));

// Route component with suspense wrapper
export const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingSkeleton />}>
    {children}
  </Suspense>
);

// Lazy route components
export const LazyIndex = () => (
  <LazyRoute>
    <Index />
  </LazyRoute>
);

export const LazyAuth = () => (
  <LazyRoute>
    <Auth />
  </LazyRoute>
);

export const LazyNotFound = () => (
  <LazyRoute>
    <NotFound />
  </LazyRoute>
);

export const LazyDirectoryPickerBridge = () => (
  <LazyRoute>
    <DirectoryPickerBridge />
  </LazyRoute>
);