import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GPSStatus } from './GPSStatus';
import { UseGPSTrackingResult } from '@/hooks/useGPSTracking';

// Mock the useTranslation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Mock translations for testing
      const translations: Record<string, string> = {
        'gpsTracking.ui.currentState': 'Current State',
        'gpsTracking.ui.timer': 'Timer',
        'gpsTracking.ui.control': 'Control',
        'gpsTracking.ui.locationInfo': 'Location Info',
        'gpsTracking.ui.travelTime': 'Travel',
        'gpsTracking.ui.workTime': 'Work',
        'gpsTracking.ui.returnTime': 'Return',
        'gpsTracking.ui.trackingActive': 'Tracking active',
        'gpsTracking.ui.trackingStopped': 'Tracking stopped',
        'gpsTracking.ui.gpsPermissionGranted': 'GPS authorized',
        'gpsTracking.ui.gpsPermissionMissing': 'GPS permission missing',
        'gpsTracking.ui.requestGpsPermission': 'GPS Permission',
        'gpsTracking.ui.getCurrentPosition': 'Get Position',
        'gpsTracking.ui.lastPosition': 'Last Position:',
        'gpsTracking.ui.noPositionAvailable': 'No position available',
        'gpsTracking.ui.speed': 'Speed:',
        'gpsTracking.ui.accuracy': 'Accuracy:',
        'gpsTracking.ui.timestamp': 'Timestamp:',
        'gpsTracking.ui.work': 'Work',
        'gpsTracking.ui.private': 'Private',
        'gpsTracking.ui.atCustomer': 'At Customer',
        'gpsTracking.ui.notAtCustomer': 'Not at Customer',
        'gpsTracking.ui.workFinished': 'Work Finished',
        'gpsTracking.ui.continueWorking': 'Continue Working',
        'gpsTracking.ui.tripHomeFinished': 'Trip Home Finished',
        'gpsTracking.ui.states.idle_at_home': 'At Home (Ready)',
        'gpsTracking.ui.states.departing': 'Leaving Home',
        'gpsTracking.ui.states.en_route_to_customer': 'En Route to Customer',
        'gpsTracking.ui.states.stationary_check': 'Stationary Check',
        'gpsTracking.ui.states.at_customer': 'At Customer',
        'gpsTracking.ui.states.leaving_customer': 'Leaving Customer',
        'gpsTracking.ui.states.en_route_home': 'Returning Home',
        'gpsTracking.ui.states.stationary_home_check': 'Home Check',
        'gpsTracking.ui.states.done': 'Completed',
        'startTracking': 'Start Tracking',
        'stopTracking': 'Stop Tracking',
      };
      return translations[key] || key;
    },
  }),
}));

describe('GPSStatus', () => {
  const mockGpsTracking: UseGPSTrackingResult = {
    currentState: 'idle_at_home',
    isTracking: false,
    hasPermissions: true,
    currentLocation: {
      latitude: 52.520008,
      longitude: 13.404954,
      accuracy: 10,
      speed: 0,
      timestamp: new Date('2023-01-01T12:00:00Z'),
    },
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
    sessionTimers: {
      travelTime: 30,
      workTime: 120,
      returnTime: 25,
      currentTimer: {
        type: 'none',
        elapsed: 0,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders current state correctly', () => {
    render(<GPSStatus gpsTracking={mockGpsTracking} />);
    
    expect(screen.getByText('Current State')).toBeInTheDocument();
    expect(screen.getByText('At Home (Ready)')).toBeInTheDocument();
  });

  it('shows tracking status badge', () => {
    render(<GPSStatus gpsTracking={mockGpsTracking} />);
    
    expect(screen.getByText('Tracking stopped')).toBeInTheDocument();
  });

  it('shows GPS permission status', () => {
    render(<GPSStatus gpsTracking={mockGpsTracking} />);
    
    expect(screen.getByText('GPS authorized')).toBeInTheDocument();
  });

  it('displays timer values correctly', () => {
    render(<GPSStatus gpsTracking={mockGpsTracking} />);
    
    expect(screen.getByText('Timer')).toBeInTheDocument();
    expect(screen.getByText('Travel')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Return')).toBeInTheDocument();
    
    // Check time formatting
    expect(screen.getByText('00:30')).toBeInTheDocument(); // Travel time
    expect(screen.getByText('02:00')).toBeInTheDocument(); // Work time
    expect(screen.getByText('00:25')).toBeInTheDocument(); // Return time
  });

  it('shows control buttons', () => {
    render(<GPSStatus gpsTracking={mockGpsTracking} />);
    
    expect(screen.getByText('Control')).toBeInTheDocument();
    expect(screen.getByText('Get Position')).toBeInTheDocument();
    expect(screen.getByText('Start Tracking')).toBeInTheDocument();
  });

  it('calls startTracking when start button is clicked', async () => {
    render(<GPSStatus gpsTracking={mockGpsTracking} />);
    
    const startButton = screen.getByText('Start Tracking');
    fireEvent.click(startButton);
    
    expect(mockGpsTracking.startTracking).toHaveBeenCalledOnce();
  });

  it('shows stop tracking button when tracking is active', () => {
    const trackingGpsState = {
      ...mockGpsTracking,
      isTracking: true,
    };
    
    render(<GPSStatus gpsTracking={trackingGpsState} />);
    
    expect(screen.getByText('Stop Tracking')).toBeInTheDocument();
    expect(screen.getByText('Tracking active')).toBeInTheDocument();
  });

  it('shows GPS permission request button when permissions are missing', () => {
    const noPermissionGpsState = {
      ...mockGpsTracking,
      hasPermissions: false,
    };
    
    render(<GPSStatus gpsTracking={noPermissionGpsState} />);
    
    expect(screen.getByText('GPS Permission')).toBeInTheDocument();
    expect(screen.getByText('GPS permission missing')).toBeInTheDocument();
  });

  it('shows departing state buttons', () => {
    const departingGpsState = {
      ...mockGpsTracking,
      currentState: 'departing' as const,
    };
    
    render(<GPSStatus gpsTracking={departingGpsState} />);
    
    // Use more specific selectors to avoid conflicts with timer labels
    expect(screen.getByRole('button', { name: 'Work' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Private' })).toBeInTheDocument();
  });

  it('shows stationary check buttons', () => {
    const stationaryGpsState = {
      ...mockGpsTracking,
      currentState: 'stationary_check' as const,
    };
    
    render(<GPSStatus gpsTracking={stationaryGpsState} />);
    
    expect(screen.getByRole('button', { name: 'At Customer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Not at Customer' })).toBeInTheDocument();
  });

  it('shows leaving customer buttons', () => {
    const leavingGpsState = {
      ...mockGpsTracking,
      currentState: 'leaving_customer' as const,
    };
    
    render(<GPSStatus gpsTracking={leavingGpsState} />);
    
    expect(screen.getByRole('button', { name: 'Work Finished' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue Working' })).toBeInTheDocument();
  });

  it('shows home arrival button', () => {
    const homeCheckGpsState = {
      ...mockGpsTracking,
      currentState: 'stationary_home_check' as const,
    };
    
    render(<GPSStatus gpsTracking={homeCheckGpsState} />);
    
    expect(screen.getByRole('button', { name: 'Trip Home Finished' })).toBeInTheDocument();
  });

  it('displays location information correctly', () => {
    render(<GPSStatus gpsTracking={mockGpsTracking} />);
    
    expect(screen.getByText('Location Info')).toBeInTheDocument();
    expect(screen.getByText('Last Position:')).toBeInTheDocument();
    expect(screen.getByText('52.520008, 13.404954')).toBeInTheDocument();
    expect(screen.getByText('Speed:')).toBeInTheDocument();
    expect(screen.getByText('Accuracy:')).toBeInTheDocument();
    expect(screen.getByText('Timestamp:')).toBeInTheDocument();
  });

  it('shows no position available when location is null', () => {
    const noLocationGpsState = {
      ...mockGpsTracking,
      currentLocation: null,
    };
    
    render(<GPSStatus gpsTracking={noLocationGpsState} />);
    
    expect(screen.getByText('No position available')).toBeInTheDocument();
  });

  it('displays error messages', () => {
    const errorGpsState = {
      ...mockGpsTracking,
      error: 'GPS error occurred',
    };
    
    render(<GPSStatus gpsTracking={errorGpsState} />);
    
    expect(screen.getByText('GPS error occurred')).toBeInTheDocument();
  });

  it('has proper ARIA labels on interactive elements', () => {
    render(<GPSStatus gpsTracking={mockGpsTracking} />);
    
    // Check that buttons have proper aria-labels
    expect(screen.getByLabelText('Get Position')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Tracking')).toBeInTheDocument();
    
    // Check that badges have proper aria-labels
    expect(screen.getByLabelText('Current State: At Home (Ready)')).toBeInTheDocument();
    expect(screen.getByLabelText('Tracking stopped')).toBeInTheDocument();
    expect(screen.getByLabelText('GPS authorized')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    const longTimeGpsState = {
      ...mockGpsTracking,
      sessionTimers: {
        ...mockGpsTracking.sessionTimers,
        workTime: 525, // 8 hours 45 minutes
      },
    };
    
    render(<GPSStatus gpsTracking={longTimeGpsState} />);
    
    expect(screen.getByText('08:45')).toBeInTheDocument();
  });
});