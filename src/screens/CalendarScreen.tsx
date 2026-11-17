import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { HabitIcon } from '../components/HabitIcon.tsx';
import { MonthlyCalendar } from '../components/MonthlyCalendar.tsx';
import type { DayCellState } from '../components/MonthlyCalendar.tsx';
import { useHabitData } from '../hooks/useHabitData.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import { formatReadableDate } from '../utils/date.ts';
import {
  getDailySummary,
  isHabitCompletedOnDate,
  isHabitScheduledOnDate,
} from '../utils/habitLogic.ts';

export function CalendarScreen() {
  const navigateToTab = useTokaStore((s) => s.navigateToTab);
  const navigateToScreen = useTokaStore((s) => s.navigateToScreen);
  const toggleCompletion = useTokaStore((s) => s.toggleCompletion);
  const { activeHabits, habits, completionLookup, todayStr } = useHabitData();

  const [todayYear, todayMonth] = todayStr.split('-').map(Number);
  const [calYear, setCalYear] = useState(todayYear);
  const [calMonthIdx, setCalMonthIdx] = useState((todayMonth || 1) - 1);
  const [inspectDate, setInspectDate] = useState(todayStr);

  const getDayState = (dateStr: string): { state: DayCellState } => {
    if (dateStr > todayStr) return { state: 'future' };
    const summary = getDailySummary(habits, completionLookup, dateStr);
    if (summary.scheduledCount === 0) return { state: 'unscheduled' };
    if (summary.completedCount === summary.scheduledCount) return { state: 'completed' };
    if (summary.completedCount > 0) return { state: 'partial' };
    if (dateStr === todayStr) return { state: 'unscheduled' };
    return { state: 'missed' };
  };

  const habitsForInspectDate = activeHabits.filter((h) =>
    isHabitScheduledOnDate(h, inspectDate)
  );
  const inspectSummary = getDailySummary(habits, completionLookup, inspectDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateToTab('home')}
          aria-label="Back to Home"
          className="min-h-[44px] min-w-[44px] rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] flex items-center justify-center text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
            Calendar & History
          </h1>
          <p className="text-xs sm:text-sm text-[var(--toka-text-secondary)]">
            Inspect any month and correct historical completion records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-7">
          <MonthlyCalendar
            year={calYear}
            monthIndex={calMonthIdx}
            todayStr={todayStr}
            selectedDate={inspectDate}
            onChangeMonth={(y, m) => {
              setCalYear(y);
              setCalMonthIdx(m);
            }}
            onSelectDate={setInspectDate}
            getDayState={getDayState}
          />
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-[var(--toka-border)]">
            <div>
              <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
                {formatReadableDate(inspectDate)}
              </h2>
              <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5 tabular-nums">
                {inspectSummary.completedCount} / {inspectSummary.scheduledCount} completed (
                {inspectSummary.percentage}%)
              </p>
            </div>
            {inspectDate !== todayStr ? (
              <button
                type="button"
                onClick={() => {
                  setInspectDate(todayStr);
                  setCalYear(todayYear);
                  setCalMonthIdx((todayMonth || 1) - 1);
                }}
                className="min-h-[44px] px-3.5 rounded-xl text-xs font-medium bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-[var(--toka-text-primary)] hover:border-[#929B93] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
              >
                Today
              </button>
            ) : null}
          </div>

          {inspectDate > todayStr ? (
            <p className="py-6 text-sm text-[var(--toka-text-secondary)]">
              Future dates cannot be marked completed in advance.
            </p>
          ) : habitsForInspectDate.length === 0 ? (
            <p className="py-6 text-sm text-[var(--toka-text-secondary)]">
              No active habits scheduled on this date.
            </p>
          ) : (
            <div className="divide-y divide-[var(--toka-border)] mt-2">
              {habitsForInspectDate.map((habit) => {
                const done = isHabitCompletedOnDate(completionLookup, habit.id, inspectDate);
                return (
                  <div
                    key={habit.id}
                    className="py-3 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => navigateToScreen('habit-details', habit.id)}
                      className="min-h-[44px] flex items-center gap-3 min-w-0 text-left flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[var(--toka-bg-secondary)] flex items-center justify-center shrink-0 text-[var(--toka-text-primary)]">
                        <HabitIcon name={habit.icon} size={17} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-[var(--toka-text-primary)] truncate">
                          {habit.title}
                        </div>
                        <div className="text-xs text-[var(--toka-text-secondary)]">
                          {habit.category}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCompletion(habit.id, inspectDate)}
                      aria-label={`Toggle ${habit.title} on ${inspectDate}`}
                      aria-pressed={done}
                      className={`w-11 h-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
                        done
                          ? 'bg-[#C6FF69] border-2 border-[#C6FF69] text-[#121512] toka-check-pop'
                          : 'bg-transparent border-2 border-[#586359] dark:border-[#768077] text-transparent hover:border-[#C6FF69]'
                      }`}
                    >
                      <Check size={18} strokeWidth={3} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
