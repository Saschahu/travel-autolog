import type { GPSEvent, GPSSession} from '@/types/gps-events';

export interface SessionTimers {
  travelTime: number; // minutes
  workTime: number; // minutes
  returnTime: number; // minutes
  currentTimer: {
    type: 'travel' | 'work' | 'return' | null;
    startTime: Date | null;
    elapsed: number; // minutes
  };
}

export class GPSSessionCalculator {
  /**
   * Calculate session totals and current timer state from events
   */
  public static calculateSessionTimers(events: GPSEvent[]): SessionTimers {
    const timers: SessionTimers = {
      travelTime: 0,
      workTime: 0,
      returnTime: 0,
      currentTimer: {
        type: null,
        startTime: null,
        elapsed: 0
      }
    };

    if (events.length === 0) {
      return timers;
    }

    // Sort events by timestamp
    const sortedEvents = [...events].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    let currentPhase: 'travel' | 'work' | 'return' | null = null;
    let phaseStartTime: Date | null = null;

    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const _nextEvent = sortedEvents[i + 1];

      switch (event.type) {
        case 'HOME_LEAVE':
        case 'WORK_SELECTED':
          // Start travel phase
          if (currentPhase && phaseStartTime) {
            // End previous phase
            this.addTimeToPhase(timers, currentPhase, phaseStartTime, event.timestamp);
          }
          currentPhase = 'travel';
          phaseStartTime = event.timestamp;
          break;

        case 'AT_CUSTOMER_START':
          // End travel, start work
          if (currentPhase === 'travel' && phaseStartTime) {
            this.addTimeToPhase(timers, 'travel', phaseStartTime, event.timestamp);
          }
          currentPhase = 'work';
          phaseStartTime = event.timestamp;
          break;

        case 'AT_CUSTOMER_END':
        case 'WORK_DONE':
          // End work, start return
          if (currentPhase === 'work' && phaseStartTime) {
            this.addTimeToPhase(timers, 'work', phaseStartTime, event.timestamp);
          }
          currentPhase = 'return';
          phaseStartTime = event.timestamp;
          break;

        case 'HOME_ARRIVAL_CONFIRMED':
          // End return phase
          if (currentPhase === 'return' && phaseStartTime) {
            this.addTimeToPhase(timers, 'return', phaseStartTime, event.timestamp);
          }
          currentPhase = null;
          phaseStartTime = null;
          break;

        case 'PRIVATE_SELECTED':
          // End any current phase
          if (currentPhase && phaseStartTime) {
            this.addTimeToPhase(timers, currentPhase, phaseStartTime, event.timestamp);
          }
          currentPhase = null;
          phaseStartTime = null;
          break;
      }
    }

    // Handle ongoing timer
    if (currentPhase && phaseStartTime) {
      const now = new Date();
      const elapsed = this.calculateMinutes(phaseStartTime, now);
      
      timers.currentTimer = {
        type: currentPhase,
        startTime: phaseStartTime,
        elapsed
      };
    }

    return timers;
  }

  /**
   * Update session totals in a GPSSession object
   */
  public static updateSessionTotals(session: GPSSession): GPSSession {
    const timers = this.calculateSessionTimers(session.events);
    
    return {
      ...session,
      totals: {
        travelTime: timers.travelTime,
        workTime: timers.workTime,
        returnTime: timers.returnTime
      }
    };
  }

  /**
   * Get current live timers (including ongoing timer)
   */
  public static getLiveTimers(events: GPSEvent[]): SessionTimers {
    return this.calculateSessionTimers(events);
  }

  private static addTimeToPhase(
    timers: SessionTimers, 
    phase: 'travel' | 'work' | 'return', 
    startTime: Date, 
    endTime: Date
  ): void {
    const minutes = this.calculateMinutes(startTime, endTime);
    timers[`${phase}Time`] += minutes;
  }

  private static calculateMinutes(startTime: Date, endTime: Date): number {
    const diffMs = endTime.getTime() - startTime.getTime();
    return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
  }

  /**
   * Format minutes to HH:MM display
   */
  public static formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Get today's date string for session keys
   */
  public static getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Validate session data integrity
   */
  public static validateSession(session: GPSSession): boolean {
    // Check if events are sorted by timestamp
    for (let i = 1; i < session.events.length; i++) {
      if (session.events[i].timestamp < session.events[i - 1].timestamp) {
        return false;
      }
    }

    // Check if session totals make sense
    const calculatedTimers = this.calculateSessionTimers(session.events);
    const tolerance = 1; // 1 minute tolerance
    
    return (
      Math.abs(session.totals.travelTime - calculatedTimers.travelTime) <= tolerance &&
      Math.abs(session.totals.workTime - calculatedTimers.workTime) <= tolerance &&
      Math.abs(session.totals.returnTime - calculatedTimers.returnTime) <= tolerance
    );
  }
}