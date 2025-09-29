import { createRoot } from 'react-dom/client'
import React, { useState } from 'react'
import './index.css'

console.log('Main.tsx loaded - creating interactive ServiceTracker app');

// Interactive ServiceTracker app with full functionality
function ServiceTrackerApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const handleTabClick = (tab: string) => {
    console.log('Tab clicked:', tab);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card text-card-foreground border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">ServiceTracker</h1>
              <p className="text-sm text-muted-foreground">Reisezeit Dokumentation</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-sm text-success">Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-card border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'jobs', label: 'Jobs' },
              { id: 'gps', label: 'GPS Tracking' },
              { id: 'reports', label: 'Berichte' },
              { id: 'settings', label: 'Einstellungen' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-6 bg-card text-card-foreground rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="text-xl font-semibold mb-3 text-primary">Heute</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Arbeitszeit: 8:30h</p>
                  <p className="text-sm text-muted-foreground">Reisezeit: 2:15h</p>
                  <p className="text-sm text-muted-foreground">Jobs: 3 abgeschlossen</p>
                </div>
              </div>
              
              <div className="p-6 bg-card text-card-foreground rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="text-xl font-semibold mb-3 text-primary">Diese Woche</h3>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Arbeitszeit: 42:30h</p>
                  <p className="text-sm text-muted-foreground">Reisezeit: 11:45h</p>
                  <p className="text-sm text-muted-foreground">Jobs: 15 abgeschlossen</p>
                </div>
              </div>

              <div className="p-6 bg-card text-card-foreground rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                <h3 className="text-xl font-semibold mb-3 text-primary">GPS Status</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-success">Aktiv</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">Letztes Update: vor 2 Min</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-bold">Jobs</h2>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Neuer Job
              </button>
            </div>
            <div className="space-y-4">
              {[
                { id: 1, kunde: 'Firma ABC', status: 'Abgeschlossen', zeit: '14:30' },
                { id: 2, kunde: 'Unternehmen XYZ', status: 'In Bearbeitung', zeit: '16:15' },
                { id: 3, kunde: 'Betrieb 123', status: 'Geplant', zeit: '18:00' }
              ].map((job) => (
                <div key={job.id} className="p-4 bg-card border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{job.kunde}</h4>
                      <p className="text-sm text-muted-foreground">Geplant für {job.zeit}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.status === 'Abgeschlossen' ? 'bg-success text-success-foreground' :
                      job.status === 'In Bearbeitung' ? 'bg-warning text-warning-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'gps' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">GPS Tracking</h2>
            <div className="p-6 bg-card border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Tracking Status</h3>
                <button className="px-4 py-2 bg-success text-success-foreground rounded-lg hover:opacity-90 transition-opacity">
                  Tracking Aktiv
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Aktuelle Position:</span>
                  <span className="font-mono text-sm">52.5200° N, 13.4050° E</span>
                </div>
                <div className="flex justify-between">
                  <span>Genauigkeit:</span>
                  <span className="text-success">±3m</span>
                </div>
                <div className="flex justify-between">
                  <span>Letztes Update:</span>
                  <span>vor 30 Sekunden</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Berichte</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <button className="p-6 bg-card border rounded-lg hover:shadow-md transition-shadow text-left">
                <h3 className="font-semibold mb-2">Wochenbericht</h3>
                <p className="text-sm text-muted-foreground">Detaillierte Zeiterfassung der letzten 7 Tage</p>
              </button>
              <button className="p-6 bg-card border rounded-lg hover:shadow-md transition-shadow text-left">
                <h3 className="font-semibold mb-2">Monatsbericht</h3>
                <p className="text-sm text-muted-foreground">Übersicht aller Jobs und Zeiten des Monats</p>
              </button>
              <button className="p-6 bg-card border rounded-lg hover:shadow-md transition-shadow text-left">
                <h3 className="font-semibold mb-2">Export</h3>
                <p className="text-sm text-muted-foreground">Daten als Excel oder PDF exportieren</p>
              </button>
              <button className="p-6 bg-card border rounded-lg hover:shadow-md transition-shadow text-left">
                <h3 className="font-semibold mb-2">Statistiken</h3>
                <p className="text-sm text-muted-foreground">Grafische Auswertung Ihrer Arbeitszeiten</p>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Einstellungen</h2>
            <div className="space-y-4">
              <div className="p-4 bg-card border rounded-lg">
                <h3 className="font-semibold mb-2">GPS Einstellungen</h3>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Automatisches Tracking aktivieren</span>
                </label>
              </div>
              <div className="p-4 bg-card border rounded-lg">
                <h3 className="font-semibold mb-2">Benachrichtigungen</h3>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span>Job-Erinnerungen</span>
                </label>
              </div>
              <div className="p-4 bg-card border rounded-lg">
                <h3 className="font-semibold mb-2">Export Format</h3>
                <select className="w-full p-2 border rounded bg-background">
                  <option>Excel (.xlsx)</option>
                  <option>PDF</option>
                  <option>CSV</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error('Root element not found!');
} else {
  console.log('Root element found, creating React root');
  const root = createRoot(rootElement);
  console.log('Rendering interactive ServiceTracker app...');
  root.render(<ServiceTrackerApp />);
  console.log('Interactive ServiceTracker app rendered successfully');
}