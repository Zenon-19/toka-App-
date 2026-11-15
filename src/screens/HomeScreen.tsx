import { Calendar, Flame, Plus, Sparkles } from 'lucide-react';
import { HabitCard } from '../components/HabitCard.tsx';
import { ProgressRing } from '../components/ProgressRing.tsx';
import { useHabitData } from '../hooks/useHabitData.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import { formatReadableDate, getGreetingForTimezone } from '../utils/date.ts';
import { isHabitCompletedOnDate } from '../utils/habitLogic.ts';

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

  const firstName = (profile?.name || 'Member').split(' ')[0];
  const greeting = getGreetingForTimezone(timezone);
  const remainingCount = Math.max(
    0,
    selectedDaySummary.scheduledCount - selectedDaySummary.completedCount
  );

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
          className="mt-5 min-h-[44px] px-5 py-2 rounded-xl bg-[#C6FF69] text-[#121512] text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting & Quick Add Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[var(--toka-text-secondary)]">
            {formatReadableDate(selectedDate)}
            {selectedDate === todayStr ? ' · Today' : ''}
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
            {greeting}, {firstName}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigateToScreen('calendar')}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] text-sm font-medium text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Calendar size={16} className="text-[var(--toka-text-secondary)]" />
            <span>History</span>
          </button>
          <button
            type="button"
            onClick={() => navigateToScreen('create-habit')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6FF69] text-[#121512] text-sm font-semibold inline-flex items-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
          >
            <Plus size={17} strokeWidth={2.5} />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* Top Bento Summary: Progress Ring + Streak & Weekly Preview */}
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
            <div className="mt-1 font-mono-num text-xl font-semibold text-[var(--toka-text-primary)]">
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
              <span className="inline-flex items-center gap-1.5 font-mono-num text-[var(--toka-text-primary)]">
                <Flame size={14} className="text-[var(--toka-accent-text)]" />
                {overallStreaks.currentStreak}d current
              </span>
              <span className="text-[var(--toka-text-secondary)] font-mono-num">
                {overallStreaks.bestStreak}d best
              </span>
            </div>
          </div>
        </div>

        {/* 7-day interactive scroller / weekly preview */}
        <div className="lg:col-span-7 rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
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
                className="min-h-[34px] px-3 rounded-lg text-xs font-medium bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-[var(--toka-accent-text)] hover:border-[#C6FF69]/60 transition-colors"
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
                  className={`min-h-[76px] rounded-xl p-2 flex flex-col items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-[#C6FF69] text-[#121512] border-[#C6FF69]'
                      : 'bg-[var(--toka-bg-secondary)] border-[var(--toka-border)] text-[var(--toka-text-primary)] hover:border-[#929B93]/60'
                  }`}
                >
                  <span
                    className={`text-[11px] font-medium ${
                      isSelected ? 'text-[#121512]/80' : 'text-[var(--toka-text-secondary)]'
                    }`}
                  >
                    {day.label}
                  </span>
                  <span className="font-mono-num text-sm font-semibold">{day.shortNum}</span>
                  <div
                    className={`w-full h-1.5 rounded-full overflow-hidden ${
                      isSelected ? 'bg-[#121512]/20' : 'bg-[var(--toka-border)]'
                    }`}
                  >
                    <div
                      className={`h-full rounded-full ${
                        isSelected
                          ? 'bg-[#121512]'
                          : allDone
                          ? 'bg-[#C6FF69]'
                          : 'bg-[#C6FF69]/65'
                      }`}
                      style={{ width: `${day.percentage}%` }}
                    />
                  </div>
                  {isToday && !isSelected ? (
                    <span className="sr-only">Today</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scheduled Habit Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
            {selectedDate === todayStr ? "Today's Habits" : `Habits for ${formatReadableDate(selectedDate)}`}
          </h2>
          <span className="font-mono-num text-xs text-[var(--toka-text-secondary)]">
            {selectedDayHabits.length} scheduled
          </span>
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
              className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#C6FF69] text-[#121512] text-sm font-semibold inline-flex items-center gap-2 hover:brightness-95 transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Create Habit</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedDayHabits.map((habit) => {
              const completed = isHabitCompletedOnDate(completionLookup, habit.id, selectedDate);
              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  completed={completed}
                  streak={habit.streak}
                  onToggle={() => toggleCompletion(habit.id, selectedDate)}
                  onSelect={() => navigateToScreen('habit-details', habit.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
