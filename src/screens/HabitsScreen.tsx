import { useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { HabitIcon } from '../components/HabitIcon.tsx';
import { HABIT_CATEGORIES } from '../constants/habits.ts';
import { useHabitData } from '../hooks/useHabitData.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import type { Habit } from '../types/index.ts';
import { formatFrequencySummary } from '../utils/habitLogic.ts';

export function HabitsScreen() {
  const { habits, habitStatsMap } = useHabitData();
  const navigateToScreen = useTokaStore((s) => s.navigateToScreen);
  const updateHabit = useTokaStore((s) => s.updateHabit);
  const deleteHabit = useTokaStore((s) => s.deleteHabit);

  const [statusFilter, setStatusFilter] = useState<'active' | 'archived'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredHabits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return habits.filter((h) => {
      if (h.status !== statusFilter) return false;
      if (categoryFilter !== 'All' && h.category !== categoryFilter) return false;
      if (q && !h.title.toLowerCase().includes(q) && !h.description.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [habits, statusFilter, categoryFilter, searchQuery]);

  const activeCount = habits.filter((h) => h.status === 'active').length;
  const archivedCount = habits.filter((h) => h.status === 'archived').length;

  const handleConfirmDelete = async () => {
    if (!habitToDelete) return;
    setDeleting(true);
    await deleteHabit(habitToDelete.id);
    setDeleting(false);
    setHabitToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
            Habits
          </h1>
          <p className="mt-1 text-sm text-[var(--toka-text-secondary)]">
            Manage schedules, reminders, categories, and archived routines.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateToScreen('create-habit')}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6FF69] text-[#121512] text-sm font-semibold inline-flex items-center justify-center gap-2 hover:brightness-95 transition-all whitespace-nowrap shrink-0"
        >
          <Plus size={17} strokeWidth={2.5} />
          <span>Create Habit</span>
        </button>
      </div>

      {/* Filters toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] self-start">
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              statusFilter === 'active'
                ? 'bg-[#C6FF69] text-[#121512]'
                : 'text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)]'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('archived')}
            className={`min-h-[38px] px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              statusFilter === 'archived'
                ? 'bg-[#C6FF69] text-[#121512]'
                : 'text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)]'
            }`}
          >
            Archived ({archivedCount})
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--toka-text-secondary)]"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search habits..."
            aria-label="Search habits"
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] text-sm text-[var(--toka-text-primary)] placeholder:text-[var(--toka-text-secondary)] focus:outline-none focus:border-[#C6FF69]"
          />
        </div>
      </div>

      {/* Category filter row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['All', ...HABIT_CATEGORIES].map((cat) => {
          const active = categoryFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[var(--toka-text-primary)] text-[var(--toka-bg-primary)] border-transparent'
                  : 'bg-[var(--toka-bg-card)] text-[var(--toka-text-secondary)] border-[var(--toka-border)] hover:text-[var(--toka-text-primary)]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Habit rows */}
      {filteredHabits.length === 0 ? (
        <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-8 text-center">
          <p className="text-base font-medium text-[var(--toka-text-primary)]">
            {statusFilter === 'archived'
              ? 'No archived habits'
              : searchQuery || categoryFilter !== 'All'
              ? 'No matching habits found'
              : 'No habits created yet'}
          </p>
          <p className="mt-1 text-sm text-[var(--toka-text-secondary)]">
            {statusFilter === 'active'
              ? 'Create a habit with custom frequency and reminders to begin tracking.'
              : 'Archived habits stay preserved with their historical completion data.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredHabits.map((habit) => {
            const stats = habitStatsMap.get(habit.id);
            return (
              <div
                key={habit.id}
                onClick={() => navigateToScreen('habit-details', habit.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateToScreen('habit-details', habit.id);
                  }
                }}
                className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-4 hover:border-[#929B93]/50 transition-colors cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[var(--toka-bg-secondary)] flex items-center justify-center shrink-0 text-[var(--toka-text-primary)]">
                    <HabitIcon name={habit.icon} size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-medium text-[var(--toka-text-primary)] truncate">
                      {habit.title}
                    </h3>
                    <div className="mt-0.5 text-xs text-[var(--toka-text-secondary)] truncate">
                      {habit.category} · {formatFrequencySummary(habit)}
                      {habit.reminderTime ? ` · ${habit.reminderTime}` : ''}
                    </div>
                    <div className="mt-1 font-mono-num text-xs text-[var(--toka-accent-text)]">
                      {stats?.completionRate ?? 0}% consistency · {stats?.currentStreak ?? 0}d streak
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-1 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => navigateToScreen('edit-habit', habit.id)}
                    aria-label={`Edit ${habit.title}`}
                    className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateHabit(habit.id, {
                        status: habit.status === 'active' ? 'archived' : 'active',
                      })
                    }
                    aria-label={
                      habit.status === 'active'
                        ? `Archive ${habit.title}`
                        : `Restore ${habit.title}`
                    }
                    className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors"
                  >
                    {habit.status === 'active' ? (
                      <Archive size={16} />
                    ) : (
                      <ArchiveRestore size={16} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHabitToDelete(habit)}
                    aria-label={`Delete ${habit.title}`}
                    className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[var(--toka-text-secondary)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(habitToDelete)}
        title="Delete habit?"
        description={`Deleting "${habitToDelete?.title}" will permanently remove the habit and all its completion history. Consider archiving if you want to keep your past analytics.`}
        confirmLabel="Delete Habit"
        destructive
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setHabitToDelete(null)}
      />
    </div>
  );
}
