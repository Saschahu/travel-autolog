import { createRoot } from 'react-dom/client'
import './index.css'

console.log('Main.tsx loaded - starting app initialization');

// Simple test component first
function TestApp() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f9ff', minHeight: '100vh' }}>
      <h1 style={{ color: '#1e40af', fontSize: '24px', fontWeight: 'bold' }}>
        ServiceTracker App lädt...
      </h1>
      <p style={{ color: '#1e40af', marginTop: '10px' }}>
        Wenn Sie diese Nachricht sehen, funktioniert die grundlegende App-Struktur.
      </p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
        <strong>Debug Info:</strong>
        <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
          <li>React: ✓ Geladen</li>
          <li>CSS: ✓ Geladen</li>
          <li>DOM: ✓ Bereit</li>
        </ul>
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
  console.log('Rendering test app...');
  root.render(<TestApp />);
  console.log('Test app rendered');
}
