import { Check, ChevronRight, Flame } from 'lucide-react';
import type { Habit } from '../types/index.ts';
import { HabitIcon } from './HabitIcon.tsx';

interface HabitCardProps {
  habit: Habit;
  completed: boolean;
  streak?: number;
  onToggle: () => void;
  onSelect: () => void;
}

export function HabitCard({
  habit,
  completed,
  streak,
  onToggle,
  onSelect,
}: HabitCardProps) {
  const currentStreak = streak ?? habit.streak ?? 0;
  const hasActiveStreak = currentStreak > 0;
  const isPersonalBest =
    hasActiveStreak && typeof habit.bestStreak === 'number' && currentStreak >= habit.bestStreak;

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
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
          completed
            ? 'bg-[#C6FF69]/15 text-[var(--toka-accent-text)]'
            : 'bg-[var(--toka-bg-secondary)] text-[var(--toka-text-primary)]'
        }`}
      >
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
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--toka-text-secondary)] truncate">
          <span>{habit.category}</span>
          {habit.reminderTime ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono-num">{habit.reminderTime}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <div
          className="flex flex-col items-end justify-center min-w-[44px]"
          title={
            habit.bestStreak && habit.bestStreak > currentStreak
              ? `${currentStreak} day streak · Best ${habit.bestStreak}d`
              : isPersonalBest && currentStreak >= 2
              ? `${currentStreak} day streak · Personal best`
              : `${currentStreak} day streak`
          }
          aria-label={`${currentStreak} day current streak`}
        >
          <div
            className={`inline-flex items-center gap-1 font-mono-num text-sm font-semibold leading-none transition-colors duration-200 ${
              hasActiveStreak
                ? 'text-[var(--toka-accent-text)]'
                : 'text-[var(--toka-text-secondary)]'
            }`}
          >
            <Flame
              size={14}
              className={
                hasActiveStreak
                  ? 'text-[var(--toka-accent-text)] fill-current opacity-90'
                  : 'text-[var(--toka-text-secondary)] opacity-55'
              }
              aria-hidden="true"
            />
            <span>{currentStreak}d</span>
          </div>
          <span className="mt-1 text-[10px] font-medium text-[var(--toka-text-secondary)] leading-none">
            streak
          </span>
        </div>

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
          className={`min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
            completed
              ? 'bg-[#C6FF69] text-[#121512] shadow-sm'
              : 'bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-transparent hover:border-[#C6FF69]/70'
          }`}
        >
          <Check size={18} strokeWidth={2.75} />
        </button>
      </div>
    </div>
  );
}
