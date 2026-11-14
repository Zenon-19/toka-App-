import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { HabitForm } from '../components/HabitForm.tsx';
import { useHabitData } from '../hooks/useHabitData.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import type { HabitInput } from '../types/index.ts';

export function EditHabitScreen() {
  const selectedHabitId = useTokaStore((s) => s.selectedHabitId);
  const updateHabit = useTokaStore((s) => s.updateHabit);
  const navigateToScreen = useTokaStore((s) => s.navigateToScreen);
  const navigateToTab = useTokaStore((s) => s.navigateToTab);
  const { getHabitById } = useHabitData();

  const [submitting, setSubmitting] = useState(false);
  const habit = getHabitById(selectedHabitId);

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

  const handleSubmit = async (values: HabitInput) => {
    setSubmitting(true);
    const updated = await updateHabit(habit.id, values);
    setSubmitting(false);
    if (updated) {
      navigateToScreen('habit-details', habit.id);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateToScreen('habit-details', habit.id)}
          aria-label="Back to habit details"
          className="min-h-[44px] min-w-[44px] rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] flex items-center justify-center text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
            Edit Habit
          </h1>
          <p className="text-xs sm:text-sm text-[var(--toka-text-secondary)] truncate">
            {habit.title}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-7">
        <HabitForm
          initialValues={{
            title: habit.title,
            description: habit.description,
            category: habit.category,
            icon: habit.icon,
            frequency: habit.frequency,
            selectedDays: habit.selectedDays,
            reminderTime: habit.reminderTime,
            startDate: habit.startDate,
          }}
          submitLabel="Save Changes"
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => navigateToScreen('habit-details', habit.id)}
        />
      </div>
    </div>
  );
}
