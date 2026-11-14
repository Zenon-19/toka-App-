import { useEffect, useRef } from 'react';
import { getDueReminders, triggerLocalNotification } from '../services/notificationService.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import { getTodayInTimezone } from '../utils/date.ts';

export function useNotificationScheduler() {
  const habits = useTokaStore((s) => s.habits);
  const completions = useTokaStore((s) => s.completions);
  const settings = useTokaStore((s) => s.settings);
  const showToast = useTokaStore((s) => s.showToast);

  const firedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!settings || !settings.notificationsEnabled) return;

    const checkReminders = () => {
      const todayStr = getTodayInTimezone(settings.timezone || 'UTC');
      const completedToday = new Set(
        completions
          .filter((c) => c.completed && c.completionDate === todayStr)
          .map((c) => c.habitId)
      );

      const due = getDueReminders({
        habits,
        settings,
        completedHabitIdsToday: completedToday,
        alreadyFiredKeys: firedKeysRef.current,
      });

      for (const item of due) {
        firedKeysRef.current.add(item.key);
        const sentSystem = triggerLocalNotification(item.title, item.body);
        if (!sentSystem) {
          showToast('info', `${item.title}: ${item.body}`);
        }
      }
    };

    checkReminders();
    const timer = window.setInterval(checkReminders, 30000);
    return () => window.clearInterval(timer);
  }, [habits, completions, settings, showToast]);
}
