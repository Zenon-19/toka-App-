import { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, ArrowLeft, Check, Pencil, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { HabitIcon } from '../components/HabitIcon.tsx';
import { MonthlyCalendar } from '../components/MonthlyCalendar.tsx';
import type { DayCellState } from '../components/MonthlyCalendar.tsx';
import { useHabitData } from '../hooks/useHabitData.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import { formatShortDate } from '../utils/date.ts';
import {
  formatFrequencySummary,
  isHabitCompletedOnDate,
  isHabitScheduledOnDate,
} from '../utils/habitLogic.ts';

export function HabitDetailsScreen() {
  const selectedHabitId = useTokaStore((s) => s.selectedHabitId);
  const navigateToScreen = useTokaStore((s) => s.navigateToScreen);
  const navigateToTab = useTokaStore((s) => s.navigateToTab);
  const updateHabit = useTokaStore((s) => s.updateHabit);
  const deleteHabit = useTokaStore((s) => s.deleteHabit);
  const toggleCompletion = useTokaStore((s) => s.toggleCompletion);

  const { getHabitById, habitStatsMap, completionLookup, completions, todayStr } = useHabitData();
  const habit = getHabitById(selectedHabitId);

  const [todayYear, todayMonth] = todayStr.split('-').map(Number);
  const [calYear, setCalYear] = useState(todayYear);
  const [calMonthIdx, setCalMonthIdx] = useState((todayMonth || 1) - 1);
  const [inspectDate, setInspectDate] = useState(todayStr);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const habitCompletions = useMemo(() => {
    if (!habit) return [];
    return completions
      .filter((c) => c.habitId === habit.id && c.completed)
      .sort((a, b) => (a.completionDate < b.completionDate ? 1 : -1));
  }, [completions, habit]);

  if (!habit) {
    return (
      <div className="max-w-2xl mx-auto rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-8 text-center">
        <p className="text-base font-medium text-[var(--toka-text-primary)]">
          Habit not found
        </p>
        <button
          type="button"
          onClick={() => navigateToTab('habits')}
          className="mt-4 min-h-[44px] px-5 py-2 rounded-xl bg-[#C6FF69] text-[#121512] text-sm font-semibold"
        >
          Back to Habits
        </button>
      </div>
    );
  }

  const stats = habitStatsMap.get(habit.id);

  const getDayState = (dateStr: string): { state: DayCellState } => {
    const completed = isHabitCompletedOnDate(completionLookup, habit.id, dateStr);
    if (completed) return { state: 'completed' };
    if (dateStr > todayStr) return { state: 'future' };
    if (isHabitScheduledOnDate(habit, dateStr)) {
      if (dateStr === todayStr) return { state: 'unscheduled' };
      return { state: 'missed' };
    }
    return { state: 'unscheduled' };
  };

  const inspectCompleted = isHabitCompletedOnDate(completionLookup, habit.id, inspectDate);
  const inspectScheduled = isHabitScheduledOnDate(habit, inspectDate);

  const handleDelete = async () => {
    setDeleting(true);
    const ok = await deleteHabit(habit.id);
    setDeleting(false);
    if (ok) {
      setConfirmDeleteOpen(false);
      navigateToTab('habits');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <button
            type="button"
            onClick={() => navigateToTab('habits')}
            aria-label="Back to habits"
            className="min-h-[44px] min-w-[44px] rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] flex items-center justify-center text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] flex items-center justify-center shrink-0 text-[var(--toka-accent-text)]">
                <HabitIcon name={habit.icon} size={18} />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--toka-text-primary)] truncate">
                {habit.title}
              </h1>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-[var(--toka-text-secondary)]">
              {habit.category} · {formatFrequencySummary(habit)}
              {habit.reminderTime ? ` · ${habit.reminderTime}` : ''} · Started{' '}
              {formatShortDate(habit.startDate)}
              {habit.status === 'archived' ? ' · Archived' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigateToScreen('edit-habit', habit.id)}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] text-sm font-medium text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Pencil size={15} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={() =>
              updateHabit(habit.id, {
                status: habit.status === 'active' ? 'archived' : 'active',
              })
            }
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] text-sm font-medium text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            {habit.status === 'active' ? (
              <>
                <Archive size={15} />
                <span>Archive</span>
              </>
            ) : (
              <>
                <ArchiveRestore size={15} />
                <span>Restore</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            aria-label="Delete habit"
            className="min-h-[44px] min-w-[44px] rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-colors shrink-0"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {habit.description ? (
        <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-4 sm:p-5 text-sm text-[var(--toka-text-secondary)] leading-relaxed">
          {habit.description}
        </div>
      ) : null}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-4 sm:p-5">
          <div className="text-xs text-[var(--toka-text-secondary)]">Current streak</div>
          <div className="mt-1.5 font-mono-num text-2xl font-semibold text-[var(--toka-accent-text)]">
            {stats?.currentStreak ?? 0}d
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-4 sm:p-5">
          <div className="text-xs text-[var(--toka-text-secondary)]">Best streak</div>
          <div className="mt-1.5 font-mono-num text-2xl font-semibold text-[var(--toka-text-primary)]">
            {stats?.bestStreak ?? 0}d
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-4 sm:p-5">
          <div className="text-xs text-[var(--toka-text-secondary)]">Total completions</div>
          <div className="mt-1.5 font-mono-num text-2xl font-semibold text-[var(--toka-text-primary)]">
            {stats?.totalCompletions ?? 0}
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-4 sm:p-5">
          <div className="text-xs text-[var(--toka-text-secondary)]">Completion rate</div>
          <div className="mt-1.5 font-mono-num text-2xl font-semibold text-[var(--toka-text-primary)]">
            {stats?.completionRate ?? 0}%
          </div>
        </div>
      </div>

      {/* Monthly Calendar + Date Correction + Log */}
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

        <div className="lg:col-span-5 space-y-4">
          {/* Selected date inspector / correction */}
          <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5">
            <div className="text-xs font-medium text-[var(--toka-text-secondary)]">
              Selected date
            </div>
            <div className="mt-1 text-base font-semibold text-[var(--toka-text-primary)]">
              {formatShortDate(inspectDate)}
            </div>
            <p className="mt-1 text-xs text-[var(--toka-text-secondary)]">
              {inspectDate > todayStr
                ? 'Future date — cannot log ahead of time.'
                : inspectScheduled
                ? 'Scheduled day. You can update or correct completion status below.'
                : 'Unscheduled rest day. Logging still counts toward total completions.'}
            </p>
            <button
              type="button"
              disabled={inspectDate > todayStr}
              onClick={() => toggleCompletion(habit.id, inspectDate)}
              className={`mt-4 w-full min-h-[46px] px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
                inspectCompleted
                  ? 'bg-[#C6FF69] text-[#121512]'
                  : 'bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-[var(--toka-text-primary)] hover:border-[#C6FF69]'
              }`}
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{inspectCompleted ? 'Completed (Tap to Undo)' : 'Mark as Completed'}</span>
            </button>
          </div>

          {/* Historical log */}
          <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--toka-text-primary)]">
                Recent completions
              </h3>
              <span className="font-mono-num text-xs text-[var(--toka-text-secondary)]">
                {habitCompletions.length} total
              </span>
            </div>
            {habitCompletions.length === 0 ? (
              <p className="text-xs text-[var(--toka-text-secondary)] py-3">
                No completions logged for this habit yet.
              </p>
            ) : (
              <div className="divide-y divide-[var(--toka-border)] max-h-60 overflow-y-auto">
                {habitCompletions.slice(0, 20).map((entry) => (
                  <div
                    key={entry.id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono-num text-[var(--toka-text-primary)]">
                      {formatShortDate(entry.completionDate)}
                    </span>
                    <span className="text-[var(--toka-accent-text)] font-medium">Completed</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete habit?"
        description={`Deleting "${habit.title}" removes the habit and its historical records permanently.`}
        confirmLabel="Delete Habit"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
