import { create } from 'zustand';
import { deleteUser, signInWithPopup, signOut } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { setInMemoryToken, tokaApi } from '../services/api.ts';
import type {
  AppScreen,
  Habit,
  HabitCompletion,
  HabitInput,
  MainTab,
  UserProfile,
  UserSettings,
} from '../types/index.ts';
import { getBrowserTimezone, getTodayInTimezone } from '../utils/date.ts';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface TokaState {
  // Auth
  firebaseUser: FirebaseUser | null;
  authInitialized: boolean;
  authLoading: boolean;
  authError: string | null;

  // Workspace data
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
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setAuthInitialized: (ready: boolean) => void;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  loadWorkspace: () => Promise<void>;

  navigateToTab: (tab: MainTab) => void;
  navigateToScreen: (screen: AppScreen, habitId?: string | null) => void;
  setSelectedDate: (dateStr: string) => void;
  setShowOnboardingPreview: (show: boolean) => void;

  showToast: (type: ToastMessage['type'], message: string) => void;
  clearToast: () => void;

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
  deleteAccount: () => Promise<boolean>;
}

let toastCounter = 0;

export const useTokaStore = create<TokaState>((set, get) => ({
  firebaseUser: null,
  authInitialized: false,
  authLoading: false,
  authError: null,

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

  setFirebaseUser: (user) => {
    set({ firebaseUser: user });
    if (!user) {
      setInMemoryToken(null);
      set({
        profile: null,
        settings: null,
        habits: [],
        completions: [],
        workspaceError: null,
      });
    }
  },

  setAuthInitialized: (ready) => set({ authInitialized: ready }),

  signInWithGoogle: async () => {
    set({ authLoading: true, authError: null });
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      setInMemoryToken(token);
      set({ firebaseUser: result.user, authLoading: false });
      await get().loadWorkspace();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign in with Google.';
      set({ authError: message, authLoading: false });
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      setInMemoryToken(null);
      set({
        firebaseUser: null,
        profile: null,
        settings: null,
        habits: [],
        completions: [],
        activeTab: 'home',
        activeScreen: 'home',
        selectedHabitId: null,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign out.';
      get().showToast('error', message);
    }
  },

  loadWorkspace: async () => {
    const user = get().firebaseUser || auth.currentUser;
    if (!user) return;
    set({ workspaceLoading: true, workspaceError: null });
    try {
      const token = await user.getIdToken();
      setInMemoryToken(token);
      const tz = getBrowserTimezone();
      const data = await tokaApi.fetchWorkspace(tz);
      const todayInUserTz = getTodayInTimezone(data.settings.timezone || tz);

      // Apply theme class
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', data.settings.theme !== 'light');
      }

      set({
        profile: data.user,
        settings: data.settings,
        habits: data.habits,
        completions: data.completions,
        selectedDate: todayInUserTz,
        workspaceLoading: false,
        activeScreen: data.settings.onboardingCompleted ? get().activeScreen : 'onboarding',
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unable to connect to TOKA workspace.';
      set({ workspaceError: message, workspaceLoading: false });
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
    }, 3400);
  },

  clearToast: () => set({ toast: null }),

  createHabit: async (input) => {
    try {
      const created = await tokaApi.createHabit(input);
      set((state) => ({ habits: [...state.habits, created] }));
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
      const created = await tokaApi.createHabitsBatch(items);
      const updatedSettings = await tokaApi.updateSettings({ onboardingCompleted: true });
      set((state) => ({
        habits: [...state.habits, ...created],
        settings: updatedSettings,
        activeTab: 'home',
        activeScreen: 'home',
        showOnboardingPreview: false,
      }));
      if (created.length > 0) {
        get().showToast('success', `Added ${created.length} starter habits.`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save onboarding.';
      get().showToast('error', message);
    }
  },

  updateHabit: async (habitId, updates) => {
    try {
      const updated = await tokaApi.updateHabit(habitId, updates);
      set((state) => ({
        habits: state.habits.map((h) => (h.id === habitId ? updated : h)),
      }));
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
      await tokaApi.deleteHabit(habitId);
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
    const prevCompletions = get().completions;
    const existing = prevCompletions.find(
      (c) => c.habitId === habitId && c.completionDate === dateStr
    );
    const nextCompleted = !(existing?.completed === true);

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
            userId: get().profile?.id || '',
            completionDate: dateStr,
            completed: nextCompleted,
            createdAt: new Date().toISOString(),
          },
        ];

    set({ completions: optimisticList });

    try {
      const saved = await tokaApi.toggleCompletion(habitId, dateStr, nextCompleted);
      set((state) => {
        const hasExisting = state.completions.some(
          (c) => c.habitId === habitId && c.completionDate === dateStr
        );
        return {
          completions: hasExisting
            ? state.completions.map((c) =>
                c.habitId === habitId && c.completionDate === dateStr ? saved : c
              )
            : [...state.completions, saved],
        };
      });
    } catch (error: unknown) {
      // Rollback
      set({ completions: prevCompletions });
      const message = error instanceof Error ? error.message : 'Could not update completion.';
      get().showToast('error', message);
    }
  },

  updateProfile: async (updates) => {
    try {
      const updated = await tokaApi.updateProfile(updates);
      set({ profile: updated });
      get().showToast('success', 'Profile saved.');
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile.';
      get().showToast('error', message);
      return false;
    }
  },

  updateSettings: async (updates) => {
    try {
      const updated = await tokaApi.updateSettings(updates);
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', updated.theme !== 'light');
      }
      set({ settings: updated });
      if (updates.timezone) {
        set({ selectedDate: getTodayInTimezone(updates.timezone) });
      }
      if (updates.onboardingCompleted === undefined) {
        get().showToast('success', 'Preferences updated.');
      }
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update settings.';
      get().showToast('error', message);
      return false;
    }
  },

  deleteAccount: async () => {
    try {
      await tokaApi.deleteAccount();
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await deleteUser(currentUser);
        } catch {
          await signOut(auth);
        }
      }
      setInMemoryToken(null);
      set({
        firebaseUser: null,
        profile: null,
        settings: null,
        habits: [],
        completions: [],
        activeTab: 'home',
        activeScreen: 'home',
      });
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete account.';
      get().showToast('error', message);
      return false;
    }
  },
}));
