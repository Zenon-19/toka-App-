import type { HabitCategory, HabitFrequency, HabitInput } from '../types/index.ts';

export const HABIT_CATEGORIES: HabitCategory[] = [
  'Personal Development',
  'Learning',
  'Mindfulness',
  'Lifestyle',
  'Productivity',
  'General',
];

export const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Every day', description: 'Scheduled all 7 days of the week' },
  { value: 'weekdays', label: 'Weekdays', description: 'Monday through Friday' },
  { value: 'custom', label: 'Custom days', description: 'Choose specific days of the week' },
];

export const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
export const WEEKDAYS_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const HABIT_ICON_NAMES = [
  'Sun',
  'BookOpen',
  'Brain',
  'Droplets',
  'Dumbbell',
  'Feather',
  'Flame',
  'Footprints',
  'Heart',
  'Leaf',
  'Moon',
  'Music',
  'PenTool',
  'Sparkles',
  'Target',
  'Timer',
  'Zap',
  'CheckCircle2',
] as const;

export const STARTER_HABIT_TEMPLATES: Omit<HabitInput, 'startDate'>[] = [
  {
    title: 'Morning Stillness',
    description: '10 minutes of quiet breathwork before checking messages.',
    category: 'Mindfulness',
    icon: 'Sun',
    frequency: 'daily',
    selectedDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '07:00',
  },
  {
    title: 'Deep Focus Block',
    description: '45 minutes of uninterrupted work on your single highest-leverage task.',
    category: 'Productivity',
    icon: 'Target',
    frequency: 'weekdays',
    selectedDays: [1, 2, 3, 4, 5],
    reminderTime: '09:30',
  },
  {
    title: 'Evening Reading',
    description: 'Read 15 pages of non-fiction or literature before sleep.',
    category: 'Learning',
    icon: 'BookOpen',
    frequency: 'daily',
    selectedDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '21:15',
  },
  {
    title: 'Daily Movement',
    description: '30 minutes of intentional movement, walk, or strength training.',
    category: 'Lifestyle',
    icon: 'Footprints',
    frequency: 'daily',
    selectedDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '17:30',
  },
  {
    title: 'Evening Reflection',
    description: 'Write three lines on what went well and one adjustment for tomorrow.',
    category: 'Personal Development',
    icon: 'PenTool',
    frequency: 'daily',
    selectedDays: [0, 1, 2, 3, 4, 5, 6],
    reminderTime: '22:00',
  },
];

export interface TimezoneOption {
  id: string;
  label: string;
}

export const COMMON_TIMEZONES: TimezoneOption[] = [
  { id: 'UTC', label: 'UTC (Coordinated Universal Time, UTC+0:00)' },
  { id: 'America/Los_Angeles', label: 'US Pacific — Los Angeles (PT, UTC-8:00)' },
  { id: 'America/Denver', label: 'US Mountain — Denver (MT, UTC-7:00)' },
  { id: 'America/Chicago', label: 'US Central — Chicago (CT, UTC-6:00)' },
  { id: 'America/New_York', label: 'US Eastern — New York (ET, UTC-5:00)' },
  { id: 'America/Sao_Paulo', label: 'Brazil — São Paulo (BRT, UTC-3:00)' },
  { id: 'Europe/London', label: 'United Kingdom — London (GMT/BST, UTC+0:00)' },
  { id: 'Europe/Paris', label: 'Central Europe — Paris (CET, UTC+1:00)' },
  { id: 'Europe/Berlin', label: 'Central Europe — Berlin (CET, UTC+1:00)' },
  { id: 'Asia/Dubai', label: 'Gulf — Dubai (GST, UTC+4:00)' },
  { id: 'Asia/Kolkata', label: 'India (IST, UTC+5:30)' },
  { id: 'Asia/Singapore', label: 'Singapore (SGT, UTC+8:00)' },
  { id: 'Asia/Tokyo', label: 'Japan — Tokyo (JST, UTC+9:00)' },
  { id: 'Australia/Sydney', label: 'Australia — Sydney (AEST, UTC+10:00)' },
];
