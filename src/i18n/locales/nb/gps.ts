export default {
  // GPS Status & Control
  currentState: 'Nåværende status',
  trackingActive: 'Sporing aktiv',
  trackingStopped: 'Sporing stoppet',
  gpsAuthorized: 'GPS autorisert',
  gpsPermissionMissing: 'GPS-tillatelse mangler',
  
  // Timer
  timer: 'Timer',
  travel: 'Reise',
  workTime: 'Arbeidstid',
  returnTrip: 'Returreise',
  
  // Control
  control: 'Kontroll',
  requestPermission: 'Be om tillatelse',
  getCurrentPosition: 'Nåværende posisjon',
  startTracking: 'Start sporing',
  stopTracking: 'Stopp sporing',
  
  // Work/Private Selection
  work: 'Arbeid',
  private: 'Privat',
  
  // Customer Confirmation
  confirmAtCustomer: 'Bekreft hos kunde',
  denyAtCustomer: 'Ikke hos kunde',
  
  // Work Done Confirmation
  confirmWorkDone: 'Arbeid fullført',
  continueWorking: 'Fortsett å arbeide',
  
  // Home Arrival
  confirmHomeArrival: 'Ankommet hjemme',
  
  // Location Info
  locationInfo: 'Posisjonsinformasjon',
  lastPosition: 'Siste posisjon',
  noPositionAvailable: 'Ingen posisjon tilgjengelig',
  speed: 'Hastighet',
  accuracy: 'Nøyaktighet',
  timestamp: 'Tidsstempel',
  
  // Aria Labels
  ariaRequestPermission: 'Be om GPS-tillatelse',
  ariaGetCurrentPosition: 'Hent nåværende GPS-posisjon',
  ariaStartTracking: 'Start GPS-sporing',
  ariaStopTracking: 'Stopp GPS-sporing',
  ariaSelectWork: 'Marker som arbeidsreise',
  ariaSelectPrivate: 'Marker som privatreise',
  ariaConfirmAtCustomer: 'Bekreft ankomst hos kunde',
  ariaDenyAtCustomer: 'Ikke hos kunde ennå',
  ariaConfirmWorkDone: 'Bekreft arbeid fullført',
  ariaContinueWorking: 'Fortsett å arbeide',
  ariaConfirmHomeArrival: 'Bekreft ankomst hjemme'
} as const;
