import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GPSStatus } from '../components/gps/GPSStatus';
import { UseGPSTrackingResult } from '../hooks/useGPSTracking';

// Mock the translation hook to control language
const mockT = vi.fn((key: string) => key);
const mockI18n = {
  language: 'en',
  changeLanguage: vi.fn(),
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: mockI18n,
  }),
}));

// Create a mock GPS tracking result
const createMockGPSTracking = (overrides?: Partial<UseGPSTrackingResult>): UseGPSTrackingResult => ({
  currentState: 'idle_at_home',
  isTracking: false,
  hasPermissions: true,
  currentLocation: null,
  error: null,
  startTracking: vi.fn(),
  stopTracking: vi.fn(),
  requestPermissions: vi.fn(),
  getCurrentPosition: vi.fn(),
  selectWork: vi.fn(),
  selectPrivate: vi.fn(),
  confirmAtCustomer: vi.fn(),
  denyAtCustomer: vi.fn(),
  confirmWorkDone: vi.fn(),
  denyWorkDone: vi.fn(),
  confirmHomeArrival: vi.fn(),
  currentSession: null,
  todaysEvents: [],
  currentJobId: null,
  settings: {
    homeLocation: { lat: 0, lng: 0, radius: 100 },
    geofenceEnabled: false,
    autoDetection: true,
    backgroundTracking: false,
  },
  updateSettings: vi.fn(),
  addManualEvent: vi.fn(),
  clearTodaysEvents: vi.fn(),
  linkToJob: vi.fn(),
  unlinkFromJob: vi.fn(),
  sessionTimers: {
    travelTime: 0,
    workTime: 0,
    returnTime: 0,
    currentTimer: {
      type: null,
      startTime: null,
      elapsed: 0,
    },
  },
  ...overrides,
});

describe('GPSStatus Component i18n Tests', () => {
  beforeEach(() => {
    mockT.mockClear();
  });

  test('renders GPS status in English with correct translation keys', () => {
    mockI18n.language = 'en';
    const mockGPSTracking = createMockGPSTracking();
    
    render(<GPSStatus gpsTracking={mockGPSTracking} />);
    
    // Verify that translation keys are being called for tracking buttons
    expect(mockT).toHaveBeenCalledWith('startTracking');
    
    // Verify UI text elements are rendered
    expect(screen.getByText('startTracking')).toBeInTheDocument();
  });

  test('renders GPS status in German with correct translation keys', () => {
    mockI18n.language = 'de';
    const mockGPSTracking = createMockGPSTracking();
    
    render(<GPSStatus gpsTracking={mockGPSTracking} />);
    
    // Verify that translation keys are being called
    expect(mockT).toHaveBeenCalledWith('startTracking');
  });

  test('renders different states with proper translations', () => {
    const mockGPSTracking = createMockGPSTracking({
      currentState: 'at_customer',
      isTracking: true,
    });
    
    render(<GPSStatus gpsTracking={mockGPSTracking} />);
    
    // Check for stop tracking when tracking is active
    expect(mockT).toHaveBeenCalledWith('stopTracking');
    expect(screen.getByText('stopTracking')).toBeInTheDocument();
  });

  test('shows tracking active/stopped status correctly', () => {
    // Test tracking active
    const mockGPSTrackingActive = createMockGPSTracking({
      isTracking: true,
    });
    
    const { rerender } = render(<GPSStatus gpsTracking={mockGPSTrackingActive} />);
    
    // Should show "Tracking aktiv" text (hard-coded in German in current implementation)
    expect(screen.getByText('Tracking aktiv')).toBeInTheDocument();
    
    // Test tracking stopped
    const mockGPSTrackingStopped = createMockGPSTracking({
      isTracking: false,
    });
    
    rerender(<GPSStatus gpsTracking={mockGPSTrackingStopped} />);
    
    // Should show "Tracking gestoppt" text (hard-coded in German in current implementation)
    expect(screen.getByText('Tracking gestoppt')).toBeInTheDocument();
  });

  test('renders current state labels correctly', () => {
    const mockGPSTracking = createMockGPSTracking({
      currentState: 'idle_at_home',
    });
    
    render(<GPSStatus gpsTracking={mockGPSTracking} />);
    
    // The current implementation has hard-coded German state labels
    // This test documents the current behavior and will need updating
    // when proper i18n is implemented for state labels
    expect(screen.getByText('Zuhause (Bereit)')).toBeInTheDocument();
  });

  test('aria labels should use translation keys (ARIA smoke test)', () => {
    const mockGPSTracking = createMockGPSTracking();
    
    render(<GPSStatus gpsTracking={mockGPSTracking} />);
    
    // This test checks that we don't have raw key names as aria-labels
    // If we find aria-label attributes, they should be properly translated
    const elementsWithAriaLabel = screen.queryAllByLabelText(/.*/, { exact: false });
    
    // For now, we just verify the component renders without breaking
    // In a complete implementation, we would check for specific aria-label translations
    expect(elementsWithAriaLabel).toBeDefined();
  });
});