import { DayData, Job } from '@/types/job';
import { minutesBetweenAcrossMidnight, isSundayUTC } from '@/lib/timeMath';

/**
 * Calculates the total minutes for travel, work, and departure for a single day.
 * Returns 0 for any segment that is missing start or end times.
 * @param day The day data object.
 * @returns An object with the total minutes for each segment and the total for the day.
 */
export function calcDailyMinutes(day: DayData): { travel: number; work: number; departure: number; total: number } {
  const travel = (day.travelStart && day.travelEnd) ? minutesBetweenAcrossMidnight(day.travelStart, day.travelEnd) : 0;
  const work = (day.workStart && day.workEnd) ? minutesBetweenAcrossMidnight(day.workStart, day.workEnd) : 0;
  const departure = (day.departureStart && day.departureEnd) ? minutesBetweenAcrossMidnight(day.departureStart, day.departureEnd) : 0;
  const total = travel + work + departure;
  return { travel, work, departure, total };
}

/**
 * Calculates the total overtime and other metrics for a given job.
 * @param job The job object, containing an array of days.
 * @param opts Options for the calculation.
 *   - sundayFactor: The multiplier for work minutes on a Sunday (default: 2).
 *   - baseDailyMinutes: The number of minutes in a standard workday before overtime (default: 480, i.e., 8 hours).
 * @returns An object with summed minutes, number of workdays, and total overtime minutes.
 */
export function calcOvertime(job: Job, opts?: { sundayFactor?: number; baseDailyMinutes?: number }): {
  sumTravel: number; sumWork: number; sumDeparture: number; sumTotal: number; workdays: number; overtime: number;
} {
  const sundayFactor = opts?.sundayFactor ?? 2;
  const baseDailyMinutes = opts?.baseDailyMinutes ?? 480;

  let sumTravel = 0;
  let sumWork = 0;
  let sumDeparture = 0;
  let workdays = 0;
  let overtime = 0;

  if (!job.days) {
    return { sumTravel: 0, sumWork: 0, sumDeparture: 0, sumTotal: 0, workdays: 0, overtime: 0 };
  }

  job.days.forEach(day => {
    const daily = calcDailyMinutes(day);
    sumTravel += daily.travel;
    sumDeparture += daily.departure;

    let effectiveWorkMinutes = daily.work;
    if (daily.work > 0) {
      workdays++;
      if (day.date && isSundayUTC(day.date)) {
        effectiveWorkMinutes *= sundayFactor;
      }
    }

    sumWork += effectiveWorkMinutes;

    // Business Rule: Overtime is calculated based on work minutes only.
    // Travel and departure time do not contribute to overtime calculation.
    if (daily.work > baseDailyMinutes) {
      overtime += daily.work - baseDailyMinutes;
    }
  });

  const sumTotal = sumTravel + sumWork + sumDeparture;

  return { sumTravel, sumWork, sumDeparture, sumTotal, workdays, overtime };
}
