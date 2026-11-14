export type HabitCategory =
  | 'Personal Development'
  | 'Learning'
  | 'Mindfulness'
  | 'Lifestyle'
  | 'Productivity'
  | 'General';

export type HabitFrequency = 'daily' | 'weekdays' | 'custom';
export type HabitStatus = 'active' | 'archived';
export type ThemePreference = 'dark' | 'light';

export interface UserProfile {
  id: string;
  uid: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: ThemePreference;
  notificationsEnabled: boolean;
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
  timezone: string;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: HabitCategory;
  icon: string;
  frequency: HabitFrequency;
  selectedDays: number[]; // 0 = Sun ... 6 = Sat
  reminderTime: string | null;
  startDate: string; // YYYY-MM-DD
  status: HabitStatus;
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completionDate: string; // YYYY-MM-DD
  completed: boolean;
  createdAt: string;
}

export interface HabitInput {
  title: string;
  description: string;
  category: HabitCategory;
  icon: string;
  frequency: HabitFrequency;
  selectedDays: number[];
  reminderTime: string | null;
  startDate: string;
}

export interface HabitStats {
  habitId: string;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  scheduledDaysCount: number;
  completionRate: number;
}

export interface DailySummary {
  date: string;
  scheduledCount: number;
  completedCount: number;
  percentage: number;
}

export type MainTab = 'home' | 'habits' | 'insights' | 'profile';

export type AppScreen =
  | 'home'
  | 'habits'
  | 'insights'
  | 'profile'
  | 'create-habit'
  | 'edit-habit'
  | 'habit-details'
  | 'calendar'
  | 'settings'
  | 'notifications'
  | 'onboarding';
