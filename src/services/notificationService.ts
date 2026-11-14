import type { Habit, UserSettings } from '../types/index.ts';
import { getCurrentTimeInTimezone, getTodayInTimezone } from '../utils/date.ts';
import { isHabitScheduledOnDate } from '../utils/habitLogic.ts';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  const result = await Notification.requestPermission();
  return result;
}

export function triggerLocalNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }
  new Notification(title, {
    body,
    tag: `toka-${title}`,
  });
  return true;
}

export function getDueReminders(params: {
  habits: Habit[];
  settings: UserSettings;
  completedHabitIdsToday: Set<string>;
  alreadyFiredKeys: Set<string>;
}): { key: string; title: string; body: string }[] {
  const { habits, settings, completedHabitIdsToday, alreadyFiredKeys } = params;
  if (!settings.notificationsEnabled) return [];

  const tz = settings.timezone || 'UTC';
  const todayStr = getTodayInTimezone(tz);
  const { hhmm } = getCurrentTimeInTimezone(tz);
  const due: { key: string; title: string; body: string }[] = [];

  // 1. Daily summary reminder
  if (settings.dailyReminderEnabled && settings.dailyReminderTime === hhmm) {
    const key = `daily::${todayStr}::${hhmm}`;
    if (!alreadyFiredKeys.has(key)) {
      const scheduledActive = habits.filter(
        (h) => h.status === 'active' && isHabitScheduledOnDate(h, todayStr)
      );
      const remaining = scheduledActive.filter((h) => !completedHabitIdsToday.has(h.id));
      if (remaining.length > 0) {
        due.push({
          key,
          title: 'TOKA Daily Check-In',
          body: `You have ${remaining.length} scheduled ${remaining.length === 1 ? 'habit' : 'habits'} remaining today.`,
        });
      }
    }
  }

  // 2. Per-habit reminders (never send notifications for archived habits)
  for (const habit of habits) {
    if (habit.status !== 'active') continue;
    if (!habit.reminderTime || habit.reminderTime !== hhmm) continue;
    if (!isHabitScheduledOnDate(habit, todayStr)) continue;
    if (completedHabitIdsToday.has(habit.id)) continue;

    const key = `habit::${habit.id}::${todayStr}::${hhmm}`;
    if (!alreadyFiredKeys.has(key)) {
      due.push({
        key,
        title: `TOKA · ${habit.title}`,
        body: habit.description || `Time for your ${habit.category.toLowerCase()} habit.`,
      });
    }
  }

  return due;
}
