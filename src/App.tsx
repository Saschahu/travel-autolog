import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Suspense } from "react";
import { lazy } from "react";
import NotFound from "./pages/NotFound";
import { DirectoryPickerBridge } from "./pages/DirectoryPickerBridge";

// Lazy load heavy route components for proper code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth").then(module => ({ default: module.Auth })));
const GpsPage = lazy(() => import("./pages/GpsPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));

const queryClient = new QueryClient();

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  console.log('AppContent render:', { user: !!user, loading });

  if (loading) {
    console.log('App is loading...');
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route 
            path="/" 
            element={user ? <Index /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/gps" 
            element={user ? <GpsPage /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/export" 
            element={user ? <ReportPage /> : <Navigate to="/auth" replace />} 
          />
          <Route 
            path="/settings" 
            element={user ? <SettingsPage /> : <Navigate to="/auth" replace />} 
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