export default {
  // Job management
  job: 'Job',
  jobs: 'Jobs',
  newJob: 'New Job',
  editJob: 'Edit Job',
  createJob: 'Create Job',
  deleteJob: 'Delete Job',
  
  // Job dialog
  dialogTitle: 'Edit Job',
  subtitle: 'Edit all job data',
  
  // Tabs
  tabs: {
    customer: 'Customer',
    machine: 'Machine',
    times: 'Times',
    overtime: 'Overtime',
    report: 'Report',
    finish: 'Finish'
  },
  
  // Customer section
  customer: {
    name: 'Customer Name',
    namePlaceholder: 'Name of the customer',
    address: 'Customer Address',
    addressPlaceholder: 'Full address of the customer',
    contact: 'Contact Person',
    contactPlaceholder: 'Name of the contact person',
    evatic: 'EVATIC Number',
    evaticPlaceholder: 'EVATIC number (if available)',
    
    // Hotel & accommodation
    hotelSection: 'Hotel & Overnight',
    hotelName: 'Hotel Name',
    hotelNamePlaceholder: 'Name of the hotel',
    hotelAddress: 'Hotel Address',
    hotelAddressPlaceholder: 'Address of the hotel',
    hotelNights: 'Hotel Nights',
    hotelPrice: 'Hotel Price (per night or total)',
    
    // Travel costs
    travelCosts: 'Travel Costs',
    kmOutbound: 'Kilometers Outbound',
    kmReturn: 'Kilometers Return',
    tollFees: 'Toll Fees (€)'
  },
  
  // Machine section
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
  
  // Times section
  times: {
    arrival: 'Arrival',
    work: 'Work',
    departure: 'Departure',
    startTime: 'Start Time',
    endTime: 'End Time',
    date: 'Date',
    selectDate: 'Select date'
  },
  
  // Report section
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
  
  // Finish section
  finish: {
    title: 'Finish service case',
    reportLabel: 'Work report',
    reportPlaceholder: 'Describe the work performed, findings, materials used, etc...',
    btnSaveReport: 'Save Work Report',
    btnPreview: 'Report preview',
    btnEmail: 'Send by email',
    btnDashboard: 'Dashboard'
  },
  
  // Actions
  buttons: {
    save: 'Save',
    cancel: 'Cancel'
  }
} as const;