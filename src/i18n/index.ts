import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { useSettingsStore } from '@/state/settingsStore';

// Extract job translations to separate namespace files
const jobTranslationsEn = {
  dialogTitle: 'Edit Job',
  subtitle: 'Edit all job data',
  tabs: {
    customer: 'Customer',
    machine: 'Machine', 
    times: 'Times',
    overtime: 'Overtime',
    finish: 'Finish'
  },
  customer: {
    name: 'Customer Name',
    namePlaceholder: 'Name of the customer',
    address: 'Customer Address',
    addressPlaceholder: 'Full address of the customer',
    evatic: 'EVATIC Number',
    evaticPlaceholder: 'EVATIC number (if available)',
    hotelSection: 'Hotel & Overnight',
    hotelName: 'Hotel Name',
    hotelNamePlaceholder: 'Name of the hotel',
    hotelAddress: 'Hotel Address',
    hotelAddressPlaceholder: 'Address of the hotel',
    hotelNights: 'Hotel Nights',
    travelCosts: 'Travel Costs',
    kmOutbound: 'Kilometers Outbound',
    kmInbound: 'Kilometers Return',
    tollFees: 'Toll Fees (€)'
  },
  machine: {
    manufacturer: 'Manufacturer',
    manufacturerPlaceholder: 'e.g. Siemens, ABB, Schneider',
    model: 'Model/Type',
    modelPlaceholder: 'e.g. S7-1200, CP1E',
    serialNumber: 'Serial Number',
    serialPlaceholder: 'Serial number of the machine/system',
    workPerformed: 'Work to Perform',
    workPerformedPlaceholder: 'Describe the work to perform...'
  },
  finish: {
    title: 'Finish service case',
    reportLabel: 'Work report',
    reportPlaceholder: 'Describe the work performed, findings, materials used, etc...',
    btnSaveReport: 'Save Work Report',
    btnPreview: 'Report preview', 
    btnEmail: 'Send by email',
    btnDashboard: 'Dashboard'
  },
  buttons: {
    save: 'Save',
    cancel: 'Cancel'
  }
};

const jobTranslationsDe = {
  dialogTitle: 'Auftrag bearbeiten',
  subtitle: 'Alle Job-Daten bearbeiten',
  tabs: {
    customer: 'Kunde',
    machine: 'Maschine',
    times: 'Zeiten', 
    overtime: 'Überstunden',
    finish: 'Abschluss'
  },
  customer: {
    name: 'Kundenname',
    namePlaceholder: 'Name des Kunden',
    address: 'Kundenadresse',
    addressPlaceholder: 'Vollständige Adresse des Kunden',
    evatic: 'EVATIC-Nummer',
    evaticPlaceholder: 'EVATIC-Nummer (falls vorhanden)',
    hotelSection: 'Hotel & Übernachtung',
    hotelName: 'Hotel Name',
    hotelNamePlaceholder: 'Name des Hotels',
    hotelAddress: 'Hotel Adresse',
    hotelAddressPlaceholder: 'Adresse des Hotels',
    hotelNights: 'Anzahl Nächte',
    travelCosts: 'Reisekosten',
    kmOutbound: 'Kilometer Hinfahrt',
    kmInbound: 'Kilometer Rückfahrt',
    tollFees: 'Mautgebühren (€)'
  },
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
  finish: {
    title: 'Auftrag abschließen',
    reportLabel: 'Arbeitsbericht',
    reportPlaceholder: 'Beschreiben Sie die durchgeführten Arbeiten, Befunde, verwendete Materialien, etc...',
    btnSaveReport: 'Arbeitsbericht speichern',
    btnPreview: 'Report Vorschau',
    btnEmail: 'Per E-Mail versenden', 
    btnDashboard: 'Dashboard'
  },
  buttons: {
    save: 'Speichern',
    cancel: 'Abbrechen'
  }
};

const resources = {
  en: {
    translation: {
      // Navigation and Tabs
      dashboard: 'Dashboard',
      location: 'Location',
      export: 'Export',
      
      // Finish Tab
      finishTitle: 'Finish service case',
      reportLabel: 'Work report',
      btnSavePdf: 'Save PDF',
      btnPreview: 'Report preview',
      btnEmail: 'Send by email',
      shareSupported: 'Direct share with attachment supported',
      savedTo: 'Saved to: {{folder}}',
      savedAs: 'File name: {{name}}',
      needFolder: 'No export folder selected. The file will be downloaded.',
      saving: 'Creating PDF…',
      pdfSaved: 'PDF saved',
      failed: 'Could not save PDF.',
      unsavedChanges: 'Unsaved Changes',
      unsavedChangesText: 'There are unsaved changes. Continue to dashboard anyway?',
      continueToDashboard: 'Continue to Dashboard',
      
      // Job Entry Form Tabs
      customer: 'Customer',
      machine: 'Machine',
      times: 'Times',
      overtime: 'Overtime',
      finish: 'Finish',
      
      // Dashboard and Quick Actions
      quickActions: 'Quick Actions',
      
      // Job Filter
      openJobs: 'Open Jobs',
      activeJobsFilter: 'Active Jobs',
      completedJobsFilter: 'Completed',
      completedSentJobs: 'Completed & Sent',
      allJobs: 'All Jobs',
      filterJobs: 'Filter jobs...',
      
      // Job Status
      open: 'Open',
      active: 'Active',
      completed: 'Completed',
      pending: 'Pending',
      
      // Actions
      start: 'Start',
      pause: 'Pause',
      details: 'Details',
      edit: 'Edit',
      
      // Settings
      profile: 'Profile',
      gps: 'GPS',
      settings: 'Settings',
      holidays: 'Holidays',
      advanced: 'Advanced',
      appLanguage: 'App language',
      uiLanguage: 'Interface language',
      logout: 'Logout',
      languageNote: 'Language changes immediately and applies across the app.',
      
      // Form Labels
      jobsToExport: 'Jobs to Export:',
      singleJobTemplate: 'Single Job (Template, optional):',
      exportOverview: 'Export Overview',
      mobileCompatibility: 'Mobile Compatibility',
      mobileOptimized: 'Optimized for iOS and Android devices',
      
      // Overtime Tab
      timeBreakdown: 'Time Breakdown',
      guaranteedHours: 'Guaranteed Hours',
      actualWorked: 'Actually Worked',
      regularHours: 'Regular Hours',
      overtimeHours: 'Overtime Hours',
      overtimeCalculation: 'Overtime Calculation',
      regularHoursUpTo8: 'Regular Hours (up to 8h)',
      totalOvertime: 'Total Overtime',
      payableHours: 'Payable Hours',
      overtimeExplanation: 'Explanation: You receive payment for at least',
      hoursMinimum: 'hours minimum, even if you work less. All hours outside 8-16 are overtime with surcharge.',
      
      // Overtime Settings
      hourBasedOvertime: 'Hour-based Overtime',
      overtimeDescription: 'Overtime based on total working time per day',
      firstOvertimeFrom: 'First overtime from (hours)',
      secondOvertimeFrom: 'Second overtime from (hours)',
      surchargeOver12h: 'Surcharge over 12h (%)',
      weekendSurcharges: 'Weekend Surcharges',
      weekendDescription: 'Automatic surcharges from Friday evening to Monday morning',
      
      // Additional overtime settings
      overtimeSettingsTitle: 'Configure Overtime Surcharges',
      surcharge8to12h: 'Surcharge 8-12h (%)',
      saturdaySurcharge: 'Saturday Surcharge (%)',
      sundayHolidaySurcharge: 'Sunday/Holiday Surcharge (%)',
      guaranteedHoursConfig: 'Guaranteed Hours',
      guaranteedHoursDescription: 'Minimum pay per day, regardless of actual working time',
      guaranteedHoursPerDay: 'Guaranteed Hours per Day',
      overtimeSettingsSaved: 'Overtime settings have been successfully saved.',
      notesSection: 'Notes',
      
      // Advanced Settings
      advancedSettings: 'Advanced Settings',
      resetAppData: 'Reset App Data',
      resetAppDescription: 'Deletes all locally stored data, settings and cache. The app will reload after reset.',
      deleteAppData: 'Delete App Data',
      
      // Overtime Display
      'overtime.base': 'OT',
      'overtime.surcharge': 'Surcharge',
      'overtime.credit': 'creditable',
      'overtime.formula.ot50': '{{base}} OT50 + {{surcharge}} Surcharge50',
      'overtime.formula.ot100': '{{base}} OT100 + {{surcharge}} Surcharge100', 
      'overtime.formula.saturday': '{{base}} Saturday + {{surcharge}} Surcharge',
      'overtime.formula.sunday': '{{base}} Sunday + {{surcharge}} Surcharge',
      
      // Location
      longitude: 'Longitude',
      jobs: 'Jobs',
      activateGpsTracking: '3. Activate GPS tracking for automatic detection',
      
      // Mapbox Errors
      mapboxTokenMissing: 'No Mapbox token found. (Native: VITE_MAPBOX_TOKEN_MOBILE, Web: VITE_MAPBOX_TOKEN_WEB or save in GPS UI)',
      mapboxTokenInvalid: 'Invalid Mapbox token (must start with "pk.").',
      mapboxTokenRejected: 'Mapbox rejects the token (401/403). For Web: Domain in URL restrictions. For Native: use separate mobile token without URL restrictions.',
      mapboxTokenMissingShort: 'Mapbox token missing.',
      mapboxEnvTokenMissing: 'VITE_MAPBOX_TOKEN is not set. Please configure .env file with your Mapbox Public Token.',
      mapboxInitError: 'Error initializing the map. Check your Mapbox token.',
      mapboxTokenRequired: 'Mapbox Token Required',
      mapboxPublicToken: 'Mapbox Public Token',
      // Mapbox GPS Settings
      mapboxSettings: 'Mapbox Settings',
      mapStyleId: 'Map Style ID',
      mapStyleDefault: 'Default: mapbox://styles/mapbox/streets-v12',
      tokenConfig: 'Token Configuration',
      tokenConfigDesc: 'Mapbox token comes from VITE_MAPBOX_TOKEN (.env/Secret). For local development, typically enter http://localhost:8080/* as URL restriction in Mapbox dashboard.',
      getTokenFromMapbox: 'Get a free token from',
      homeGeofence: 'Home Geofence',
      homePositionSet: 'Home position set',
      radius: 'Radius',
      atHome: 'At home',
      away: 'Away',
      stopMonitoring: 'Stop monitoring',
      startMonitoring: 'Start monitoring',
      noHomePosition: 'No home position set. Please set a home position first.',
      radiusLabel: 'Radius (meters)',
      getCurrentLocation: 'Get current location',
      gettingLocation: 'Getting location...',
      radiusDefault: 'Default: 100 meters',
      geofenceWarning: 'Geofence monitoring is only active in foreground and serves as demonstration. True background geofencing is not possible in web.',
      
      // Export
      supportedFormats: 'Supported formats: .xlsx, .xls',
      maxFileSize: 'Maximum file size: 10 MB',
      
      // General
      addMoreData: 'You can add more data',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      close: 'Close',
      
      // Job Entry Form
      customerData: 'Customer data',
      customerName: 'Customer name',
      required: 'Required',
      customerAddress: 'Customer address',
      evaticNo: 'Evatic No',
      machineData: 'Machine data',
      manufacturer: 'Manufacturer',
      model: 'Model',
      serialNumber: 'Serial number',
      workPerformed: 'Work performed',
      workPerformedPlaceholder: 'Describe the work that was performed',
      timesTitle: 'Times',
      travelStart: 'Travel start',
      travelEnd: 'Travel end',
      workStart: 'Work start',
      workEnd: 'Work end',
      departureStart: 'Return start',
      departureEnd: 'Return end',
      travelAndStay: 'Travel & accommodation',
      hotelNameOptional: 'Hotel name (optional)',
      hotelAddress: 'Hotel address',
      hotelNights: 'Hotel nights',
      kmOutbound: 'KM outbound',
      kmReturn: 'KM return',
      tollAmountNok: 'Toll (NOK)',
      back: 'Back',
      newJob: 'New job',
      saveCustomer: 'Save customer',
      completeJob: 'Complete job',
      next: 'Next',
      plannedDaysLabel: 'Planned duration (days)',
      now: 'Now',
      customerSavedGoMachineTitle: 'Continue to machine',
      customerSavedGoMachineDesc: 'Customer saved! Now enter machine data.',
      jobEditing: 'Job is being edited',
      jobIdShort: 'ID',
      editJob: 'Edit Job',
      
      // Job Details
      jobDetails: 'Job Details',
      jobDetailsDescription: 'Information about the selected job',
      status: 'Status',
      startDate: 'Start Date',
      days: 'Days',
      totalHours: 'Total Hours',
      
      // Dashboard specific
      startDateLabel: 'Start Date',
      workTimes: 'Work Times',
      workStartLabel: 'Start',
      workEndLabel: 'End',
      travelTime: 'Travel',
      workTime: 'Work',
      departureTime: 'Departure',
      total: 'Total',
      progress: 'Progress',
      daysLabel: 'Days',
      maxDaysReached: '⚠️ Max. 7 days reached - New file will be created',
      sendReport: 'Send Report',
      
      // Toast messages
      saved: 'Saved',
      timeEntriesSaved: 'Time entries have been saved successfully',
      error: 'Error',
      errorSavingEntries: 'Error saving time entries',
      statusChanged: 'Status Changed',
      jobStarted: 'Job started',
      jobPaused: 'Job paused',
      errorChangingStatus: 'Error changing job status',
      jobDeleted: 'Job Deleted',
      jobDeletedSuccess: 'Job deleted successfully',
      errorDeletingJob: 'Error deleting job',
      deleteConfirm: 'Do you really want to delete this job? This action cannot be undone.',
      workTripStarted: 'Work Trip Started',
      newJobDescription: 'You can now create a new job',
      privateTrip: 'Private Trip',
      privateTripDescription: 'Have fun with your private activities!',
      
      // Overtime Rules
      overtimeRules: 'Overtime Rules:',
      rule8to12: '• 8-12 hours: 50% surcharge on overtime',
      ruleOver12: '• Over 12 hours: 100% surcharge on overtime',
      weekendRules: 'Weekend Rules:',
      payment: '• Payment: At least guaranteed hours + overtime surcharges'
    },
    job: jobTranslationsEn
  },
  de: {
    translation: {
      // Navigation and Tabs
      dashboard: 'Dashboard',
      location: 'GPS',
      export: 'Export',
      
      // Finish Tab
      finishTitle: 'Auftrag abschließen',
      reportLabel: 'Arbeitsbericht',
      btnSavePdf: 'PDF speichern',
      btnPreview: 'Report Vorschau',
      btnEmail: 'Per E-Mail versenden',
      shareSupported: 'Direktes Teilen mit Anhang unterstützt',
      savedTo: 'Gespeichert in: {{folder}}',
      savedAs: 'Dateiname: {{name}}',
      needFolder: 'Kein Exportordner gewählt. Datei wird heruntergeladen.',
      saving: 'PDF wird erstellt …',
      pdfSaved: 'PDF gespeichert',
      failed: 'PDF konnte nicht gespeichert werden.',
      unsavedChanges: 'Ungespeicherte Änderungen',
      unsavedChangesText: 'Es liegen ungespeicherte Änderungen vor. Trotzdem zum Dashboard wechseln?',
      continueToDashboard: 'Weiter zum Dashboard',
      
      // Job Entry Form Tabs
      customer: 'Kunde',
      machine: 'Maschine',
      times: 'Zeiten',
      overtime: 'Überstunden',
      finish: 'Abschluss',
      
      // Dashboard and Quick Actions
      quickActions: 'Schnellaktionen',
      
      // Job Filter
      openJobs: 'Offene Jobs',
      activeJobsFilter: 'Aktive Jobs',
      completedJobsFilter: 'Abgeschlossen',
      completedSentJobs: 'Abgeschlossen & Versendet',
      allJobs: 'Alle Jobs',
      filterJobs: 'Jobs filtern...',
      
      // Job Status
      open: 'Offen',
      active: 'Aktiv',
      completed: 'Abgeschlossen',
      pending: 'Ausstehend',
      
      // Actions
      start: 'Starten',
      pause: 'Pausieren',
      details: 'Details',
      edit: 'Bearbeiten',
      
      // Settings
      profile: 'Profil',
      gps: 'GPS',
      settings: 'Einstellungen',
      holidays: 'Feiertage',
      advanced: 'Erweitert',
      appLanguage: 'App-Sprache',
      uiLanguage: 'Sprache der Benutzeroberfläche',
      logout: 'Abmelden',
      languageNote: 'Die Sprache wird sofort geändert und gilt in der gesamten App.',
      
      // Form Labels
      jobsToExport: 'Zu exportierende Aufträge:',
      singleJobTemplate: 'Einzelauftrag (Template, optional):',
      exportOverview: 'Export-Übersicht',
      mobileCompatibility: 'Mobile Kompatibilität',
      mobileOptimized: 'Optimiert für iOS und Android Geräte',
      
      // Overtime Tab
      timeBreakdown: 'Zeitaufschlüsselung',
      guaranteedHours: 'Garantierte Stunden',
      actualWorked: 'Tatsächlich gearbeitet',
      regularHours: 'Reguläre Stunden',
      overtimeHours: 'Überstunden',
      overtimeCalculation: 'Überstundenzuschläge',
      regularHoursUpTo8: 'Reguläre Stunden (bis 8h)',
      totalOvertime: 'Überstunden gesamt',
      payableHours: 'Bezahlbare Stunden',
      overtimeExplanation: 'Erklärung: Sie erhalten mindestens',
      hoursMinimum: 'Stunden bezahlt, auch wenn Sie weniger arbeiten. Alle Stunden außerhalb 8-16 Uhr sind Überstunden mit Zuschlag.',
      
      // Overtime Settings
      hourBasedOvertime: 'Stundenbasierte Überstunden',
      overtimeDescription: 'Überstunden basierend auf Gesamtarbeitszeit pro Tag',
      firstOvertimeFrom: 'Erste Überstunden ab (Stunden)',
      secondOvertimeFrom: 'Zweite Überstunden ab (Stunden)',
      surchargeOver12h: 'Zuschlag über 12h (%)',
      weekendSurcharges: 'Wochenend-Zuschläge',
      weekendDescription: 'Automatische Zuschläge von Freitag Abend bis Montag Morgen',
      
      // Additional overtime settings
      overtimeSettingsTitle: 'Überstunden-Zuschläge konfigurieren',
      surcharge8to12h: 'Zuschlag 8-12h (%)',
      saturdaySurcharge: 'Samstag-Zuschlag (%)',
      sundayHolidaySurcharge: 'Sonntag/Feiertag-Zuschlag (%)',
      guaranteedHoursConfig: 'Garantierte Stunden',
      guaranteedHoursDescription: 'Mindestbezahlung pro Tag, unabhängig von der tatsächlichen Arbeitszeit',
      guaranteedHoursPerDay: 'Garantierte Stunden pro Tag',
      overtimeSettingsSaved: 'Überstunden-Einstellungen wurden erfolgreich gespeichert.',
      notesSection: 'Hinweise',
      
      // Advanced Settings
      advancedSettings: 'Erweiterte Einstellungen',
      resetAppData: 'Appdaten zurücksetzen',
      resetAppDescription: 'Löscht alle lokal gespeicherten Daten, Einstellungen und den Cache. Die App wird nach dem Reset neu geladen.',
      deleteAppData: 'App-Daten löschen',
      
      // Overtime Display
      'overtime.base': 'ÜS',
      'overtime.surcharge': 'Zuschlag',
      'overtime.credit': 'anrechenbar',
      'overtime.formula.ot50': '{{base}} ÜS50 + {{surcharge}} Zuschlag50',
      'overtime.formula.ot100': '{{base}} ÜS100 + {{surcharge}} Zuschlag100',
      'overtime.formula.saturday': '{{base}} Samstag + {{surcharge}} Zuschlag',
      'overtime.formula.sunday': '{{base}} Sonntag + {{surcharge}} Zuschlag',
      
      // Location
      longitude: 'Längengrad',
      jobs: 'Aufträge',
      activateGpsTracking: '3. GPS Tracking aktivieren für automatische Erkennung',
      
      // Mapbox Errors
      mapboxTokenMissing: 'Kein Mapbox-Token gefunden. (Native: VITE_MAPBOX_TOKEN_MOBILE, Web: VITE_MAPBOX_TOKEN_WEB oder im GPS-UI speichern)',
      mapboxTokenInvalid: 'Mapbox-Token ungültig (muss mit "pk." beginnen).',
      mapboxTokenRejected: 'Mapbox lehnt den Token ab (401/403). Für Web: Domain in URL-Restrictions. Für Native: separaten mobilen Token ohne URL-Restrictions nutzen.',
      mapboxTokenMissingShort: 'Mapbox-Token fehlt.',
      mapboxEnvTokenMissing: 'VITE_MAPBOX_TOKEN ist nicht gesetzt. Bitte .env-Datei mit Ihrem Mapbox Public Token konfigurieren.',
      mapboxInitError: 'Fehler beim Initialisieren der Karte. Überprüfen Sie Ihren Mapbox Token.',
      mapboxTokenRequired: 'Mapbox Token erforderlich',
      mapboxPublicToken: 'Mapbox Public Token',
      mapboxTokenSaved: 'Mapbox Token gespeichert',
      
      // Mapbox GPS Settings
      mapboxSettings: 'Mapbox Einstellungen',
      mapStyleId: 'Map Style ID',
      mapStyleDefault: 'Standard: mapbox://styles/mapbox/streets-v12',
      tokenConfig: 'Token Konfiguration',
      tokenConfigDesc: 'Mapbox-Token kommt aus VITE_MAPBOX_TOKEN (.env/Secret). Für lokale Entwicklung standardmäßig http://localhost:8080/* als URL-Restriction im Mapbox-Dashboard eintragen.',
      getTokenFromMapbox: 'Hol dir einen kostenlosen Token von',
      homeGeofence: 'Home Geofence',
      homePositionSet: 'Home-Position gesetzt',
      radius: 'Radius',
      atHome: 'Zuhause',
      away: 'Auswärts',
      stopMonitoring: 'Monitoring stoppen',
      startMonitoring: 'Monitoring starten',
      noHomePosition: 'Keine Home-Position gesetzt. Legen Sie zuerst eine Home-Position fest.',
      radiusLabel: 'Radius (Meter)',
      getCurrentLocation: 'Aktuelle Position abrufen',
      gettingLocation: 'Position wird abgerufen...',
      radiusDefault: 'Standard: 100 Meter',
      geofenceWarning: 'Das Geofence-Monitoring ist nur im Vordergrund aktiv und dient zur Demonstration. Echter Hintergrund-Geofence ist im Web nicht möglich.',
      
      // Export
      supportedFormats: 'Unterstützte Formate: .xlsx, .xls',
      maxFileSize: 'Maximale Dateigröße: 10 MB',
      
      // General
      addMoreData: 'Du kannst weitere Daten hinzufügen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      close: 'Schließen',
      
      // Job Entry Form
      customerData: 'Kundendaten',
      customerName: 'Kundenname',
      required: 'Pflicht',
      customerAddress: 'Kundenadresse',
      evaticNo: 'Evatic No',
      machineData: 'Maschinendaten',
      manufacturer: 'Hersteller',
      model: 'Modell',
      serialNumber: 'Seriennummer',
      workPerformed: 'Durchgeführte Arbeit',
      workPerformedPlaceholder: 'Beschreibe die durchgeführte Arbeit',
      timesTitle: 'Zeiten',
      travelStart: 'Anreise Start',
      travelEnd: 'Anreise Ende',
      workStart: 'Arbeit Start',
      workEnd: 'Arbeit Ende',
      departureStart: 'Heimreise Start',
      departureEnd: 'Heimreise Ende',
      travelAndStay: 'Reise & Unterkunft',
      hotelNameOptional: 'Hotel Name (optional)',
      hotelAddress: 'Hotel Adresse',
      hotelNights: 'Hotelnächte',
      kmOutbound: 'KM Hinfahrt',
      kmReturn: 'KM Rückfahrt',
      tollAmountNok: 'Maut (NOK)',
      back: 'Zurück',
      newJob: 'Neuer Job',
      saveCustomer: 'Kunde Speichern',
      completeJob: 'Job Abschließen',
      next: 'Weiter',
      plannedDaysLabel: 'Geplante Dauer (Tage)',
      now: 'Jetzt',
      customerSavedGoMachineTitle: 'Weiter zur Maschine',
      customerSavedGoMachineDesc: 'Kunde gespeichert! Jetzt Maschinendaten eingeben.',
      jobEditing: 'Job wird bearbeitet',
      jobIdShort: 'ID',
      editJob: 'Auftrag bearbeiten',
      
      // Job Details
      jobDetails: 'Auftragsdetails',
      jobDetailsDescription: 'Informationen zum ausgewählten Auftrag',
      status: 'Status',
      startDate: 'Startdatum',
      days: 'Tage',
      totalHours: 'Gesamtstunden',
      
      // Dashboard specific
      startDateLabel: 'Startdatum',
      workTimes: 'Arbeitszeiten',
      workStartLabel: 'Start',
      workEndLabel: 'Ende',
      travelTime: 'Anreise',
      workTime: 'Arbeit',
      departureTime: 'Abreise',
      total: 'Gesamt',
      progress: 'Fortschritt',
      daysLabel: 'Tage',
      maxDaysReached: '⚠️ Max. 7 Tage erreicht - Neue Datei wird erstellt',
      sendReport: 'Report senden',
      
      // Toast messages
      saved: 'Gespeichert',
      timeEntriesSaved: 'Zeiteinträge wurden erfolgreich gespeichert',
      error: 'Fehler',
      errorSavingEntries: 'Fehler beim Speichern der Zeiteinträge',
      statusChanged: 'Status geändert',
      jobStarted: 'gestartet',
      jobPaused: 'pausiert',
      errorChangingStatus: 'Fehler beim Ändern des Job-Status',
      jobDeleted: 'Job gelöscht',
      jobDeletedSuccess: 'Der Job wurde erfolgreich gelöscht',
      errorDeletingJob: 'Fehler beim Löschen des Jobs',
      deleteConfirm: 'Möchtest du diesen Job wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      workTripStarted: 'Arbeitsreise gestartet',
      newJobDescription: 'Du kannst jetzt einen neuen Job erfassen',
      privateTrip: 'Private Reise',
      privateTripDescription: 'Viel Spaß bei deinen privaten Aktivitäten!',
      
      // Overtime Rules
      overtimeRules: 'Überstundenregeln:',
      rule8to12: '• 8-12 Stunden: 50% Zuschlag auf Überstunden',
      ruleOver12: '• Über 12 Stunden: 100% Zuschlag auf Überstunden',
      weekendRules: 'Wochenendregeln:',
      payment: '• Bezahlung: Mindestens garantierte Stunden + Überstundenzuschläge'
    },
    job: jobTranslationsDe
  },
  no: {
    translation: {
      // Navigation and Tabs
      dashboard: 'Dashboard',
      newJob: 'Ny jobb',
      location: 'GPS',
      export: 'Eksport',
      
      // Finish Tab
      finishTitle: 'Fullfør oppdrag',
      reportLabel: 'Arbeidsrapport',
      btnSavePdf: 'Lagre PDF',
      btnPreview: 'Forhåndsvisning',
      btnEmail: 'Send på e-post',
      shareSupported: 'Direkte deling med vedlegg støttes',
      savedTo: 'Lagret i: {{folder}}',
      savedAs: 'Filnavn: {{name}}',
      needFolder: 'Ingen eksportmappe valgt. Filen lastes ned.',
      saving: 'Lager PDF …',
      pdfSaved: 'PDF lagret',
      failed: 'Kunne ikke lagre PDF.',
      unsavedChanges: 'Ulagrede endringer',
      unsavedChangesText: 'Det finnes ulagrede endringer. Fortsett til dashboard likevel?',
      back: 'Tilbake',
      continueToDashboard: 'Fortsett til Dashboard',
      
      // Job Entry Form Tabs
      customer: 'Kunde',
      machine: 'Maskin',
      times: 'Tider',
      overtime: 'Overtid',
      finish: 'Ferdig',
      
      // Dashboard and Quick Actions
      quickActions: 'Hurtighandlinger',
      
      // Job Filter
      openJobs: 'Åpne jobber',
      activeJobsFilter: 'Aktive jobber',
      completedJobsFilter: 'Fullført',
      completedSentJobs: 'Fullført og sendt',
      allJobs: 'Alle jobber',
      filterJobs: 'Filtrer jobber...',
      
      // Job Status
      open: 'Åpen',
      active: 'Aktiv',
      completed: 'Fullført',
      pending: 'Venter',
      
      // Actions
      start: 'Start',
      pause: 'Pause',
      details: 'Detaljer',
      edit: 'Rediger',
      
      // Settings
      profile: 'Profil',
      gps: 'GPS',
      settings: 'Innstillinger',
      holidays: 'Helligdager',
      advanced: 'Avansert',
      appLanguage: 'App-språk',
      uiLanguage: 'Grensesnittspråk',
      logout: 'Logg ut',
      languageNote: 'Språket endres umiddelbart og gjelder i hele appen.',
      
      // Form Labels
      workPerformed: 'Arbeid som skal utføres',
      workPerformedPlaceholder: 'Beskriv arbeidet som skal utføres...',
      hotelNights: 'Antall netter',
      kmReturn: 'KM retur',
      jobsToExport: 'Jobber å eksportere:',
      singleJobTemplate: 'Enkelt jobb (mal, valgfritt):',
      exportOverview: 'Eksport-oversikt',
      mobileCompatibility: 'Mobil kompatibilitet',
      mobileOptimized: 'Optimalisert for iOS og Android enheter',
      
      // Overtime Tab
      timeBreakdown: 'Tidsoppbrudd',
      guaranteedHours: 'Garanterte timer',
      actualWorked: 'Faktisk arbeidet',
      regularHours: 'Vanlige timer',
      overtimeHours: 'Overtidstimer',
      overtimeCalculation: 'Overtidsberegning',
      regularHoursUpTo8: 'Vanlige timer (opptil 8t)',
      totalOvertime: 'Total overtid',
      payableHours: 'Betalbare timer',
      overtimeExplanation: 'Forklaring: Du får betalt for minst',
      hoursMinimum: 'timer minimum, selv om du arbeider mindre. Alle timer utenfor 8-16 er overtid med tillegg.',
      
      // Overtime Settings
      hourBasedOvertime: 'Timebasert overtid',
      overtimeDescription: 'Overtid basert på total arbeidstid per dag',
      firstOvertimeFrom: 'Første overtid fra (timer)',
      secondOvertimeFrom: 'Andre overtid fra (timer)',
      surchargeOver12h: 'Tillegg over 12t (%)',
      weekendSurcharges: 'Helgetillegg',
      weekendDescription: 'Automatiske tillegg fra fredag kveld til mandag morgen',
      
      // Additional overtime settings
      overtimeSettingsTitle: 'Konfigurer overtidstillegg',
      surcharge8to12h: 'Tillegg 8-12t (%)',
      saturdaySurcharge: 'Lørdagstillegg (%)',
      sundayHolidaySurcharge: 'Søndag/Helligdagstillegg (%)',
      guaranteedHoursConfig: 'Garanterte timer',
      guaranteedHoursDescription: 'Minimum betaling per dag, uavhengig av faktisk arbeidstid',
      guaranteedHoursPerDay: 'Garanterte timer per dag',
      overtimeSettingsSaved: 'Overtidsinnstillingene er lagret.',
      notesSection: 'Notater',
      
      // Advanced Settings
      advancedSettings: 'Avanserte innstillinger',
      resetAppData: 'Tilbakestill appdata',
      resetAppDescription: 'Sletter alle lokalt lagrede data, innstillinger og cache. Appen vil laste på nytt etter tilbakestilling.',
      deleteAppData: 'Slett appdata',

      // Overtime Display
      'overtime.base': 'OT',
      'overtime.surcharge': 'Tillegg',
      'overtime.credit': 'krediterbar',
      'overtime.formula.ot50': '{{base}} OT50 + {{surcharge}} Tillegg50',
      'overtime.formula.ot100': '{{base}} OT100 + {{surcharge}} Tillegg100',
      'overtime.formula.saturday': '{{base}} Lørdag + {{surcharge}} Tillegg',
      'overtime.formula.sunday': '{{base}} Søndag + {{surcharge}} Tillegg',
      
      // Location
      longitude: 'Lengdegrad',
      jobs: 'Jobber',
      activateGpsTracking: '3. Aktiver GPS-sporing for automatisk gjenkjennelse',
      
      // Mapbox Errors
      mapboxTokenMissing: 'Ingen Mapbox-token funnet. (Native: VITE_MAPBOX_TOKEN_MOBILE, Web: VITE_MAPBOX_TOKEN_WEB eller lagre i GPS-UI)',
      mapboxTokenInvalid: 'Ugyldig Mapbox-token (må begynne med "pk.").',
      mapboxTokenRejected: 'Mapbox avviser token (401/403). For Web: Domene i URL-restriksjoner. For Native: bruk separat mobil token uten URL-restriksjoner.',
      mapboxTokenMissingSht: 'Mapbox-token mangler.',
      mapboxEnvTokenMissing: 'VITE_MAPBOX_TOKEN er ikke satt. Vennligst konfigurer .env-fil med ditt Mapbox Public Token.',
      mapboxInitError: 'Feil ved initialisering av kart. Sjekk ditt Mapbox token.',
      mapboxTokenRequired: 'Mapbox Token Påkrevd',
      mapboxPublicToken: 'Mapbox Public Token',
      mapboxTokenSaved: 'Mapbox Token Lagret',
      
      // Mapbox GPS Settings
      mapboxSettings: 'Mapbox Innstillinger',
      mapStyleId: 'Kart Style ID',
      mapStyleDefault: 'Standard: mapbox://styles/mapbox/streets-v12',
      tokenConfig: 'Token Konfigurasjon',
      tokenConfigDesc: 'Mapbox-token kommer fra VITE_MAPBOX_TOKEN (.env/Secret). For lokal utvikling, angi vanligvis http://localhost:8080/* som URL-restriksjon i Mapbox dashboard.',
      getTokenFromMapbox: 'Få et gratis token fra',
      homeGeofence: 'Hjemme Geofence',
      homePositionSet: 'Hjemmeposisjon satt',
      radius: 'Radius',
      atHome: 'Hjemme',
      away: 'Borte',
      stopMonitoring: 'Stopp overvåking',
      startMonitoring: 'Start overvåking',
      noHomePosition: 'Ingen hjemmeposisjon satt. Vennligst sett en hjemmeposisjon først.',
      radiusLabel: 'Radius (meter)',
      getCurrentLocation: 'Få gjeldende posisjon',
      gettingLocation: 'Får posisjon...',
      radiusDefault: 'Standard: 100 meter',
      geofenceWarning: 'Geofence-overvåking er kun aktiv i forgrunnen og fungerer som demonstrasjon. Ekte bakgrunns-geofencing er ikke mulig på web.',
      
      // Export
      supportedFormats: 'Støttede formater: .xlsx, .xls',
      maxFileSize: 'Maksimal filstørrelse: 10 MB',
      
      // General
      addMoreData: 'Du kan legge til mer data',
      save: 'Lagre',
      cancel: 'Avbryt',
      delete: 'Slett',
      close: 'Lukk',
      
      // Job Entry Form (main keys for tabs)
      customerData: 'Kundedata',
      machineData: 'Maskindata', 
      travelAndStay: 'Reise & opphold',
      customerName: 'Kundenavn',
      required: 'Påkrevd',
      customerAddress: 'Kundeadresse',
      evaticNo: 'Evatic Nr',
      model: 'Modell',
      timesTitle: 'Tider',
      hotelNameOptional: 'Hotellnavn (valgfritt)',
      tollAmountNok: 'Bompenger (NOK)',
      saveCustomer: 'Lagre kunde',
      completeJob: 'Fullfør jobb',
      next: 'Neste',
      plannedDaysLabel: 'Planlagt varighet (dager)',
      now: 'Nå',
      customerSavedGoMachineTitle: 'Fortsett til maskin',
      customerSavedGoMachineDesc: 'Kunde lagret! Nå legg inn maskindata.',
      jobEditing: 'Jobb redigeres',
      jobIdShort: 'ID',
      
      // Job Edit Dialog
      editJob: 'Rediger jobb',
      editAllJobData: 'Rediger alle jobbdata',
      evaticNumber: 'EVATIC-nummer',
      evaticPlaceholder: 'EVATIC-nummer (hvis tilgjengelig)',
      hotelOvernight: 'Hotell & Overnatting',
      travelCosts: 'Reisekostnader',
      tollFees: 'Bomavgifter (€)',
      manufacturerPlaceholder: 'f.eks. Siemens, ABB, Schneider',
      modelType: 'Modell/Type',
      modelPlaceholder: 'f.eks. S7-1200, CP1E',
      serialPlaceholder: 'Serienummer på maskinen/anlegget',
      workReport: 'Arbeidsrapport',
      workReportPlaceholder: 'Detaljert beskrivelse av utført arbeid...',
      estimatedDays: 'Estimerte dager',
      currentDay: 'Gjeldende dag',
      totalTimeCalculated: 'Total tid beregnes automatisk: Reise + Arbeidstid + Avreise for alle dager',
      dailyTimes: 'Daglige tider',
      
      // Job Details
      jobDetails: 'Jobbdetaljer',
      jobDetailsDescription: 'Informasjon om valgt jobb',
      status: 'Status',
      startDate: 'Startdato',
      days: 'Dager',
      totalHours: 'Totale timer',
      
      // Dashboard specific
      startDateLabel: 'Startdato',
      workTimes: 'Arbeidstider',
      workStartLabel: 'Start',
      workEndLabel: 'Slutt',
      travelTime: 'Reise',
      workTime: 'Arbeid',
      departureTime: 'Avreise',
      total: 'Totalt',
      progress: 'Fremdrift',
      daysLabel: 'Dager',
      maxDaysReached: '⚠️ Maks. 7 dager nådd - Ny fil vil bli opprettet',
      sendReport: 'Send rapport',
      
      // Toast messages
      saved: 'Lagret',
      timeEntriesSaved: 'Tidsregistreringer har blitt lagret',
      error: 'Feil',
      errorSavingEntries: 'Feil ved lagring av tidsregistreringer',
      statusChanged: 'Status endret',
      jobStarted: 'startet',
      jobPaused: 'pausert',
      errorChangingStatus: 'Feil ved endring av jobbstatus',
      jobDeleted: 'Jobb slettet',
      jobDeletedSuccess: 'Jobben ble slettet',
      errorDeletingJob: 'Feil ved sletting av jobb',
      deleteConfirm: 'Vil du virkelig slette denne jobben? Denne handlingen kan ikke angres.',
      workTripStarted: 'Arbeidsreise startet',
      newJobDescription: 'Du kan nå opprette en ny jobb',
      privateTrip: 'Privat reise',
      privateTripDescription: 'Ha det gøy med dine private aktiviteter!',
      
      // Overtime Rules
      overtimeRules: 'Overtidsregler:',
      rule8to12: '• 8-12 timer: 50% tillegg på overtid',
      ruleOver12: '• Over 12 timer: 100% tillegg på overtid',
      weekendRules: 'Helgeregler:',
      payment: '• Betaling: Minst garanterte timer + overtidstillegg'
    },
    job: {
      dialogTitle: 'Rediger jobb',
      subtitle: 'Rediger alle jobbdata',
      tabs: {
        customer: 'Kunde',
        machine: 'Maskin',
        times: 'Tider',
        overtime: 'Overtid', 
        finish: 'Ferdig'
      },
      customer: {
        name: 'Kundenavn',
        namePlaceholder: 'Navn på kunden',
        address: 'Kundeadresse',
        addressPlaceholder: 'Full adresse til kunden',
        evatic: 'EVATIC-nummer',
        evaticPlaceholder: 'EVATIC-nummer (hvis tilgjengelig)',
        hotelSection: 'Hotell & Overnatting',
        hotelName: 'Hotellnavn',
        hotelNamePlaceholder: 'Navn på hotellet',
        hotelAddress: 'Hotelladresse',
        hotelAddressPlaceholder: 'Adresse til hotellet',
        hotelNights: 'Antall netter',
        travelCosts: 'Reisekostnader',
        kmOutbound: 'Kilometer utreise',
        kmInbound: 'Kilometer hjemreise',
        tollFees: 'Bomavgifter (€)'
      },
      machine: {
        manufacturer: 'Produsent',
        manufacturerPlaceholder: 'f.eks. Siemens, ABB, Schneider',
        model: 'Modell/Type',
        modelPlaceholder: 'f.eks. S7-1200, CP1E',
        serialNumber: 'Serienummer',
        serialPlaceholder: 'Serienummer på maskinen/anlegget',
        workPerformed: 'Arbeid som skal utføres',
        workPerformedPlaceholder: 'Beskriv arbeidet som skal utføres...'
      },
      finish: {
        title: 'Fullfør oppdrag',
        reportLabel: 'Arbeidsrapport',
        reportPlaceholder: 'Beskriv arbeidet som ble utført, funn, materialer brukt, etc...',
        btnSaveReport: 'Lagre arbeidsrapport',
        btnPreview: 'Forhåndsvisning',
        btnEmail: 'Send på e-post',
        btnDashboard: 'Dashboard' 
      },
      buttons: {
        save: 'Lagre',
        cancel: 'Avbryt'
      }
    }
  }
};

// Support both 'no' and 'nb' by aliasing 'nb' to the Norwegian resources
const resourcesExtended: any = { ...resources, nb: (resources as any).no };

i18n
  .use(initReactI18next)
  .init({
    resources: resourcesExtended,
    lng: 'de', // Set initial language from settings store
    fallbackLng: 'de',
    
    interpolation: {
      escapeValue: false
    }
  });

// Connect i18n to settings store for reactive language switching
const settingsStore = useSettingsStore.getState();
i18n.changeLanguage(settingsStore.locale);

// Subscribe to settings changes for live language switching
useSettingsStore.subscribe((state) => {
  if (i18n.language !== state.locale) {
    i18n.changeLanguage(state.locale);
  }
});

export default i18n;