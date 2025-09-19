import { describe, it, expect } from 'vitest';
import { defaultGPSSettings } from '../types/gps';

describe('GPS Configuration', () => {
  it('should have valid default GPS settings', () => {
    expect(defaultGPSSettings).toBeDefined();
    expect(defaultGPSSettings.enabled).toBe(false);
    expect(defaultGPSSettings.backgroundMode).toBe(false);
  });

  it('should have valid home location defaults', () => {
    expect(defaultGPSSettings.homeLocation.latitude).toBe(null);
    expect(defaultGPSSettings.homeLocation.longitude).toBe(null);
    expect(defaultGPSSettings.homeLocation.radius).toBe(100);
  });

  it('should have valid threshold settings', () => {
    expect(defaultGPSSettings.thresholds.movingSpeed).toBe(1.5);
    expect(defaultGPSSettings.thresholds.stationaryTime).toBe(10);
    expect(defaultGPSSettings.thresholds.samplingInterval).toBeUndefined(); // This property is in capture
  });

  it('should have valid capture settings', () => {
    expect(defaultGPSSettings.capture.accuracyThreshold).toBe(50);
    expect(defaultGPSSettings.capture.samplingInterval).toBe(5);
  });

  it('should have valid mapbox settings', () => {
    expect(defaultGPSSettings.mapbox.styleId).toBe('mapbox://styles/mapbox/streets-v12');
    expect(defaultGPSSettings.mapbox.minZoom).toBe(5);
    expect(defaultGPSSettings.mapbox.maxZoom).toBe(20);
    expect(defaultGPSSettings.mapbox.markerStyle).toBe('default');
  });

  it('should have valid notification settings', () => {
    expect(defaultGPSSettings.notifications.enabled).toBe(true);
    expect(defaultGPSSettings.notifications.sound).toBe(true);
    expect(defaultGPSSettings.notifications.actions).toBe(true);
  });
});