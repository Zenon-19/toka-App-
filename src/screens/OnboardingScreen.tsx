import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { HabitIcon } from '../components/HabitIcon.tsx';
import { STARTER_HABIT_TEMPLATES } from '../constants/habits.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import { getTodayInTimezone } from '../utils/date.ts';

const PILLARS = [
  {
    step: '01',
    title: 'Consistency over perfection',
    body: 'Missing a day does not erase your identity. TOKA measures honest momentum across weeks and months rather than fragile all-or-nothing guilt.',
  },
  {
    step: '02',
    title: 'Built around your real week',
    body: 'Set daily, weekday, or custom schedules. Unscheduled rest days are respected automatically in your streak calculations.',
  },
  {
    step: '03',
    title: 'Choose a starting rhythm',
    body: 'Select a few foundational habits below to populate your dashboard right away, or start fresh with an empty slate.',
  },
];

export function OnboardingScreen() {
  const settings = useTokaStore((s) => s.settings);
  const createStarterHabits = useTokaStore((s) => s.createStarterHabits);
  const updateSettings = useTokaStore((s) => s.updateSettings);
  const navigateToTab = useTokaStore((s) => s.navigateToTab);
  const setShowOnboardingPreview = useTokaStore((s) => s.setShowOnboardingPreview);

  const [stepIndex, setStepIndex] = useState(0);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([
    STARTER_HABIT_TEMPLATES[0].title,
    STARTER_HABIT_TEMPLATES[2].title,
  ]);
  const [submitting, setSubmitting] = useState(false);

  const todayStr = getTodayInTimezone(settings?.timezone || 'UTC');

  const toggleTemplate = (title: string) => {
    setSelectedTitles((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleFinish = async (useSelected: boolean) => {
    setSubmitting(true);
    try {
      if (useSelected && selectedTitles.length > 0) {
        const chosen = STARTER_HABIT_TEMPLATES.filter((t) =>
          selectedTitles.includes(t.title)
        ).map((t) => ({
          ...t,
          startDate: todayStr,
        }));
        await createStarterHabits(chosen);
      } else {
        await updateSettings({ onboardingCompleted: true });
        setShowOnboardingPreview(false);
        navigateToTab('home');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const activePillar = PILLARS[stepIndex];

  return (
    <div className="min-h-screen bg-[var(--toka-bg-primary)] text-[var(--toka-text-primary)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-3xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-6 sm:p-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border-2 border-[#C6FF69]" />
            </div>
            <span className="font-display font-semibold tracking-tight">TOKA</span>
          </div>

          <button
            type="button"
            onClick={() => handleFinish(false)}
            disabled={submitting}
            className="min-h-[40px] px-3 text-sm text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Step progress bars */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {PILLARS.map((p, idx) => (
            <button
              key={p.step}
              type="button"
              onClick={() => setStepIndex(idx)}
              aria-label={`Step ${idx + 1}: ${p.title}`}
              className="py-2 text-left group"
            >
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  idx <= stepIndex ? 'bg-[#C6FF69]' : 'bg-[var(--toka-border)]'
                }`}
              />
            </button>
          ))}
        </div>

        <div>
          <span className="font-mono-num text-xs text-[var(--toka-accent-text)]">
            {activePillar.step} / 03
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight [text-wrap:balance]">
            {activePillar.title}
          </h1>
          <p className="mt-3 text-sm sm:text-base leading-relaxed text-[var(--toka-text-secondary)]">
            {activePillar.body}
          </p>
        </div>

        {stepIndex < 2 ? (
          <div className="mt-8 rounded-2xl overflow-hidden border border-[var(--toka-border)] bg-[var(--toka-bg-secondary)]">
            <img
              src="/src/assets/images/toka_onboarding_stone_1794664301339.jpg"
              alt="Balanced basalt river stones"
              referrerPolicy="no-referrer"
              className="w-full h-52 sm:h-64 object-cover"
            />
          </div>
        ) : (
          <div className="mt-6 space-y-2.5">
            {STARTER_HABIT_TEMPLATES.map((tpl) => {
              const selected = selectedTitles.includes(tpl.title);
              return (
                <button
                  key={tpl.title}
                  type="button"
                  onClick={() => toggleTemplate(tpl.title)}
                  className={`w-full p-3.5 rounded-2xl border flex items-center gap-3.5 text-left transition-colors ${
                    selected
                      ? 'bg-[#C6FF69]/10 border-[#C6FF69]'
                      : 'bg-[var(--toka-bg-secondary)] border-[var(--toka-border)] hover:border-[var(--toka-text-secondary)]/50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selected
                        ? 'bg-[#C6FF69] text-[#121512]'
                        : 'bg-[var(--toka-bg-card)] text-[var(--toka-text-primary)]'
                    }`}
                  >
                    <HabitIcon name={tpl.icon} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--toka-text-primary)]">
                      {tpl.title}
                    </div>
                    <div className="text-xs text-[var(--toka-text-secondary)] truncate">
                      {tpl.category} · {tpl.reminderTime}
                    </div>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      selected
                        ? 'bg-[#C6FF69] text-[#121512]'
                        : 'border border-[var(--toka-border)] text-transparent'
                    }`}
                  >
                    <Check size={14} strokeWidth={2.75} />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-[var(--toka-border)] flex items-center justify-between gap-3">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="min-h-[46px] px-5 py-2.5 rounded-xl text-sm font-medium border border-[var(--toka-border)] text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {stepIndex < 2 ? (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i + 1)}
              className="min-h-[46px] px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#C6FF69] text-[#121512] inline-flex items-center gap-2 hover:brightness-95 transition-all"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleFinish(true)}
              disabled={submitting}
              className="min-h-[46px] px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#C6FF69] text-[#121512] inline-flex items-center gap-2 hover:brightness-95 transition-all disabled:opacity-60"
            >
              <span>
                {submitting
                  ? 'Preparing workspace...'
                  : selectedTitles.length > 0
                  ? `Start with ${selectedTitles.length} ${
                      selectedTitles.length === 1 ? 'habit' : 'habits'
                    }`
                  : 'Enter workspace'}
              </span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
