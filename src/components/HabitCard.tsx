import { Check, ChevronRight, Flame } from 'lucide-react';
import type { Habit } from '../types/index.ts';
import { HabitIcon } from './HabitIcon.tsx';

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  streak?: number;
  statusHint?: string | null;
  onToggle: () => void;
  onSelect: () => void;
}

export function HabitCard({
  habit,
  completed,
  streak,
  statusHint,
  onToggle,
  onSelect,
}: HabitCardProps) {
  const currentStreak = streak ?? habit.streak ?? 0;
  const showStreak = currentStreak >= 2;
  const isPersonalBest =
    showStreak && typeof habit.bestStreak === 'number' && currentStreak >= habit.bestStreak;

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group flex items-center gap-3.5 p-4 rounded-2xl border transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
        completed
          ? 'bg-[var(--toka-bg-secondary)] border-[var(--toka-border)] opacity-90'
          : 'bg-[var(--toka-bg-card)] border-[var(--toka-border)] hover:border-[#929B93]/50'
      }`}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[var(--toka-bg-secondary)] text-[var(--toka-text-primary)]">
        <HabitIcon name={habit.icon} size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4
            className={`text-[15px] font-medium truncate transition-colors ${
              completed
                ? 'line-through text-[var(--toka-text-secondary)]'
                : 'text-[var(--toka-text-primary)]'
            }`}
          >
            {habit.title}
          </h4>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-[var(--toka-text-secondary)]">
          <span className="truncate">{habit.category}</span>
          {habit.reminderTime ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{habit.reminderTime}</span>
            </>
          ) : null}
          {!completed && statusHint ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[var(--toka-text-secondary)] font-medium">{statusHint}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {showStreak ? (
          <div
            className="flex flex-col items-end justify-center min-w-[44px]"
            title={
              habit.bestStreak && habit.bestStreak > currentStreak
                ? `${currentStreak} day streak · Best ${habit.bestStreak}d`
                : isPersonalBest
                ? `${currentStreak} day streak · Personal best`
                : `${currentStreak} day streak`
            }
            aria-label={`${currentStreak} day current streak`}
          >
            <div
              className={`inline-flex items-center gap-1 tabular-nums text-sm font-semibold leading-none transition-colors duration-200 ${
                completed
                  ? 'text-[var(--toka-text-primary)]'
                  : 'text-[var(--toka-accent-text)]'
              }`}
            >
              <Flame
                size={14}
                className={
                  completed
                    ? 'text-[var(--toka-text-secondary)]'
                    : 'text-[var(--toka-accent-text)] fill-current opacity-90'
                }
                aria-hidden="true"
              />
              <span>{currentStreak}d</span>
            </div>
            <span className="mt-1 text-xs font-medium text-[var(--toka-text-secondary)] leading-none">
              streak
            </span>
          </div>
        ) : null}

        <ChevronRight
          size={16}
          className="text-[var(--toka-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={completed ? `Mark ${habit.title} incomplete` : `Mark ${habit.title} complete`}
          aria-pressed={completed}
          className={`w-11 h-11 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-all duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--toka-bg-card)] ${
            completed
              ? 'bg-[#C6FF69] border-2 border-[#C6FF69] text-[#121512] toka-check-pop'
              : 'bg-transparent border-2 border-[#586359] dark:border-[#768077] text-transparent hover:border-[#C6FF69]'
          }`}
        >
          <Check size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
