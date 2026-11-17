import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ArrowLeft, Download, Moon, Sun, Trash2, Upload } from 'lucide-react';
import { COMMON_TIMEZONES } from '../constants/habits.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import { getBrowserTimezone, normalizeTimezone } from '../utils/date.ts';

export function SettingsScreen() {
  const settings = useTokaStore((s) => s.settings);
  const updateSettings = useTokaStore((s) => s.updateSettings);
  const exportDataJson = useTokaStore((s) => s.exportDataJson);
  const exportDataCsv = useTokaStore((s) => s.exportDataCsv);
  const importDataJson = useTokaStore((s) => s.importDataJson);
  const resetAllData = useTokaStore((s) => s.resetAllData);
  const navigateToTab = useTokaStore((s) => s.navigateToTab);
  const showToast = useTokaStore((s) => s.showToast);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const browserTz = getBrowserTimezone();
  const currentTz = normalizeTimezone(settings?.timezone || browserTz);

  const knownIds = new Set(COMMON_TIMEZONES.map((z) => z.id));
  const timezoneOptions = [
    ...(knownIds.has(currentTz) ? [] : [{ id: currentTz, label: currentTz }]),
    ...(browserTz !== currentTz && !knownIds.has(browserTz)
      ? [{ id: browserTz, label: browserTz }]
      : []),
    ...COMMON_TIMEZONES,
  ];

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(exportDataJson(), `toka-backup-${stamp}.json`, 'application/json');
    showToast('success', 'Data exported as JSON.');
  };

  const handleExportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    triggerDownload(exportDataCsv(), `toka-habits-${stamp}.csv`, 'text/csv;charset=utf-8');
    showToast('success', 'Data exported as CSV.');
  };

  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      await importDataJson(text);
    } catch {
      showToast('error', 'Could not read the selected backup file.');
    }
  };

  const handleResetAll = async () => {
    if (confirmText.trim() !== 'RESET') return;
    setResetting(true);
    const ok = await resetAllData();
    setResetting(false);
    if (ok) {
      setResetDialogOpen(false);
      setConfirmText('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigateToTab('profile')}
          aria-label="Back to Profile"
          className="min-h-[44px] min-w-[44px] rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] flex items-center justify-center text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--toka-text-secondary)]">
            Appearance, timezone calibration, and local device data controls.
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
            className={`min-h-[52px] px-4 py-3 rounded-xl border flex items-center justify-center gap-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
              settings?.theme !== 'light'
                ? 'bg-[#C6FF69] text-[#121512] border-[#C6FF69]'
                : 'bg-[var(--toka-bg-secondary)] text-[var(--toka-text-primary)] border-[var(--toka-border)]'
            }`}
          >
            <Moon size={17} aria-hidden="true" />
            <span>Dark Obsidian</span>
          </button>

          <button
            type="button"
            onClick={() => updateSettings({ theme: 'light' })}
            className={`min-h-[52px] px-4 py-3 rounded-xl border flex items-center justify-center gap-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
              settings?.theme === 'light'
                ? 'bg-[#C6FF69] text-[#121512] border-[#C6FF69]'
                : 'bg-[var(--toka-bg-secondary)] text-[var(--toka-text-primary)] border-[var(--toka-border)]'
            }`}
          >
            <Sun size={17} aria-hidden="true" />
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
          value={currentTz}
          onChange={(e) => updateSettings({ timezone: e.target.value })}
          className="w-full min-h-[46px] px-4 py-2 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-sm text-[var(--toka-text-primary)] focus:outline-none focus:border-[#C6FF69]"
        >
          {timezoneOptions.map((tz) => (
            <option key={tz.id} value={tz.id}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>

      {/* Data Export & Import */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
            Backup &amp; portability
          </h2>
          <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
            Your data is stored on this device. Export JSON/CSV or restore from a JSON backup.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleExportJson}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-secondary)] text-sm font-medium text-[var(--toka-text-primary)] hover:border-[#929B93] inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
          >
            <Download size={16} aria-hidden="true" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-secondary)] text-sm font-medium text-[var(--toka-text-primary)] hover:border-[#929B93] inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
          >
            <Download size={16} aria-hidden="true" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-secondary)] text-sm font-medium text-[var(--toka-text-primary)] hover:border-[#929B93] inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
          >
            <Upload size={16} aria-hidden="true" />
            <span>Import JSON</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImportFile}
            aria-label="Import backup JSON file"
            className="hidden"
          />
        </div>
      </div>

      {/* Reset All Data */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-red-500/30 p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-red-400">Reset all data</h2>
          <p className="text-xs text-[var(--toka-text-secondary)] mt-1 leading-relaxed">
            Your data is stored on this device. Resetting permanently erases your profile, all
            habits, completion history, and preferences from this browser. This action cannot be
            undone.
          </p>
        </div>

        {!resetDialogOpen ? (
          <button
            type="button"
            onClick={() => setResetDialogOpen(true)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600/15 border border-red-500/40 text-sm font-medium text-red-400 hover:bg-red-600/25 inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <Trash2 size={16} aria-hidden="true" />
            <span>Reset all data</span>
          </button>
        ) : (
          <div className="p-4 rounded-xl bg-[var(--toka-bg-secondary)] border border-red-500/30 space-y-3">
            <label
              htmlFor="delete-confirm-input"
              className="block text-xs text-[var(--toka-text-primary)]"
            >
              Type <span className="tabular-nums font-semibold">RESET</span> to permanently clear
              all data stored on this device:
            </label>
            <input
              id="delete-confirm-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="RESET"
              className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] text-sm tabular-nums text-[var(--toka-text-primary)] focus:outline-none focus:border-red-400"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={confirmText.trim() !== 'RESET' || resetting}
                onClick={handleResetAll}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                {resetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
              <button
                type="button"
                disabled={resetting}
                onClick={() => {
                  setResetDialogOpen(false);
                  setConfirmText('');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--toka-border)] text-xs text-[var(--toka-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
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
