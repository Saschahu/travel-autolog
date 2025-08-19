import MapView from '@/components/MapView';

export const GPSPage: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">GPS</h1>
      <MapView />
      <div className="text-sm text-gray-600">
        Hinweis: Tokenverwaltung über <b>.env</b> / CI-Secrets. Einstellungen zu Style/Geofence unter
        <b> Einstellungen → GPS</b>.
      </div>
    </div>
  );
};