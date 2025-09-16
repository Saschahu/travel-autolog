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
    report: 'Report',
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
    hotelPrice: 'Hotel Price (per night or total)',
    travelCosts: 'Travel Costs',
    kmOutbound: 'Kilometers Outbound',
    kmInbound: 'Kilometers Return',
    tollFees: 'Toll Fees (€)'
  },
  times: {
    arrival: 'Arrival',
    work: 'Work',
    departure: 'Departure', 
    startTime: 'Start Time',
    endTime: 'End Time',
    date: 'Date',
    selectDate: 'Select date'
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
  report: {
    tab: 'Report',
    day: 'Day {{n}}',
    dayCounter: 'Day {{current}}/{{total}}',
    dayWithDate: '{{date}}',
    placeholder: 'Report for {{label}}',
    save: 'Save',
    prev: 'Previous day',
    next: 'Next day',
    saved: 'Report saved',
    trimTitle: 'Reduce days?',
    trimBody: 'Reports for days {{from}}–{{to}} will be deleted. Continue?',
    cancel: 'Cancel',
    confirm: 'Continue'
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
    report: 'Arbeitsbericht',
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
    hotelPrice: 'Hotel Preis (pro Nacht oder gesamt)',
    travelCosts: 'Reisekosten',
    kmOutbound: 'Kilometer Hinfahrt',
    kmInbound: 'Kilometer Rückfahrt',
    tollFees: 'Mautgebühren (€)'
  },
  times: {
    arrival: 'Anreise',
    work: 'Arbeit', 
    departure: 'Abreise',
    startTime: 'Start Zeit',
    endTime: 'Ende Zeit',
    date: 'Datum',
    selectDate: 'Datum wählen'
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
  report: {
    tab: 'Report',
    day: 'Tag {{n}}',
    dayCounter: 'Tag {{current}}/{{total}}',
    dayWithDate: '{{date}}',
    placeholder: 'Report für {{label}}',
    save: 'Speichern',
    prev: 'Vorheriger Tag',
    next: 'Nächster Tag',
    saved: 'Report gespeichert',
    trimTitle: 'Tage reduzieren?',
    trimBody: 'Es werden Reports für die Tage {{from}}–{{to}} dauerhaft gelöscht. Fortfahren?',
    cancel: 'Abbrechen',
    confirm: 'Fortfahren'
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
      hotelData: 'Hotel Data',
      travel: 'Travel',
      report: 'Report',
      
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
      userProfile: 'User Profile',
      emailSendSettings: 'Email Send Settings',
      defaultRecipient: 'Default Recipient (TO)',
      emailSeparatorNote: 'Separate multiple addresses with comma or semicolon',
      emailNote: 'The email will be sent from your mail app. You control the sender account in your mail app.',
      note: 'Note',
      languageNote: 'Language changes immediately and applies across the app.',
      
      // Form Labels
      name: 'Name',
      homeAddress: 'Home address',
      email: 'Email',
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
       
       // Time format
       hoursShort: 'h',
       minutesShort: 'min',
      
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
      
      // GPS Tracking
      startTracking: 'Start Tracking',
      stopTracking: 'Stop Tracking',
      trackingCouldNotStart: 'Tracking could not be started:',
      
      // Export
      excelExport: 'Excel Export',
      exportAll: 'All',
      totalJobs: 'Total:',
      activeJobsStats: 'Active:',
      openJobsStats: 'Open:',
      completedJobsStats: 'Completed:',
      exporting: 'Exporting...',
      exportExcel: 'Export Excel',
      jobsCount: 'jobs',
      exportHistory: 'Export History',
      noExportsCreated: 'No exports created yet',
      exportHistoryWillShow: 'Your export history will be shown here',
      exportInformation: 'Export Information',
      excelFormat: 'Excel Format',
      exportedAsXlsx: 'Exported as .xlsx file with formatted tables',
      emailIntegration: 'Email Integration',
      directForwarding: 'Direct forwarding to your preferred email app',
      localStoragePath: 'Local Storage Path',
      selectedFolder: 'Selected Folder',
      permissionLost: 'Permission lost',
      testWrite: 'Test write',
      clearSelection: 'Clear selection',
      noFolderSelected: 'No folder selected',
      selectingFolder: 'Selecting folder...',
      selectFolder: 'Select folder',
      selectInNewTab: 'Select in new tab',
      pdfSettings: 'PDF Settings',
      pdfQuality: 'PDF Quality',
      preferredEmailApp: 'Preferred Email Application',
      selectEmailProvider: 'Select Email Provider',
      sendTestEmail: 'Send Test Email',
      testing: 'Testing...',
      test: 'Test',
      emailClientLimitation: 'Installed desktop programs cannot be automatically detected in the browser. The selection opens web-based email clients or the system default program.',
      
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
      supportedFormatsCsvOnly: 'Supported formats: .csv only',
      supportedFormatsAll: 'Supported formats: .xlsx, .xls, .csv', 
      maxFileSize: 'Maximum file size: 10 MB',
      excelImport: 'Excel Import',
      excelImportDescription: 'Upload Excel files to import job data',
      selectExcelFile: 'Select Excel file',
      uploading: 'Uploading...',
      pleaseSelectExcelFile: 'Please select an Excel file (.xlsx or .xls)',
      
      // Import warnings and messages
      'import.xlsxDisabledCsvAvailable': 'XLSX import is disabled. Only CSV files are accepted.',
      'import.xlsxBlocked': 'XLSX files are not allowed when XLSX import is disabled.',
      
      // Export Settings Messages - Toast Messages
      exportPathSet: 'Export path set:',
      clickButtonDirectly: 'Please click the button directly (no automatic actions).',
      browserNotSupportFolder: 'Your browser does not support folder selection.',
      popupsBlocked: 'Pop-ups were blocked. Please allow pop-ups and try again.',
      folderSelectionFailed: 'Folder selection failed',
      folderSelectionError: 'Error in folder selection',
      unknownError: 'An unknown error occurred.',
      popupBlocked: 'Pop-up blocked',
      allowPopups: 'Please allow pop-ups for this page and try again.',
      newTabOpened: 'New tab opened',
      clickStartFolder: 'Please click on "Start folder selection" there.',
      testWriteSuccess: 'Test write successful',
      fileCreatedSuccessfully: 'File "{fileName}" was created successfully.',
      testWriteFailed: 'Test write failed',
      unknownWriteError: 'Unknown error writing test file',
      permissionValid: 'Permission valid',
      folderAccessStillAllowed: 'Access to the folder is still allowed.',
      folderAccessRevoked: 'Access to the folder has been revoked. Please select the folder again.',
      permissionCheckError: 'Error in permission check',
      permissionStatusNotChecked: 'Permission status could not be checked.',
      selectionCleared: 'Selection cleared',
      folderSelectionRemoved: 'Folder selection was removed.',
      emailAppOpened: 'Email app opened',
      composeWindowOpened: 'Compose window was opened successfully',
      popupBlockedEmail: 'Popup blocked',
      allowPopupsForEmail: 'Please allow popups for this page and try again',
      emailAppError: 'Error opening email app',
      emailAppNotOpened: 'Email app could not be opened',
      
      // Export Settings - Alert Messages
      permissionLostBadge: '(lost)',
      browserNotSupportFolderAlert: 'Your browser does not support folder selection. The default download folder will be used.',
      folderEmbeddedAlert: 'Folder selection not possible in embedded window. Use "Select in new tab" or "Select folder" (opens new tab).',
      androidFolderAlert: 'Select a folder for export. The app uses Android Storage Access Framework (SAF) for secure file access.',
      noFolderInfo: 'If no folder is selected, the default download folder will be used.',
      standardDownloadInfo: 'Excel files will be saved in your default download folder.',
      pdfQualityInfo: 'Higher quality = larger files. 60% is a good compromise between quality and file size.',
      selectOption: 'Select option',
      success: 'Success',
      
      // Holiday Settings
      holidaysAndCalendar: 'Holidays & Calendar',
      selectCountry: 'Select country',
      selectCountryPlaceholder: 'Select country',
      regionState: 'Region/State',
      selectRegion: 'Select region',
      timezone: 'Timezone',
      selectTimezone: 'Select timezone',
      currentTimezone: 'Current timezone:',
      ownCalendarsICS: 'Own calendars (ICS)',
      loading: 'Loading...',
      addCalendar: 'Add calendar',
      activeCalendars: 'Active calendars',
      appointments: 'appointments',
      calendarAdded: 'Calendar added',
      calendarImportedSuccess: '{name} was successfully imported',
      errorImportingICS: 'Error importing ICS file',
      calendarRemoved: 'Calendar removed',
      calendarRemovedSuccess: 'The calendar was successfully removed',
      holidayExplanation: 'Holidays differ by country/region. Custom ICS calendars are additionally considered. ICS calendars take precedence over standard holidays.',
      
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
      
      // Job Entry Form Messages
      userNotLoggedIn: 'User not logged in - please log in',
      successfullySaved: 'Successfully saved',
      jobDataSaved: 'Job data was saved. You can add more data.',
      jobCompleted: 'Job was completed successfully!',
      errorSaving: 'Error saving the data',
      newJobStarted: 'New job form started',
      saveCustomerFirst: 'Save customer first',
      saveCustomerFirstDesc: 'Please save the customer data first',
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
      time: 'Time',
      hotelNameOptional: 'Hotel name (optional)',
      hotelAddress: 'Hotel address',
      hotelNights: 'Hotel nights',
      hotelPrice: 'Hotel price',
      kmOutbound: 'KM outbound',
      kmReturn: 'KM return',
      tollAmountNok: 'Toll (NOK)',
      travelPerDay: 'Travel per Day',
      travelThere: 'Travel There (km)',
      travelBack: 'Travel Back (km)',
      tollsNorwegian: 'Tolls / Bom (NOK)',
      back: 'Back',
      newJob: 'New job',
      saveCustomer: 'Save customer',
      saveAndContinue: 'Save & Continue',
      completeJob: 'Complete job',
      plannedDaysLabel: 'Planned duration (days)',
      now: 'Now',
      customerSavedGoMachineTitle: 'Continue to machine',
      customerSavedGoMachineDesc: 'Customer saved! Now enter machine data.',
      'errorLoadingJob': 'Error loading job data',
      jobEditing: 'Job is being edited',
      jobIdShort: 'ID',
      editJob: 'Edit Job',
      
      // Job Edit Dialog
      editAllJobData: 'Edit all job data',
      evaticNumber: 'EVATIC number',
      evaticPlaceholder: 'EVATIC number (if available)',
      hotelOvernight: 'Hotel & Overnight',
      travelCosts: 'Travel costs',
      tollFees: 'Toll fees (€)',
      manufacturerPlaceholder: 'e.g. Siemens, ABB, Schneider',
      modelType: 'Model/Type',
      modelPlaceholder: 'e.g. S7-1200, CP1E',
      serialPlaceholder: 'Serial number of the machine/system',
      workReport: 'Work report',
      workReportPlaceholder: 'Detailed description of performed work...',
      estimatedDays: 'Estimated days',
      currentDay: 'Current day',
      totalTimeCalculated: 'Total time calculated automatically: Travel + Work time + Departure for all days',
      dailyTimes: 'Daily times',
      
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
      hotelData: 'Hotel-Daten',
      travel: 'Reise',
      report: 'Bericht',
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
      userProfile: 'Benutzerprofil',
      emailSendSettings: 'E-Mail-Versand Einstellungen',
      defaultRecipient: 'Standard-Empfänger (TO)',
      emailSeparatorNote: 'Mehrere Adressen durch Komma oder Semikolon trennen',
      emailNote: 'Die E-Mail wird aus Ihrer Mail-App gesendet. Das Absender-Konto steuern Sie in der Mail-App.',
      note: 'Hinweis',
      languageNote: 'Die Sprache wird sofort geändert und gilt in der gesamten App.',
      
       // Form Labels
       name: 'Name',
       homeAddress: 'Wohnadresse',
       email: 'E-Mail',
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
       hoursMinimum: 'Stunden bezahlt, auch wenn Sie weniger arbeiten. Alle Stunden über 8 Stunden sind Überstunden mit Zuschlag.',
       
       // Time format
       hoursShort: 'Std',
       minutesShort: 'Min',
      
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
      
      // GPS Tracking
      startTracking: 'Tracking starten',
      stopTracking: 'Tracking stoppen',
      trackingCouldNotStart: 'Tracking konnte nicht gestartet werden:',
      
      // Export
      excelExport: 'Excel Export',
      exportAll: 'Alle',
      totalJobs: 'Gesamt:',
      activeJobsStats: 'Aktive:',
      openJobsStats: 'Offene:',
      completedJobsStats: 'Abgeschlossen:',
      exporting: 'Exportiere...',
      exportExcel: 'Excel exportieren',
      jobsCount: 'Aufträge',
      exportHistory: 'Export-Verlauf',
      noExportsCreated: 'Noch keine Exports erstellt',
      exportHistoryWillShow: 'Deine Export-Historie wird hier angezeigt',
      exportInformation: 'Export-Informationen',
      excelFormat: 'Excel-Format',
      exportedAsXlsx: 'Exportiert als .xlsx Datei mit formatierten Tabellen',
      emailIntegration: 'E-Mail Integration',
      directForwarding: 'Direkte Weiterleitung an deine bevorzugte E-Mail-App',
      localStoragePath: 'Lokaler Speicherpfad',
      selectedFolder: 'Gewählter Ordner',
      permissionLost: 'Berechtigung verloren',
      testWrite: 'Test schreiben',
      clearSelection: 'Auswahl löschen',
      noFolderSelected: 'Kein Ordner ausgewählt',
      selectingFolder: 'Wähle Ordner...',
      selectFolder: 'Ordner wählen',
      selectInNewTab: 'In neuem Tab wählen',
      pdfSettings: 'PDF-Einstellungen',
      pdfQuality: 'PDF-Qualität',
      preferredEmailApp: 'Bevorzugte E-Mail-Anwendung',
      selectEmailProvider: 'E-Mail-Provider auswählen',
      sendTestEmail: 'Test E-Mail senden',
      testing: 'Teste...',
      test: 'Testen',
      emailClientLimitation: 'Installierte Desktop-Programme können im Browser nicht automatisch erkannt werden. Die Auswahl öffnet Web-basierte E-Mail-Clients oder das System-Standard-Programm.',
      
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
      supportedFormatsCsvOnly: 'Unterstützte Formate: nur .csv',
      supportedFormatsAll: 'Unterstützte Formate: .xlsx, .xls, .csv',
      maxFileSize: 'Maximale Dateigröße: 10 MB',
      excelImport: 'Excel Import',
      excelImportDescription: 'Laden Sie Excel-Dateien hoch um Auftragsdaten zu importieren',
      selectExcelFile: 'Excel-Datei auswählen',
      uploading: 'Wird hochgeladen...',
      pleaseSelectExcelFile: 'Bitte wählen Sie eine Excel-Datei (.xlsx oder .xls)',
      
      // Import warnings and messages
      'import.xlsxDisabledCsvAvailable': 'XLSX-Import ist deaktiviert. Nur CSV-Dateien werden akzeptiert.',
      'import.xlsxBlocked': 'XLSX-Dateien sind nicht erlaubt wenn XLSX-Import deaktiviert ist.',
      
      // Export Settings Messages - Toast Messages
      exportPathSet: 'Exportpfad gesetzt:',
      clickButtonDirectly: 'Bitte klicken Sie den Button direkt an (keine automatischen Aktionen).',
      browserNotSupportFolder: 'Ihr Browser unterstützt die Ordnerauswahl nicht.',
      popupsBlocked: 'Pop-ups wurden blockiert. Bitte erlauben Sie Pop-ups und versuchen Sie es erneut.',
      folderSelectionFailed: 'Ordnerauswahl fehlgeschlagen',
      folderSelectionError: 'Fehler bei Ordnerauswahl',
      unknownError: 'Ein unbekannter Fehler ist aufgetreten.',
      popupBlocked: 'Pop-up blockiert',
      allowPopups: 'Bitte erlauben Sie Pop-ups für diese Seite und versuchen Sie es erneut.',
      newTabOpened: 'Neuer Tab geöffnet',
      clickStartFolder: 'Bitte klicken Sie dort auf "Ordnerauswahl starten".',
      testWriteSuccess: 'Testschreibung erfolgreich',
      fileCreatedSuccessfully: 'Datei "{fileName}" wurde erfolgreich erstellt.',
      testWriteFailed: 'Testschreibung fehlgeschlagen',
      unknownWriteError: 'Unbekannter Fehler beim Schreiben der Testdatei',
      permissionValid: 'Berechtigung gültig',
      folderAccessStillAllowed: 'Zugriff auf den Ordner ist weiterhin erlaubt.',
      folderAccessRevoked: 'Zugriff auf den Ordner wurde entzogen. Bitte wählen Sie den Ordner erneut.',
      permissionCheckError: 'Fehler bei Berechtigungsprüfung',
      permissionStatusNotChecked: 'Berechtigungsstatus konnte nicht überprüft werden.',
      selectionCleared: 'Auswahl gelöscht',
      folderSelectionRemoved: 'Ordnerauswahl wurde entfernt.',
      emailAppOpened: 'E-Mail-App geöffnet',
      composeWindowOpened: 'Compose-Fenster wurde erfolgreich geöffnet',
      popupBlockedEmail: 'Popup blockiert',
      allowPopupsForEmail: 'Bitte erlauben Sie Popups für diese Seite und versuchen Sie es erneut',
      emailAppError: 'Fehler beim Öffnen der E-Mail-App',
      emailAppNotOpened: 'E-Mail-App konnte nicht geöffnet werden',
      
      // Export Settings - Alert Messages
      permissionLostBadge: '(verloren)',
      browserNotSupportFolderAlert: 'Ihr Browser unterstützt die Ordner-Auswahl nicht. Es wird der Standard-Download-Ordner verwendet.',
      folderEmbeddedAlert: 'Ordnerauswahl im eingebetteten Fenster nicht möglich. Verwenden Sie "In neuem Tab wählen" oder "Ordner wählen" (öffnet neuen Tab).',
      androidFolderAlert: 'Wählen Sie einen Ordner für den Export. Die App verwendet den Android Storage Access Framework (SAF) für sicheren Dateizugriff.',
      noFolderInfo: 'Wenn kein Ordner gewählt ist, wird der Standard-Download-Ordner verwendet.',
      standardDownloadInfo: 'Excel-Dateien werden in Ihrem Standard-Download-Ordner gespeichert.',
      pdfQualityInfo: 'Höhere Qualität = größere Dateien. 60% ist ein guter Kompromiss zwischen Qualität und Dateigröße.',
      selectOption: 'Option wählen',
      success: 'Erfolgreich',
      
      // Holiday Settings
      holidaysAndCalendar: 'Feiertage & Kalender',
      selectCountry: 'Land auswählen',
      selectCountryPlaceholder: 'Land auswählen',
      regionState: 'Region/Bundesland',
      selectRegion: 'Region auswählen',
      timezone: 'Zeitzone',
      selectTimezone: 'Zeitzone auswählen',
      currentTimezone: 'Aktuelle Zeitzone:',
      ownCalendarsICS: 'Eigene Kalender (ICS)',
      loading: 'Lade...',
      addCalendar: 'Kalender hinzufügen',
      activeCalendars: 'Aktivierte Kalender',
      appointments: 'Termine',
      calendarAdded: 'Kalender hinzugefügt',
      calendarImportedSuccess: '{name} wurde erfolgreich importiert',
      errorImportingICS: 'Fehler beim Importieren der ICS-Datei',
      calendarRemoved: 'Kalender entfernt',
      calendarRemovedSuccess: 'Der Kalender wurde erfolgreich entfernt',
      holidayExplanation: 'Feiertage unterscheiden sich je nach Land/Region. Eigene ICS-Kalender werden zusätzlich berücksichtigt. ICS-Kalender haben Vorrang vor den Standard-Feiertagen.',
      
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
      
      // Job Entry Form Messages
      userNotLoggedIn: 'Benutzer nicht angemeldet - bitte melde dich an',
      successfullySaved: 'Erfolgreich gespeichert',
      jobDataSaved: 'Job-Daten wurden gespeichert. Du kannst weitere Daten hinzufügen.',
      jobCompleted: 'Job wurde vollständig abgeschlossen!',
      errorSaving: 'Fehler beim Speichern der Daten',
      newJobStarted: 'Neues Job-Formular gestartet',
      saveCustomerFirst: 'Erst Kunde speichern',
      saveCustomerFirstDesc: 'Bitte speichere zuerst die Kundendaten',
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
      time: 'Zeit',
      hotelNameOptional: 'Hotel Name (optional)',
      hotelAddress: 'Hotel Adresse',
      hotelNights: 'Hotelnächte',
      hotelPrice: 'Hotel Preis',
      kmOutbound: 'KM Hinfahrt',
      kmReturn: 'KM Rückfahrt',
      tollAmountNok: 'Maut (NOK)',
      travelPerDay: 'Reise pro Tag',
      travelThere: 'Hinfahrt (km)',
      travelBack: 'Rückfahrt (km)',
      tollsNorwegian: 'Maut / Bom (NOK)',
      back: 'Zurück',
      newJob: 'Neuer Job',
      saveCustomer: 'Kunde Speichern',
      saveAndContinue: 'Speichern & Weiter',
      completeJob: 'Job Abschließen',
      next: 'Weiter',
      plannedDaysLabel: 'Geplante Dauer (Tage)',
      now: 'Jetzt',
      customerSavedGoMachineTitle: 'Weiter zur Maschine',
      customerSavedGoMachineDesc: 'Kunde gespeichert! Jetzt Maschinendaten eingeben.',
      saveJobFirst: 'Bitte speichern Sie zuerst den Job, um auf diesen Bereich zugreifen zu können',
      'errorLoadingJob': 'Fehler beim Laden der Jobdaten',
      jobEditing: 'Job wird bearbeitet',
      jobIdShort: 'ID',
      editJob: 'Auftrag bearbeiten',
      
      // Job Edit Dialog
      editAllJobData: 'Alle Auftragsdaten bearbeiten',
      evaticNumber: 'EVATIC-Nummer',
      evaticPlaceholder: 'EVATIC-Nummer (falls vorhanden)',
      hotelOvernight: 'Hotel & Übernachtung',
      travelCosts: 'Reisekosten',
      tollFees: 'Mautgebühren (€)',
      manufacturerPlaceholder: 'z.B. Siemens, ABB, Schneider',
      modelType: 'Modell/Typ',
      modelPlaceholder: 'z.B. S7-1200, CP1E',
      serialPlaceholder: 'Seriennummer der Maschine/Anlage',
      workReport: 'Arbeitsbericht',
      workReportPlaceholder: 'Detaillierte Beschreibung der durchgeführten Arbeiten...',
      estimatedDays: 'Geschätzte Tage',
      currentDay: 'Aktueller Tag',
      totalTimeCalculated: 'Gesamtzeit wird automatisch berechnet: Anreise + Arbeitszeit + Abreise für alle Tage',
      dailyTimes: 'Tägliche Zeiten',
      
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
      
      // GPS tracking specific translations
      gpsTracking: {
        tracking: {
          title: 'GPS-Strecken-Aufzeichnung',
          description: 'GPS-Punkte aufzeichnen um tägliche Strecken mit Entfernungsberechnung zu erstellen.',
          toggle: 'Aufzeichnung aktivieren',
          toggleDescription: 'GPS-Punkte während Aktivität aufzeichnen',
          active: 'Aktiv',
          starting: 'Startet...',
          stopped: 'Gestoppt',
          error: 'Fehler'
        },
        stats: {
          pointsToday: 'Punkte heute',
          distanceToday: 'Strecke heute'
        },
        export: {
          title: 'Heutige Strecke exportieren',
          gpx: 'GPX exportieren',
          geojson: 'GeoJSON exportieren',
          success: 'Export erfolgreich',
          error: 'Export fehlgeschlagen',
          gpxDownloaded: 'GPX-Datei heruntergeladen',
          geojsonDownloaded: 'GeoJSON-Datei heruntergeladen',
          failed: 'Strecken-Export fehlgeschlagen',
          noDataToExport: 'Keine GPS-Daten für heute aufgezeichnet'
        },
        cleanup: {
          button: 'Alte Strecken löschen',
          confirmTitle: 'Alte Strecken löschen?',
          confirmDescription: 'Dies löscht alle GPS-Strecken älter als 60 Tage. Diese Aktion kann nicht rückgängig gemacht werden.',
          confirm: 'Löschen',
          success: 'Aufräumen erfolgreich',
          error: 'Aufräumen fehlgeschlagen',
          failed: 'Alte Strecken konnten nicht gelöscht werden',
          deletedCount: '{{count}} alte Strecken gelöscht',
          description: 'Entfernt automatisch Strecken älter als 60 Tage'
        },
        maintenance: {
          title: 'Wartung'
        },
        backgroundMode: {
          info: 'Hintergrund-Tracking benötigt zusätzliche Berechtigungen auf Android-Geräten.'
        }
      },
      
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
      // Tabs / Navigation
      customer: "Kunde",
      machine: "Maskin", 
      timesTab: "Tider",
      overtime: "Overtid",
      finish: "Ferdig",
      reports: "Rapporter",

      // Common
      save: "Lagre",
      cancel: "Avbryt",
      close: "Lukk",
      delete: "Slett",
      edit: "Rediger",
      dashboard: "Dashboard",
      yes: "Ja",
      no: "Nei",
      loading: "Laster …",

      // Finish / Report-Ansicht (bestehende Flat-Keys beibehalten!)
      finishTitle: "Fullfør oppdrag",
      reportLabel: "Arbeidsrapport",
      btnSavePdf: "Lagre PDF",
      btnEmail: "E-post",
      btnPreview: "Forhåndsvisning",
      btnDashboard: "Dashboard",
      shareSupported: "Deling støttes",

      // Report (Tagesberichte)
      report_day: "Dag",
      report_date: "Dato", 
      report_editor_placeholder: "Beskriv arbeidet for denne dagen …",
      report_save: "Lagre rapport",
      report_prev: "Forrige",
      report_next: "Neste",
      report_concat_heading: "Arbeidsrapport",
      report_concat_no_entries: "Ingen rapporter er lagret.",

      // Standardized component keys
      report: {
        tab: "Rapport",
        day: "Dag {{n}}",
        dayCounter: "Dag {{current}}/{{total}}",
        dayWithDate: "{{date}}",
        placeholder: "Rapport for {{label}}",
        save: "Lagre",
        prev: "Forrige dag",
        next: "Neste dag",
        saved: "Rapport lagret",
        trimTitle: "Reduser dager?",
        trimBody: "Rapporter for dagene {{from}}–{{to}} blir slettet. Fortsette?",
        cancel: "Avbryt",
        confirm: "Fortsett"
      },

      // Navigation and Basic UI
      newJob: "Ny jobb",
      editJob: "Rediger jobb",
      location: "GPS", 
      export: "Eksport",

      // Times
      times: {
        arrival: "Reise",
        work: "Arbeid", 
        departure: "Avreise",
        startTime: "Start",
        endTime: "Slutt",
        date: "Dato",
        selectDate: "Velg dato"
      },

      // Job Entry Form - Customer Data
      customerData: "Kundedata",
      customerName: "Kundenavn",
      customerAddress: "Kundeadresse",
      required: "Påkrevd",

      // Job Entry Form - Machine Data  
      machineData: "Maskindata",
      manufacturer: "Produsent",
      model: "Modell",
      serialNumber: "Serienummer",
      evaticNo: "Evatic Nr",
      evaticNumber: "EVATIC-nummer",

      // Job Entry Form - Travel & Stay
      travelAndStay: "Reise & opphold",
      hotelNameOptional: "Hotellnavn (valgfritt)",
      hotelAddress: "Hotelladresse",
      kmOutbound: "KM utreise", 
      kmReturn: "KM retur",

      // Times/Zeiten
      timesTitle: "Tider",
      travelStart: "Reise start",
      travelEnd: "Reise slutt", 
      workStart: "Arbeid start",
      workEnd: "Arbeid slutt",
      departureStart: "Hjemreise start",
      departureEnd: "Hjemreise slutt",
      date: "Dato",
      type: "Type",
      from: "Fra",
      to: "Til",
      break: "Pause",
      duration: "Varighet",
      note: "Notat",
      totalHours: "Sum timer",
      regular: "Regulær",
      overtime50: "Overtid 50%",
      overtime100: "Overtid 100%",

      // Job Actions
      back: "Tilbake",
      next: "Neste",
      saveCustomer: "Lagre kunde",
      completeJob: "Fullfør jobb",
      plannedDaysLabel: "Planlagt varighet (dager)",
      now: "Nå",

      // Job Status Messages
      customerSavedGoMachineTitle: "Fortsett til maskin",
      customerSavedGoMachineDesc: "Kunde lagret! Nå legg inn maskindata.",
      jobEditing: "Jobb redigeres",
      jobIdShort: "ID",
      addMoreData: "Du kan legge til mer data",

      // Job Details
      jobDetails: "Jobbdetaljer",
      jobDetailsDescription: "Informasjon om valgt jobb",
      status: "Status",
      startDate: "Startdato",
      days: "Dager",
      progress: "Fremdrift",

      // Job Header Fields (Report) - EINDEUTIGE KEYS
      createdAt: "Opprettet",
      jobId: "Jobb-ID", 
      client: "Kunde",
      address: "Adresse",
      workPerformed: "Utført arbeid",
      workPerformedPlaceholder: "Beskriv arbeidet som ble utført",
      hotelNights: "Hotellnetter", 
      hotelPrice: "Hotellpris",
      tollAmountNok: "Bompenger (NOK)",
      travelPerDay: "Reise per dag",
      travelThere: "Reise dit (km)",
      travelBack: "Hjemreise (km)",
      tollsNorwegian: "Bompenger (NOK)",

      // Dashboard specific
      startDateLabel: "Startdato",
      workTimes: "Arbeidstider",
      workStartLabel: "Start",
      workEndLabel: "Slutt",
      travelTime: "Reise",
      workTime: "Arbeid", 
      departureTime: "Avreise",
      total: "Totalt",
      daysLabel: "Dager",
      maxDaysReached: "⚠️ Maks. 7 dager nådd - Ny fil vil bli opprettet",
      sendReport: "Send rapport",

      // Toast messages
      saved: "Lagret",
      timeEntriesSaved: "Tidsregistreringer har blitt lagret",
      error: "Feil",
      errorSavingEntries: "Feil ved lagring av tidsregistreringer",
      statusChanged: "Status endret", 
      jobStarted: "startet",
      jobPaused: "pausert",
      errorChangingStatus: "Feil ved endring av jobbstatus",
      jobDeleted: "Jobb slettet",
      jobDeletedSuccess: "Jobben ble slettet",
      errorDeletingJob: "Feil ved sletting av jobb",
      deleteConfirm: "Vil du virkelig slette denne jobben? Denne handlingen kan ikke angres.",
      workTripStarted: "Arbeidsreise startet",
      newJobDescription: "Du kan nå opprette en ny jobb",
      privateTrip: "Privat reise",
      privateTripDescription: "Ha det gøy med dine private aktiviteter!",

      // Overtime Rules
      overtimeRules: "Overtidsregler:",
      rule8to12: "• 8-12 timer: 50% tillegg på overtid",
      ruleOver12: "• Over 12 timer: 100% tillegg på overtid", 
      weekendRules: "Helgeregler:",
      payment: "• Betaling: Minst garanterte timer + overtidstillegg",

      // Job (Auftrag bearbeiten / Report Tab)
      job: {
        dialogTitle: "Rediger jobb",
        subtitle: "Rediger alle jobbdata",
        tabs: {
          customer: "Kunde",
          machine: "Maskin",
          timesTab: "Tider",
          overtime: "Overtid",
          report: "Rapport",
          finish: "Ferdig"
        },
        customer: {
          name: "Kundenavn",
          namePlaceholder: "Navn på kunden",
          address: "Kundeadresse",
          addressPlaceholder: "Full adresse til kunden",
          evatic: "EVATIC-nummer",
          evaticPlaceholder: "EVATIC-nummer (hvis tilgjengelig)",
          hotelSection: "Hotell & Overnatting",
          hotelName: "Hotellnavn",
          hotelNamePlaceholder: "Navn på hotellet",
          hotelAddress: "Hotelladresse",
          hotelAddressPlaceholder: "Adresse til hotellet",
          hotelNights: "Antall netter",
          hotelPrice: "Hotellpris",
          travelCosts: "Reisekostnader",
          kmOutbound: "Kilometer utreise",
          kmInbound: "Kilometer hjemreise",
          tollFees: "Bomavgifter (€)"
        },
        machine: {
          manufacturer: "Produsent",
          manufacturerPlaceholder: "f.eks. Siemens, ABB, Schneider",
          model: "Modell/Type",
          modelPlaceholder: "f.eks. S7-1200, CP1E",
          serialNumber: "Serienummer",
          serialPlaceholder: "Serienummer på maskinen/anlegget",
          workPerformed: "Arbeid som skal utføres",
          workPerformedPlaceholder: "Beskriv arbeidet som skal utføres..."
        },
        report: {
          tab: "Rapport",
          day: "Dag {{n}}",
          dayCounter: "Dag {{current}}/{{total}}",
          dayWithDate: "{{date}}",
          placeholder: "Rapport for {{label}}",
          save: "Lagre",
          prev: "Forrige dag",
          next: "Neste dag",
          saved: "Rapport lagret",
          trimTitle: "Reduser dager?",
          trimBody: "Rapporter for dagene {{from}}–{{to}} blir slettet. Fortsette?",
          cancel: "Avbryt",
          confirm: "Fortsett"
        },
        finish: {
          title: "Fullfør oppdrag",
          reportLabel: "Arbeidsrapport",
          reportPlaceholder: "Beskriv arbeidet som ble utført, funn, materialer brukt, etc...",
          btnSaveReport: "Lagre arbeidsrapport",
          btnPreview: "Forhåndsvisning",
          btnEmail: "Send på e-post",
          btnDashboard: "Dashboard"
        },
        buttons: {
          save: "Lagre",
          cancel: "Avbryt"
        }
      },

      // Settings Übersetzungen
      settings: "Innstillinger",
      settingsTitle: "Innstillinger",
      userProfile: "Brukerprofil",
      displayName: "Visningsnavn",
      displayNamePlaceholder: "Skriv inn visningsnavnet ditt",
      timezone: "Tidssone",
      selectTimezone: "Velg tidssone",

      // Language Settings
      appLanguage: "Appspråk",
      uiLanguage: "Grensesnittspråk",
      languageNote: "Språkendringer trer i kraft umiddelbart",

      // Export Settings
      exportSettings: "Eksportinnstillinger",
      localStoragePath: "Lokal lagringsbane",
      selectedFolder: "Valgt mappe",
      selectFolder: "Velg mappe",
      selectInNewTab: "Velg i ny fane",
      noFolderSelected: "Ingen mappe valgt",
      selectingFolder: "Velger mappe...",
      clearSelection: "Tøm valg",
      testWrite: "Test skriving",
      testing: "Tester...",
      test: "Test",
      pdfSettings: "PDF-innstillinger",
      pdfQuality: "PDF-kvalitet",
      pdfQualityInfo: "Høyere kvalitet gir større filer. 60% anbefales for beste balanse.",
      directorySettings: "Mappeinnstillinger",
      exportDirectory: "Eksportmappe",
      selectDirectory: "Velg mappe",
      emailSettings: "E-postinnstillinger",
      preferredEmailProvider: "Foretrukket e-postleverandør",
      preferredEmailApp: "Foretrukket e-postapp",
      selectEmailProvider: "Velg e-postleverandør",
      selectOption: "Velg alternativ",
      emailClientLimitation: "E-postklienter kan ha begrensninger på vedleggsstørrelse og antall.",
      testEmailButton: "Test e-post",
      testEmailSuccess: "Test-e-post åpnet!",
      testEmailError: "Kunne ikke åpne e-postklient",
      
      // Folder Selection Messages
      browserNotSupportFolderAlert: "Nettleseren din støtter ikke mappevalg. Filer vil bli lastet ned til standard nedlastingsmappe.",
      folderEmbeddedAlert: "Mappevalg fungerer ikke i innebygd modus. Bruk 'Velg i ny fane' eller åpne appen direkte.",
      androidFolderAlert: "På Android kan du velge en mappe for eksport. Dette vil be om tilgang til den valgte mappen.",
      noFolderInfo: "Hvis ingen mappe er valgt, vil filer bli lastet ned til nettleserens standardmappe.",
      standardDownloadInfo: "Filer vil bli lastet ned til nettleserens standardmappe.",
      
      // Permission Status
      permissionLostBadge: "- tilgang tapt",
      
      // Toast Messages
      exportPathSet: "Eksportbane satt til:",
      clickButtonDirectly: "Vennligst klikk knappen direkte for å velge mappe.",
      browserNotSupportFolder: "Nettleseren din støtter ikke mappevalg.",
      popupsBlocked: "Popup-vinduer er blokkert. Vennligst tillat popup-vinduer.",
      folderSelectionFailed: "Mappevalg feilet",
      folderSelectionError: "Feil under mappevalg",
      unknownError: "Ukjent feil",
      popupBlocked: "Popup blokkert",
      allowPopups: "Vennligst tillat popup-vinduer for denne siden.",
      newTabOpened: "Ny fane åpnet",
      clickStartFolder: "Klikk 'Start mappevalg' i den nye fanen.",
      testWriteSuccess: "Skrivetest vellykket",
      fileCreatedSuccessfully: "Fil opprettet: {fileName}",
      testWriteFailed: "Skrivetest feilet",
      unknownWriteError: "Ukjent skrivefeil",
      permissionValid: "Tilgang gyldig",
      folderAccessStillAllowed: "Mappeadgang er fortsatt tillatt.",
      folderAccessRevoked: "Mappeadgang er trukket tilbake. Vennligst velg mappen på nytt.",
      permissionCheckError: "Feil ved kontroll av tilgang",
      permissionStatusNotChecked: "Kunne ikke kontrollere tilgangsstatus.",
      selectionCleared: "Valg tømt",
      folderSelectionRemoved: "Mappevalg fjernet.",
      emailAppOpened: "E-postapp åpnet",
      composeWindowOpened: "Skrivevindu åpnet i e-postklient.",
      popupBlockedEmail: "Popup blokkert for e-post",
      allowPopupsForEmail: "Vennligst tillat popup-vinduer for å åpne e-postklient.",
      emailAppError: "E-postapp-feil",
      emailAppNotOpened: "Kunne ikke åpne e-postapp.",

      // Overtime Settings
      overtimeSettingsTitle: "Overtidsinnstillinger",
      overtimeSettingsSaved: "Overtidsinnstillinger lagret!",
      hourBasedOvertime: "Timebasert overtid",
      firstOvertimeThreshold: "Første overtidsgrense (timer)",
      firstOvertimeRate: "Første overtidssats (%)",
      secondOvertimeThreshold: "Andre overtidsgrense (timer)",
      secondOvertimeRate: "Andre overtidssats (%)",
      weekendSettings: "Helgeinnstillinger",
      enableWeekendOvertime: "Aktiver helgeovertid",
      saturdayRate: "Lørdagssats (%)",
      sundayRate: "Søndagssats (%)",
      guaranteedHours: "Garanterte timer",
      guaranteedHoursNote: "Minimum timer som alltid blir betalt",

      // Holiday Settings
      holidaySettings: "Ferieinnstillinger",
      holidayCountry: "Land",
      holidayRegion: "Region",
      selectCountry: "Velg land",
      selectRegion: "Velg region",
      customHolidays: "Tilpassede ferier",
      addCustomHoliday: "Legg til tilpasset ferie",
      customHolidayName: "Ferienavn",
      customHolidayNamePlaceholder: "f.eks. Bedriftsferie",
      icsCalendars: "ICS-kalendere",
      addIcsCalendar: "Legg til ICS-kalender",
      icsUrl: "ICS-URL",
      icsUrlPlaceholder: "https://example.com/calendar.ics",
      icsName: "Kalendernavn",
      icsNamePlaceholder: "f.eks. Bedriftskalender",
      removeCalendar: "Fjern kalender",

      // Location Settings
      locationSettings: "Posisjonsinnstillinger", 
      gpsTracking: "GPS-sporing",
      enableGpsTracking: "Aktiver GPS-sporing",
      gpsTrackingNote: "Sporer posisjonen din automatisk under arbeid",
      homeLocation: "Hjemmelokasjon",
      setHomeLocation: "Angi hjemmelokasjon",
      homeLocationNote: "Brukes for å beregne reiseavstand",

      
      // General Settings
      gps: "GPS",
      holidays: "Ferier", 
      advanced: "Avansert",
      name: "Navn",
      homeAddress: "Hjemmeadresse",
      email: "E-post",
      emailSendSettings: "E-postsendingsinnstillinger",
      defaultRecipient: "Standard mottaker",
      emailSeparatorNote: "Skill flere e-postadresser med komma",
      emailNote: "E-postadressen din og standardmottakerne brukes for hurtig rapportdeling",
      saving: "Lagrer",
      advancedSettings: "Avanserte innstillinger",
      resetAppData: "Tilbakestill app-data",
      resetAppDescription: "Dette vil slette alle jobber, innstillinger og data permanent. Handlingen kan ikke angres.",
      deleteAppData: "Slett app-data"
    }
  }
};

// Support both 'no' and 'nb' by aliasing 'nb' to the Norwegian resources
const resourcesExtended: any = { ...resources, nb: (resources as any).no };

i18n
  .use(initReactI18next)
  .init({
    resources: resourcesExtended,
    lng: 'de', // Default to German
    fallbackLng: 'de',
    
    interpolation: {
      escapeValue: false
    }
  });

// Connect i18n to settings store for reactive language switching
const initializeLanguage = () => {
  const settingsStore = useSettingsStore.getState();
  const currentLocale = settingsStore.locale || 'de'; // Default to German
  
  if (i18n.language !== currentLocale) {
    i18n.changeLanguage(currentLocale);
  }
};

// Initialize language immediately
initializeLanguage();

// Subscribe to settings changes for live language switching
useSettingsStore.subscribe((state) => {
  if (i18n.language !== state.locale) {
    i18n.changeLanguage(state.locale || 'de');
  }
});

export default i18n;