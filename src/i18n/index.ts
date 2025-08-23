import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Core Job namespace
      job: {
        dialogTitle: 'Edit Job',
        tabs: {
          customer: 'Customer',
          machine: 'Machine', 
          times: 'Times',
          overtime: 'Overtime',
          finish: 'Finish'
        },
        finish: {
          title: 'Finish service case',
          reportLabel: 'Work report',
          reportPlaceholder: 'Describe the work performed, findings, materials used, etc...',
          btnSaveReport: 'Save Work Report',
          btnPreview: 'Report preview', 
          btnEmail: 'Send by email',
          btnDashboard: 'Dashboard'
        }
      },
      // Navigation and Tabs
      dashboard: 'Dashboard',
      newJob: 'New Job',
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
      back: 'Back',
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
      workPerformed: 'Work to perform',
      workPerformedPlaceholder: 'Describe the work to perform...',
      hotelNights: 'Number of Nights',
      kmReturn: 'KM Return',
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
      
      // Job Edit Dialog
      editJob: 'Edit Job',
      editAllJobData: 'Edit all job data',
      customerName: 'Customer Name',
      customerNamePlaceholder: 'Name of the customer',
      customerAddress: 'Customer Address',
      customerAddressPlaceholder: 'Full address of the customer',
      evaticNumber: 'EVATIC Number',
      evaticPlaceholder: 'EVATIC number (if available)',
      hotelOvernight: 'Hotel & Overnight',
      hotelName: 'Hotel Name',
      hotelNamePlaceholder: 'Name of the hotel',
      hotelAddress: 'Hotel Address',
      hotelAddressPlaceholder: 'Address of the hotel',
      travelCosts: 'Travel Costs',
      kmOutbound: 'Kilometers Outbound',
      kmInbound: 'Kilometers Return',
      tollFees: 'Toll Fees (€)',
      manufacturer: 'Manufacturer',
      manufacturerPlaceholder: 'e.g. Siemens, ABB, Schneider',
      modelType: 'Model/Type',
      modelPlaceholder: 'e.g. S7-1200, CP1E',
      serialNumber: 'Serial Number',
      serialPlaceholder: 'Serial number of the machine/system',
      workReport: 'Work Report',
      workReportPlaceholder: 'Detailed description of the work performed...',
      estimatedDays: 'Estimated Days',
      currentDay: 'Current Day',
      totalTimeCalculated: 'Total time is calculated automatically: Travel + Work time + Departure for all days',
      dailyTimes: 'Daily Times',
      day: 'Day',
      travelStart: 'Travel Start',
      travelEnd: 'Travel End',
      departureStart: 'Departure Start',
      departureEnd: 'Departure End',
      
      // Job Details
      jobDetails: 'Job Details',
      jobDetailsDescription: 'Information about the selected job',
      status: 'Status',
      startDate: 'Start Date',
      days: 'Days',
      workStart: 'Work Start',
      workEnd: 'Work End',
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
    }
  },
  de: {
    translation: {
      // Core Job namespace  
      job: {
        dialogTitle: 'Auftrag bearbeiten',
        tabs: {
          customer: 'Kunde',
          machine: 'Maschine',
          times: 'Zeiten', 
          overtime: 'Überstunden',
          finish: 'Abschluss'
        },
        finish: {
          title: 'Auftrag abschließen',
          reportLabel: 'Arbeitsbericht',
          reportPlaceholder: 'Beschreiben Sie die durchgeführten Arbeiten, Befunde, verwendete Materialien, etc...',
          btnSaveReport: 'Arbeitsbericht speichern',
          btnPreview: 'Report Vorschau',
          btnEmail: 'Per E-Mail versenden', 
          btnDashboard: 'Dashboard'
        }
      },
      // Navigation and Tabs
      dashboard: 'Dashboard',
      newJob: 'Neuer Job',
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
      back: 'Zurück',
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
      workPerformed: 'Zu leistende Arbeiten',
      workPerformedPlaceholder: 'Beschreiben Sie die geplanten/zu leistenden Arbeiten...',
      hotelNights: 'Anzahl Nächte',
      kmReturn: 'KM Rückfahrt',
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
      
      // Job Edit Dialog
      editJob: 'Auftrag bearbeiten',
      editAllJobData: 'Alle Job-Daten bearbeiten',
      customerName: 'Kundenname',
      customerNamePlaceholder: 'Name des Kunden',
      customerAddress: 'Kundenadresse',
      customerAddressPlaceholder: 'Vollständige Adresse des Kunden',
      evaticNumber: 'EVATIC-Nummer',
      evaticPlaceholder: 'EVATIC-Nummer (falls vorhanden)',
      hotelOvernight: 'Hotel & Übernachtung',
      hotelName: 'Hotel Name',
      hotelNamePlaceholder: 'Name des Hotels',
      hotelAddress: 'Hotel Adresse',
      hotelAddressPlaceholder: 'Adresse des Hotels',
      travelCosts: 'Reisekosten',
      kmOutbound: 'Kilometer Hinfahrt',
      kmInbound: 'Kilometer Rückfahrt',
      tollFees: 'Mautgebühren (€)',
      manufacturer: 'Hersteller',
      manufacturerPlaceholder: 'z.B. Siemens, ABB, Schneider',
      modelType: 'Modell/Typ',
      modelPlaceholder: 'z.B. S7-1200, CP1E',
      serialNumber: 'Seriennummer',
      serialPlaceholder: 'Seriennummer der Maschine/Anlage',
      workReport: 'Arbeitsbericht',
      workReportPlaceholder: 'Detaillierte Beschreibung der durchgeführten Arbeiten...',
      estimatedDays: 'Geschätzte Tage',
      currentDay: 'Aktueller Tag',
      totalTimeCalculated: 'Gesamtzeit wird automatisch berechnet: Anreise + Arbeitszeit + Abreise aller Tage',
      dailyTimes: 'Tägliche Zeiten',
      day: 'Tag',
      travelStart: 'Anreise Start',
      travelEnd: 'Anreise Ende',
      departureStart: 'Abreise Start',
      departureEnd: 'Abreise Ende',
      
      // Job Details
      jobDetails: 'Auftragsdetails',
      jobDetailsDescription: 'Informationen zum ausgewählten Auftrag',
      status: 'Status',
      startDate: 'Startdatum',
      days: 'Tage',
      workStart: 'Arbeitsbeginn',
      workEnd: 'Arbeitsende',
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
    }
  },
  no: {
    translation: {
      // Core Job namespace
      job: {
        dialogTitle: 'Rediger jobb',
        tabs: {
          customer: 'Kunde',
          machine: 'Maskin',
          times: 'Tider',
          overtime: 'Overtid', 
          finish: 'Ferdig'
        },
        finish: {
          title: 'Fullfør oppdrag',
          reportLabel: 'Arbeidsrapport',
          reportPlaceholder: 'Beskriv arbeidet som ble utført, funn, materialer brukt, etc...',
          btnSaveReport: 'Lagre arbeidsrapport',
          btnPreview: 'Forhåndsvisning',
          btnEmail: 'Send på e-post',
          btnDashboard: 'Dashboard' 
        }
      },
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
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'de',
    
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;