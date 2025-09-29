export default {
  // Job management
  job: 'Jobb',
  jobs: 'Jobber',
  newJob: 'Ny jobb',
  editJob: 'Rediger jobb',
  createJob: 'Opprett jobb',
  deleteJob: 'Slett jobb',
  
  // Job dialog
  dialogTitle: 'Rediger jobb',
  subtitle: 'Rediger alle jobbdata',
  
  // Tabs
  tabs: {
    customer: 'Kunde',
    machine: 'Maskin',
    times: 'Tider',
    overtime: 'Overtid',
    report: 'Rapport',
    finish: 'Fullfør'
  },
  
  // Customer section
  customer: {
    name: 'Kundenavn',
    namePlaceholder: 'Navn på kunden',
    address: 'Kundeadresse',
    addressPlaceholder: 'Fullstendig adresse til kunden',
    contact: 'Kontaktperson',
    contactPlaceholder: 'Navn på kontaktperson',
    evatic: 'EVATIC-nummer',
    evaticPlaceholder: 'EVATIC-nummer (hvis tilgjengelig)',
    
    // Hotel & accommodation
    hotelSection: 'Hotell & Overnatting',
    hotelName: 'Hotellnavn',
    hotelNamePlaceholder: 'Navn på hotellet',
    hotelAddress: 'Hotelladresse',
    hotelAddressPlaceholder: 'Adresse til hotellet',
    hotelNights: 'Hotellnetter',
    hotelPrice: 'Hotellpris (per natt eller totalt)',
    
    // Travel costs
    travelCosts: 'Reisekostnader',
    kmOutbound: 'Kilometer utreise',
    kmReturn: 'Kilometer hjemreise',
    tollFees: 'Bomavgifter (€)'
  },
  
  // Machine section
  machine: {
    manufacturer: 'Produsent',
    manufacturerPlaceholder: 'f.eks. Siemens, ABB, Schneider',
    model: 'Modell/Type',
    modelPlaceholder: 'f.eks. S7-1200, CP1E',
    serialNumber: 'Serienummer',
    serialPlaceholder: 'Serienummer på maskinen/systemet',
    workPerformed: 'Arbeid som skal utføres',
    workPerformedPlaceholder: 'Beskriv arbeidet som skal utføres...'
  },
  
  // Times section
  times: {
    arrival: 'Ankomst',
    work: 'Arbeid',
    departure: 'Avreise',
    startTime: 'Starttid',
    endTime: 'Sluttid',
    date: 'Dato',
    selectDate: 'Velg dato'
  },
  
  // Report section
  report: {
    tab: 'Rapport',
    day: 'Dag {{n}}',
    dayCounter: 'Dag {{current}}/{{total}}',
    dayWithDate: '{{date}}',
    placeholder: 'Rapport for {{label}}',
    save: 'Lagre',
    prev: 'Forrige dag',
    next: 'Neste dag',
    saved: 'Rapport lagret',
    trimTitle: 'Reduser dager?',
    trimBody: 'Rapporter for dagene {{from}}–{{to}} vil bli slettet. Fortsett?',
    cancel: 'Avbryt',
    confirm: 'Fortsett'
  },
  
  // Finish section
  finish: {
    title: 'Fullfør serviceoppdrag',
    reportLabel: 'Arbeidsrapport',
    reportPlaceholder: 'Beskriv utført arbeid, funn, materialer brukt, etc...',
    btnSaveReport: 'Lagre arbeidsrapport',
    btnPreview: 'Rapportforhåndsvisning',
    btnEmail: 'Send på e-post',
    btnDashboard: 'Dashbord'
  },
  
  // Actions
  buttons: {
    save: 'Lagre',
    cancel: 'Avbryt'
  }
} as const;