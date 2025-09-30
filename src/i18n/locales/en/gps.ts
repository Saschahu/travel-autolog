export default {
  // GPS Status & Control
  currentState: 'Current State',
  trackingActive: 'Tracking Active',
  trackingStopped: 'Tracking Stopped',
  gpsAuthorized: 'GPS Authorized',
  gpsPermissionMissing: 'GPS Permission Missing',
  
  // Timer
  timer: 'Timer',
  travel: 'Travel',
  workTime: 'Work Time',
  returnTrip: 'Return Trip',
  
  // Control
  control: 'Control',
  requestPermission: 'Request Permission',
  getCurrentPosition: 'Get Current Position',
  startTracking: 'Start Tracking',
  stopTracking: 'Stop Tracking',
  
  // Work/Private Selection
  work: 'Work',
  private: 'Private',
  
  // Customer Confirmation
  confirmAtCustomer: 'Confirm At Customer',
  denyAtCustomer: 'Not At Customer',
  
  // Work Done Confirmation
  confirmWorkDone: 'Work Done',
  continueWorking: 'Continue Working',
  
  // Home Arrival
  confirmHomeArrival: 'Arrived Home',
  
  // Location Info
  locationInfo: 'Location Information',
  lastPosition: 'Last Position',
  noPositionAvailable: 'No Position Available',
  speed: 'Speed',
  accuracy: 'Accuracy',
  timestamp: 'Timestamp',
  
  // Aria Labels
  ariaRequestPermission: 'Request GPS permission',
  ariaGetCurrentPosition: 'Get current GPS position',
  ariaStartTracking: 'Start GPS tracking',
  ariaStopTracking: 'Stop GPS tracking',
  ariaSelectWork: 'Mark as work trip',
  ariaSelectPrivate: 'Mark as private trip',
  ariaConfirmAtCustomer: 'Confirm arrival at customer',
  ariaDenyAtCustomer: 'Not at customer yet',
  ariaConfirmWorkDone: 'Confirm work is done',
  ariaContinueWorking: 'Continue working',
  ariaConfirmHomeArrival: 'Confirm arrival at home'
} as const;
