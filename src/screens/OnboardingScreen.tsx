import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { TokaLogo } from '../components/TokaLogo.tsx';
import {
  FREQUENCY_OPTIONS,
  HABIT_CATEGORIES,
  STARTER_HABIT_TEMPLATES,
} from '../constants/habits.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import type { HabitCategory, HabitFrequency, HabitInput } from '../types/index.ts';
import { getTodayInTimezone } from '../utils/date.ts';

export function OnboardingScreen() {
  const profile = useTokaStore((s) => s.profile);
  const settings = useTokaStore((s) => s.settings);
  const completeOnboarding = useTokaStore((s) => s.completeOnboarding);
  const setShowOnboardingPreview = useTokaStore((s) => s.setShowOnboardingPreview);

  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState(profile?.name || '');
  const [nameError, setNameError] = useState<string | null>(null);

  const [habitTitle, setHabitTitle] = useState('');
  const [category, setCategory] = useState<HabitCategory>('Mindfulness');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [habitIcon, setHabitIcon] = useState('Sun');
  const [habitDescription, setHabitDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const todayStr = getTodayInTimezone(settings?.timezone || 'UTC');

  const handleNextFromName = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = firstName.trim();
    if (!trimmed) {
      setNameError('Please enter your first name.');
      return;
    }
    setNameError(null);
    setStep(2);
  };

  const applyStarterPreset = (tpl: (typeof STARTER_HABIT_TEMPLATES)[number]) => {
    setHabitTitle(tpl.title);
    setHabitDescription(tpl.description);
    setCategory(tpl.category);
    setFrequency(tpl.frequency);
    setReminderTime(tpl.reminderTime || '08:00');
    setHabitIcon(tpl.icon);
  };

  const handleFinish = async (includeHabit: boolean) => {
    setSubmitting(true);
    try {
      const trimmedHabit = habitTitle.trim();
      const firstHabit: HabitInput | null =
        includeHabit && trimmedHabit
          ? {
              title: trimmedHabit,
              description: habitDescription.trim(),
              category,
              icon: habitIcon,
              frequency,
              selectedDays:
                frequency === 'weekdays' ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6],
              reminderTime: reminderTime || null,
              startDate: todayStr,
            }
          : null;

      await completeOnboarding({
        firstName: firstName.trim(),
        firstHabit,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--toka-bg-primary)] text-[var(--toka-text-primary)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-6 sm:p-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <TokaLogo size={32} />
            <span className="font-display font-semibold tracking-tight text-lg">TOKA</span>
          </div>

          {settings?.onboardingCompleted ? (
            <button
              type="button"
              onClick={() => setShowOnboardingPreview(false)}
              className="min-h-[44px] px-3 text-sm text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] rounded-xl"
            >
              Close
            </button>
          ) : (
            <span className="tabular-nums text-xs text-[var(--toka-text-secondary)]">
              Step {step} of 2
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-8">
          <div className="h-1.5 rounded-full bg-[#C6FF69]" />
          <div
            className={`h-1.5 rounded-full transition-colors ${
              step === 2 ? 'bg-[#C6FF69]' : 'bg-[var(--toka-border)]'
            }`}
          />
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextFromName} className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight [text-wrap:balance]">
                What should we call you?
              </h1>
              <p className="mt-2 text-sm text-[var(--toka-text-secondary)] leading-relaxed">
                Your data stays privately on this device. No account or sign-in required.
              </p>
            </div>

            <div>
              <label
                htmlFor="onboarding-first-name"
                className="block text-sm font-medium text-[var(--toka-text-primary)] mb-2"
              >
                First name
              </label>
              <input
                id="onboarding-first-name"
                type="text"
                autoFocus
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="e.g., Maya"
                maxLength={40}
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-base text-[var(--toka-text-primary)] placeholder:text-[var(--toka-text-secondary)] focus:outline-none focus:border-[#C6FF69]"
              />
              {nameError ? (
                <p role="alert" className="mt-2 text-xs text-red-400">
                  {nameError}
                </p>
              ) : null}
            </div>

            <div className="pt-4 border-t border-[var(--toka-border)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
              >
                Skip
              </button>
              <button
                type="submit"
                className="min-h-[46px] px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#C6FF69] text-[#121512] inline-flex items-center gap-2 hover:brightness-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight [text-wrap:balance]">
                Add your first habit
              </h1>
              <p className="mt-2 text-sm text-[var(--toka-text-secondary)] leading-relaxed">
                Start with one small, repeatable action — or pick a suggestion below.
              </p>
            </div>

            <div>
              <span className="block text-xs font-medium text-[var(--toka-text-secondary)] mb-2">
                Quick ideas
              </span>
              <div className="flex flex-wrap gap-2">
                {STARTER_HABIT_TEMPLATES.slice(0, 4).map((tpl) => (
                  <button
                    key={tpl.title}
                    type="button"
                    onClick={() => applyStarterPreset(tpl)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
                      habitTitle === tpl.title
                        ? 'bg-[var(--toka-bg-secondary)] border-[var(--toka-text-primary)] text-[var(--toka-text-primary)]'
                        : 'bg-[var(--toka-bg-secondary)] border-[var(--toka-border)] text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)]'
                    }`}
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="onboarding-habit-title"
                  className="block text-sm font-medium text-[var(--toka-text-primary)] mb-2"
                >
                  Habit name
                </label>
                <input
                  id="onboarding-habit-title"
                  type="text"
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  placeholder="e.g., Morning Stillness, 15m Reading"
                  maxLength={80}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-sm text-[var(--toka-text-primary)] placeholder:text-[var(--toka-text-secondary)] focus:outline-none focus:border-[#C6FF69]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="onboarding-habit-category"
                    className="block text-xs font-medium text-[var(--toka-text-secondary)] mb-1.5"
                  >
                    Category
                  </label>
                  <select
                    id="onboarding-habit-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as HabitCategory)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-xs text-[var(--toka-text-primary)] focus:outline-none focus:border-[#C6FF69]"
                  >
                    {HABIT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="onboarding-habit-frequency"
                    className="block text-xs font-medium text-[var(--toka-text-secondary)] mb-1.5"
                  >
                    Schedule
                  </label>
                  <select
                    id="onboarding-habit-frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-xs text-[var(--toka-text-primary)] focus:outline-none focus:border-[#C6FF69]"
                  >
                    {FREQUENCY_OPTIONS.filter((o) => o.value !== 'custom').map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="onboarding-habit-reminder"
                    className="block text-xs font-medium text-[var(--toka-text-secondary)] mb-1.5"
                  >
                    Reminder time
                  </label>
                  <input
                    id="onboarding-habit-reminder"
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-xs tabular-nums text-[var(--toka-text-primary)] focus:outline-none focus:border-[#C6FF69]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--toka-border)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium border border-[var(--toka-border)] text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleFinish(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
                >
                  Skip for now
                </button>
              </div>

              <button
                type="button"
                disabled={submitting || !habitTitle.trim()}
                onClick={() => handleFinish(true)}
                className="min-h-[46px] px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#C6FF69] text-[#121512] inline-flex items-center gap-2 hover:brightness-95 transition-all disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
              >
                <span>{submitting ? 'Setting up...' : 'Start with this habit'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
