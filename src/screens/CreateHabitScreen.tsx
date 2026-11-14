import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { HabitForm } from '../components/HabitForm.tsx';
import { useTokaStore } from '../store/useTokaStore.ts';
import type { HabitInput } from '../types/index.ts';
import { getTodayInTimezone } from '../utils/date.ts';

export function CreateHabitScreen() {
  const settings = useTokaStore((s) => s.settings);
  const createHabit = useTokaStore((s) => s.createHabit);
  const navigateToTab = useTokaStore((s) => s.navigateToTab);
  const [submitting, setSubmitting] = useState(false);

  const todayStr = getTodayInTimezone(settings?.timezone || 'UTC');

  const handleSubmit = async (values: HabitInput) => {
    setSubmitting(true);
    const created = await createHabit(values);
    setSubmitting(false);
    if (created) {
      navigateToTab('home');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateToTab('habits')}
          aria-label="Back"
          className="min-h-[44px] min-w-[44px] rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] flex items-center justify-center text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
            Create Habit
          </h1>
          <p className="text-xs sm:text-sm text-[var(--toka-text-secondary)]">
            Define a clear, repeatable action and schedule.
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-7">
        <HabitForm
          initialValues={{
            title: '',
            description: '',
            category: 'Personal Development',
            icon: 'Sun',
            frequency: 'daily',
            selectedDays: [0, 1, 2, 3, 4, 5, 6],
            reminderTime: '08:00',
            startDate: todayStr,
          }}
          submitLabel="Create Habit"
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => navigateToTab('habits')}
        />
      </div>
    </div>
  );
}
