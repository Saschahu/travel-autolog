export default {
  // Manual Input
  manualInput: 'Beregn reise',
  manualInputDesc: 'Angi start og mål for å beregne ruten',
  
  // Form Fields
  startAddress: 'Startadresse',
  startAddressPlaceholder: 'f.eks. Hovedgata 1, Oslo',
  targetAddress: 'Destinasjon',
  targetAddressPlaceholder: 'f.eks. Storgata 10, Bergen',
  date: 'Dato',
  time: 'Tid',
  
  // Vehicle
  vehicleType: 'Kjøretøytype',
  vehicleBenzin: 'Bensinbil',
  vehicleDiesel: 'Dieselbil',
  vehicleEv: 'Elektrisk (EV)',
  vehiclePhev: 'Plug-in Hybrid (PHEV)',
  vehicleSize: 'Kjøretøystørrelse',
  vehicleSize1: 'Liten (opp til 3,5t)',
  vehicleSize2: 'Middels (3,5-7,5t)',
  vehicleSize3: 'Stor (7,5-12t)',
  vehicleSize4: 'Lastebil (over 12t)',
  vehicleLength: 'Kjøretøylengde (m)',
  optional: 'valgfritt',
  
  // Actions
  calculateRoute: 'Beregn rute',
  saveDraft: 'Lagre som reise',
  
  // Messages
  calculating: 'Beregner rute...',
  calculatingDesc: 'Bomavgifter blir beregnet',
  draftSaved: 'Reise lagret',
  draftSavedDesc: 'Inndataene dine er lagret som utkast',
  
  // Validation
  'validation.startRequired': 'Startadresse påkrevd',
  'validation.startRequiredDesc': 'Vennligst angi en startadresse',
  'validation.targetRequired': 'Destinasjon påkrevd',
  'validation.targetRequiredDesc': 'Vennligst angi en destinasjon',
  
  // Info
  noGpsHint: 'Ingen GPS – vennligst angi start og mål'
} as const;
