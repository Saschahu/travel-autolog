export default {
  // GPS Status & Control
  currentState: 'Aktueller Status',
  trackingActive: 'Tracking aktiv',
  trackingStopped: 'Tracking gestoppt',
  gpsAuthorized: 'GPS berechtigt',
  gpsPermissionMissing: 'GPS-Berechtigung fehlt',
  
  // Timer
  timer: 'Timer',
  travel: 'Reise',
  workTime: 'Arbeitszeit',
  returnTrip: 'Rückfahrt',
  
  // Control
  control: 'Steuerung',
  requestPermission: 'Berechtigung anfordern',
  getCurrentPosition: 'Aktuelle Position',
  startTracking: 'Tracking starten',
  stopTracking: 'Tracking stoppen',
  
  // Work/Private Selection
  work: 'Arbeit',
  private: 'Privat',
  
  // Customer Confirmation
  confirmAtCustomer: 'Beim Kunden bestätigen',
  denyAtCustomer: 'Nicht beim Kunden',
  
  // Work Done Confirmation
  confirmWorkDone: 'Arbeit beendet',
  continueWorking: 'Weiter arbeiten',
  
  // Home Arrival
  confirmHomeArrival: 'Zu Hause angekommen',
  
  // Location Info
  locationInfo: 'Standortinformationen',
  lastPosition: 'Letzte Position',
  noPositionAvailable: 'Keine Position verfügbar',
  speed: 'Geschwindigkeit',
  accuracy: 'Genauigkeit',
  timestamp: 'Zeitstempel',
  
  // Aria Labels
  ariaRequestPermission: 'GPS-Berechtigung anfordern',
  ariaGetCurrentPosition: 'Aktuelle GPS-Position abrufen',
  ariaStartTracking: 'GPS-Tracking starten',
  ariaStopTracking: 'GPS-Tracking stoppen',
  ariaSelectWork: 'Als Arbeitsfahrt markieren',
  ariaSelectPrivate: 'Als Privatfahrt markieren',
  ariaConfirmAtCustomer: 'Ankunft beim Kunden bestätigen',
  ariaDenyAtCustomer: 'Noch nicht beim Kunden',
  ariaConfirmWorkDone: 'Arbeit beendet bestätigen',
  ariaContinueWorking: 'Weiter arbeiten',
  ariaConfirmHomeArrival: 'Ankunft zu Hause bestätigen'
} as const;
