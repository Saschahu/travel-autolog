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
      
      // Export
      supportedFormats: 'Støttede formater: .xlsx, .xls',
      maxFileSize: 'Maksimal filstørrelse: 10 MB',
      
      // General
      addMoreData: 'Du kan legge til mer data',
      save: 'Lagre',
      cancel: 'Avbryt',
      delete: 'Slett',
      close: 'Lukk',
      
      // Job Edit Dialog
      editJob: 'Rediger jobb',
      editAllJobData: 'Rediger alle jobbdata',
      customerName: 'Kundenavn',
      customerNamePlaceholder: 'Navn på kunden',
      customerAddress: 'Kundeadresse',
      customerAddressPlaceholder: 'Full adresse til kunden',
      evaticNumber: 'EVATIC-nummer',
      evaticPlaceholder: 'EVATIC-nummer (hvis tilgjengelig)',
      hotelOvernight: 'Hotell & Overnatting',
      hotelName: 'Hotellnavn',
      hotelNamePlaceholder: 'Navn på hotellet',
      hotelAddress: 'Hotelladresse',
      hotelAddressPlaceholder: 'Adresse til hotellet',
      travelCosts: 'Reisekostnader',
      kmOutbound: 'Kilometer utreise',
      kmInbound: 'Kilometer retur',
      tollFees: 'Bomavgifter (€)',
      manufacturer: 'Produsent',
      manufacturerPlaceholder: 'f.eks. Siemens, ABB, Schneider',
      modelType: 'Modell/Type',
      modelPlaceholder: 'f.eks. S7-1200, CP1E',
      serialNumber: 'Serienummer',
      serialPlaceholder: 'Serienummer på maskinen/anlegget',
      workReport: 'Arbeidsrapport',
      workReportPlaceholder: 'Detaljert beskrivelse av utført arbeid...',
      estimatedDays: 'Estimerte dager',
      currentDay: 'Gjeldende dag',
      totalTimeCalculated: 'Total tid beregnes automatisk: Reise + Arbeidstid + Avreise for alle dager',
      dailyTimes: 'Daglige tider',
      day: 'Dag',
      travelStart: 'Reise start',
      travelEnd: 'Reise slutt',
      departureStart: 'Avreise start',
      departureEnd: 'Avreise slutt',
      
      // Job Details
      jobDetails: 'Jobbdetaljer',
      jobDetailsDescription: 'Informasjon om valgt jobb',
      status: 'Status',
      startDate: 'Startdato',
      days: 'Dager',
      workStart: 'Arbeidsstart',
      workEnd: 'Arbeidsslutt',
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

i18n
  .use(initReactI18next)
  .init({
    resources,
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