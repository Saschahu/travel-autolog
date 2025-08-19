import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      newEntry: 'New Entry',
      newJob: 'New Job',
      location: 'Location',
      export: 'Export',
      gps: 'GPS',
      settings: 'Settings',
      
      // Tabs
      customer: 'Customer',
      machine: 'Machine',
      times: 'Times',
      overtime: 'Overtime',
      finish: 'Finish',
      profile: 'Profile',
      
      // Dashboard
      activeJobs: 'Active Jobs',
      completedJobs: 'Completed Jobs',
      totalHours: 'Total Hours',
      jobStatus: 'Job Status',
      customerName: 'Customer Name',
      startDate: 'Start Date',
      currentDay: 'Current Day',
      status: 'Status',
      active: 'Active',
      completed: 'Completed',
      pending: 'Pending',
      open: 'Open',
      start: 'Start',
      pause: 'Pause',
      
      // Job Entry Form
      addNewJob: 'Add New Job',
      estimatedDays: 'Estimated Days',
      workStart: 'Work Start',
      workEnd: 'Work End',
      travelStart: 'Travel Start',
      travelEnd: 'Travel End',
      departureStart: 'Departure Start',
      departureEnd: 'Departure End',
      totalTime: 'Total Time (Travel + Work)',
      addJob: 'Add Job',
      cancel: 'Cancel',
      day: 'Day',
      details: 'Details',
      edit: 'Edit',
      delete: 'Delete',
      
      // Quick Actions
      quickActions: 'Quick Actions',
      
      // Job Filter
      filterJobs: 'Filter Jobs...',
      openJobs: 'Open (to be processed)',
      activeJobsFilter: 'Active (currently in progress)',
      completedJobsFilter: 'Completed',
      completedSentJobs: 'Completed and Sent',
      allJobs: 'All Jobs',
      
      // GPS
      locationStatus: 'Location Status',
      gpsTracking: 'GPS Tracking',
      activeStatus: 'Active',
      inactive: 'Inactive',
      atHome: 'At Home',
      away: 'Away',
      currentLocation: 'Current Location',
      getGpsPosition: 'Get GPS Position',
      setAsHome: 'Set as Home',
      homeSettings: 'Home Settings',
      savedHome: 'Saved Home',
      radius: 'Radius (Meters)',
      manualSet: 'Manual Set',
      latitude: 'Latitude',
      longitude: 'Longitude',
      instructions: 'Instructions',
      
      // Settings
      userProfile: 'User Profile',
      name: 'Name',
      homeAddress: 'Home Address',
      preferredLanguage: 'Preferred Language',
      gpsSettings: 'GPS Settings',
      enableGps: 'Enable GPS',
      homeLocation: 'Home Location',
      save: 'Save',
      
      // Notifications
      locationLeft: 'Location Left',
      leftHomeMessage: 'You have left your home. Work or private?',
      work: 'Work',
      private: 'Private',
      locationUpdated: 'Location Updated',
      homeSet: 'Home Set',
      currentLocationSetAsHome: 'Current location has been set as home',
      trackingStarted: 'Tracking Started',
      trackingStopped: 'Tracking Stopped',
      error: 'Error',
      success: 'Success'
    }
  },
  de: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      newEntry: 'Neuer Eintrag',
      newJob: 'Neuer Job',
      location: 'Standort',
      export: 'Export',
      gps: 'GPS',
      settings: 'Einstellungen',
      
      // Tabs
      customer: 'Kunde',
      machine: 'Maschine',
      times: 'Zeiten',
      overtime: 'Überstunden',
      finish: 'Abschluss',
      profile: 'Profil',
      
      // Dashboard
      activeJobs: 'Aktive Aufträge',
      completedJobs: 'Abgeschlossene Aufträge',
      totalHours: 'Gesamtstunden',
      jobStatus: 'Auftragsstatus',
      customerName: 'Kundenname',
      startDate: 'Startdatum',
      currentDay: 'Aktueller Tag',
      status: 'Status',
      active: 'Aktiv',
      completed: 'Abgeschlossen',
      pending: 'Ausstehend',
      open: 'Offen',
      start: 'Starten',
      pause: 'Pausieren',
      
      // Job Entry Form
      addNewJob: 'Neuen Auftrag hinzufügen',
      estimatedDays: 'Geschätzte Tage',
      workStart: 'Arbeitsbeginn',
      workEnd: 'Arbeitsende',
      travelStart: 'Anreise Beginn',
      travelEnd: 'Anreise Ende',
      departureStart: 'Abreise Beginn',
      departureEnd: 'Abreise Ende',
      totalTime: 'Gesamtzeit (Reise + Arbeit)',
      addJob: 'Auftrag hinzufügen',
      cancel: 'Abbrechen',
      day: 'Tag',
      details: 'Details',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      
      // Quick Actions
      quickActions: 'Schnellaktionen',
      
      // Job Filter
      filterJobs: 'Aufträge filtern...',
      openJobs: 'Offene (noch abzuarbeiten)',
      activeJobsFilter: 'Aktive (gerade in Bearbeitung)',
      completedJobsFilter: 'Abgeschlossene',
      completedSentJobs: 'Abgeschlossene und gesendet',
      allJobs: 'Alle Aufträge',
      
      // GPS
      locationStatus: 'Standort Status',
      gpsTracking: 'GPS Verfolgung',
      activeStatus: 'Aktiv',
      inactive: 'Inaktiv',
      atHome: 'Zuhause',
      away: 'Unterwegs',
      currentLocation: 'Aktueller Standort',
      getGpsPosition: 'GPS Position abrufen',
      setAsHome: 'Als Zuhause setzen',
      homeSettings: 'Zuhause Einstellungen',
      savedHome: 'Gespeichertes Zuhause',
      radius: 'Radius (Meter)',
      manualSet: 'Manuell setzen',
      latitude: 'Breitengrad',
      longitude: 'Längengrad',
      instructions: 'Anleitung',
      
      // Settings
      userProfile: 'Nutzerprofil',
      name: 'Name',
      homeAddress: 'Hausadresse',
      preferredLanguage: 'Bevorzugte Sprache',
      gpsSettings: 'GPS Einstellungen',
      enableGps: 'GPS aktivieren',
      homeLocation: 'Heimatstandort',
      save: 'Speichern',
      
      // Notifications
      locationLeft: 'Standort verlassen',
      leftHomeMessage: 'Du hast dein Zuhause verlassen. Arbeit oder privat?',
      work: 'Arbeit',
      private: 'Privat',
      locationUpdated: 'Standort aktualisiert',
      homeSet: 'Zuhause gesetzt',
      currentLocationSetAsHome: 'Aktueller Standort wurde als Zuhause gespeichert',
      trackingStarted: 'Tracking gestartet',
      trackingStopped: 'Tracking gestoppt',
      error: 'Fehler',
      success: 'Erfolg'
    }
  },
  no: {
    translation: {
      // Navigation
      dashboard: 'Dashbord',
      newEntry: 'Ny Oppføring',
      newJob: 'Ny Jobb',
      location: 'Posisjon',
      export: 'Eksport',
      gps: 'GPS',
      settings: 'Innstillinger',
      
      // Tabs
      customer: 'Kunde',
      machine: 'Maskin',
      times: 'Tider',
      overtime: 'Overtid',
      finish: 'Ferdig',
      profile: 'Profil',
      
      // Dashboard
      activeJobs: 'Aktive Oppdrag',
      completedJobs: 'Fullførte Oppdrag',
      totalHours: 'Totale Timer',
      jobStatus: 'Oppdragsstatus',
      customerName: 'Kundenavn',
      startDate: 'Startdato',
      currentDay: 'Gjeldende Dag',
      status: 'Status',
      active: 'Aktiv',
      completed: 'Fullført',
      pending: 'Ventende',
      open: 'Åpen',
      start: 'Start',
      pause: 'Pause',
      
      // Job Entry Form
      addNewJob: 'Legg til Nytt Oppdrag',
      estimatedDays: 'Estimerte Dager',
      workStart: 'Arbeidsstart',
      workEnd: 'Arbeidsslutt',
      travelStart: 'Reise Start',
      travelEnd: 'Reise Slutt',
      departureStart: 'Avreise Start',
      departureEnd: 'Avreise Slutt',
      totalTime: 'Total Tid (Reise + Arbeid)',
      addJob: 'Legg til Oppdrag',
      cancel: 'Avbryt',
      day: 'Dag',
      details: 'Detaljer',
      edit: 'Rediger',
      delete: 'Slett',
      
      // Quick Actions
      quickActions: 'Hurtighandlinger',
      
      // Job Filter
      filterJobs: 'Filtrer Oppdrag...',
      openJobs: 'Åpne (til å behandles)',
      activeJobsFilter: 'Aktive (pågår nå)',
      completedJobsFilter: 'Fullførte',
      completedSentJobs: 'Fullførte og Sendt',
      allJobs: 'Alle Oppdrag',
      
      // GPS
      locationStatus: 'Posisjonsstatus',
      gpsTracking: 'GPS Sporing',
      activeStatus: 'Aktiv',
      inactive: 'Inaktiv',
      atHome: 'Hjemme',
      away: 'Borte',
      currentLocation: 'Nåværende Posisjon',
      getGpsPosition: 'Få GPS Posisjon',
      setAsHome: 'Sett som Hjem',
      homeSettings: 'Hjemmeinnstillinger',
      savedHome: 'Lagret Hjem',
      radius: 'Radius (Meter)',
      manualSet: 'Manuell Innstilling',
      latitude: 'Breddegrad',
      longitude: 'Lengdegrad',
      instructions: 'Instruksjoner',
      
      // Settings
      userProfile: 'Brukerprofil',
      name: 'Navn',
      homeAddress: 'Hjemmeadresse',
      preferredLanguage: 'Foretrukket Språk',
      gpsSettings: 'GPS Innstillinger',
      enableGps: 'Aktiver GPS',
      homeLocation: 'Hjemmeposisjon',
      save: 'Lagre',
      
      // Notifications
      locationLeft: 'Posisjon Forlatt',
      leftHomeMessage: 'Du har forlatt hjemmet ditt. Arbeid eller privat?',
      work: 'Arbeid',
      private: 'Privat',
      locationUpdated: 'Posisjon Oppdatert',
      homeSet: 'Hjem Satt',
      currentLocationSetAsHome: 'Nåværende posisjon er satt som hjem',
      trackingStarted: 'Sporing Startet',
      trackingStopped: 'Sporing Stoppet',
      error: 'Feil',
      success: 'Suksess'
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false
    },
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;