import { useMemo } from 'react';
import { useTokaStore } from '../store/useTokaStore.ts';
import type { Habit, HabitStats } from '../types/index.ts';
import { addDays, getTodayInTimezone } from '../utils/date.ts';
import {
  attachHabitStreaks,
  buildCompletionLookup,
  calculateHabitStats,
  calculateOverallStreaks,
  getDailySummary,
  isHabitScheduledOnDate,
} from '../utils/habitLogic.ts';

export function useHabitData() {
  const rawHabits = useTokaStore((s) => s.habits);
  const completions = useTokaStore((s) => s.completions);
  const settings = useTokaStore((s) => s.settings);
  const selectedDate = useTokaStore((s) => s.selectedDate);

  const timezone = settings?.timezone || 'UTC';
  const todayStr = useMemo(() => getTodayInTimezone(timezone), [timezone]);

  const completionLookup = useMemo(() => buildCompletionLookup(completions), [completions]);

  const habits = useMemo(
    () => attachHabitStreaks(rawHabits, completions, todayStr),
    [rawHabits, completions, todayStr]
  );

  const activeHabits = useMemo(() => habits.filter((h) => h.status === 'active'), [habits]);
  const archivedHabits = useMemo(() => habits.filter((h) => h.status === 'archived'), [habits]);

  const habitStatsMap = useMemo(() => {
    const map = new Map<string, HabitStats>();
    for (const h of habits) {
      map.set(h.id, calculateHabitStats(h, completionLookup, todayStr));
    }
    return map;
  }, [habits, completionLookup, todayStr]);

  const selectedDayHabits = useMemo(
    () => activeHabits.filter((h) => isHabitScheduledOnDate(h, selectedDate)),
    [activeHabits, selectedDate]
  );

  const selectedDaySummary = useMemo(
    () => getDailySummary(habits, completionLookup, selectedDate),
    [habits, completionLookup, selectedDate]
  );

  const todaySummary = useMemo(
    () => getDailySummary(habits, completionLookup, todayStr),
    [habits, completionLookup, todayStr]
  );

  const overallStreaks = useMemo(
    () => calculateOverallStreaks(habits, completionLookup, todayStr),
    [habits, completionLookup, todayStr]
  );

  const totalCompletedCount = useMemo(
    () => completions.filter((c) => c.completed).length,
    [completions]
  );

  // Last 7 days series for weekly bar chart
  const weeklySeries = useMemo(() => {
    const days: {
      date: string;
      label: string;
      shortNum: string;
      completedCount: number;
      scheduledCount: number;
      percentage: number;
    }[] = [];
    for (let offset = -6; offset <= 0; offset++) {
      const dateStr = addDays(todayStr, offset);
      const summary = getDailySummary(habits, completionLookup, dateStr);
      const dt = new Date(`${dateStr}T00:00:00Z`);
      const label = new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        weekday: 'short',
      }).format(dt);
      const shortNum = String(dt.getUTCDate());
      days.push({
        date: dateStr,
        label,
        shortNum,
        completedCount: summary.completedCount,
        scheduledCount: summary.scheduledCount,
        percentage: summary.percentage,
      });
    }
    return days;
  }, [habits, completionLookup, todayStr]);

  // Last 8 weeks aggregated completion rate for consistency over time chart
  const weeklyConsistencySeries = useMemo(() => {
    const weeks: {
      weekKey: string;
      label: string;
      rangeLabel: string;
      completedCount: number;
      scheduledCount: number;
      percentage: number;
    }[] = [];

    for (let w = 7; w >= 0; w--) {
      const endOffset = -(w * 7);
      const startOffset = endOffset - 6;
      const startStr = addDays(todayStr, startOffset);
      const endStr = addDays(todayStr, endOffset);

      let completedCount = 0;
      let scheduledCount = 0;

      for (let d = startOffset; d <= endOffset; d++) {
        const dateStr = addDays(todayStr, d);
        const summary = getDailySummary(habits, completionLookup, dateStr);
        completedCount += summary.completedCount;
        scheduledCount += summary.scheduledCount;
      }

      const percentage =
        scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;

      const startDt = new Date(`${startStr}T00:00:00Z`);
      const endDt = new Date(`${endStr}T00:00:00Z`);
      const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        month: 'short',
        day: 'numeric',
      });

      const label = w === 0 ? 'This wk' : fmt.format(startDt);
      const rangeLabel = `${fmt.format(startDt)} – ${fmt.format(endDt)}`;

      weeks.push({
        weekKey: startStr,
        label,
        rangeLabel,
        completedCount,
        scheduledCount,
        percentage,
      });
    }

    return weeks;
  }, [habits, completionLookup, todayStr]);

  // Last 30 days series for monthly trend chart
  const monthlySeries = useMemo(() => {
    const days: {
      date: string;
      completedCount: number;
      scheduledCount: number;
      percentage: number;
    }[] = [];
    for (let offset = -29; offset <= 0; offset++) {
      const dateStr = addDays(todayStr, offset);
      const summary = getDailySummary(habits, completionLookup, dateStr);
      days.push({
        date: dateStr,
        completedCount: summary.completedCount,
        scheduledCount: summary.scheduledCount,
        percentage: summary.percentage,
      });
    }
    return days;
  }, [habits, completionLookup, todayStr]);

  // 84-day (12 weeks) heatmap
  const heatmapDays = useMemo(() => {
    const days: {
      date: string;
      completedCount: number;
      scheduledCount: number;
      percentage: number;
    }[] = [];
    for (let offset = -83; offset <= 0; offset++) {
      const dateStr = addDays(todayStr, offset);
      const summary = getDailySummary(habits, completionLookup, dateStr);
      days.push({
        date: dateStr,
        completedCount: summary.completedCount,
        scheduledCount: summary.scheduledCount,
        percentage: summary.percentage,
      });
    }
    return days;
  }, [habits, completionLookup, todayStr]);

  const getHabitById = (id: string | null): Habit | undefined =>
    id ? habits.find((h) => h.id === id) : undefined;

  return {
    habits,
    activeHabits,
    archivedHabits,
    completions,
    completionLookup,
    habitStatsMap,
    selectedDayHabits,
    selectedDaySummary,
    todaySummary,
    todayStr,
    timezone,
    overallStreaks,
    totalCompletedCount,
    weeklySeries,
    weeklyConsistencySeries,
    monthlySeries,
    heatmapDays,
    getHabitById,
  };
}
