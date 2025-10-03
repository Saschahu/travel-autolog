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
    btnDashboard: 'Dashboard',
    noReports: 'No reports created',
    editInReportTab: 'Reports can be edited in the Report tab.',
    editReportsInfo: 'Reports are edited in the Report tab'
  },
  
  // Actions
  buttons: {
    save: 'Save',
    cancel: 'Cancel'
  },
  
  // Job details labels (for dialog)
  jobDetails: 'Job Details',
  jobDetailsDescription: 'Job overview',
  customerLabel: 'Customer',
  contactName: 'Contact',
  contactPhone: 'Phone',
  manufacturerLabel: 'Manufacturer',
  modelLabel: 'Model',
  
  // Job entry form
  customerData: 'Customer Data',
  machineData: 'Machine Data',
  hotelData: 'Hotel Data',
  travel: 'Travel',
  expenses: 'Expenses',
  expensesTab: 'Expenses',
  addExpense: 'Add Expense',
  expenseCategory: 'Category',
  expenseDescription: 'Description',
  expenseLocation: 'Where purchased',
  expensePrice: 'Price',
  expenseCategories: {
    tool: 'Tool',
    consumable: 'Consumable',
    rental_car: 'Rental Car',
    flight: 'Flight Ticket',
    taxi: 'Taxi',
    other: 'Other'
  },
  removeExpense: 'Remove',
  noExpensesRecorded: 'No expenses recorded',
  expenseLocationPlaceholder: 'e.g. Hardware store, Amazon',
  expenseDescriptionPlaceholder: 'e.g. Drill, Cable 10m',
  expensesDescription: 'Tools and Consumables',
  expensesPlaceholder: 'Describe used tools, consumables and other expenses...',
  timesTitle: 'Times',
  travelPerDay: 'Travel per Day',
  days: 'Days',
  travelThere: 'Travel There',
  travelBack: 'Travel Back',
  jobEditing: 'Job Editing',
  jobIdShort: 'Job ID',
  newJobStarted: 'New job started',

  // Edit form structure
  edit: {
    form: {
      title: 'Title',
      customer: 'Customer',
      customerData: 'Customer Data',
      customerName: 'Customer Name',
      customerAddress: 'Customer Address',
      description: 'Description',
      plannedDays: 'Planned days',
      day: 'Day',
      contact: 'Contact',
      contactPhone: 'Contact phone',
      evaticNo: 'EVATIC Number',
      manufacturer: 'Manufacturer',
      model: 'Model/Type',
      serialNumber: 'Serial Number',
      workPerformed: 'Work to Perform',
      machineData: 'Machine Data',
      hotelData: 'Hotel Data',
      travel: 'Travel',
      travelPerDay: 'Travel per Day',
      days: 'Days',
      travelThere: 'Travel There',
      travelBack: 'Travel Back',
      tollsNorwegian: 'Toll Fees',
      overtime: 'Overtime',
      report: 'Report',
      finish: 'Finish',
      expenses: 'Expenses',
      expensesTab: 'Expenses',
      addExpense: 'Add Expense',
      expenseCategory: 'Category',
      expenseDescription: 'Description',
      expenseLocation: 'Where purchased',
      expensePrice: 'Price',
      expenseCategories: {
        tool: 'Tool',
        consumable: 'Consumable',
        rental_car: 'Rental Car',
        flight: 'Flight Ticket',
        taxi: 'Taxi',
        other: 'Other'
      },
      removeExpense: 'Remove',
      noExpensesRecorded: 'No expenses recorded',
      expenseLocationPlaceholder: 'e.g. Hardware store, Amazon',
      expenseDescriptionPlaceholder: 'e.g. Drill, Cable 10m',
      editJob: 'Edit Job',
      newJob: 'New Job',
      jobEditing: 'Job Editing',
      jobIdShort: 'Job ID',
      addMoreData: 'Add more data',
      back: 'Back',
      completeJob: 'Complete Job',
      saveCustomerFirst: 'Save customer first',
      saveCustomerFirstDesc: 'Please save customer data before proceeding',
      tabs: {
        details: 'Details',
        times: 'Times'
      },
      times: {
        startTime: 'Start time',
        endTime: 'End time',
        break: 'Break',
        totalHours: 'Total hours'
      },
      save: 'Save',
      cancel: 'Cancel',
      next: 'Next',
      dashboard: 'Dashboard',
      placeholders: {
        title: 'Enter title',
        customer: 'Enter customer name',
        customerName: 'Name of the customer',
        customerAddress: 'Full address of the customer',
        description: 'Enter description',
        contact: 'Enter contact name',
        contactPhone: 'Enter contact phone',
        evaticNo: 'EVATIC number (if available)',
        manufacturer: 'e.g. Siemens, ABB, Schneider',
        model: 'e.g. S7-1200, CP1E',
        serialNumber: 'Serial number of the machine/system',
        workPerformed: 'Describe the work to perform...'
      }
    }
  }
} as const;