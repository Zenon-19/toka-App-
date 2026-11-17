import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Bell,
  Calendar,
  ChevronRight,
  Compass,
  Download,
  HardDrive,
  Moon,
  Pencil,
  Settings,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { useHabitData } from '../hooks/useHabitData.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import { formatShortDate } from '../utils/date.ts';

function getInitials(name?: string): string {
  const clean = (name || '').trim();
  if (!clean) return 'T';
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function ProfileScreen() {
  const profile = useTokaStore((s) => s.profile);
  const settings = useTokaStore((s) => s.settings);
  const updateProfile = useTokaStore((s) => s.updateProfile);
  const updateSettings = useTokaStore((s) => s.updateSettings);
  const exportDataJson = useTokaStore((s) => s.exportDataJson);
  const exportDataCsv = useTokaStore((s) => s.exportDataCsv);
  const importDataJson = useTokaStore((s) => s.importDataJson);
  const resetAllData = useTokaStore((s) => s.resetAllData);
  const navigateToScreen = useTokaStore((s) => s.navigateToScreen);
  const setShowOnboardingPreview = useTokaStore((s) => s.setShowOnboardingPreview);
  const showToast = useTokaStore((s) => s.showToast);

  const { activeHabits, archivedHabits, totalCompletedCount, overallStreaks } = useHabitData();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || '');
  const [savingName, setSavingName] = useState(false);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [resetting, setResetting] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.name?.trim() || 'Set your name';
  const initials = getInitials(profile?.name);

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSavingName(true);
    const ok = await updateProfile({ name: trimmed });
    setSavingName(false);
    if (ok) setEditingName(false);
  };

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select an image file.');
      return;
    }
    if (file.size > 1_500_000) {
      showToast('error', 'Please pick an image smaller than 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        await updateProfile({ avatarUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

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
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerDownload(exportDataJson(), `toka-backup-${dateStamp}.json`, 'application/json');
    showToast('success', 'Data exported as JSON.');
  };

  const handleExportCsv = () => {
    const dateStamp = new Date().toISOString().slice(0, 10);
    triggerDownload(exportDataCsv(), `toka-habits-${dateStamp}.csv`, 'text/csv;charset=utf-8');
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
          Profile
        </h1>
        <p className="mt-1 text-sm text-[var(--toka-text-secondary)]">
          Your personal routine, preferences, and local backups.
        </p>
      </div>

      {/* Device-only storage notice */}
      <div className="rounded-2xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] px-4 py-3.5 flex items-center gap-3">
        <HardDrive size={18} className="text-[var(--toka-accent-text)] shrink-0" aria-hidden="true" />
        <p className="text-xs sm:text-sm text-[var(--toka-text-primary)]">
          Your data is stored on this device. Export a JSON backup anytime to transfer or archive it.
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] shrink-0 flex items-center justify-center">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name ? `${profile.name} avatar` : 'Profile avatar'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
                  {initials}
                </span>
              )}
            </div>

            <div className="sm:hidden flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-secondary)] text-xs font-medium text-[var(--toka-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
              >
                {profile?.avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {profile?.avatarUrl ? (
                <button
                  type="button"
                  onClick={() => updateProfile({ avatarUrl: null })}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] text-left"
                >
                  Use initials
                </button>
              ) : null}
            </div>
          </div>

          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            aria-label="Upload profile photo"
            className="hidden"
          />

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="First name"
                  maxLength={40}
                  aria-label="First name"
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-sm text-[var(--toka-text-primary)] focus:outline-none focus:border-[#C6FF69]"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C6FF69] text-[#121512] text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
                >
                  {savingName ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(false);
                    setNameInput(profile?.name || '');
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--toka-border)] text-xs text-[var(--toka-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-[var(--toka-text-primary)] truncate">
                  {displayName}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(profile?.name || '');
                    setEditingName(true);
                  }}
                  aria-label="Edit first name"
                  className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
                >
                  <Pencil size={15} />
                </button>
              </div>
            )}

            {profile?.createdAt ? (
              <p className="mt-0.5 text-xs text-[var(--toka-text-secondary)] tabular-nums">
                Tracking since {formatShortDate(profile.createdAt.slice(0, 10))}
              </p>
            ) : null}

            <div className="hidden sm:flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-secondary)] text-xs font-medium text-[var(--toka-text-primary)] hover:border-[#929B93] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
              >
                {profile?.avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {profile?.avatarUrl ? (
                <button
                  type="button"
                  onClick={() => updateProfile({ avatarUrl: null })}
                  className="min-h-[44px] px-3 py-2 rounded-xl text-xs text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
                >
                  Use initials
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[var(--toka-border)] grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-[var(--toka-text-secondary)]">Active habits</div>
            <div className="mt-1 tabular-nums text-xl font-semibold text-[var(--toka-text-primary)]">
              {activeHabits.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--toka-text-secondary)]">Completions</div>
            <div className="mt-1 tabular-nums text-xl font-semibold text-[var(--toka-accent-text)]">
              {totalCompletedCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--toka-text-secondary)]">Best streak</div>
            <div className="mt-1 tabular-nums text-xl font-semibold text-[var(--toka-text-primary)]">
              {overallStreaks.bestStreak}d
            </div>
          </div>
        </div>
      </div>

      {/* Quick Theme & Reminders */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">Appearance</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`min-h-[48px] px-4 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
                settings?.theme !== 'light'
                  ? 'bg-[#C6FF69] text-[#121512] border-[#C6FF69]'
                  : 'bg-[var(--toka-bg-secondary)] text-[var(--toka-text-primary)] border-[var(--toka-border)]'
              }`}
            >
              <Moon size={16} aria-hidden="true" />
              <span>Dark Obsidian</span>
            </button>

            <button
              type="button"
              onClick={() => updateSettings({ theme: 'light' })}
              className={`min-h-[48px] px-4 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
                settings?.theme === 'light'
                  ? 'bg-[#C6FF69] text-[#121512] border-[#C6FF69]'
                  : 'bg-[var(--toka-bg-secondary)] text-[var(--toka-text-primary)] border-[var(--toka-border)]'
              }`}
            >
              <Sun size={16} aria-hidden="true" />
              <span>Light Stone</span>
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--toka-border)] flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-[var(--toka-text-primary)]">
              Reminders
            </div>
            <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
              Daily check-in alerts and per-habit notification times
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Toggle reminders"
            aria-checked={settings?.notificationsEnabled ?? true}
            onClick={() =>
              updateSettings({
                notificationsEnabled: !(settings?.notificationsEnabled ?? true),
              })
            }
            className={`min-h-[44px] min-w-[52px] flex items-center rounded-full px-1 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69] ${
              settings?.notificationsEnabled ? 'bg-[#C6FF69]' : 'bg-[var(--toka-border)]'
            }`}
          >
            <span
              className={`block w-6 h-6 rounded-full bg-[#121512] transition-transform ${
                settings?.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Navigation List (Calendar, Reminders, Settings under Profile on < 768px) */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] divide-y divide-[var(--toka-border)] overflow-hidden">
        <button
          type="button"
          onClick={() => navigateToScreen('calendar')}
          className="w-full min-h-[56px] px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--toka-bg-secondary)]/60 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C6FF69]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--toka-bg-secondary)] flex items-center justify-center text-[var(--toka-text-primary)]">
              <Calendar size={18} aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--toka-text-primary)]">
                Calendar & History
              </div>
              <div className="text-xs text-[var(--toka-text-secondary)]">
                Monthly completion view and {archivedHabits.length} archived habits
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[var(--toka-text-secondary)]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => navigateToScreen('notifications')}
          className="w-full min-h-[56px] px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--toka-bg-secondary)]/60 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C6FF69]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--toka-bg-secondary)] flex items-center justify-center text-[var(--toka-text-primary)]">
              <Bell size={18} aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--toka-text-primary)]">
                Reminders & Notification Preferences
              </div>
              <div className="text-xs text-[var(--toka-text-secondary)]">
                Configure check-in schedule and per-habit reminders
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[var(--toka-text-secondary)]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => navigateToScreen('settings')}
          className="w-full min-h-[56px] px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--toka-bg-secondary)]/60 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C6FF69]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--toka-bg-secondary)] flex items-center justify-center text-[var(--toka-text-primary)]">
              <Settings size={18} aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--toka-text-primary)]">
                Settings & Timezone
              </div>
              <div className="text-xs text-[var(--toka-text-secondary)]">
                {settings?.timezone || 'UTC'} · Theme, data controls
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[var(--toka-text-secondary)]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => setShowOnboardingPreview(true)}
          className="w-full min-h-[56px] px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--toka-bg-secondary)]/60 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#C6FF69]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--toka-bg-secondary)] flex items-center justify-center text-[var(--toka-text-primary)]">
              <Compass size={18} aria-hidden="true" />
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--toka-text-primary)]">
                Review Setup Guide
              </div>
              <div className="text-xs text-[var(--toka-text-secondary)]">
                Revisit onboarding or update your first-run setup
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[var(--toka-text-secondary)]" aria-hidden="true" />
        </button>
      </div>

      {/* Export my data & Import data */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--toka-text-primary)]">
            Export &amp; import data
          </h2>
          <p className="text-xs text-[var(--toka-text-secondary)] mt-0.5">
            Download all habits, completion logs, and preferences, or restore from a JSON backup.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={handleExportJson}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-secondary)] text-sm font-medium text-[var(--toka-text-primary)] hover:border-[#929B93] inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
          >
            <Download size={16} aria-hidden="true" />
            <span>Export my data (JSON)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-secondary)] text-sm font-medium text-[var(--toka-text-primary)] hover:border-[#929B93] inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
          >
            <Download size={16} aria-hidden="true" />
            <span>Export my data (CSV)</span>
          </button>

          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-[var(--toka-border)] bg-[var(--toka-bg-secondary)] text-sm font-medium text-[var(--toka-text-primary)] hover:border-[#929B93] inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6FF69]"
          >
            <Upload size={16} aria-hidden="true" />
            <span>Import data (JSON)</span>
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

      {/* Reset all data */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-red-500/30 p-5 sm:p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-red-400">Reset all data</h2>
          <p className="text-xs text-[var(--toka-text-secondary)] mt-1 leading-relaxed">
            Your data is stored on this device. Resetting permanently erases your profile, all
            habits, completion history, and preferences from this browser.
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
              htmlFor="profile-reset-confirm-input"
              className="block text-xs text-[var(--toka-text-primary)]"
            >
              Type <span className="tabular-nums font-semibold">RESET</span> to confirm clearing
              all local data on this device:
            </label>
            <input
              id="profile-reset-confirm-input"
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
