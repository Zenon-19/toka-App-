const LEGACY_TIMEZONE_ALIASES: Record<string, string> = {
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Katmandu': 'Asia/Kathmandu',
  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Rangoon': 'Asia/Yangon',
  'Europe/Kiev': 'Europe/Kyiv',
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'US/Eastern': 'America/New_York',
  'US/Central': 'America/Chicago',
  'US/Mountain': 'America/Denver',
  'US/Pacific': 'America/Los_Angeles',
};

export function normalizeTimezone(tz?: string | null): string {
  if (!tz) return 'UTC';
  return LEGACY_TIMEZONE_ALIASES[tz] || tz;
}

export function getBrowserTimezone(): string {
  try {
    const raw = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    return normalizeTimezone(raw);
  } catch {
    return 'UTC';
  }
}

export function getTodayInTimezone(timezone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

export function getCurrentTimeInTimezone(timezone: string): { hours: number; minutes: number; hhmm: string } {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone || 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? '0') % 24;
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
    return {
      hours: h,
      minutes: m,
      hhmm: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    };
  } catch {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    return {
      hours: h,
      minutes: m,
      hhmm: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    };
  }
}

export function getGreetingForTimezone(timezone: string): string {
  const { hours } = getCurrentTimeInTimezone(timezone);
  if (hours < 12) return 'Good morning';
  if (hours < 17) return 'Good afternoon';
  return 'Good evening';
}

export function parseDateUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

export function formatUTCDateString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const dt = parseDateUTC(dateStr);
  dt.setUTCDate(dt.getUTCDate() + days);
  return formatUTCDateString(dt);
}

export function getDayOfWeekUTC(dateStr: string): number {
  return parseDateUTC(dateStr).getUTCDay(); // 0 (Sun) - 6 (Sat)
}

export function getDateRange(startStr: string, endStr: string): string[] {
  if (startStr > endStr) return [];
  const dates: string[] = [];
  let cursor = startStr;
  let guard = 0;
  while (cursor <= endStr && guard < 1500) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return dates;
}

export function formatReadableDate(dateStr: string): string {
  const dt = parseDateUTC(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(dt);
}

export function formatShortDate(dateStr: string): string {
  const dt = parseDateUTC(dateStr);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dt);
}

export function getMonthDaysGrid(year: number, monthIndex: number): {
  dateStr: string;
  dayNumber: number;
  inCurrentMonth: boolean;
}[] {
  const firstDay = new Date(Date.UTC(year, monthIndex, 1));
  const startOffset = firstDay.getUTCDay(); // 0..6
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  const cells: { dateStr: string; dayNumber: number; inCurrentMonth: boolean }[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const dt = new Date(Date.UTC(year, monthIndex, -i));
    cells.push({
      dateStr: formatUTCDateString(dt),
      dayNumber: dt.getUTCDate(),
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dt = new Date(Date.UTC(year, monthIndex, day));
    cells.push({
      dateStr: formatUTCDateString(dt),
      dayNumber: day,
      inCurrentMonth: true,
    });
  }

  const remainder = cells.length % 7;
  if (remainder > 0) {
    const needed = 7 - remainder;
    for (let i = 1; i <= needed; i++) {
      const dt = new Date(Date.UTC(year, monthIndex + 1, i));
      cells.push({
        dateStr: formatUTCDateString(dt),
        dayNumber: dt.getUTCDate(),
        inCurrentMonth: false,
      });
    }
  }

  return cells;
}
