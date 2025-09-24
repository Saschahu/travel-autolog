import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGpsFsm, FsmConfig, TimeSource, Emitter, LocationData, GPSEvent } from '../core';

// Test configuration with reasonable defaults
const createTestConfig = (overrides: Partial<FsmConfig> = {}): FsmConfig => ({
  distanceThresholdMeters: 50,
  dwellMs: 10 * 60 * 1000, // 10 minutes
  noFixTimeoutMs: 5 * 60 * 1000, // 5 minutes
  movingSpeedMs: 1.5, // 1.5 m/s
  movingDistanceMeters: 150,
  movingTimeWindowMs: 2 * 60 * 1000, // 2 minutes
  homeRadiusMeters: 100,
  homeLatitude: 47.3769, // Example: Seattle
  homeLongitude: -122.3169,
  ...overrides
});

// Test location helpers
const createHomeLocation = (): LocationData => ({
  latitude: 47.3769,
  longitude: -122.3169,
  accuracy: 10,
  speed: 0,
  timestamp: new Date()
});

const createAwayLocation = (): LocationData => ({
  latitude: 47.3900, // ~1.5km away from home
  longitude: -122.3200,
  accuracy: 10,
  speed: 0,
  timestamp: new Date()
});

const createCustomerLocation = (): LocationData => ({
  latitude: 47.6062, // Seattle downtown, ~25km from "home"
  longitude: -122.3321,
  accuracy: 10,
  speed: 0,
  timestamp: new Date()
});

describe('GPS FSM Core', () => {
  let mockTime: TimeSource;
  let mockEmitter: Emitter;
  let emittedEvents: GPSEvent[];
  let currentTime: number;

  beforeEach(() => {
    vi.useFakeTimers();
    currentTime = new Date('2024-01-15T08:00:00Z').getTime();
    vi.setSystemTime(currentTime);
    
    emittedEvents = [];
    
    mockTime = {
      now: () => currentTime
    };
    
    mockEmitter = {
      emit: vi.fn((event: GPSEvent) => {
        emittedEvents.push(event);
      })
    };
  });

  describe('Happy Path - Complete Journey', () => {
    it('should complete a full work journey cycle', () => {
      const config = createTestConfig();
      const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });

      // Start at home - idle_at_home
      expect(fsm.getState()).toBe('idle_at_home');

      // Leave home with movement - should trigger departing
      const departureLocation = createAwayLocation();
      departureLocation.speed = 5; // Moving speed
      departureLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: departureLocation });
      
      expect(fsm.getState()).toBe('departing');
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].type).toBe('HOME_LEAVE');

      // User selects work option
      fsm.dispatch({ type: 'SELECT_WORK' });
      expect(fsm.getState()).toBe('en_route_to_customer');
      expect(emittedEvents).toHaveLength(2);
      expect(emittedEvents[1].type).toBe('WORK_SELECTED');

      // Arrive at customer location and build stationary history
      const customerLocation = createCustomerLocation();
      customerLocation.speed = 0;
      
      // Add multiple stationary locations to build up history
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      // Should still be en route - not stationary long enough yet
      expect(fsm.getState()).toBe('en_route_to_customer');
      
      // Advance time past dwell threshold and add another location
      currentTime += config.dwellMs + 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      expect(fsm.getState()).toBe('stationary_check');
      expect(emittedEvents).toHaveLength(3);
      expect(emittedEvents[2].type).toBe('ARRIVAL_CANDIDATE');

      // User confirms arrival at customer
      fsm.dispatch({ type: 'CONFIRM_AT_CUSTOMER' });
      expect(fsm.getState()).toBe('at_customer');
      expect(emittedEvents).toHaveLength(4);
      expect(emittedEvents[3].type).toBe('AT_CUSTOMER_START');

      // Start moving (work finished)
      const leavingLocation = { ...customerLocation, speed: 3 };
      currentTime += 1000;
      leavingLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: leavingLocation });
      expect(fsm.getState()).toBe('leaving_customer');
      expect(emittedEvents).toHaveLength(5);
      expect(emittedEvents[4].type).toBe('AT_CUSTOMER_END');

      // User confirms work is done
      fsm.dispatch({ type: 'CONFIRM_WORK_DONE' });
      expect(fsm.getState()).toBe('en_route_home');
      expect(emittedEvents).toHaveLength(6);
      expect(emittedEvents[5].type).toBe('WORK_DONE');

      // Arrive back home and build stationary history
      const homeArrivalLocation = createHomeLocation();
      
      currentTime += 1000;
      homeArrivalLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: homeArrivalLocation });
      
      currentTime += 1000;
      homeArrivalLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: homeArrivalLocation });
      
      currentTime += 1000;
      homeArrivalLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: homeArrivalLocation });
      
      // Advance time past dwell threshold
      currentTime += config.dwellMs + 1000;
      homeArrivalLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: homeArrivalLocation });
      
      expect(fsm.getState()).toBe('stationary_home_check');
      expect(emittedEvents).toHaveLength(7);
      expect(emittedEvents[6].type).toBe('HOME_ARRIVAL_CONFIRMED');

      // User confirms home arrival
      fsm.dispatch({ type: 'CONFIRM_HOME_ARRIVAL' });
      expect(fsm.getState()).toBe('done');

      // Done state should reset to idle_at_home when at home
      currentTime += 1000;
      homeArrivalLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: homeArrivalLocation });
      expect(fsm.getState()).toBe('idle_at_home');
    });

    it('should handle private trip selection', () => {
      const config = createTestConfig();
      const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });

      // Leave home
      const departureLocation = createAwayLocation();
      departureLocation.speed = 5;
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: departureLocation });
      expect(fsm.getState()).toBe('departing');

      // User selects private
      fsm.dispatch({ type: 'SELECT_PRIVATE' });
      expect(fsm.getState()).toBe('idle_at_home');
      expect(emittedEvents).toHaveLength(2);
      expect(emittedEvents[1].type).toBe('PRIVATE_SELECTED');
    });
  });

  describe('Jitter Filter', () => {
    it('should not trigger transitions for small movements below threshold', () => {
      const config = createTestConfig({ distanceThresholdMeters: 50 });
      const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });

      const homeLocation = createHomeLocation();
      
      // Small jitter movements (less than 50m)
      const jitterLocations = [
        { ...homeLocation, latitude: homeLocation.latitude + 0.0001 }, // ~11m
        { ...homeLocation, latitude: homeLocation.latitude + 0.0002 }, // ~22m  
        { ...homeLocation, longitude: homeLocation.longitude + 0.0003 }, // ~20m
      ];

      jitterLocations.forEach(location => {
        fsm.dispatch({ type: 'LOCATION_UPDATE', location });
      });

      // Should remain at idle_at_home - no transitions triggered
      expect(fsm.getState()).toBe('idle_at_home');
      expect(emittedEvents).toHaveLength(0);
    });

    it('should trigger transition when movement exceeds threshold', () => {
      const config = createTestConfig({ distanceThresholdMeters: 50 });
      const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });

      // Movement that exceeds threshold
      const awayLocation = createAwayLocation(); // ~1.5km away
      awayLocation.speed = 3; // Clear movement
      
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: awayLocation });

      expect(fsm.getState()).toBe('departing');
      expect(emittedEvents).toHaveLength(1);
      expect(emittedEvents[0].type).toBe('HOME_LEAVE');
    });
  });

  describe('No-Fix Timeout Handling', () => {
    it('should handle missing GPS updates gracefully', () => {
      const config = createTestConfig({ noFixTimeoutMs: 5 * 60 * 1000 });
      const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });

      // Initial location
      const location1 = createHomeLocation();
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: location1 });
      expect(fsm.getState()).toBe('idle_at_home');

      // Simulate no GPS updates for longer than timeout
      currentTime += config.noFixTimeoutMs + 1000;
      
      // FSM should remain stable without GPS updates
      expect(fsm.getState()).toBe('idle_at_home');
      
      // When GPS returns, should continue normal operation
      const location2 = createAwayLocation();
      location2.speed = 4;
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: location2 });
      
      expect(fsm.getState()).toBe('departing');
    });
  });

  describe('Day Rollover / Overnight Handling', () => {
    it('should handle day rollover correctly during a session', () => {
      const config = createTestConfig();
      const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });

      // Start late in the day
      currentTime = new Date('2024-01-15T23:55:00Z').getTime();
      
      // Leave home
      const departureLocation = createAwayLocation();
      departureLocation.speed = 5;
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: departureLocation });
      expect(fsm.getState()).toBe('departing');

      // Select work
      fsm.dispatch({ type: 'SELECT_WORK' });
      expect(fsm.getState()).toBe('en_route_to_customer');

      // Advance time past midnight
      currentTime = new Date('2024-01-16T00:10:00Z').getTime();
      
      // Arrive at customer
      const customerLocation = createCustomerLocation();
      customerLocation.speed = 0;
      
      // Build up location history for stationary detection
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += config.dwellMs + 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      expect(fsm.getState()).toBe('stationary_check');

      // Confirm at customer - should work normally despite day change
      fsm.dispatch({ type: 'CONFIRM_AT_CUSTOMER' });
      expect(fsm.getState()).toBe('at_customer');

      // Session should continue working across day boundary
      expect(emittedEvents.filter(e => e.type === 'AT_CUSTOMER_START')).toHaveLength(1);
    });
  });

  describe('State Transition Edge Cases', () => {
    it('should handle deny actions correctly', () => {
      const config = createTestConfig();
      const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });

      // Get to stationary_check state
      const awayLocation = createAwayLocation();
      awayLocation.speed = 5;
      awayLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: awayLocation });
      fsm.dispatch({ type: 'SELECT_WORK' });
      
      const customerLocation = createCustomerLocation();
      customerLocation.speed = 0;
      
      // Build up stationary history
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += config.dwellMs + 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      expect(fsm.getState()).toBe('stationary_check');

      // User denies being at customer
      fsm.dispatch({ type: 'DENY_AT_CUSTOMER' });
      expect(fsm.getState()).toBe('en_route_to_customer');

      // Get to leaving_customer state and test deny work done
      // Need to re-establish stationary state since we're back to en_route_to_customer
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += config.dwellMs + 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      expect(fsm.getState()).toBe('stationary_check');
      
      fsm.dispatch({ type: 'CONFIRM_AT_CUSTOMER' });
      expect(fsm.getState()).toBe('at_customer');
      
      const leavingLocation = { ...customerLocation, speed: 3 };
      currentTime += 1000;
      leavingLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: leavingLocation });
      expect(fsm.getState()).toBe('leaving_customer');

      // User denies work is done
      fsm.dispatch({ type: 'DENY_WORK_DONE' });
      expect(fsm.getState()).toBe('at_customer');
    });

    it('should handle movement detection during stationary checks', () => {
      const config = createTestConfig();
      const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });

      // Get to stationary_check
      const awayLocation = createAwayLocation();
      awayLocation.speed = 5;
      awayLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: awayLocation });
      fsm.dispatch({ type: 'SELECT_WORK' });
      
      const customerLocation = createCustomerLocation();
      customerLocation.speed = 0;
      
      // Build stationary history
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      
      currentTime += config.dwellMs + 1000;
      customerLocation.timestamp = new Date(currentTime);
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: customerLocation });
      expect(fsm.getState()).toBe('stationary_check');

      // Movement detected - should go back to en_route_to_customer
      const movingLocation = { ...customerLocation, latitude: customerLocation.latitude + 0.01, speed: 3 };
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: movingLocation });
      expect(fsm.getState()).toBe('en_route_to_customer');
    });
  });

  describe('Configuration Validation', () => {
    it('should work with different threshold configurations', () => {
      const config = createTestConfig({
        distanceThresholdMeters: 25, // Tighter threshold
        dwellMs: 5 * 60 * 1000, // Shorter dwell time
        movingSpeedMs: 2.0 // Higher speed threshold
      });
      
      const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });

      const departureLocation = createAwayLocation();
      departureLocation.speed = 2.5; // Above the higher threshold
      
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: departureLocation });
      expect(fsm.getState()).toBe('departing');
    });

    it('should handle missing home coordinates gracefully', () => {
      const config = createTestConfig({
        homeLatitude: null,
        homeLongitude: null
      });
      
      const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });

      // Without home coordinates, should not detect being at home
      const homeLocation = createHomeLocation();
      homeLocation.speed = 5;
      
      fsm.dispatch({ type: 'LOCATION_UPDATE', location: homeLocation });
      expect(fsm.getState()).toBe('departing'); // Should still detect movement
    });
  });
});