import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WEEKDAYS_SHORT } from '../constants/habits.ts';
import { getMonthDaysGrid } from '../utils/date.ts';

export type DayCellState = 'completed' | 'partial' | 'missed' | 'unscheduled' | 'future';

interface MonthlyCalendarProps {
  year: number;
  monthIndex: number;
  todayStr: string;
  selectedDate: string;
  onChangeMonth: (year: number, monthIndex: number) => void;
  onSelectDate: (dateStr: string) => void;
  getDayState: (dateStr: string) => {
    state: DayCellState;
    label?: string;
  };
}

export function MonthlyCalendar({
  year,
  monthIndex,
  todayStr,
  selectedDate,
  onChangeMonth,
  onSelectDate,
  getDayState,
}: MonthlyCalendarProps) {
  const cells = getMonthDaysGrid(year, monthIndex);
  const monthLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, monthIndex, 1)));

  const handlePrev = () => {
    if (monthIndex === 0) onChangeMonth(year - 1, 11);
    else onChangeMonth(year, monthIndex - 1);
  };

  const handleNext = () => {
    if (monthIndex === 11) onChangeMonth(year + 1, 0);
    else onChangeMonth(year, monthIndex + 1);
  };

  return (
    <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[var(--toka-text-primary)]">
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous month"
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center border border-[var(--toka-border)] text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next month"
            className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center border border-[var(--toka-border)] text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {WEEKDAYS_SHORT.map((d, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-[var(--toka-text-secondary)] py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell) => {
          const { state } = getDayState(cell.dateStr);
          const isToday = cell.dateStr === todayStr;
          const isSelected = cell.dateStr === selectedDate;

          let bgClass = 'bg-transparent text-[var(--toka-text-secondary)]';
          let marker = '';

          if (!cell.inCurrentMonth) {
            bgClass = 'bg-transparent text-[var(--toka-text-secondary)]/30';
          } else if (state === 'completed') {
            bgClass = 'bg-[#C6FF69] text-[#121512] font-semibold';
            marker = '✓';
          } else if (state === 'partial') {
            bgClass =
              'bg-[#C6FF69]/20 text-[var(--toka-text-primary)] border border-[#C6FF69]/40';
            marker = '◐';
          } else if (state === 'missed') {
            bgClass = 'bg-red-500/12 text-red-400 border border-red-500/25';
            marker = '×';
          } else if (state === 'unscheduled') {
            bgClass = 'bg-[var(--toka-bg-secondary)]/60 text-[var(--toka-text-secondary)]';
          } else if (state === 'future') {
            bgClass = 'bg-transparent text-[var(--toka-text-secondary)]/55';
          }

          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => onSelectDate(cell.dateStr)}
              aria-label={`${cell.dateStr} (${state})`}
              className={`relative min-h-[44px] rounded-xl flex flex-col items-center justify-center text-xs font-mono-num transition-all ${bgClass} ${
                isSelected ? 'ring-2 ring-[var(--toka-text-primary)] ring-offset-1 ring-offset-[var(--toka-bg-card)]' : ''
              }`}
            >
              <span>{cell.dayNumber}</span>
              {cell.inCurrentMonth && marker ? (
                <span className="text-[9px] leading-none mt-0.5 opacity-85" aria-hidden="true">
                  {marker}
                </span>
              ) : isToday ? (
                <span
                  className="text-[9px] leading-none mt-0.5 font-sans font-semibold"
                  aria-label="Today"
                >
                  •
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Explicit non-hue-only legend */}
      <div className="mt-4 pt-3 border-t border-[var(--toka-border)] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--toka-text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-[#C6FF69] text-[#121512] inline-flex items-center justify-center text-[10px] font-bold">
            ✓
          </span>
          Completed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-[#C6FF69]/20 border border-[#C6FF69]/40 text-[var(--toka-text-primary)] inline-flex items-center justify-center text-[10px]">
            ◐
          </span>
          Partial
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-red-500/15 border border-red-500/30 text-red-400 inline-flex items-center justify-center text-[10px]">
            ×
          </span>
          Missed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] inline-block" />
          Rest / Unscheduled
        </span>
      </div>
    </div>
  );
}
