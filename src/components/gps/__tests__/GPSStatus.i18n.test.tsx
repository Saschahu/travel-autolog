import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../i18n'
import { GPSStatus } from '../GPSStatus'
import type { UseGPSTrackingResult } from '../../../hooks/useGPSTracking'

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
    currentTimer: { type: 'none', elapsed: 0 }
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

describe('GPSStatus Internationalization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('German (DE) Language', () => {
    it('displays all sections in German', () => {
      const mockGPS = createMockGPSTracking()
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'de')
      
      expect(screen.getByText('Aktueller Zustand')).toBeInTheDocument()
      expect(screen.getByText('Timer')).toBeInTheDocument()
      expect(screen.getByText('Kontrolle')).toBeInTheDocument()
      expect(screen.getByText('Standort-Info')).toBeInTheDocument()
    })

    it('displays state labels in German', () => {
      const mockGPS = createMockGPSTracking({ currentState: 'idle_at_home' })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'de')
      
      expect(screen.getByText('Zuhause (Bereit)')).toBeInTheDocument()
    })

    it('displays timer labels in German', () => {
      const mockGPS = createMockGPSTracking()
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'de')
      
      expect(screen.getByText('Anreise')).toBeInTheDocument()
      expect(screen.getByText('Arbeitszeit')).toBeInTheDocument()
      expect(screen.getByText('Heimreise')).toBeInTheDocument()
    })

    it('displays control buttons in German', () => {
      const mockGPS = createMockGPSTracking({ hasPermissions: false })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'de')
      
      expect(screen.getByText('GPS Berechtigung')).toBeInTheDocument()
      expect(screen.getByText('Position abrufen')).toBeInTheDocument()
    })

    it('displays status badges in German', () => {
      const mockGPS = createMockGPSTracking({ isTracking: true, hasPermissions: false })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'de')
      
      expect(screen.getByText('Tracking aktiv')).toBeInTheDocument()
      expect(screen.getByText('GPS Berechtigung fehlt')).toBeInTheDocument()
    })
  })

  describe('English (EN) Language', () => {
    it('displays all sections in English', () => {
      const mockGPS = createMockGPSTracking()
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'en')
      
      expect(screen.getByText('Current State')).toBeInTheDocument()
      expect(screen.getByText('Timers')).toBeInTheDocument()
      expect(screen.getByText('Controls')).toBeInTheDocument()
      expect(screen.getByText('Location Info')).toBeInTheDocument()
    })

    it('displays state labels in English', () => {
      const mockGPS = createMockGPSTracking({ currentState: 'idle_at_home' })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'en')
      
      expect(screen.getByText('At Home (Ready)')).toBeInTheDocument()
    })

    it('displays timer labels in English', () => {
      const mockGPS = createMockGPSTracking()
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'en')
      
      expect(screen.getByText('Travel')).toBeInTheDocument()
      expect(screen.getByText('Work Time')).toBeInTheDocument()
      expect(screen.getByText('Return')).toBeInTheDocument()
    })

    it('displays control buttons in English', () => {
      const mockGPS = createMockGPSTracking({ hasPermissions: false })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'en')
      
      expect(screen.getByText('GPS Permission')).toBeInTheDocument()
      expect(screen.getByText('Get Position')).toBeInTheDocument()
    })

    it('displays status badges in English', () => {
      const mockGPS = createMockGPSTracking({ isTracking: true, hasPermissions: false })
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'en')
      
      expect(screen.getByText('Tracking Active')).toBeInTheDocument()
      expect(screen.getByText('GPS Permission Missing')).toBeInTheDocument()
    })
  })

  describe('State-specific Translations', () => {
    const stateTestCases = [
      { state: 'departing', de: 'Verlässt Zuhause', en: 'Leaving Home' },
      { state: 'en_route_to_customer', de: 'Anreise zum Kunden', en: 'En Route to Customer' },
      { state: 'at_customer', de: 'Beim Kunden', en: 'At Customer' },
      { state: 'leaving_customer', de: 'Verlässt Kunde', en: 'Leaving Customer' },
      { state: 'en_route_home', de: 'Heimreise', en: 'Returning Home' },
      { state: 'done', de: 'Abgeschlossen', en: 'Completed' }
    ]

    stateTestCases.forEach(({ state, de, en }) => {
      it(`displays ${state} state correctly in both languages`, () => {
        const mockGPS = createMockGPSTracking({ currentState: state })
        
        // Test German - look for the state badge specifically
        renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'de')
        const deStateBadge = screen.getByLabelText(new RegExp(`Aktueller Zustand.*${de.replace(/[()]/g, '\\$&')}`))
        expect(deStateBadge).toBeInTheDocument()
        
        // Test English - look for the state badge specifically
        renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'en')
        const enStateBadge = screen.getByLabelText(new RegExp(`Current State.*${en.replace(/[()]/g, '\\$&')}`))
        expect(enStateBadge).toBeInTheDocument()
      })
    })
  })

  describe('Action Button Translations', () => {
    it('translates work/private buttons correctly', () => {
      const mockGPS = createMockGPSTracking({ currentState: 'departing' })
      
      // German
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'de')
      expect(screen.getByText('Arbeit')).toBeInTheDocument()
      expect(screen.getByText('Privat')).toBeInTheDocument()
      
      // English
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'en')
      expect(screen.getByText('Work')).toBeInTheDocument()
      expect(screen.getByText('Private')).toBeInTheDocument()
    })

    it('translates customer confirmation buttons correctly', () => {
      const mockGPS = createMockGPSTracking({ currentState: 'stationary_check' })
      
      // German
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'de')
      expect(screen.getByText('Beim Kunden')).toBeInTheDocument()
      expect(screen.getByText('Nicht beim Kunden')).toBeInTheDocument()
      
      // English
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'en')
      expect(screen.getByText('At Customer')).toBeInTheDocument()
      expect(screen.getByText('Not at Customer')).toBeInTheDocument()
    })
  })

  describe('ARIA Labels', () => {
    it('provides proper ARIA labels for state badges', () => {
      const mockGPS = createMockGPSTracking({ 
        currentState: 'at_customer',
        isTracking: true,
        hasPermissions: true 
      })
      
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'de')
      
      const stateBadge = screen.getByText('Beim Kunden').closest('[aria-label]')
      expect(stateBadge).toHaveAttribute('aria-label', 'Aktueller Zustand: Beim Kunden')
      
      const trackingBadge = screen.getByText('Tracking aktiv').closest('[aria-label]')
      expect(trackingBadge).toHaveAttribute('aria-label', 'GPS-Strecken-Aufzeichnung: Tracking aktiv')
    })

    it('provides ARIA labels for control buttons', () => {
      const mockGPS = createMockGPSTracking({ hasPermissions: false, isTracking: false })
      
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'en')
      
      const permissionButton = screen.getByText('GPS Permission')
      expect(permissionButton).toHaveAttribute('aria-label', 'GPS Permission')
      
      const positionButton = screen.getByText('Get Position')
      expect(positionButton).toHaveAttribute('aria-label', 'Get Position')
      
      const startButton = screen.getByText('Start Tracking')
      expect(startButton).toHaveAttribute('aria-label', 'Start Tracking')
    })
  })

  describe('Location Info Translations', () => {
    it('translates location info labels correctly', () => {
      const mockGPS = createMockGPSTracking({
        currentLocation: {
          latitude: 52.5,
          longitude: 13.4,
          timestamp: new Date(),
          accuracy: 10,
          speed: 5,
          heading: null
        }
      })
      
      // German
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'de')
      expect(screen.getByText('Letzte Position:')).toBeInTheDocument()
      expect(screen.getByText('Geschwindigkeit:')).toBeInTheDocument()
      expect(screen.getByText('Genauigkeit:')).toBeInTheDocument()
      expect(screen.getByText('Zeitstempel:')).toBeInTheDocument()
      
      // English
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'en')
      expect(screen.getByText('Last Position:')).toBeInTheDocument()
      expect(screen.getByText('Speed:')).toBeInTheDocument()
      expect(screen.getByText('Accuracy:')).toBeInTheDocument()
      expect(screen.getByText('Timestamp:')).toBeInTheDocument()
    })

    it('translates no position message correctly', () => {
      const mockGPS = createMockGPSTracking({ currentLocation: null })
      
      // German
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'de')
      expect(screen.getByText('Keine Position verfügbar')).toBeInTheDocument()
      
      // English
      renderWithI18n(<GPSStatus gpsTracking={mockGPS} />, 'en')
      expect(screen.getByText('No position available')).toBeInTheDocument()
    })
  })
})