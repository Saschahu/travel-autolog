import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/auth-context.helpers";
import { ConsentWrapper } from "@/components/privacy/ConsentWrapper";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { DirectoryPickerBridge } from "./pages/DirectoryPickerBridge";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();

  console.log('AppContent render:', { user: !!user, loading });

  if (loading) {
    console.log('App is loading...');
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f9ff' }}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-blue-900">App wird geladen...</p>
          <p className="text-sm text-blue-700 mt-2">Bitte warten...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, should show auth page');
  }

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProfileProvider>
      <TooltipProvider>
        <ConsentWrapper>
          <AppContent />
          <Toaster />
          <Sonner />
        </ConsentWrapper>
      </TooltipProvider>
    </UserProfileProvider>
  </QueryClientProvider>
);

export default App;