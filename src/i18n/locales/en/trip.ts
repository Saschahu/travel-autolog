export default {
  // Manual Input
  manualInput: 'Calculate Trip',
  manualInputDesc: 'Enter start and destination to calculate the route',
  
  // Form Fields
  startAddress: 'Start Address',
  startAddressPlaceholder: 'e.g. Main Street 1, Oslo',
  targetAddress: 'Destination Address',
  targetAddressPlaceholder: 'e.g. Storgata 10, Bergen',
  date: 'Date',
  time: 'Time',
  
  // Vehicle
  vehicleType: 'Vehicle Type',
  vehicleBenzin: 'Petrol Car',
  vehicleDiesel: 'Diesel Car',
  vehicleEv: 'Electric (EV)',
  vehiclePhev: 'Plug-in Hybrid (PHEV)',
  vehicleSize: 'Vehicle Size',
  vehicleSize1: 'Small (up to 3.5t)',
  vehicleSize2: 'Medium (3.5-7.5t)',
  vehicleSize3: 'Large (7.5-12t)',
  vehicleSize4: 'Truck (over 12t)',
  vehicleLength: 'Vehicle Length (m)',
  optional: 'optional',
  
  // Actions
  calculateRoute: 'Calculate Route',
  saveDraft: 'Save as Trip',
  
  // Messages
  calculating: 'Calculating route...',
  calculatingDesc: 'Toll costs are being calculated',
  draftSaved: 'Trip saved',
  draftSavedDesc: 'Your input has been saved as draft',
  
  // Validation
  'validation.startRequired': 'Start address required',
  'validation.startRequiredDesc': 'Please enter a start address',
  'validation.targetRequired': 'Destination required',
  'validation.targetRequiredDesc': 'Please enter a destination address',
  
  // Info
  noGpsHint: 'No GPS – please enter start and destination'
} as const;
