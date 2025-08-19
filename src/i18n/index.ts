import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation and Tabs
      dashboard: 'Dashboard',
      newJob: 'New Job',
      location: 'Location',
      export: 'Export',
      
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
      workPerformed: 'Work Performed',
      workPerformedPlaceholder: 'Description of work performed...',
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
      // Navigation and Tabs
      dashboard: 'Dashboard',
      newJob: 'Neuer Job',
      location: 'Standort',
      export: 'Export',
      
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
      workPerformed: 'Durchgeführte Arbeiten',
      workPerformedPlaceholder: 'Beschreibung der durchgeführten Arbeiten...',
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
      // Navigation and Tabs
      dashboard: 'Dashboard',
      newJob: 'Ny jobb',
      location: 'GPS',
      export: 'Eksport',
      
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
      workPerformed: 'Utført arbeid',
      workPerformedPlaceholder: 'Beskrivelse av utført arbeid...',
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