import { WEEKDAYS_LABELS } from '../constants/habits.ts';
import type {
  DailySummary,
  HabitCompletion,
  HabitFrequency,
  HabitStats,
} from '../types/index.ts';
import { addDays, getDateRange, getDayOfWeekUTC } from './date.ts';

export interface StreakSchedulableHabit {
  id: string;
  frequency: HabitFrequency | string;
  selectedDays: number[];
  startDate: string;
  status?: string;
}

export function getEffectiveSelectedDays(
  habit: Pick<StreakSchedulableHabit, 'frequency' | 'selectedDays'>
): number[] {
  if (habit.frequency === 'daily') return [0, 1, 2, 3, 4, 5, 6];
  if (habit.frequency === 'weekdays') return [1, 2, 3, 4, 5];
  return habit.selectedDays.length > 0 ? habit.selectedDays : [0, 1, 2, 3, 4, 5, 6];
}

export function isHabitScheduledOnDate(
  habit: Pick<StreakSchedulableHabit, 'frequency' | 'selectedDays' | 'startDate'>,
  dateStr: string
): boolean {
  if (dateStr < habit.startDate) return false;
  const day = getDayOfWeekUTC(dateStr);
  return getEffectiveSelectedDays(habit).includes(day);
}

export function formatFrequencySummary(
  habit: Pick<StreakSchedulableHabit, 'frequency' | 'selectedDays'>
): string {
  if (habit.frequency === 'daily') return 'Every day';
  if (habit.frequency === 'weekdays') return 'Weekdays (Mon–Fri)';
  const sorted = [...new Set(habit.selectedDays)].sort((a, b) => a - b);
  if (sorted.length === 7) return 'Every day';
  if (sorted.length === 0) return 'Custom';
  return sorted.map((d) => WEEKDAYS_LABELS[d]).join(', ');
}

export function buildCompletionLookup(
  completions: Pick<HabitCompletion, 'habitId' | 'completionDate' | 'completed'>[]
): Map<string, boolean> {
  const map = new Map<string, boolean>();
  for (const c of completions) {
    if (c.completed) {
      map.set(`${c.habitId}::${c.completionDate}`, true);
    }
  }
  return map;
}

export function isHabitCompletedOnDate(
  lookup: Map<string, boolean>,
  habitId: string,
  dateStr: string
): boolean {
  return lookup.get(`${habitId}::${dateStr}`) === true;
}

export function calculateHabitStats(
  habit: StreakSchedulableHabit,
  lookup: Map<string, boolean>,
  todayStr: string
): HabitStats {
  const effectiveEnd = todayStr;
  const dates = getDateRange(habit.startDate, effectiveEnd);

  let scheduledDaysCount = 0;
  let completedScheduledCount = 0;
  let totalCompletions = 0;

  let runningStreak = 0;
  let bestStreak = 0;

  for (const dateStr of dates) {
    const completed = isHabitCompletedOnDate(lookup, habit.id, dateStr);
    if (completed) {
      totalCompletions += 1;
    }

    if (isHabitScheduledOnDate(habit, dateStr)) {
      scheduledDaysCount += 1;
      if (completed) {
        completedScheduledCount += 1;
        runningStreak += 1;
        if (runningStreak > bestStreak) bestStreak = runningStreak;
      } else if (dateStr < todayStr) {
        runningStreak = 0;
      }
    }
  }

  // Current streak: walk backwards from todayStr, skipping unscheduled days.
  // If todayStr is scheduled and not yet completed, keep yesterday's streak alive.
  let currentStreak = 0;
  let cursor = todayStr;
  let guard = 0;
  while (cursor >= habit.startDate && guard < 1500) {
    if (isHabitScheduledOnDate(habit, cursor)) {
      const done = isHabitCompletedOnDate(lookup, habit.id, cursor);
      if (done) {
        currentStreak += 1;
      } else if (cursor === todayStr) {
        // Pending today does not break yesterday's streak yet
      } else {
        break;
      }
    }
    cursor = addDays(cursor, -1);
    guard += 1;
  }

  const completionRate =
    scheduledDaysCount > 0 ? Math.round((completedScheduledCount / scheduledDaysCount) * 100) : 0;

  return {
    habitId: habit.id,
    currentStreak,
    bestStreak,
    totalCompletions,
    scheduledDaysCount,
    completionRate,
  };
}

export function attachHabitStreaks<T extends StreakSchedulableHabit>(
  habitsList: T[],
  completions: Pick<HabitCompletion, 'habitId' | 'completionDate' | 'completed'>[],
  todayStr: string
): (T & { streak: number; bestStreak: number })[] {
  const lookup = buildCompletionLookup(completions);
  return habitsList.map((habit) => {
    const stats = calculateHabitStats(habit, lookup, todayStr);
    return {
      ...habit,
      streak: stats.currentStreak,
      bestStreak: stats.bestStreak,
    };
  });
}

export function getDailySummary(
  habits: StreakSchedulableHabit[],
  lookup: Map<string, boolean>,
  dateStr: string
): DailySummary {
  const activeHabits = habits.filter((h) => h.status === 'active');
  const scheduled = activeHabits.filter((h) => isHabitScheduledOnDate(h, dateStr));
  const completedCount = scheduled.filter((h) => isHabitCompletedOnDate(lookup, h.id, dateStr)).length;
  const scheduledCount = scheduled.length;
  const percentage = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;

  return {
    date: dateStr,
    scheduledCount,
    completedCount,
    percentage,
  };
}

export function calculateOverallStreaks(
  habits: StreakSchedulableHabit[],
  lookup: Map<string, boolean>,
  todayStr: string
): { currentStreak: number; bestStreak: number } {
  const activeHabits = habits.filter((h) => h.status === 'active');
  if (activeHabits.length === 0) return { currentStreak: 0, bestStreak: 0 };

  const earliestStart = activeHabits.reduce(
    (min, h) => (h.startDate < min ? h.startDate : min),
    todayStr
  );

  const dates = getDateRange(earliestStart, todayStr);
  let running = 0;
  let best = 0;

  for (const dateStr of dates) {
    const summary = getDailySummary(activeHabits, lookup, dateStr);
    if (summary.scheduledCount === 0) continue;
    if (summary.completedCount === summary.scheduledCount) {
      running += 1;
      if (running > best) best = running;
    } else if (dateStr < todayStr) {
      running = 0;
    }
  }

  let current = 0;
  let cursor = todayStr;
  let guard = 0;
  while (cursor >= earliestStart && guard < 1500) {
    const summary = getDailySummary(activeHabits, lookup, cursor);
    if (summary.scheduledCount > 0) {
      if (summary.completedCount === summary.scheduledCount) {
        current += 1;
      } else if (cursor === todayStr) {
        // Pending today does not break ongoing streak
      } else {
        break;
      }
    }
    cursor = addDays(cursor, -1);
    guard += 1;
  }

  return { currentStreak: current, bestStreak: best };
}

const FULL_WEEKDAY_NAMES = [
  'Sundays',
  'Mondays',
  'Tuesdays',
  'Wednesdays',
  'Thursdays',
  'Fridays',
  'Saturdays',
] as const;

export function getBestDayOfWeek(
  habits: StreakSchedulableHabit[],
  lookup: Map<string, boolean>,
  todayStr: string
): {
  dayIndex: number;
  dayName: string;
  completionRate: number;
  completedCount: number;
  scheduledCount: number;
} | null {
  const activeHabits = habits.filter((h) => h.status !== 'archived');
  if (activeHabits.length === 0) return null;

  const earliestStart = activeHabits.reduce(
    (min, h) => (h.startDate < min ? h.startDate : min),
    todayStr
  );
  const dates = getDateRange(earliestStart, todayStr);
  if (dates.length === 0) return null;

  const buckets = Array.from({ length: 7 }, () => ({ completed: 0, scheduled: 0 }));

  for (const dateStr of dates) {
    const dayIdx = getDayOfWeekUTC(dateStr);
    for (const h of activeHabits) {
      if (isHabitScheduledOnDate(h, dateStr)) {
        buckets[dayIdx].scheduled += 1;
        if (isHabitCompletedOnDate(lookup, h.id, dateStr)) {
          buckets[dayIdx].completed += 1;
        }
      }
    }
  }

  let bestIdx = -1;
  let bestRate = -1;
  let bestCompleted = 0;

  for (let i = 0; i < 7; i++) {
    const { completed, scheduled } = buckets[i];
    if (scheduled === 0 || completed === 0) continue;
    const rate = Math.round((completed / scheduled) * 100);
    if (rate > bestRate || (rate === bestRate && completed > bestCompleted)) {
      bestIdx = i;
      bestRate = rate;
      bestCompleted = completed;
    }
  }

  if (bestIdx === -1) return null;

  return {
    dayIndex: bestIdx,
    dayName: FULL_WEEKDAY_NAMES[bestIdx],
    completionRate: bestRate,
    completedCount: buckets[bestIdx].completed,
    scheduledCount: buckets[bestIdx].scheduled,
  };
}

export type TimeOfDayBucket = 'Morning' | 'Afternoon' | 'Evening';

export function getTimeOfDayBucket(reminderTime: string | null): TimeOfDayBucket {
  if (!reminderTime || !/^\d{2}:\d{2}$/.test(reminderTime)) {
    return 'Morning';
  }
  const hour = Number(reminderTime.slice(0, 2));
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}
