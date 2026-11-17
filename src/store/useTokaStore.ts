import { create } from 'zustand';
import {
  TOKA_SCHEMA_VERSION,
  buildExportCsv,
  buildExportJson,
  deleteLocalHabit,
  importWorkspaceJson,
  insertLocalHabit,
  insertLocalHabitsBatch,
  loadLocalWorkspace,
  resetAllLocalData,
  saveLocalProfile,
  saveLocalSettings,
  updateLocalHabit,
  upsertLocalCompletion,
} from '../services/localDb.ts';
import type {
  AppScreen,
  Habit,
  HabitCompletion,
  HabitInput,
  MainTab,
  UserProfile,
  UserSettings,
} from '../types/index.ts';
import { getBrowserTimezone, getTodayInTimezone, normalizeTimezone } from '../utils/date.ts';
import { attachHabitStreaks } from '../utils/habitLogic.ts';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface TokaState {
  workspaceInitialized: boolean;

  // Workspace data (persisted in browser IndexedDB)
  schemaVersion: number;
  profile: UserProfile | null;
  settings: UserSettings | null;
  habits: Habit[];
  completions: HabitCompletion[];
  workspaceLoading: boolean;
  workspaceError: string | null;

  // Navigation
  activeTab: MainTab;
  activeScreen: AppScreen;
  selectedHabitId: string | null;
  selectedDate: string;
  showOnboardingPreview: boolean;

  // UI feedback
  toast: ToastMessage | null;

  // Actions
  loadWorkspace: () => Promise<void>;
  navigateToTab: (tab: MainTab) => void;
  navigateToScreen: (screen: AppScreen, habitId?: string | null) => void;
  setSelectedDate: (dateStr: string) => void;
  setShowOnboardingPreview: (show: boolean) => void;

  showToast: (type: ToastMessage['type'], message: string) => void;
  clearToast: () => void;

  completeOnboarding: (params: {
    firstName: string;
    firstHabit: HabitInput | null;
  }) => Promise<boolean>;

  createHabit: (input: HabitInput) => Promise<Habit | null>;
  createStarterHabits: (items: HabitInput[]) => Promise<void>;
  updateHabit: (
    habitId: string,
    updates: Partial<HabitInput> & { status?: 'active' | 'archived' }
  ) => Promise<Habit | null>;
  deleteHabit: (habitId: string) => Promise<boolean>;
  toggleCompletion: (habitId: string, dateStr: string) => Promise<void>;

  updateProfile: (updates: { name?: string; avatarUrl?: string | null }) => Promise<boolean>;
  updateSettings: (
    updates: Partial<
      Pick<
        UserSettings,
        | 'theme'
        | 'notificationsEnabled'
        | 'dailyReminderEnabled'
        | 'dailyReminderTime'
        | 'timezone'
        | 'onboardingCompleted'
      >
    >
  ) => Promise<boolean>;

  exportDataJson: () => string;
  exportDataCsv: () => string;
  importDataJson: (rawJson: string) => Promise<boolean>;
  resetAllData: () => Promise<boolean>;
}

let toastCounter = 0;

function applyThemeToDom(theme: 'dark' | 'light') {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme !== 'light');
  }
}

export const useTokaStore = create<TokaState>((set, get) => ({
  workspaceInitialized: false,

  schemaVersion: TOKA_SCHEMA_VERSION,
  profile: null,
  settings: null,
  habits: [],
  completions: [],
  workspaceLoading: false,
  workspaceError: null,

  activeTab: 'home',
  activeScreen: 'home',
  selectedHabitId: null,
  selectedDate: getTodayInTimezone(getBrowserTimezone()),
  showOnboardingPreview: false,

  toast: null,

  loadWorkspace: async () => {
    set({ workspaceLoading: true, workspaceError: null });
    try {
      const tz = getBrowserTimezone();
      const ws = await loadLocalWorkspace(tz);
      const todayInUserTz = getTodayInTimezone(ws.settings.timezone || tz);

      applyThemeToDom(ws.settings.theme);

      set({
        schemaVersion: ws.schemaVersion,
        profile: ws.profile,
        settings: ws.settings,
        habits: attachHabitStreaks(ws.habits, ws.completions, todayInUserTz),
        completions: ws.completions,
        selectedDate: todayInUserTz,
        workspaceLoading: false,
        workspaceInitialized: true,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to load local TOKA storage.';
      set({
        workspaceError: message,
        workspaceLoading: false,
        workspaceInitialized: true,
      });
    }
  },

  navigateToTab: (tab) =>
    set({
      activeTab: tab,
      activeScreen: tab,
      selectedHabitId: null,
    }),

  navigateToScreen: (screen, habitId = null) => {
    const tabMap: Partial<Record<AppScreen, MainTab>> = {
      home: 'home',
      habits: 'habits',
      insights: 'insights',
      profile: 'profile',
    };
    const nextTab = tabMap[screen];
    set((state) => ({
      activeScreen: screen,
      activeTab: nextTab || state.activeTab,
      selectedHabitId: habitId !== undefined ? habitId : state.selectedHabitId,
    }));
  },

  setSelectedDate: (dateStr) => set({ selectedDate: dateStr }),
  setShowOnboardingPreview: (show) => set({ showOnboardingPreview: show }),

  showToast: (type, message) => {
    const id = ++toastCounter;
    set({ toast: { id, type, message } });
    setTimeout(() => {
      if (get().toast?.id === id) {
        set({ toast: null });
      }
    }, 3600);
  },

  clearToast: () => set({ toast: null }),

  completeOnboarding: async ({ firstName, firstHabit }) => {
    try {
      const currentProfile = get().profile || {
        id: 'local-user',
        name: '',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      };
      const currentSettings = get().settings;
      const tz = currentSettings?.timezone || getBrowserTimezone();

      const savedProfile = await saveLocalProfile({
        ...currentProfile,
        name: firstName.trim(),
      });

      let nextHabits = get().habits;
      if (firstHabit && firstHabit.title.trim()) {
        const created = await insertLocalHabit(firstHabit, tz);
        const todayStr = getTodayInTimezone(tz);
        nextHabits = attachHabitStreaks([...nextHabits, created], get().completions, todayStr);
      }

      const nextSettings: UserSettings = currentSettings
        ? await saveLocalSettings({ ...currentSettings, onboardingCompleted: true })
        : await saveLocalSettings({
            id: 'local-settings',
            userId: 'local-user',
            theme: 'dark',
            notificationsEnabled: true,
            dailyReminderEnabled: true,
            dailyReminderTime: '08:30',
            timezone: tz,
            onboardingCompleted: true,
            createdAt: new Date().toISOString(),
          });

      set({
        profile: savedProfile,
        settings: nextSettings,
        habits: nextHabits,
        activeTab: 'home',
        activeScreen: 'home',
        showOnboardingPreview: false,
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to finish onboarding.';
      get().showToast('error', message);
      return false;
    }
  },

  createHabit: async (input) => {
    try {
      const tz = get().settings?.timezone || getBrowserTimezone();
      const created = await insertLocalHabit(input, tz);
      set((state) => {
        const todayStr = getTodayInTimezone(state.settings?.timezone || getBrowserTimezone());
        return {
          habits: attachHabitStreaks([...state.habits, created], state.completions, todayStr),
        };
      });
      get().showToast('success', `"${created.title}" added to your routine.`);
      return created;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create habit.';
      get().showToast('error', message);
      return null;
    }
  },

  createStarterHabits: async (items) => {
    try {
      const tz = get().settings?.timezone || getBrowserTimezone();
      const created = await insertLocalHabitsBatch(items, tz);
      const currentSettings = get().settings;
      const updatedSettings = currentSettings
        ? await saveLocalSettings({ ...currentSettings, onboardingCompleted: true })
        : null;
      set((state) => {
        const todayStr = getTodayInTimezone(
          updatedSettings?.timezone || state.settings?.timezone || getBrowserTimezone()
        );
        return {
          habits: attachHabitStreaks([...state.habits, ...created], state.completions, todayStr),
          ...(updatedSettings ? { settings: updatedSettings } : {}),
          activeTab: 'home',
          activeScreen: 'home',
          showOnboardingPreview: false,
        };
      });
      if (created.length > 0) {
        get().showToast('success', `Added ${created.length} habits.`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to add habits.';
      get().showToast('error', message);
    }
  },

  updateHabit: async (habitId, updates) => {
    try {
      const updated = await updateLocalHabit(habitId, updates);
      if (!updated) {
        get().showToast('error', 'Habit not found.');
        return null;
      }
      set((state) => {
        const todayStr = getTodayInTimezone(state.settings?.timezone || getBrowserTimezone());
        const nextHabits = state.habits.map((h) => (h.id === habitId ? updated : h));
        return {
          habits: attachHabitStreaks(nextHabits, state.completions, todayStr),
        };
      });
      get().showToast('success', 'Habit updated.');
      return updated;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update habit.';
      get().showToast('error', message);
      return null;
    }
  },

  deleteHabit: async (habitId) => {
    try {
      await deleteLocalHabit(habitId);
      set((state) => ({
        habits: state.habits.filter((h) => h.id !== habitId),
        completions: state.completions.filter((c) => c.habitId !== habitId),
      }));
      get().showToast('success', 'Habit deleted.');
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete habit.';
      get().showToast('error', message);
      return false;
    }
  },

  toggleCompletion: async (habitId, dateStr) => {
    const prevHabits = get().habits;
    const prevCompletions = get().completions;
    const todayStr = getTodayInTimezone(get().settings?.timezone || getBrowserTimezone());
    const existing = prevCompletions.find(
      (c) => c.habitId === habitId && c.completionDate === dateStr
    );
    const nextCompleted = !(existing?.completed === true);
    const prevHabit = prevHabits.find((h) => h.id === habitId);
    const prevStreak = prevHabit?.streak ?? 0;

    // Optimistic update
    const optimisticList: HabitCompletion[] = existing
      ? prevCompletions.map((c) =>
          c.habitId === habitId && c.completionDate === dateStr
            ? { ...c, completed: nextCompleted }
            : c
        )
      : [
          ...prevCompletions,
          {
            id: `temp-${habitId}-${dateStr}`,
            habitId,
            userId: 'local-user',
            completionDate: dateStr,
            completed: nextCompleted,
            createdAt: new Date().toISOString(),
          },
        ];

    const optimisticHabits = attachHabitStreaks(prevHabits, optimisticList, todayStr);
    const nextHabit = optimisticHabits.find((h) => h.id === habitId);
    const nextStreak = nextHabit?.streak ?? 0;

    set({
      completions: optimisticList,
      habits: optimisticHabits,
    });

    try {
      const saved = await upsertLocalCompletion(habitId, dateStr, nextCompleted);
      set((state) => {
        const hasExisting = state.completions.some(
          (c) => c.habitId === habitId && c.completionDate === dateStr
        );
        const syncedCompletions = hasExisting
          ? state.completions.map((c) =>
              c.habitId === habitId && c.completionDate === dateStr ? saved : c
            )
          : [...state.completions, saved];
        const currentToday = getTodayInTimezone(state.settings?.timezone || getBrowserTimezone());
        return {
          completions: syncedCompletions,
          habits: attachHabitStreaks(state.habits, syncedCompletions, currentToday),
        };
      });

      // Milestone celebration at 7, 30, and 100 day streaks
      if (nextCompleted && nextHabit && nextStreak > prevStreak) {
        if (nextStreak === 7) {
          get().showToast(
            'success',
            `7-day streak on "${nextHabit.title}" — one full week of consistency.`
          );
        } else if (nextStreak === 30) {
          get().showToast(
            'success',
            `30-day streak on "${nextHabit.title}" — a full month of showing up.`
          );
        } else if (nextStreak === 100) {
          get().showToast(
            'success',
            `100-day streak on "${nextHabit.title}" — extraordinary consistency.`
          );
        }
      }
    } catch (error: unknown) {
      set({ completions: prevCompletions, habits: prevHabits });
      const message = error instanceof Error ? error.message : 'Could not save completion.';
      get().showToast('error', message);
    }
  },

  updateProfile: async (updates) => {
    try {
      const current = get().profile;
      if (!current) return false;
      const next: UserProfile = {
        ...current,
        ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
        ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
      };
      const saved = await saveLocalProfile(next);
      set({ profile: saved });
      get().showToast('success', 'Profile saved.');
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save profile.';
      get().showToast('error', message);
      return false;
    }
  },

  updateSettings: async (updates) => {
    try {
      const current = get().settings;
      if (!current) return false;
      const next: UserSettings = {
        ...current,
        ...updates,
        timezone: normalizeTimezone(updates.timezone ?? current.timezone),
      };
      const saved = await saveLocalSettings(next);
      applyThemeToDom(saved.theme);

      set((state) => {
        const tz = saved.timezone || getBrowserTimezone();
        const todayStr = getTodayInTimezone(tz);
        return {
          settings: saved,
          habits: attachHabitStreaks(state.habits, state.completions, todayStr),
          ...(updates.timezone ? { selectedDate: todayStr } : {}),
        };
      });

      if (updates.onboardingCompleted === undefined) {
        get().showToast('success', 'Preferences saved.');
      }
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save preferences.';
      get().showToast('error', message);
      return false;
    }
  },

  exportDataJson: () => {
    const state = get();
    return buildExportJson({
      schemaVersion: state.schemaVersion,
      profile: state.profile || {
        id: 'local-user',
        name: '',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
      settings: state.settings || {
        id: 'local-settings',
        userId: 'local-user',
        theme: 'dark',
        notificationsEnabled: true,
        dailyReminderEnabled: true,
        dailyReminderTime: '08:30',
        timezone: getBrowserTimezone(),
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
      },
      habits: state.habits,
      completions: state.completions,
    });
  },

  exportDataCsv: () => {
    const state = get();
    return buildExportCsv({
      schemaVersion: state.schemaVersion,
      profile: state.profile || {
        id: 'local-user',
        name: '',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
      settings: state.settings || {
        id: 'local-settings',
        userId: 'local-user',
        theme: 'dark',
        notificationsEnabled: true,
        dailyReminderEnabled: true,
        dailyReminderTime: '08:30',
        timezone: getBrowserTimezone(),
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
      },
      habits: state.habits,
      completions: state.completions,
    });
  },

  importDataJson: async (rawJson) => {
    try {
      const ws = await importWorkspaceJson(rawJson);
      const todayInUserTz = getTodayInTimezone(ws.settings.timezone);
      applyThemeToDom(ws.settings.theme);

      set({
        schemaVersion: ws.schemaVersion,
        profile: ws.profile,
        settings: ws.settings,
        habits: attachHabitStreaks(ws.habits, ws.completions, todayInUserTz),
        completions: ws.completions,
        selectedDate: todayInUserTz,
        showOnboardingPreview: false,
      });

      get().showToast(
        'success',
        `Imported ${ws.habits.length} ${ws.habits.length === 1 ? 'habit' : 'habits'} and ${ws.completions.length} records.`
      );
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to import backup file.';
      get().showToast('error', message);
      return false;
    }
  },

  resetAllData: async () => {
    try {
      const tz = getBrowserTimezone();
      const ws = await resetAllLocalData(tz);
      applyThemeToDom(ws.settings.theme);
      const todayStr = getTodayInTimezone(ws.settings.timezone);

      set({
        schemaVersion: ws.schemaVersion,
        profile: ws.profile,
        settings: ws.settings,
        habits: [],
        completions: [],
        selectedDate: todayStr,
        selectedHabitId: null,
        activeTab: 'home',
        activeScreen: 'home',
        showOnboardingPreview: false,
      });

      get().showToast('success', 'All local data has been reset.');
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reset local data.';
      get().showToast('error', message);
      return false;
    }
  },
}));
