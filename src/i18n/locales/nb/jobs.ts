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
    btnDashboard: 'Dashbord',
    noReports: 'Ingen rapporter opprettet',
    editInReportTab: 'Rapporter kan redigeres i Rapport-fanen.',
    editReportsInfo: 'Rapporter redigeres i Rapport-fanen'
  },
  
  // Actions
  buttons: {
    save: 'Lagre',
    cancel: 'Avbryt'
  },
  
  // Job details labels (for dialog)
  jobDetails: 'Jobbdetaljer',
  jobDetailsDescription: 'Jobboversikt',
  customerLabel: 'Kunde',
  contactName: 'Kontakt',
  contactPhone: 'Telefon',
  manufacturerLabel: 'Produsent',
  modelLabel: 'Modell',
  
  // Job entry form
  customerData: 'Kundedata',
  machineData: 'Maskindata',
  hotelData: 'Hotelldata',
  travel: 'Reise',
  expenses: 'Utgifter',
  expensesTab: 'Utgifter',
  addExpense: 'Legg til utgift',
  expenseCategory: 'Kategori',
  expenseDescription: 'Beskrivelse',
  expenseLocation: 'Hvor kjøpt',
  expensePrice: 'Pris',
  expenseCategories: {
    tool: 'Verktøy',
    consumable: 'Forbruksmateriell',
    rental_car: 'Leiebil',
    flight: 'Flybillett',
    taxi: 'Taxi',
    other: 'Annet'
  },
  removeExpense: 'Fjern',
  expensesDescription: 'Verktøy og Forbruksmateriell',
  expensesPlaceholder: 'Beskriv brukte verktøy, forbruksmateriell og andre utgifter...',
  timesTitle: 'Tider',
  travelPerDay: 'Reise per dag',
  days: 'Dager',
  travelThere: 'Reise dit',
  travelBack: 'Hjemreise',
  jobEditing: 'Rediger jobb',
  jobIdShort: 'Jobb-ID',
  newJobStarted: 'Ny jobb startet',

  // Edit form structure
  edit: {
    form: {
      title: 'Tittel',
      customer: 'Kunde',
      customerData: 'Kundedata',
      customerName: 'Kundenavn',
      customerAddress: 'Kundeadresse',
      description: 'Beskrivelse',
      plannedDays: 'Planlagte dager',
      day: 'Dag',
      contact: 'Kontakt',
      contactPhone: 'Kontakttelefon',
      evaticNo: 'EVATIC-nummer',
      manufacturer: 'Produsent',
      model: 'Modell/Type',
      serialNumber: 'Serienummer',
      workPerformed: 'Arbeid som skal utføres',
      machineData: 'Maskindata',
      hotelData: 'Hotelldata',
      travel: 'Reise',
      travelPerDay: 'Reise per dag',
      days: 'Dager',
      travelThere: 'Reise dit',
      travelBack: 'Hjemreise',
      tollsNorwegian: 'Bomavgifter',
      overtime: 'Overtid',
      report: 'Rapport',
      finish: 'Fullfør',
      expenses: 'Utgifter',
      expensesTab: 'Utgifter',
      addExpense: 'Legg til utgift',
      expenseCategory: 'Kategori',
      expenseDescription: 'Beskrivelse',
      expenseLocation: 'Hvor kjøpt',
      expensePrice: 'Pris',
      expenseCategories: {
        tool: 'Verktøy',
        consumable: 'Forbruksmateriell',
        rental_car: 'Leiebil',
        flight: 'Flybillett',
        taxi: 'Taxi',
        other: 'Annet'
      },
      removeExpense: 'Fjern',
      noExpensesRecorded: 'Ingen utgifter registrert',
      expenseLocationPlaceholder: 'f.eks. Byggvarehandel, Amazon',
      expenseDescriptionPlaceholder: 'f.eks. Drill, Kabel 10m',
      editJob: 'Rediger jobb',
      newJob: 'Ny jobb',
      jobEditing: 'Rediger jobb',
      jobIdShort: 'Jobb-ID',
      addMoreData: 'Legg til mer data',
      back: 'Tilbake',
      completeJob: 'Fullfør jobb',
      saveCustomerFirst: 'Lagre kunde først',
      saveCustomerFirstDesc: 'Vennligst lagre kundedata før du fortsetter',
      tabs: {
        details: 'Detaljer',
        times: 'Tider'
      },
      times: {
        startTime: 'Starttid',
        endTime: 'Sluttid',
        break: 'Pause',
        totalHours: 'Totaltimer'
      },
      save: 'Lagre',
      cancel: 'Avbryt',
      next: 'Neste',
      dashboard: 'Dashbord',
      placeholders: {
        title: 'Skriv inn tittel',
        customer: 'Skriv inn kundenavn',
        customerName: 'Navn på kunden',
        customerAddress: 'Fullstendig adresse til kunden',
        description: 'Skriv inn beskrivelse',
        contact: 'Skriv inn kontaktnavn',
        contactPhone: 'Skriv inn kontakttelefon',
        evaticNo: 'EVATIC-nummer (hvis tilgjengelig)',
        manufacturer: 'f.eks. Siemens, ABB, Schneider',
        model: 'f.eks. S7-1200, CP1E',
        serialNumber: 'Serienummer på maskinen/systemet',
        workPerformed: 'Beskriv arbeidet som skal utføres...'
      }
    }
  }
} as const;