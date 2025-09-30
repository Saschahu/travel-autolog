export default {
  // Application basics
  appName: 'Travel AutoLog',
  loading: 'Loading...',
  pleaseWait: 'Please wait...',
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  info: 'Information',
  
  // Navigation
  dashboard: 'Dashboard',
  jobs: 'Jobs',
  gps: 'GPS',
  reports: 'Reports',
  export: 'Export',
  settings: 'Settings',
  location: 'Location',
  
  // Common actions
  save: 'Save',
  cancel: 'Cancel',
  edit: 'Edit',
  delete: 'Delete',
  add: 'Add',
  remove: 'Remove',
  close: 'Close',
  openAction: 'Open',
  start: 'Start',
  stop: 'Stop',
  pause: 'Pause',
  continue: 'Continue',
  next: 'Next',
  previous: 'Previous',
  finish: 'Finish',
  confirm: 'Confirm',
  
  // Time and date
  date: 'Date',
  time: 'Time',
  startTime: 'Start Time',
  endTime: 'End Time',
  duration: 'Duration',
  today: 'Today',
  yesterday: 'Yesterday',
  tomorrow: 'Tomorrow',
  
  // Time units
  hours: 'Hours',
  hoursShort: 'h',
  minutes: 'Minutes',
  minutesShort: 'min',
  seconds: 'Seconds',
  days: 'Days',
  daysShort: 'd',
  
  // Status
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  completed: 'Completed',
  open: 'Open',
  closed: 'Closed',
  
  // Forms
  name: 'Name',
  email: 'Email',
  address: 'Address',
  phone: 'Phone',
  description: 'Description',
  note: 'Note',
  notes: 'Notes',
  
  // Messages
  noData: 'No data available',
  loading_data: 'Loading data...',
  saving: 'Saving...',
  saved: 'Saved',
  saveFailed: 'Save failed',
  deleteConfirm: 'Are you sure you want to delete this?',
  unsavedChanges: 'Unsaved Changes',
  unsavedChangesText: 'There are unsaved changes. Continue anyway?',
  
  // Validation
  required: 'Required field',
  invalid: 'Invalid',
  tooShort: 'Too short',
  tooLong: 'Too long',
  invalidEmail: 'Invalid email address',
  invalidFormat: 'Invalid format',
  
  // Auth
  login: 'Login',
  logout: 'Logout',
  user: 'User',
  profile: 'Profile',
  
  // File operations
  upload: 'Upload',
  download: 'Download',
  file: 'File',
  folder: 'Folder',
  fileName: 'File Name',
  fileSize: 'File Size',
  
  // Search and filter
  search: 'Search',
  filter: 'Filter',
  all: 'All',
  none: 'None',
  
  // Language
  language: 'Language',
  
  // Job filtering
  filterJobs: 'Filter Jobs',
  openJobs: 'Open Jobs',
  activeJobsFilter: 'Active Jobs',
  completedJobsFilter: 'Completed Jobs',
  completedSentJobs: 'Completed & Sent Jobs',
  allJobs: 'All Jobs',
  
  // Time tracking
  workTime: 'Work Time',
  travelTime: 'Travel Time',
  departureTime: 'Departure Time',
  workTimes: 'Work Times',
  total: 'Total',
  totalHours: 'Total Hours',
  
  // UI Labels
  details: 'Details',
  startDateLabel: 'Start Date',
  workStartLabel: 'Work Start',
  workEndLabel: 'Work End',
  progress: 'Progress',
  daysLabel: 'Days',
  maxDaysReached: 'Maximum days reached',
  sendReport: 'Send Report',
  totalJobs: 'Total Jobs',
  totalOvertime: 'Total Overtime',
  
  // Job form sections (moved from jobs namespace)
  customerData: 'Customer Data',
  machineData: 'Machine Data',
  hotelData: 'Hotel Data',
  travel: 'Travel',
  times: 'Times',
  travelPerDay: 'Travel per Day',
  travelThere: 'Travel There',
  travelBack: 'Travel Back',
  jobEditing: 'Job Editing',
  jobIdShort: 'Job ID',
  newJobStarted: 'New job started',
  
  // Additional form labels
  editJob: 'Edit Job',
  newJob: 'New Job',
  overtime: 'Overtime',
  report: 'Report',
  tollsNorwegian: 'Toll Fees',
  
  // Time tracking labels
  arrival: 'Arrival',
  work: 'Work',
  departure: 'Departure',
  selectDate: 'Select date',
  timesTitle: 'Times',
  
  // Job form messages
  saveJobFirst: 'Please save the job first',
  userNotLoggedIn: 'User not logged in',
  successfullySaved: 'Successfully saved',
  jobDataSaved: 'Job data saved',
  jobCompleted: 'Job completed',
  customerSavedGoMachineTitle: 'Customer saved',
  customerSavedGoMachineDesc: 'You can now enter machine data',
  
  // Customer/Hotel fields
  customer: {
    hotelName: 'Hotel Name',
    hotelNamePlaceholder: 'Name of the hotel',
    hotelAddress: 'Hotel Address',
    hotelAddressPlaceholder: 'Address of the hotel',
    hotelNights: 'Hotel Nights',
    hotelPrice: 'Hotel Price (per night or total)'
  },
  
  // Privacy
  privacy: {
    consentTitle: 'Privacy & Data Collection',
    consentSubtitle: 'We value your privacy and want to be transparent about data collection',
    acceptTelemetry: 'Accept & Continue',
    declineTelemetry: 'Decline',
    consentNote: 'You can change your preferences anytime in Settings',
    readFullPolicy: 'Read full privacy policy',
    saving: 'Saving...'
  },
  
  // Overtime calculations
  recalculate: 'Recalculate',
  timeBreakdown: 'Time Breakdown',
  guaranteedHours: 'Guaranteed Hours',
  actualWorked: 'Actually Worked',
  regularHours: 'Regular Hours',
  overtimeHours: 'Overtime Hours',
  overtimeCalculation: 'Overtime Calculation',
  overtimeExplanation: 'Calculation based on',
  hoursMinimum: 'hours minimum',
  overtimeTypes: {
    '8to12hours': 'Overtime 8–12h',
    over12hours: 'Overtime over 12h',
    saturday: 'Saturday',
    sundayHoliday: 'Sunday/Holiday',
    surcharge: 'Surcharge',
    credit: 'Credit'
  }
} as const;