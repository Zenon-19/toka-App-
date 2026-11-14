import { useState } from 'react';
import {
  Bell,
  Calendar,
  ChevronRight,
  Compass,
  LogOut,
  Pencil,
  Settings,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog.tsx';
import { useHabitData } from '../hooks/useHabitData.ts';
import { useTokaStore } from '../store/useTokaStore.ts';
import { formatShortDate } from '../utils/date.ts';

export function ProfileScreen() {
  const profile = useTokaStore((s) => s.profile);
  const updateProfile = useTokaStore((s) => s.updateProfile);
  const logout = useTokaStore((s) => s.logout);
  const navigateToScreen = useTokaStore((s) => s.navigateToScreen);
  const setShowOnboardingPreview = useTokaStore((s) => s.setShowOnboardingPreview);

  const { activeHabits, archivedHabits, totalCompletedCount, overallStreaks } = useHabitData();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const avatarSrc =
    !avatarFailed && profile?.avatarUrl
      ? profile.avatarUrl
      : '/src/assets/images/toka_avatar_emblem_1794664301644.jpg';

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSavingName(true);
    const ok = await updateProfile({ name: trimmed });
    setSavingName(false);
    if (ok) setEditingName(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--toka-text-primary)]">
          Profile
        </h1>
        <p className="mt-1 text-sm text-[var(--toka-text-secondary)]">
          Your personal identity, consistency summary, and workspace preferences.
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] shrink-0">
            <img
              src={avatarSrc}
              alt={`${profile?.name || 'User'} avatar`}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  maxLength={60}
                  aria-label="Display name"
                  className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-[var(--toka-bg-secondary)] border border-[var(--toka-border)] text-sm text-[var(--toka-text-primary)] focus:outline-none focus:border-[#C6FF69]"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={savingName}
                  className="min-h-[42px] px-4 py-1.5 rounded-xl bg-[#C6FF69] text-[#121512] text-xs font-semibold"
                >
                  {savingName ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(false);
                    setNameInput(profile?.name || '');
                  }}
                  className="min-h-[42px] px-3 py-1.5 rounded-xl border border-[var(--toka-border)] text-xs text-[var(--toka-text-secondary)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-[var(--toka-text-primary)] truncate">
                  {profile?.name || 'TOKA Member'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(profile?.name || '');
                    setEditingName(true);
                  }}
                  aria-label="Edit display name"
                  className="min-h-[36px] min-w-[36px] rounded-lg flex items-center justify-center text-[var(--toka-text-secondary)] hover:text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] transition-colors"
                >
                  <Pencil size={15} />
                </button>
              </div>
            )}

            <p className="mt-1 text-sm text-[var(--toka-text-secondary)] truncate">
              {profile?.email}
            </p>
            {profile?.createdAt ? (
              <p className="mt-1 text-xs text-[var(--toka-text-secondary)] font-mono-num">
                Member since {formatShortDate(profile.createdAt.slice(0, 10))}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[var(--toka-border)] grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-[var(--toka-text-secondary)]">Active habits</div>
            <div className="mt-1 font-mono-num text-xl font-semibold text-[var(--toka-text-primary)]">
              {activeHabits.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--toka-text-secondary)]">Completions</div>
            <div className="mt-1 font-mono-num text-xl font-semibold text-[var(--toka-accent-text)]">
              {totalCompletedCount}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--toka-text-secondary)]">Best streak</div>
            <div className="mt-1 font-mono-num text-xl font-semibold text-[var(--toka-text-primary)]">
              {overallStreaks.bestStreak}d
            </div>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="rounded-2xl bg-[var(--toka-bg-card)] border border-[var(--toka-border)] divide-y divide-[var(--toka-border)] overflow-hidden">
        <button
          type="button"
          onClick={() => navigateToScreen('settings')}
          className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--toka-bg-secondary)]/60 transition-colors text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--toka-bg-secondary)] flex items-center justify-center text-[var(--toka-text-primary)]">
              <Settings size={18} />
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--toka-text-primary)]">
                Settings
              </div>
              <div className="text-xs text-[var(--toka-text-secondary)]">
                Theme, timezone, data export, and account management
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[var(--toka-text-secondary)]" />
        </button>

        <button
          type="button"
          onClick={() => navigateToScreen('notifications')}
          className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--toka-bg-secondary)]/60 transition-colors text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--toka-bg-secondary)] flex items-center justify-center text-[var(--toka-text-primary)]">
              <Bell size={18} />
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--toka-text-primary)]">
                Notification Preferences
              </div>
              <div className="text-xs text-[var(--toka-text-secondary)]">
                Daily check-in alerts and per-habit reminder schedules
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[var(--toka-text-secondary)]" />
        </button>

        <button
          type="button"
          onClick={() => navigateToScreen('calendar')}
          className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--toka-bg-secondary)]/60 transition-colors text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--toka-bg-secondary)] flex items-center justify-center text-[var(--toka-text-primary)]">
              <Calendar size={18} />
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
          <ChevronRight size={18} className="text-[var(--toka-text-secondary)]" />
        </button>

        <button
          type="button"
          onClick={() => setShowOnboardingPreview(true)}
          className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-[var(--toka-bg-secondary)]/60 transition-colors text-left"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--toka-bg-secondary)] flex items-center justify-center text-[var(--toka-text-primary)]">
              <Compass size={18} />
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--toka-text-primary)]">
                Review Onboarding Guide
              </div>
              <div className="text-xs text-[var(--toka-text-secondary)]">
                Revisit TOKA principles or add starter habit templates
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-[var(--toka-text-secondary)]" />
        </button>
      </div>

      {/* Sign out */}
      <button
        type="button"
        onClick={() => setConfirmLogoutOpen(true)}
        className="w-full min-h-[48px] px-5 py-3 rounded-2xl border border-[var(--toka-border)] bg-[var(--toka-bg-card)] text-sm font-medium text-[var(--toka-text-primary)] hover:bg-[var(--toka-bg-secondary)] inline-flex items-center justify-center gap-2 transition-colors"
      >
        <LogOut size={16} />
        <span>Sign Out</span>
      </button>

      <ConfirmDialog
        open={confirmLogoutOpen}
        title="Sign out of TOKA?"
        description="Your habits and progress remain safely saved in your account."
        confirmLabel="Sign Out"
        onConfirm={async () => {
          setConfirmLogoutOpen(false);
          await logout();
        }}
        onCancel={() => setConfirmLogoutOpen(false)}
      />
    </div>
  );
}
