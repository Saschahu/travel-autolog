export default {
  // Manual Input
  manualInput: 'Fahrt berechnen',
  manualInputDesc: 'Geben Sie Start und Ziel ein, um die Route zu berechnen',
  
  // Form Fields
  startAddress: 'Startadresse',
  startAddressPlaceholder: 'z.B. Hauptstraße 1, Oslo',
  targetAddress: 'Zieladresse',
  targetAddressPlaceholder: 'z.B. Storgata 10, Bergen',
  date: 'Datum',
  time: 'Uhrzeit',
  
  // Vehicle
  vehicleType: 'Fahrzeugtyp',
  vehicleBenzin: 'PKW Benzin',
  vehicleDiesel: 'PKW Diesel',
  vehicleEv: 'Elektro (EV)',
  vehiclePhev: 'Plug-in Hybrid (PHEV)',
  vehicleSize: 'Fahrzeuggröße',
  vehicleSize1: 'Klein (bis 3,5t)',
  vehicleSize2: 'Mittel (3,5-7,5t)',
  vehicleSize3: 'Groß (7,5-12t)',
  vehicleSize4: 'LKW (über 12t)',
  vehicleLength: 'Fahrzeuglänge (m)',
  optional: 'optional',
  
  // Actions
  calculateRoute: 'Route berechnen',
  saveDraft: 'Als Fahrt speichern',
  
  // Messages
  calculating: 'Berechne Route...',
  calculatingDesc: 'Die Mautkosten werden ermittelt',
  draftSaved: 'Fahrt gespeichert',
  draftSavedDesc: 'Die Eingaben wurden als Entwurf gespeichert',
  
  // Validation
  'validation.startRequired': 'Startadresse erforderlich',
  'validation.startRequiredDesc': 'Bitte geben Sie eine Startadresse ein',
  'validation.targetRequired': 'Zieladresse erforderlich',
  'validation.targetRequiredDesc': 'Bitte geben Sie eine Zieladresse ein',
  
  // Info
  noGpsHint: 'Kein GPS – bitte Start und Ziel eingeben'
} as const;
