import { auth } from '../lib/firebase.ts';
import type {
  Habit,
  HabitCompletion,
  HabitInput,
  UserProfile,
  UserSettings,
} from '../types/index.ts';

let inMemoryIdToken: string | null = null;

export function setInMemoryToken(token: string | null) {
  inMemoryIdToken = token;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    inMemoryIdToken = await currentUser.getIdToken();
  }
  if (!inMemoryIdToken) {
    throw new Error('Authentication required. Please sign in.');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${inMemoryIdToken}`,
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(path, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let errorMessage = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && typeof data.error === 'string') {
        errorMessage = data.error;
      }
    } catch {
      // Ignore JSON parse error
    }
    throw new Error(errorMessage);
  }

  return res.json() as Promise<T>;
}

export interface WorkspacePayload {
  user: UserProfile;
  settings: UserSettings;
  habits: Habit[];
  completions: HabitCompletion[];
}

export const tokaApi = {
  fetchWorkspace: (timezone: string) =>
    request<WorkspacePayload>(`/api/workspace?tz=${encodeURIComponent(timezone)}`),

  updateProfile: (payload: { name?: string; avatarUrl?: string | null }) =>
    request<UserProfile>('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  updateSettings: (
    payload: Partial<
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
  ) =>
    request<UserSettings>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteAccount: () =>
    request<{ deleted: boolean }>('/api/account', {
      method: 'DELETE',
    }),

  createHabit: (input: HabitInput) =>
    request<Habit>('/api/habits', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  createHabitsBatch: (habits: HabitInput[]) =>
    request<Habit[]>('/api/habits/batch', {
      method: 'POST',
      body: JSON.stringify({ habits }),
    }),

  updateHabit: (habitId: string, updates: Partial<HabitInput> & { status?: 'active' | 'archived' }) =>
    request<Habit>(`/api/habits/${habitId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteHabit: (habitId: string) =>
    request<{ deleted: boolean }>(`/api/habits/${habitId}`, {
      method: 'DELETE',
    }),

  toggleCompletion: (habitId: string, completionDate: string, completed: boolean) =>
    request<HabitCompletion>('/api/completions/toggle', {
      method: 'POST',
      body: JSON.stringify({ habitId, completionDate, completed }),
    }),
};
