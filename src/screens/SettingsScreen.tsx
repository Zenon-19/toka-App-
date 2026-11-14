import { useState } from 'react';
import { ArrowLeft, Download, Moon, Sun, Trash2 } from 'lucide-react';
import { COMMON_TIMEZONES } from '../constants/habits.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import { getBrowserTimezone } from '../utils/date.ts';

export function SettingsScreen() {
  const settings = useTokaStore((s) => s.settings);
  const profile = useTokaStore((s) => s.profile);
  const habits = useTokaStore((s) => s.habits);
  const completions = useTokaStore((s) => s.completions);
  const updateSettings = useTokaStore((s) => s.updateSettings);
  const deleteAccount = useTokaStore((s) => s.deleteAccount);
  const navigateToTab = useTokaStore((s) => s.navigateToTab);
  const showToast = useTokaStore((s) => s.showToast);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const browserTz = getBrowserTimezone();
  const timezoneOptions = Array.from(
    new Set([browserTz, settings?.timezone || 'UTC', ...COMMON_TIMEZONES])
  );

  const handleExportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profile,
      settings,
      habits,
      completions,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toka-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Habit archive exported as JSON.');
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    setDeleting(true);
    await deleteAccount();
    setDeleting(false);
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
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--toka-text-secondary)]">
            Appearance, timezone calibration, and account data controls.
          </p>
        </div>
      </div>

      {/* Appearance */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
            Theme preference
          </h2>
          <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
            Dark obsidian is TOKA&apos;s default aesthetic. Switch to light stone anytime.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => updateSettings({ theme: 'dark' })}
            className={`min-h-[52px] px-4 py-3 rounded-xl border flex items-center justify-center gap-2.5 text-sm font-medium transition-colors ${
              settings?.theme !== 'light'
                ? 'bg-[#C6FF69] text-[#121512] border-[#C6FF69]'
                : 'bg-[var(--toka-bg-secondary)] text-[var(--toka-text-primary)] border-[var(--toka-border)]'
            }`}
          >
            <Moon size={17} />
            <span>Dark Obsidian</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ theme: 'light' })}
            className={`min-h-[52px] px-4 py-3 rounded-xl border flex items-center justify-center gap-2.5 text-sm font-medium transition-colors ${
              settings?.theme === 'light'
                ? 'bg-[#C6FF69] text-[#121512] border-[#C6FF69]'
                : 'bg-[var(--toka-bg-secondary)] text-[var(--toka-text-primary)] border-[var(--toka-border)]'
            }`}
          >
            <Sun size={17} />
            <span>Light Stone</span>
          </button>
        </div>
      </div>

      {/* Timezone */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6 space-y-3">
        <div>
          <label
            htmlFor="timezone-select"
            className="block text-base font-semibold text-[var(--toka-text-primary)]"
          >
            Local timezone
          </label>
          <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
            Used for accurate midnight boundaries, streak protection, and reminders.
          </p>
        </div>

        <select
          id="timezone-select"
          value={settings?.timezone || browserTz}
          onChange={(e) => updateSettings({ timezone: e.target.value })}
          className="w-full min-h-[46px] px-4 py-2 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-sm text-[var(--toka-text-primary)] focus:outline-none focus:border-[#C6FF69]"
        >
          {timezoneOptions.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {/* Data Export */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
            Export personal data
          </h2>
          <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
            Download all habits, completion logs, and preferences as JSON.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportJson}
          className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-secondary)] text-sm font-medium text-[var(--toka-text-primary)] hover:border-[#C6FF69] inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <Download size={16} />
          <span>Export JSON</span>
        </button>
      </div>

      {/* Delete Account */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-red-500/30 p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-red-400">Delete account</h2>
          <p className="text-xs text-[var(--toka-text-secondary)] mt-1 leading-relaxed">
            Permanently erase your TOKA profile, all habits, completion history, and preferences
            from the database. This action cannot be undone.
          </p>
        </div>

        {!deleteDialogOpen ? (
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600/15 border border-red-500/40 text-sm font-medium text-red-400 hover:bg-red-600/25 inline-flex items-center gap-2 transition-colors"
          >
            <Trash2 size={16} />
            <span>Delete Account & Data</span>
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-[var(--toka-bg-secondary)] border border-red-500/30 space-y-3">
            <label
              htmlFor="delete-confirm-input"
              className="block text-xs text-[var(--toka-text-primary)]"
            >
              Type <span className="font-mono-num font-semibold">DELETE</span> to permanently
              remove your account:
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] text-sm font-mono-num text-[var(--toka-text-primary)] focus:outline-none focus:border-red-400"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={confirmText !== 'DELETE' || deleting}
                onClick={handleDeleteAccount}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Confirm Permanent Deletion'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setConfirmText('');
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-[var(--toka-border)] text-xs text-[var(--toka-text-secondary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
