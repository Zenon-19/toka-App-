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

export const COMMON_TIMEZONES = [
  'UTC',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];
