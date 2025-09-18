import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import { GPSStatus } from '../GPSStatus'
import type { UseGPSTrackingResult } from '../../../hooks/useGPSTracking'

// Mock GPS tracking hook result
const createMockGPSTracking = (overrides = {}): UseGPSTrackingResult => ({
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
  sessionTimers: {
    travelTime: 0,
    workTime: 0,
    returnTime: 0,
    currentTimer: {
      type: 'none',
      elapsed: 0
    }
  },
  ...overrides
})

const renderWithI18n = (component: React.ReactElement, language = 'de') => {
  i18n.changeLanguage(language)
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

describe('GPSStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders current state section', () => {
      const mockGPS = createMockGPSTracking()
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('Aktueller Zustand')).toBeInTheDocument()
      expect(screen.getByText('Zuhause (Bereit)')).toBeInTheDocument()
    })

    it('renders timer section', () => {
      const mockGPS = createMockGPSTracking()
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('Timer')).toBeInTheDocument()
      expect(screen.getByText('Anreise')).toBeInTheDocument()
      expect(screen.getByText('Arbeitszeit')).toBeInTheDocument()
      expect(screen.getByText('Heimreise')).toBeInTheDocument()
    })

    it('renders control section', () => {
      const mockGPS = createMockGPSTracking()
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('Kontrolle')).toBeInTheDocument()
      expect(screen.getByText('Position abrufen')).toBeInTheDocument()
    })

    it('renders location info section', () => {
      const mockGPS = createMockGPSTracking()
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('Standort-Info')).toBeInTheDocument()
      expect(screen.getByText('Letzte Position:')).toBeInTheDocument()
    })
  })

  describe('State-dependent UI', () => {
    it('shows GPS permission button when permissions missing', () => {
      const mockGPS = createMockGPSTracking({ hasPermissions: false })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('GPS Berechtigung')).toBeInTheDocument()
      expect(screen.getByText('GPS Berechtigung fehlt')).toBeInTheDocument()
    })

    it('shows tracking buttons based on tracking state', () => {
      const mockGPS = createMockGPSTracking({ isTracking: false })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('Tracking starten')).toBeInTheDocument()
      expect(screen.getByText('Tracking gestoppt')).toBeInTheDocument()
    })

    it('shows stop tracking button when tracking is active', () => {
      const mockGPS = createMockGPSTracking({ isTracking: true })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('Tracking stoppen')).toBeInTheDocument()
      expect(screen.getByText('Tracking aktiv')).toBeInTheDocument()
    })

    it('shows work/private buttons when departing', () => {
      const mockGPS = createMockGPSTracking({ currentState: 'departing' })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('Arbeit')).toBeInTheDocument()
      expect(screen.getByText('Privat')).toBeInTheDocument()
    })

    it('shows customer confirmation buttons when in stationary check', () => {
      const mockGPS = createMockGPSTracking({ currentState: 'stationary_check' })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('Beim Kunden')).toBeInTheDocument()
      expect(screen.getByText('Nicht beim Kunden')).toBeInTheDocument()
    })

    it('shows work completion buttons when leaving customer', () => {
      const mockGPS = createMockGPSTracking({ currentState: 'leaving_customer' })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('Arbeit fertig')).toBeInTheDocument()
      expect(screen.getByText('Weiter arbeiten')).toBeInTheDocument()
    })

    it('shows home arrival button when in home check', () => {
      const mockGPS = createMockGPSTracking({ currentState: 'stationary_home_check' })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('Heimreise beendet')).toBeInTheDocument()
    })
  })

  describe('Location Display', () => {
    it('shows current location when available', () => {
      const mockGPS = createMockGPSTracking({
        currentLocation: {
          latitude: 52.520008,
          longitude: 13.404954,
          timestamp: new Date('2024-01-01T10:00:00Z'),
          accuracy: 10,
          speed: 5.5,
          heading: null
        }
      })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('52.520008, 13.404954')).toBeInTheDocument()
      expect(screen.getByText('5.5 m/s')).toBeInTheDocument()
      expect(screen.getByText('10 m')).toBeInTheDocument()
    })

    it('shows no position message when location unavailable', () => {
      const mockGPS = createMockGPSTracking({ currentLocation: null })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('Keine Position verfügbar')).toBeInTheDocument()
    })

    it('displays error message when present', () => {
      const mockGPS = createMockGPSTracking({ error: 'GPS Error occurred' })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />)
      
      expect(screen.getByText('GPS Error occurred')).toBeInTheDocument()
    })
  })
})