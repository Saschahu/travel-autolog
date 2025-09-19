// English locale - only export when needed
export const jobTranslationsEn = {
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

export const enTranslations = {
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
  
  // Time format
  hoursShort: 'h',
  minutesShort: 'min',
  
  // Common
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete',
  close: 'Close',
  loading: 'Loading...',
  
  // Toast messages
  saved: 'Saved',
  error: 'Error',
  success: 'Success',
};