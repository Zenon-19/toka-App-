import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  FREQUENCY_OPTIONS,
  HABIT_CATEGORIES,
  HABIT_ICON_NAMES,
  WEEKDAYS_SHORT,
} from '../constants/habits.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import type { HabitCategory, HabitFrequency, HabitInput } from '../types/index.ts';
import { getBrowserTimezone, getTodayInTimezone } from '../utils/date.ts';
import { HabitIcon } from './HabitIcon.tsx';

interface HabitFormProps {
  initialValues?: HabitInput;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (values: HabitInput) => Promise<void>;
  onCancel: () => void;
}

export function HabitForm({
  initialValues,
  submitLabel,
  submitting = false,
  onSubmit,
  onCancel,
}: HabitFormProps) {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [category, setCategory] = useState<HabitCategory>(
    initialValues?.category || 'Personal Development'
  );
  const [icon, setIcon] = useState<string>(initialValues?.icon || 'Sun');
  const [frequency, setFrequency] = useState<HabitFrequency>(
    initialValues?.frequency || 'daily'
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialValues?.selectedDays?.length ? initialValues.selectedDays : [1, 2, 3, 4, 5]
  );
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(
    Boolean(initialValues?.reminderTime)
  );
  const timezone = useTokaStore((s) => s.settings?.timezone) || getBrowserTimezone();
  const [reminderTime, setReminderTime] = useState<string>(
    initialValues?.reminderTime || '08:00'
  );
  const [startDate, setStartDate] = useState<string>(
    initialValues?.startDate || getTodayInTimezone(timezone)
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleDay = (dayIdx: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx].sort()
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setValidationError('Please enter a habit title.');
      return;
    }
    if (trimmedTitle.length > 80) {
      setValidationError('Habit title should be 80 characters or fewer.');
      return;
    }
    if (frequency === 'custom' && selectedDays.length === 0) {
      setValidationError('Select at least one weekday for your custom schedule.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      setValidationError('Please choose a valid start date.');
      return;
    }

    setValidationError(null);
    await onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      category,
      icon,
      frequency,
      selectedDays:
        frequency === 'daily'
          ? [0, 1, 2, 3, 4, 5, 6]
          : frequency === 'weekdays'
          ? [1, 2, 3, 4, 5]
          : selectedDays,
      reminderTime: reminderEnabled ? reminderTime : null,
      startDate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {validationError ? (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400"
        >
          {validationError}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="habit-title"
          className="block text-sm font-medium text-[var(--toka-text-primary)] mb-2"
        >
          Habit name
        </label>
        <input
          id="habit-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Morning Mobility, Deep Reading"
          maxLength={80}
          className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-[var(--toka-text-primary)] placeholder:text-[var(--toka-text-secondary)]/60 focus:outline-none focus:border-[#C6FF69]"
        />
      </div>

      <div>
        <label
          htmlFor="habit-description"
          className="block text-sm font-medium text-[var(--toka-text-primary)] mb-2"
        >
          Description <span className="text-[var(--toka-text-secondary)] font-normal">(optional)</span>
        </label>
        <textarea
          id="habit-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Define your minimum viable commitment for busy days."
          className="w-full px-4 py-3 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-[var(--toka-text-primary)] placeholder:text-[var(--toka-text-secondary)]/60 focus:outline-none focus:border-[#C6FF69] resize-none"
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-[var(--toka-text-primary)] mb-2">
          Category
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {HABIT_CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-left transition-colors truncate border focus-visible:outline-2 focus-visible:outline-[#C6FF69] focus-visible:outline-offset-2 ${
                  active
                    ? 'bg-[#C6FF69]/12 text-[var(--toka-text-primary)] border-[#C6FF69]'
                    : 'bg-[var(--toka-bg-secondary)] text-[var(--toka-text-secondary)] border-[var(--toka-border)] hover:text-[var(--toka-text-primary)]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-[var(--toka-text-primary)] mb-2">
          Icon
        </span>
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
          {HABIT_ICON_NAMES.map((iconName) => {
            const active = icon === iconName;
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => setIcon(iconName)}
                aria-label={`Select ${iconName} icon`}
                aria-pressed={active}
                className={`min-h-[44px] rounded-xl flex items-center justify-center border transition-colors focus-visible:outline-2 focus-visible:outline-[#C6FF69] focus-visible:outline-offset-2 ${
                  active
                    ? 'bg-[#C6FF69]/12 text-[var(--toka-accent-text)] border-[#C6FF69]'
                    : 'bg-[var(--toka-bg-secondary)] text-[var(--toka-text-secondary)] border-[var(--toka-border)] hover:text-[var(--toka-text-primary)]'
                }`}
              >
                <HabitIcon name={iconName} size={18} />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-[var(--toka-text-primary)] mb-2">
          Frequency
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {FREQUENCY_OPTIONS.map((opt) => {
            const active = frequency === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFrequency(opt.value)}
                className={`p-3.5 rounded-xl border text-left transition-colors ${
                  active
                    ? 'bg-[#C6FF69]/12 border-[#C6FF69] text-[var(--toka-text-primary)]'
                    : 'bg-[var(--toka-bg-secondary)] border-[var(--toka-border)] text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)]'
                }`}
              >
                <div className="text-sm font-medium text-[var(--toka-text-primary)]">
                  {opt.label}
                </div>
                <div className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
                  {opt.description}
                </div>
              </button>
            );
          })}
        </div>

        {frequency === 'custom' ? (
          <div className="mt-3 grid grid-cols-7 gap-2">
            {WEEKDAYS_SHORT.map((letter, idx) => {
              const selected = selectedDays.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  aria-pressed={selected}
                  className={`min-h-[44px] rounded-xl text-sm font-semibold border transition-colors focus-visible:outline-2 focus-visible:outline-[#C6FF69] focus-visible:outline-offset-2 ${
                    selected
                      ? 'bg-[#C6FF69]/12 text-[var(--toka-accent-text)] border-[#C6FF69]'
                      : 'bg-[var(--toka-bg-secondary)] text-[var(--toka-text-secondary)] border-[var(--toka-border)] hover:text-[var(--toka-text-primary)]'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="habit-start-date"
            className="block text-sm font-medium text-[var(--toka-text-primary)] mb-2"
          >
            Start date
          </label>
          <input
            id="habit-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full min-h-[46px] px-4 py-2 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-[var(--toka-text-primary)] tabular-nums focus:outline-none focus:border-[#C6FF69]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="habit-reminder-time"
              className="text-sm font-medium text-[var(--toka-text-primary)]"
            >
              Daily reminder
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={reminderEnabled}
              aria-label="Toggle daily reminder"
              onClick={() => setReminderEnabled((v) => !v)}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-end focus-visible:outline-2 focus-visible:outline-[#C6FF69] focus-visible:outline-offset-2 rounded-lg"
            >
              <span
                className={`w-11 h-6 rounded-full transition-colors p-0.5 inline-flex items-center ${
                  reminderEnabled ? 'bg-[#C6FF69]' : 'bg-[var(--toka-border)]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-[#121512] transition-transform ${
                    reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </span>
            </button>
          </div>
          <input
            id="habit-reminder-time"
            type="time"
            disabled={!reminderEnabled}
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-full min-h-[46px] px-4 py-2 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-[var(--toka-text-primary)] tabular-nums focus:outline-none focus:border-[#C6FF69] disabled:opacity-40"
          />
        </div>
      </div>

      <div className="pt-2 flex items-center justify-end gap-3 border-t border-[var(--toka-border)]">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="min-h-[46px] px-5 py-2.5 rounded-xl text-sm font-medium border border-[var(--toka-border)] text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors whitespace-nowrap shrink-0"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[46px] px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#C6FF69] text-[#121512] hover:brightness-95 transition-all whitespace-nowrap shrink-0 disabled:opacity-60"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
