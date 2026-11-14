import { useState } from 'react';
import { ArrowLeft, Bell, Clock } from 'lucide-react';
import { HabitIcon } from '../components/HabitIcon.tsx';
import { useHabitData } from '../hooks/useHabitData.ts';
import {
  getNotificationPermission,
  requestNotificationPermission,
  triggerLocalNotification,
} from '../services/notificationService.ts';
import { useTokaStore } from '../store/useTokaStore.ts';

export function NotificationsScreen() {
  const settings = useTokaStore((s) => s.settings);
  const updateSettings = useTokaStore((s) => s.updateSettings);
  const navigateToTab = useTokaStore((s) => s.navigateToTab);
  const navigateToScreen = useTokaStore((s) => s.navigateToScreen);
  const showToast = useTokaStore((s) => s.showToast);

  const { activeHabits } = useHabitData();
  const [permission, setPermission] = useState(getNotificationPermission());

  const activeReminders = activeHabits.filter((h) => Boolean(h.reminderTime));

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      showToast('success', 'Browser notifications enabled.');
    } else if (result === 'denied') {
      showToast('error', 'Browser notifications were blocked. In-app reminders remain active.');
    }
  };

  const handleTestAlert = () => {
    const sent = triggerLocalNotification(
      'TOKA Reminder Test',
      'Consistency over perfection. Your reminder schedule is active.'
    );
    if (!sent) {
      showToast('info', 'TOKA Reminder Test: In-app alert delivered cleanly.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateToTab('profile')}
          aria-label="Back to Profile"
          className="min-h-[44px] min-w-[44px] rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] flex items-center justify-center text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
            Notification Preferences
          </h1>
          <p className="text-xs sm:text-sm text-[var(--toka-text-secondary)]">
            Timezone-aware reminders for active habits ({settings?.timezone || 'UTC'}).
          </p>
        </div>
      </div>

      {/* Master Toggle & Browser Permission */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
              Enable notifications
            </h2>
            <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
              Master switch for daily check-ins and per-habit reminders.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings?.notificationsEnabled ?? true}
            onClick={() =>
              updateSettings({
                notificationsEnabled: !(settings?.notificationsEnabled ?? true),
              })
            }
            className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 ${
              settings?.notificationsEnabled ? 'bg-[#C6FF69]' : 'bg-[var(--toka-border)]'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-[#121512] transition-transform ${
                settings?.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="pt-4 border-t border-[var(--toka-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-[var(--toka-text-secondary)]">
            Browser permission:{' '}
            <span className="font-medium text-[var(--toka-text-primary)] capitalize">
              {permission}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {permission !== 'granted' && permission !== 'unsupported' ? (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="min-h-[40px] px-4 py-1.5 rounded-xl bg-[#C6FF69] text-[#121512] text-xs font-semibold"
              >
                Allow System Alerts
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleTestAlert}
              className="min-h-[40px] px-4 py-1.5 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-secondary)] text-xs font-medium text-[var(--toka-text-primary)] hover:border-[#C6FF69] inline-flex items-center gap-1.5"
            >
              <Bell size={14} />
              <span>Send Test Alert</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daily Summary Reminder */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
              Daily summary check-in
            </h2>
            <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
              A single gentle prompt if you still have scheduled habits remaining.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            disabled={!settings?.notificationsEnabled}
            aria-checked={settings?.dailyReminderEnabled ?? true}
            onClick={() =>
              updateSettings({
                dailyReminderEnabled: !(settings?.dailyReminderEnabled ?? true),
              })
            }
            className={`w-12 h-7 rounded-full transition-colors p-1 shrink-0 disabled:opacity-40 ${
              settings?.dailyReminderEnabled ? 'bg-[#C6FF69]' : 'bg-[var(--toka-border)]'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-[#121512] transition-transform ${
                settings?.dailyReminderEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 pt-2">
          <label
            htmlFor="daily-reminder-time"
            className="text-sm text-[var(--toka-text-secondary)]"
          >
            Preferred check-in time
          </label>
          <input
            id="daily-reminder-time"
            type="time"
            disabled={!settings?.notificationsEnabled || !settings?.dailyReminderEnabled}
            value={settings?.dailyReminderTime || '08:30'}
            onChange={(e) => updateSettings({ dailyReminderTime: e.target.value })}
            className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-sm font-mono-num text-[var(--toka-text-primary)] focus:outline-none focus:border-[#C6FF69] disabled:opacity-40"
          />
        </div>
      </div>

      {/* Per-habit reminder schedule (active habits only) */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
              Active habit reminders
            </h2>
            <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
              Archived habits never trigger notifications.
            </p>
          </div>
          <span className="font-mono-num text-xs text-[var(--toka-text-secondary)]">
            {activeReminders.length} scheduled
          </span>
        </div>

        {activeReminders.length === 0 ? (
          <p className="text-xs text-[var(--toka-text-secondary)] py-3">
            No active habits have individual reminder times set. Edit any habit to configure one.
          </p>
        ) : (
          <div className="divide-y divide-[var(--toka-border)]">
            {activeReminders.map((habit) => (
              <button
                key={habit.id}
                type="button"
                onClick={() => navigateToScreen('edit-habit', habit.id)}
                className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-[var(--toka-bg-secondary)]/50 px-2 -mx-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[var(--toka-bg-secondary)] flex items-center justify-center shrink-0 text-[var(--toka-text-primary)]">
                    <HabitIcon name={habit.icon} size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--toka-text-primary)] truncate">
                      {habit.title}
                    </div>
                    <div className="text-xs text-[var(--toka-text-secondary)]">
                      {habit.category}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono-num text-xs font-medium text-[var(--toka-accent-text)] shrink-0">
                  <Clock size={13} />
                  {habit.reminderTime}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
