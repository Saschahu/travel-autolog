import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Suspense, lazy, useEffect, useState } from "react";

// Lazy load pages to reduce initial bundle
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth").then(module => ({ default: module.Auth })));
const NotFound = lazy(() => import("./pages/NotFound"));
const DirectoryPickerBridge = lazy(() => import("./pages/DirectoryPickerBridge").then(module => ({ default: module.DirectoryPickerBridge })));

const queryClient = new QueryClient();

// Loading component for lazy-loaded routes
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

function AppContent() {
  const { user, loading } = useAuth();
  const [i18nReady, setI18nReady] = useState(false);

  // Initialize i18n when the app first loads
  useEffect(() => {
    import('@/i18n').then(() => {
      setI18nReady(true);
    }).catch((error) => {
      console.error('Failed to load i18n:', error);
      setI18nReady(true); // Continue without i18n
    });
  }, []);

  console.log('AppContent render:', { user: !!user, loading, i18nReady });

  if (loading || !i18nReady) {
    console.log('App is loading...');
    return <RouteLoader />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route 
            path="/" 
            element={user ? <Index /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/auth" 
            element={!user ? <Auth /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/bridge/directory-picker" 
            element={<DirectoryPickerBridge />} 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProfileProvider>
      <TooltipProvider>
        <AppContent />
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </UserProfileProvider>
  </QueryClientProvider>
);

export default App;