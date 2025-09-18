import { describe, it, expect } from 'vitest'
import i18n from '../i18n'

describe('GPS i18n Parity', () => {
  const gpsKeys = [
    'gpsTracking.ui.currentState',
    'gpsTracking.ui.stateLabels.idle_at_home',
    'gpsTracking.ui.stateLabels.departing',
    'gpsTracking.ui.stateLabels.en_route_to_customer',
    'gpsTracking.ui.stateLabels.stationary_check',
    'gpsTracking.ui.stateLabels.at_customer',
    'gpsTracking.ui.stateLabels.leaving_customer',
    'gpsTracking.ui.stateLabels.en_route_home',
    'gpsTracking.ui.stateLabels.stationary_home_check',
    'gpsTracking.ui.stateLabels.done',
    'gpsTracking.ui.trackingActive',
    'gpsTracking.ui.trackingStopped',
    'gpsTracking.ui.gpsAuthorized',
    'gpsTracking.ui.gpsPermissionMissing',
    'gpsTracking.ui.timers',
    'gpsTracking.ui.travelTime',
    'gpsTracking.ui.workTime',
    'gpsTracking.ui.returnTime',
    'gpsTracking.ui.controls',
    'gpsTracking.ui.gpsPermission',
    'gpsTracking.ui.getCurrentPosition',
    'gpsTracking.ui.work',
    'gpsTracking.ui.private',
    'gpsTracking.ui.atCustomer',
    'gpsTracking.ui.notAtCustomer',
    'gpsTracking.ui.workComplete',
    'gpsTracking.ui.continueWorking',
    'gpsTracking.ui.returnComplete',
    'gpsTracking.ui.locationInfo',
    'gpsTracking.ui.lastPosition',
    'gpsTracking.ui.noPositionAvailable',
    'gpsTracking.ui.speed',
    'gpsTracking.ui.accuracy',
    'gpsTracking.ui.timestamp'
  ]

  it('should have all GPS UI keys in German', () => {
    i18n.changeLanguage('de')
    
    gpsKeys.forEach(key => {
      const translation = i18n.t(key)
      expect(translation).not.toBe(key) // Should not return the key itself
      expect(translation).toBeTruthy()
      expect(typeof translation).toBe('string')
    })
  })

  it('should have all GPS UI keys in English', () => {
    i18n.changeLanguage('en')
    
    gpsKeys.forEach(key => {
      const translation = i18n.t(key)
      expect(translation).not.toBe(key) // Should not return the key itself
      expect(translation).toBeTruthy()
      expect(typeof translation).toBe('string')
    })
  })

  it('should have different translations for EN and DE', () => {
    const testKeys = [
      'gpsTracking.ui.currentState',
      'gpsTracking.ui.stateLabels.idle_at_home',
      'gpsTracking.ui.trackingActive',
      'gpsTracking.ui.gpsAuthorized',
      'gpsTracking.ui.work',
      'gpsTracking.ui.locationInfo'
    ]

    testKeys.forEach(key => {
      i18n.changeLanguage('de')
      const deTrans = i18n.t(key)
      
      i18n.changeLanguage('en')
      const enTrans = i18n.t(key)
      
      expect(deTrans).not.toBe(enTrans)
      expect(deTrans).toBeTruthy()
      expect(enTrans).toBeTruthy()
    })
  })

  it('should not have translation key leaks', () => {
    const languages = ['en', 'de']
    
    languages.forEach(lang => {
      i18n.changeLanguage(lang)
      
      gpsKeys.forEach(key => {
        const translation = i18n.t(key)
        // Should not return the key itself (which would indicate missing translation)
        expect(translation).not.toBe(key)
        // Should not contain the key structure
        expect(translation).not.toContain('gpsTracking.')
        expect(translation).not.toContain('ui.')
      })
    })
  })

  it('should have consistent state label count', () => {
    i18n.changeLanguage('de')
    const deStateLabels = Object.keys(i18n.getResourceBundle('de', 'translation').gpsTracking.ui.stateLabels || {})
    
    i18n.changeLanguage('en')
    const enStateLabels = Object.keys(i18n.getResourceBundle('en', 'translation').gpsTracking.ui.stateLabels || {})
    
    expect(deStateLabels.length).toBe(enStateLabels.length)
    expect(deStateLabels.length).toBeGreaterThan(0)
    
    // Check that all state keys exist in both languages
    deStateLabels.forEach(stateKey => {
      expect(enStateLabels).toContain(stateKey)
    })
  })
})