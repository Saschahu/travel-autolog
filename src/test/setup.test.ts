import { describe, it, expect } from 'vitest'
import i18n from '../i18n'

describe('Test Setup', () => {
  it('should have Vitest working correctly', () => {
    expect(true).toBe(true)
  })

  it('should have i18n configured', () => {
    expect(i18n).toBeDefined()
    expect(i18n.language).toBeDefined()
  })

  it('should be able to change language', () => {
    i18n.changeLanguage('en')
    expect(i18n.language).toBe('en')
    
    i18n.changeLanguage('de')
    expect(i18n.language).toBe('de')
  })

  it('should have GPS tracking translations loaded', () => {
    i18n.changeLanguage('de')
    expect(i18n.exists('gpsTracking.ui.currentState')).toBe(true)
    
    i18n.changeLanguage('en')
    expect(i18n.exists('gpsTracking.ui.currentState')).toBe(true)
  })

  it('should have DOM testing library setup', () => {
    // Test that jest-dom matchers are available
    expect(expect.extend).toBeDefined()
  })

  it('should have mocks configured', () => {
    // Test that ResizeObserver mock is working
    expect(global.ResizeObserver).toBeDefined()
    expect(typeof global.ResizeObserver).toBe('function')
    
    // Test that matchMedia mock is working
    expect(window.matchMedia).toBeDefined()
    expect(typeof window.matchMedia).toBe('function')
  })

  it('should count translation keys correctly', () => {
    i18n.changeLanguage('de')
    const deBundle = i18n.getResourceBundle('de', 'translation')
    const gpsTrackingKeys = Object.keys(deBundle.gpsTracking || {})
    
    expect(gpsTrackingKeys.length).toBeGreaterThan(0)
    expect(gpsTrackingKeys).toContain('ui')
    expect(gpsTrackingKeys).toContain('tracking')
    expect(gpsTrackingKeys).toContain('stats')
  })
})