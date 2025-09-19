import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Suspense, lazy } from "react";

// Lazy load page components for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth").then(module => ({ default: module.Auth })));
const NotFound = lazy(() => import("./pages/NotFound"));
const DirectoryPickerBridge = lazy(() => import("./pages/DirectoryPickerBridge").then(module => ({ default: module.DirectoryPickerBridge })));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

function AppContent() {
  const { user, loading } = useAuth();

  console.log('AppContent render:', { user: !!user, loading });

  if (loading) {
    console.log('App is loading...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
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