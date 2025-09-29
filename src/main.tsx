import { createRoot } from 'react-dom/client'
import './index.css'

console.log('Main.tsx loaded - creating simple working app');

// Simple working app without complex dependencies
function ServiceTrackerApp() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">
            ServiceTracker
          </h1>
          <p className="text-xl text-muted-foreground">
            Reisezeit Dokumentation für Servicetechniker
          </p>
        </header>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 bg-card text-card-foreground rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">GPS Tracking</h2>
            <p className="text-muted-foreground">
              Automatische Erfassung von Reise- und Arbeitszeiten
            </p>
          </div>
          
          <div className="p-6 bg-card text-card-foreground rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">Job Management</h2>
            <p className="text-muted-foreground">
              Verwaltung und Organisation Ihrer Serviceeinsätze
            </p>
          </div>
          
          <div className="p-6 bg-card text-card-foreground rounded-lg border">
            <h2 className="text-xl font-semibold mb-3">Reporting</h2>
            <p className="text-muted-foreground">
              Detaillierte Berichte und Zeiterfassung
            </p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success text-success-foreground rounded-lg">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
            <span>App ist aktiv und funktionsfähig</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found!');
} else {
  console.log('Root element found, creating React root');
  const root = createRoot(rootElement);
  console.log('Rendering ServiceTracker app...');
  root.render(<ServiceTrackerApp />);
  console.log('ServiceTracker app rendered successfully');
}