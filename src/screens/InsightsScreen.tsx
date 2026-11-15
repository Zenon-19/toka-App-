import { useMemo, useState } from 'react';
import { Calendar, Flame, TrendingUp } from 'lucide-react';
import { HabitIcon } from '../components/HabitIcon.tsx';
import {
  Last7DaysRechartsBar,
  WeeklyConsistencyOverTimeChart,
} from '../components/WeeklyConsistencyChart.tsx';
import { useHabitData } from '../hooks/useHabitData.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import { formatShortDate } from '../utils/date.ts';

export function InsightsScreen() {
  const navigateToScreen = useTokaStore((s) => s.navigateToScreen);
  const {
    habits,
    activeHabits,
    habitStatsMap,
    todaySummary,
    overallStreaks,
    totalCompletedCount,
    weeklySeries,
    weeklyConsistencySeries,
    monthlySeries,
    heatmapDays,
  } = useHabitData();

  const [hoveredHeatDate, setHoveredHeatDate] = useState<{
    date: string;
    completedCount: number;
    scheduledCount: number;
    percentage: number;
  } | null>(null);

  const habitLeaderboard = useMemo(() => {
    return [...habits]
      .map((h) => ({
        habit: h,
        stats: habitStatsMap.get(h.id)!,
      }))
      .sort((a, b) => b.stats.completionRate - a.stats.completionRate);
  }, [habits, habitStatsMap]);

  const weeklyAverage = useMemo(() => {
    const activeDays = weeklySeries.filter((d) => d.scheduledCount > 0);
    if (activeDays.length === 0) return 0;
    const sum = activeDays.reduce((acc, d) => acc + d.percentage, 0);
    return Math.round(sum / activeDays.length);
  }, [weeklySeries]);

  const eightWeekAverage = useMemo(() => {
    const activeWeeks = weeklyConsistencySeries.filter((w) => w.scheduledCount > 0);
    if (activeWeeks.length === 0) return 0;
    const sum = activeWeeks.reduce((acc, w) => acc + w.percentage, 0);
    return Math.round(sum / activeWeeks.length);
  }, [weeklyConsistencySeries]);

  const monthlyAverage = useMemo(() => {
    const activeDays = monthlySeries.filter((d) => d.scheduledCount > 0);
    if (activeDays.length === 0) return 0;
    const sum = activeDays.reduce((acc, d) => acc + d.percentage, 0);
    return Math.round(sum / activeDays.length);
  }, [monthlySeries]);

  // Group 84 days into 12 columns of 7 days for heatmap
  const heatmapWeeks = useMemo(() => {
    const cols: typeof heatmapDays[] = [];
    for (let i = 0; i < heatmapDays.length; i += 7) {
      cols.push(heatmapDays.slice(i, i + 7));
    }
    return cols;
  }, [heatmapDays]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
            Insights
          </h1>
          <p className="mt-1 text-sm text-[var(--toka-text-secondary)]">
            Live consistency metrics calculated directly from your completion records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigateToScreen('calendar')}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] text-sm font-medium text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] inline-flex items-center gap-2 transition-colors self-start whitespace-nowrap shrink-0"
        >
          <Calendar size={16} className="text-[var(--toka-text-secondary)]" />
          <span>Full Calendar</span>
        </button>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5">
          <div className="text-xs text-[var(--toka-text-secondary)]">Today&apos;s rate</div>
          <div className="mt-2 font-mono-num text-2xl sm:text-3xl font-semibold text-[var(--toka-accent-text)]">
            {todaySummary.percentage}%
          </div>
          <div className="mt-1 text-xs text-[var(--toka-text-secondary)] font-mono-num">
            {todaySummary.completedCount} / {todaySummary.scheduledCount} habits
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5">
          <div className="text-xs text-[var(--toka-text-secondary)]">Current streak</div>
          <div className="mt-2 font-mono-num text-2xl sm:text-3xl font-semibold text-[var(--toka-text-primary)] flex items-center gap-2">
            <span>{overallStreaks.currentStreak}d</span>
            <Flame size={20} className="text-[var(--toka-accent-text)]" />
          </div>
          <div className="mt-1 text-xs text-[var(--toka-text-secondary)]">
            100% scheduled days
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5">
          <div className="text-xs text-[var(--toka-text-secondary)]">Best streak</div>
          <div className="mt-2 font-mono-num text-2xl sm:text-3xl font-semibold text-[var(--toka-text-primary)]">
            {overallStreaks.bestStreak}d
          </div>
          <div className="mt-1 text-xs text-[var(--toka-text-secondary)]">
            Historical personal record
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5">
          <div className="text-xs text-[var(--toka-text-secondary)]">Total completed</div>
          <div className="mt-2 font-mono-num text-2xl sm:text-3xl font-semibold text-[var(--toka-text-primary)]">
            {totalCompletedCount}
          </div>
          <div className="mt-1 text-xs text-[var(--toka-text-secondary)] font-mono-num">
            Across {activeHabits.length} active
          </div>
        </div>
      </div>

      {/* Recharts Weekly Consistency Over Time + Last 7 Days Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
                Weekly completion rate
              </h2>
              <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
                8-week habit consistency trajectory
              </p>
            </div>
            <span className="font-mono-num text-sm font-semibold text-[var(--toka-accent-text)] inline-flex items-center gap-1">
              <TrendingUp size={14} />
              {eightWeekAverage}% avg
            </span>
          </div>

          <WeeklyConsistencyOverTimeChart
            data={weeklyConsistencySeries}
            averageRate={eightWeekAverage}
          />
        </div>

        <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
                This week&apos;s daily breakdown
              </h2>
              <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
                Last 7 days scheduled completion rate
              </p>
            </div>
            <span className="font-mono-num text-sm font-semibold text-[var(--toka-accent-text)]">
              {weeklyAverage}% avg
            </span>
          </div>

          <Last7DaysRechartsBar data={weeklySeries} />
        </div>
      </div>

      {/* Monthly 30-day Completion Chart */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
                Monthly trend
              </h2>
              <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
                30-day completion rate trajectory
              </p>
            </div>
            <span className="font-mono-num text-sm font-semibold text-[var(--toka-accent-text)] inline-flex items-center gap-1">
              <TrendingUp size={14} />
              {monthlyAverage}% avg
            </span>
          </div>

          <div className="h-44 flex items-end gap-[3px] pt-6">
            {monthlySeries.map((day) => (
              <div
                key={day.date}
                className="flex-1 h-full flex items-end group relative"
                title={`${day.date}: ${day.completedCount}/${day.scheduledCount} (${day.percentage}%)`}
              >
                <div
                  className={`w-full rounded-t transition-all ${
                    day.percentage === 100
                      ? 'bg-[#C6FF69]'
                      : day.percentage > 0
                      ? 'bg-[#C6FF69]/55'
                      : 'bg-[var(--toka-border)]'
                  }`}
                  style={{ height: `${Math.max(day.percentage, 4)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono-num text-[var(--toka-text-secondary)]">
            <span>{formatShortDate(monthlySeries[0]?.date || '')}</span>
            <span>{formatShortDate(monthlySeries[monthlySeries.length - 1]?.date || '')}</span>
          </div>
      </div>

      {/* 12-Week Calendar Heatmap */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
              12-week consistency heatmap
            </h2>
            <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
              {hoveredHeatDate
                ? `${formatShortDate(hoveredHeatDate.date)}: ${hoveredHeatDate.completedCount} / ${hoveredHeatDate.scheduledCount} completed (${hoveredHeatDate.percentage}%)`
                : 'Hover or tap any cell to inspect daily completion ratio'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--toka-text-secondary)]">
            <span>Less</span>
            <span className="w-3.5 h-3.5 rounded bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)]" />
            <span className="w-3.5 h-3.5 rounded bg-[#C6FF69]/30" />
            <span className="w-3.5 h-3.5 rounded bg-[#C6FF69]/65" />
            <span className="w-3.5 h-3.5 rounded bg-[#C6FF69]" />
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-1">
          <div className="grid grid-cols-12 gap-1.5 min-w-[480px]">
            {heatmapWeeks.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-rows-7 gap-1.5">
                {week.map((day) => {
                  const pct = day.percentage;
                  const cellBg =
                    day.scheduledCount === 0 && day.completedCount === 0
                      ? 'bg-[var(--toka-bg-secondary)]/50 border border-[var(--toka-border)]/50'
                      : pct === 0
                      ? 'bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)]'
                      : pct < 50
                      ? 'bg-[#C6FF69]/30'
                      : pct < 100
                      ? 'bg-[#C6FF69]/65'
                      : 'bg-[#C6FF69]';
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onMouseEnter={() => setHoveredHeatDate(day)}
                      onFocus={() => setHoveredHeatDate(day)}
                      onClick={() => setHoveredHeatDate(day)}
                      aria-label={`${day.date}: ${day.completedCount} of ${day.scheduledCount} completed`}
                      className={`w-full aspect-square rounded-md transition-transform hover:scale-110 ${cellBg}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Individual Habit Performance */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6">
        <h2 className="text-base font-semibold text-[var(--toka-text-primary)] mb-4">
          Individual habit performance
        </h2>

        {habitLeaderboard.length === 0 ? (
          <p className="text-sm text-[var(--toka-text-secondary)] py-4">
            Create and track habits to unlock individual performance analytics.
          </p>
        ) : (
          <div className="divide-y divide-[var(--toka-border)]">
            {habitLeaderboard.map(({ habit, stats }) => (
              <button
                key={habit.id}
                type="button"
                onClick={() => navigateToScreen('habit-details', habit.id)}
                className="w-full py-3.5 flex items-center justify-between gap-4 text-left hover:bg-[var(--toka-bg-secondary)]/50 px-2 -mx-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-[var(--toka-bg-secondary)] flex items-center justify-center shrink-0 text-[var(--toka-text-primary)]">
                    <HabitIcon name={habit.icon} size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-[var(--toka-text-primary)] truncate">
                      {habit.title}
                      {habit.status === 'archived' ? ' (Archived)' : ''}
                    </div>
                    <div className="text-xs text-[var(--toka-text-secondary)]">
                      {habit.category} · {stats.totalCompletions} completions · Best{' '}
                      {stats.bestStreak}d
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:block w-28 h-2 rounded-full bg-[var(--toka-bg-secondary)] overflow-hidden">
                    <div
                      className="h-full bg-[#C6FF69] rounded-full"
                      style={{ width: `${stats.completionRate}%` }}
                    />
                  </div>
                  <span className="font-mono-num text-sm font-semibold text-[var(--toka-text-primary)] w-12 text-right">
                    {stats.completionRate}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
