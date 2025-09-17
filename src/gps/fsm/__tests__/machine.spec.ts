import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGpsFsm, type FsmConfig, type TimeSource, type Emitter } from '../core';

describe('GPS FSM', () => {
  let mockTime: TimeSource;
  let mockEmitter: Emitter;
  let config: FsmConfig;

  beforeEach(() => {
    mockTime = { now: vi.fn(() => Date.now()) };
    mockEmitter = { emit: vi.fn() };
    config = {
      homeRadius: 100,
      customerRadius: 50,
      stationaryTimeout: 300000 // 5 minutes
    };
  });

  afterEach(() => {
    try { 
      vi.useRealTimers(); 
    } catch {
      // ignore cleanup errors
    }
    vi.clearAllMocks();
  });

  it('should start in idle_at_home state', () => {
    const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });
    expect(fsm.getState()).toBe('idle_at_home');
  });

  it('should handle GPS_FIX events', () => {
    const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });
    
    fsm.dispatch({
      type: 'GPS_FIX',
      lat: 52.5200,
      lng: 13.4050,
      speed: 10,
      ts: Date.now()
    });

    expect(mockEmitter.emit).toHaveBeenCalled();
  });

  it('should handle USER_CONFIRM events', () => {
    const fsm = createGpsFsm(config, { time: mockTime, emit: mockEmitter });
    
    fsm.dispatch({
      type: 'USER_CONFIRM',
      action: 'ARRIVED',
      ts: Date.now()
    });

    expect(mockEmitter.emit).toHaveBeenCalled();
  });
});