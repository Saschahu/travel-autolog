/**
 * Tests for GPSStatus component internationalization and accessibility
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { GPSStatus } from '../GPSStatus';
import { useTranslation } from 'react-i18next';

// Mock the useTranslation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

// Mock GPS tracking hook result
const mockGPSTracking = {
  currentState: 'idle_at_home' as const,
  isTracking: false,
  hasPermissions: true,
  currentLocation: null,
  error: null,
  startTracking: jest.fn(),
  stopTracking: jest.fn(),
  requestPermissions: jest.fn(),
  getCurrentPosition: jest.fn(),
  selectWork: jest.fn(),
  selectPrivate: jest.fn(),
  confirmAtCustomer: jest.fn(),
  denyAtCustomer: jest.fn(),
  confirmWorkDone: jest.fn(),
  denyWorkDone: jest.fn(),
  confirmHomeArrival: jest.fn(),
  sessionTimers: {
    travelTime: 0,
    workTime: 0,
    returnTime: 0,
    currentTimer: { type: 'travel' as const, elapsed: 0 }
  }
};

describe('GPSStatus Component', () => {
  const mockT = jest.fn((key: string, options?: any) => {
    // Mock translations for key paths
    const translations: Record<string, string> = {
      'gpsStatus.states.idle_at_home': 'At Home (Ready)',
      'gpsStatus.ui.currentState': 'Current State',
      'gpsStatus.ui.timer': 'Timer',
      'gpsStatus.ui.control': 'Control',
      'gpsStatus.ui.locationInfo': 'Location Info',
      'gpsStatus.ui.trackingActive': 'Tracking Active',
      'gpsStatus.ui.gpsAuthorized': 'GPS Authorized',
      'gpsStatus.ui.travelTime': 'Travel',
      'gpsStatus.ui.workTime': 'Work Time',
      'gpsStatus.ui.returnTime': 'Return',
      'gpsStatus.aria.currentStateLabel': 'Current GPS tracking state',
      'gpsStatus.aria.trackingStatusLabel': 'GPS tracking status',
      'gpsStatus.aria.permissionStatusLabel': 'GPS permission status',
      'gpsStatus.aria.timerLabel': `Time tracker for ${options?.type || 'unknown'}`,
      'gpsStatus.aria.controlButton': 'GPS control button',
      'gpsStatus.aria.locationInfoRegion': 'Current location information',
      'startTracking': 'Start Tracking',
      'stopTracking': 'Stop Tracking'
    };
    return translations[key] || key;
  });

  beforeEach(() => {
    (useTranslation as jest.Mock).mockReturnValue({ t: mockT });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders with i18n translations for German state', () => {
    // Test German translations
    const mockTDe = jest.fn((key: string) => {
      const germanTranslations: Record<string, string> = {
        'gpsStatus.states.idle_at_home': 'Zuhause (Bereit)',
        'gpsStatus.ui.currentState': 'Aktueller Zustand',
        'gpsStatus.ui.timer': 'Timer',
        'gpsStatus.ui.control': 'Kontrolle',
        'gpsStatus.ui.locationInfo': 'Standort-Info',
        'gpsStatus.ui.trackingActive': 'Tracking aktiv',
        'gpsStatus.ui.gpsAuthorized': 'GPS berechtigt',
        'gpsStatus.ui.travelTime': 'Anreise',
        'gpsStatus.ui.workTime': 'Arbeitszeit',
        'gpsStatus.ui.returnTime': 'Heimreise'
      };
      return germanTranslations[key] || key;
    });

    (useTranslation as jest.Mock).mockReturnValue({ t: mockTDe });

    render(<GPSStatus gpsTracking={mockGPSTracking} />);

    expect(screen.getByText('Aktueller Zustand')).toBeInTheDocument();
    expect(screen.getByText('Zuhause (Bereit)')).toBeInTheDocument();
    expect(screen.getByText('Timer')).toBeInTheDocument();
    expect(screen.getByText('Kontrolle')).toBeInTheDocument();
    expect(screen.getByText('Standort-Info')).toBeInTheDocument();
  });

  test('renders with i18n translations for English state', () => {
    render(<GPSStatus gpsTracking={mockGPSTracking} />);

    expect(screen.getByText('Current State')).toBeInTheDocument();
    expect(screen.getByText('At Home (Ready)')).toBeInTheDocument();
    expect(screen.getByText('Timer')).toBeInTheDocument();
    expect(screen.getByText('Control')).toBeInTheDocument();
    expect(screen.getByText('Location Info')).toBeInTheDocument();
  });

  test('has proper ARIA labels for accessibility', () => {
    render(<GPSStatus gpsTracking={mockGPSTracking} />);

    expect(screen.getByLabelText('Current GPS tracking state')).toBeInTheDocument();
    expect(screen.getByLabelText('GPS tracking status')).toBeInTheDocument();
    expect(screen.getByLabelText('GPS permission status')).toBeInTheDocument();
    expect(screen.getByLabelText('GPS control button')).toBeInTheDocument();
    expect(screen.getByLabelText('Current location information')).toBeInTheDocument();
  });

  test('displays different states correctly with translations', () => {
    const testCases = [
      { state: 'departing', expectedKey: 'gpsStatus.states.departing' },
      { state: 'en_route_to_customer', expectedKey: 'gpsStatus.states.en_route_to_customer' },
      { state: 'at_customer', expectedKey: 'gpsStatus.states.at_customer' },
      { state: 'done', expectedKey: 'gpsStatus.states.done' }
    ];

    testCases.forEach(({ state, expectedKey }) => {
      const modifiedTracking = { ...mockGPSTracking, currentState: state as any };
      const { rerender } = render(<GPSStatus gpsTracking={modifiedTracking} />);
      
      expect(mockT).toHaveBeenCalledWith(expectedKey);
      rerender(<div />); // Clear for next test
    });
  });

  test('shows correct tracking status badges with translations', () => {
    const trackingCases = [
      { isTracking: true, hasPermissions: true },
      { isTracking: false, hasPermissions: false }
    ];

    trackingCases.forEach(({ isTracking, hasPermissions }) => {
      const modifiedTracking = { ...mockGPSTracking, isTracking, hasPermissions };
      render(<GPSStatus gpsTracking={modifiedTracking} />);
      
      const expectedTrackingKey = isTracking ? 'gpsStatus.ui.trackingActive' : 'gpsStatus.ui.trackingStopped';
      const expectedPermissionKey = hasPermissions ? 'gpsStatus.ui.gpsAuthorized' : 'gpsStatus.ui.gpsPermissionMissing';
      
      expect(mockT).toHaveBeenCalledWith(expectedTrackingKey);
      expect(mockT).toHaveBeenCalledWith(expectedPermissionKey);
    });
  });

  test('has error alert with proper ARIA role', () => {
    const trackingWithError = { ...mockGPSTracking, error: 'GPS Error occurred' };
    render(<GPSStatus gpsTracking={trackingWithError} />);

    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveTextContent('GPS Error occurred');
  });

  test('timer labels have proper ARIA attributes', () => {
    render(<GPSStatus gpsTracking={mockGPSTracking} />);

    expect(mockT).toHaveBeenCalledWith('gpsStatus.aria.timerLabel', { type: 'Travel' });
    expect(mockT).toHaveBeenCalledWith('gpsStatus.aria.timerLabel', { type: 'Work Time' });
    expect(mockT).toHaveBeenCalledWith('gpsStatus.aria.timerLabel', { type: 'Return' });
  });
});