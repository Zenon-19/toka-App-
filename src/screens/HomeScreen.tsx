import { useMemo } from 'react';
import { Flame, Plus, Sparkles } from 'lucide-react';
import { HabitCard } from '../components/HabitCard.tsx';
import { ProgressRing } from '../components/ProgressRing.tsx';
import { useHabitData } from '../hooks/useHabitData.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import {
  formatReadableDate,
  getCurrentTimeInTimezone,
  getGreetingForTimezone,
} from '../utils/date.ts';
import { getTimeOfDayBucket, isHabitCompletedOnDate } from '../utils/habitLogic.ts';
import type { TimeOfDayBucket } from '../utils/habitLogic.ts';

const TIME_BUCKETS: TimeOfDayBucket[] = ['Morning', 'Afternoon', 'Evening'];

export function HomeScreen() {
  const profile = useTokaStore((s) => s.profile);
  const workspaceLoading = useTokaStore((s) => s.workspaceLoading);
  const workspaceError = useTokaStore((s) => s.workspaceError);
  const loadWorkspace = useTokaStore((s) => s.loadWorkspace);
  const selectedDate = useTokaStore((s) => s.selectedDate);
  const setSelectedDate = useTokaStore((s) => s.setSelectedDate);
  const toggleCompletion = useTokaStore((s) => s.toggleCompletion);
  const navigateToScreen = useTokaStore((s) => s.navigateToScreen);

  const {
    selectedDayHabits,
    selectedDaySummary,
    todayStr,
    timezone,
    overallStreaks,
    weeklySeries,
    completionLookup,
    activeHabits,
  } = useHabitData();

  const rawFirstName = (profile?.name || '').trim().split(/\s+/)[0] || '';
  const greeting = getGreetingForTimezone(timezone);
  const greetingHeading = rawFirstName ? `${greeting}, ${rawFirstName}` : greeting;

  const remainingCount = Math.max(
    0,
    selectedDaySummary.scheduledCount - selectedDaySummary.completedCount
  );

  const isViewingToday = selectedDate === todayStr;
  const { hhmm: currentHhmm } = getCurrentTimeInTimezone(timezone);

  const groupedHabits = useMemo(() => {
    const groups: Record<TimeOfDayBucket, typeof selectedDayHabits> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
    };
    for (const habit of selectedDayHabits) {
      groups[getTimeOfDayBucket(habit.reminderTime)].push(habit);
    }
    return TIME_BUCKETS.map((bucket) => ({
      bucket,
      items: groups[bucket].sort((a, b) => {
        if (a.reminderTime && b.reminderTime) return a.reminderTime.localeCompare(b.reminderTime);
        if (a.reminderTime) return -1;
        if (b.reminderTime) return 1;
        return a.createdAt.localeCompare(b.createdAt);
      }),
    })).filter((g) => g.items.length > 0);
  }, [selectedDayHabits]);

  const nextUpHabit = useMemo(() => {
    if (!isViewingToday || selectedDayHabits.length === 0) return null;
    const uncompleted = selectedDayHabits.filter(
      (h) => !isHabitCompletedOnDate(completionLookup, h.id, selectedDate)
    );
    if (uncompleted.length === 0) return null;
    const withUpcomingTime = uncompleted
      .filter((h) => h.reminderTime && h.reminderTime >= currentHhmm)
      .sort((a, b) => (a.reminderTime || '').localeCompare(b.reminderTime || ''));
    if (withUpcomingTime.length > 0) return withUpcomingTime[0];
    return uncompleted[0];
  }, [isViewingToday, selectedDayHabits, completionLookup, selectedDate, currentHhmm]);

  if (workspaceError) {
    return (
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-8 text-center">
        <p className="text-base font-medium text-[var(--toka-text-primary)]">
          Could not load your habits
        </p>
        <p className="mt-1 text-sm text-[var(--toka-text-secondary)]">{workspaceError}</p>
        <button
          type="button"
          onClick={loadWorkspace}
          className="mt-5 min-h-[44px] px-5 py-2 rounded-xl bg-[#C6FF69] text-[#121512] text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting & Date Header (no repeated "Today", no duplicate New Habit button) */}
      <div>
        <p className="text-xs font-medium text-[var(--toka-text-secondary)]">
          {formatReadableDate(selectedDate)}
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
          {greetingHeading}
        </h1>
      </div>

      {/* Top Bento Summary: Progress Ring + Weekly Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-5 rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6 flex items-center gap-6">
          <ProgressRing
            percentage={selectedDaySummary.percentage}
            size={112}
            strokeWidth={9}
            sublabel="done"
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-[var(--toka-text-secondary)]">
              Daily progress
            </div>
            <div className="mt-1 tabular-nums text-xl font-semibold text-[var(--toka-text-primary)]">
              {selectedDaySummary.completedCount} / {selectedDaySummary.scheduledCount} completed
            </div>
            <p className="mt-1.5 text-xs text-[var(--toka-text-secondary)] leading-relaxed">
              {selectedDaySummary.scheduledCount === 0
                ? 'No habits scheduled for this day.'
                : remainingCount === 0
                ? 'All scheduled habits complete. Strong consistency.'
                : `${remainingCount} ${remainingCount === 1 ? 'habit' : 'habits'} remaining.`}
            </p>
            <div className="mt-3 pt-3 border-t border-[var(--toka-border)] flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 tabular-nums text-[var(--toka-text-primary)]">
                <Flame size={14} className="text-[var(--toka-text-secondary)]" aria-hidden="true" />
                {overallStreaks.currentStreak}d current
              </span>
              <span className="text-[var(--toka-text-secondary)] tabular-nums">
                {overallStreaks.bestStreak}d best
              </span>
            </div>
          </div>
        </div>

        {/* 7-day week strip (Today = outline with lime dot) */}
        <div className="lg:col-span-7 rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--toka-text-primary)]">
                This week
              </h2>
              <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
                Tap any day to inspect or update completion status
              </p>
            </div>
            {selectedDate !== todayStr ? (
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className="min-h-[44px] px-3.5 rounded-xl text-xs font-medium bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-[var(--toka-text-primary)] hover:border-[#929B93] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
              >
                Jump to today
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weeklySeries.map((day) => {
              const isSelected = day.date === selectedDate;
              const isToday = day.date === todayStr;
              const allDone = day.scheduledCount > 0 && day.completedCount === day.scheduledCount;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  aria-label={`${day.label} ${day.shortNum}${isToday ? ' (Today)' : ''}, ${day.percentage}% complete`}
                  aria-pressed={isSelected}
                  className={`min-h-[78px] rounded-xl p-2 flex flex-col items-center justify-between transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
                    isToday
                      ? 'bg-[var(--toka-bg-secondary)] border-2 border-[#C6FF69] text-[var(--toka-text-primary)]'
                      : isSelected
                      ? 'bg-[var(--toka-bg-secondary)] border-2 border-[var(--toka-text-primary)] text-[var(--toka-text-primary)]'
                      : 'bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-[var(--toka-text-primary)] hover:border-[#929B93]/60'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-[var(--toka-text-secondary)]">
                      {day.label}
                    </span>
                    {isToday ? (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#C6FF69]"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  <span className="tabular-nums text-sm font-semibold">{day.shortNum}</span>
                  <div className="w-full h-1.5 rounded-full overflow-hidden bg-[var(--toka-border)]">
                    <div
                      className={`h-full rounded-full ${
                        allDone ? 'bg-[#C6FF69]' : 'bg-[#C6FF69]/70'
                      }`}
                      style={{ width: `${day.percentage}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scheduled Habits Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
              {isViewingToday ? "Today's Habits" : `Habits for ${formatReadableDate(selectedDate)}`}
            </h2>
            {isViewingToday && selectedDayHabits.length > 0 ? (
              <p className="mt-0.5 text-xs text-[var(--toka-text-secondary)]">
                {nextUpHabit
                  ? `Next up: ${nextUpHabit.title}${nextUpHabit.reminderTime ? ` · ${nextUpHabit.reminderTime}` : ''}`
                  : 'All scheduled habits complete for today.'}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="tabular-nums text-xs text-[var(--toka-text-secondary)]">
              {selectedDayHabits.length} scheduled
            </span>
            <button
              type="button"
              onClick={() => navigateToScreen('create-habit')}
              aria-label="Quick add habit"
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] text-xs font-medium text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
            >
              <Plus size={14} strokeWidth={2.25} />
              <span>Quick add</span>
            </button>
          </div>
        </div>

        {workspaceLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[76px] rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] animate-pulse"
              />
            ))}
          </div>
        ) : selectedDayHabits.length === 0 ? (
          <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-8 text-center">
            <div className="w-11 h-11 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] flex items-center justify-center mx-auto mb-3 text-[var(--toka-accent-text)]">
              <Sparkles size={20} />
            </div>
            <h3 className="text-base font-medium text-[var(--toka-text-primary)]">
              {activeHabits.length === 0
                ? 'Your routine is ready for its first habit'
                : 'Rest day — nothing scheduled'}
            </h3>
            <p className="mt-1.5 text-sm text-[var(--toka-text-secondary)] max-w-md mx-auto">
              {activeHabits.length === 0
                ? 'Start small. One repeatable daily action beats an ambitious plan you abandon.'
                : 'None of your active habits are scheduled on this date.'}
            </p>
            <button
              type="button"
              onClick={() => navigateToScreen('create-habit')}
              className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#C6FF69] text-[#121512] text-sm font-semibold inline-flex items-center gap-2 hover:brightness-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create Habit</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedHabits.map(({ bucket, items }) => (
              <section key={bucket} aria-label={`${bucket} habits`} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--toka-text-secondary)]">
                    {bucket}
                  </h3>
                  <span className="tabular-nums text-xs text-[var(--toka-text-secondary)]">
                    {items.filter((h) => isHabitCompletedOnDate(completionLookup, h.id, selectedDate)).length}
                    /{items.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((habit) => {
                    const completed = isHabitCompletedOnDate(
                      completionLookup,
                      habit.id,
                      selectedDate
                    );
                    const isStillOpen =
                      isViewingToday &&
                      !completed &&
                      Boolean(habit.reminderTime && habit.reminderTime < currentHhmm);

                    return (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        completed={completed}
                        streak={habit.streak}
                        statusHint={isStillOpen ? 'Still open' : null}
                        onToggle={() => toggleCompletion(habit.id, selectedDate)}
                        onSelect={() => navigateToScreen('habit-details', habit.id)}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
