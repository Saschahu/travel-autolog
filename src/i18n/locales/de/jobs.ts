export default {
  // Job management
  job: 'Auftrag',
  jobs: 'Aufträge',
  newJob: 'Neuer Auftrag',
  editJob: 'Auftrag bearbeiten',
  createJob: 'Auftrag erstellen',
  deleteJob: 'Auftrag löschen',
  
  // Job dialog
  dialogTitle: 'Auftrag bearbeiten',
  subtitle: 'Alle Job-Daten bearbeiten',
  
  // Tabs
  tabs: {
    customer: 'Kunde',
    machine: 'Maschine',
    times: 'Zeiten',
    overtime: 'Überstunden',
    report: 'Bericht',
    finish: 'Abschluss'
  },
  
  // Customer section
  customer: {
    name: 'Kundenname',
    namePlaceholder: 'Name des Kunden',
    address: 'Kundenadresse',
    addressPlaceholder: 'Vollständige Adresse des Kunden',
    contact: 'Kontaktperson',
    contactPlaceholder: 'Name der Kontaktperson',
    evatic: 'EVATIC-Nummer',
    evaticPlaceholder: 'EVATIC-Nummer (falls vorhanden)',
    
    // Hotel & accommodation
    hotelSection: 'Hotel & Übernachtung',
    hotelName: 'Hotel Name',
    hotelNamePlaceholder: 'Name des Hotels',
    hotelAddress: 'Hotel Adresse',
    hotelAddressPlaceholder: 'Adresse des Hotels',
    hotelNights: 'Anzahl Nächte',
    hotelPrice: 'Hotel Preis (pro Nacht oder gesamt)',
    
    // Travel costs
    travelCosts: 'Reisekosten',
    kmOutbound: 'Kilometer Hinfahrt',
    kmReturn: 'Kilometer Rückfahrt',
    tollFees: 'Mautgebühren (€)'
  },
  
  // Machine section
  machine: {
    manufacturer: 'Hersteller',
    manufacturerPlaceholder: 'z.B. Siemens, ABB, Schneider',
    model: 'Modell/Typ',
    modelPlaceholder: 'z.B. S7-1200, CP1E',
    serialNumber: 'Seriennummer',
    serialPlaceholder: 'Seriennummer der Maschine/Anlage',
    workPerformed: 'Zu leistende Arbeiten',
    workPerformedPlaceholder: 'Beschreiben Sie die geplanten/zu leistenden Arbeiten...'
  },
  
  // Times section
  times: {
    arrival: 'Anreise',
    work: 'Arbeit',
    departure: 'Abreise',
    startTime: 'Start Zeit',
    endTime: 'Ende Zeit',
    date: 'Datum',
    selectDate: 'Datum wählen'
  },
  
  // Report section
  report: {
    tab: 'Bericht',
    day: 'Tag {{n}}',
    dayCounter: 'Tag {{current}}/{{total}}',
    dayWithDate: '{{date}}',
    placeholder: 'Bericht für {{label}}',
    save: 'Speichern',
    prev: 'Vorheriger Tag',
    next: 'Nächster Tag',
    saved: 'Bericht gespeichert',
    trimTitle: 'Tage reduzieren?',
    trimBody: 'Es werden Berichte für die Tage {{from}}–{{to}} dauerhaft gelöscht. Fortfahren?',
    cancel: 'Abbrechen',
    confirm: 'Fortfahren'
  },
  
  // Finish section
  finish: {
    title: 'Auftrag abschließen',
    reportLabel: 'Arbeitsbericht',
    reportPlaceholder: 'Beschreiben Sie die durchgeführten Arbeiten, Befunde, verwendete Materialien, etc...',
    btnSaveReport: 'Arbeitsbericht speichern',
    btnPreview: 'Bericht Vorschau',
    btnEmail: 'Per E-Mail versenden',
    btnDashboard: 'Dashboard'
  },
  
  // Actions
  buttons: {
    save: 'Speichern',
    cancel: 'Abbrechen'
  },
  
  // Job entry form
  customerData: 'Kundendaten',
  machineData: 'Maschinendaten',
  hotelData: 'Hoteldaten',
  travel: 'Reise',
  timesTitle: 'Zeiten',
  travelPerDay: 'Reise pro Tag',
  days: 'Tage',
  travelThere: 'Hinreise',
  travelBack: 'Rückreise',
  jobEditing: 'Auftrag bearbeiten',
  jobIdShort: 'Auftrags-ID',
  newJobStarted: 'Neuer Auftrag gestartet'
} as const;