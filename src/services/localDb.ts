import type {
  Habit,
  HabitCategory,
  HabitCompletion,
  HabitFrequency,
  HabitInput,
  TokaExportPayload,
  UserProfile,
  UserSettings,
} from '../types/index.ts';
import { getBrowserTimezone, getTodayInTimezone, normalizeTimezone } from '../utils/date.ts';
import { attachHabitStreaks } from '../utils/habitLogic.ts';

export const TOKA_SCHEMA_VERSION = 1;
const DB_NAME = 'toka_local_db';
const DB_VERSION = 1;

const STORE_META = 'meta';
const STORE_HABITS = 'habits';
const STORE_COMPLETIONS = 'completions';

const FALLBACK_LS_KEY = 'toka_local_fallback_v1';

export interface LocalWorkspace {
  schemaVersion: number;
  profile: UserProfile;
  settings: UserSettings;
  habits: Habit[];
  completions: HabitCompletion[];
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function createDefaultProfile(): UserProfile {
  return {
    id: 'local-user',
    name: '',
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };
}

function createDefaultSettings(timezone?: string): UserSettings {
  return {
    id: 'local-settings',
    userId: 'local-user',
    theme: 'dark',
    notificationsEnabled: true,
    dailyReminderEnabled: true,
    dailyReminderTime: '08:30',
    timezone: normalizeTimezone(timezone || getBrowserTimezone()),
    onboardingCompleted: false,
    createdAt: new Date().toISOString(),
  };
}

function hasIndexedDb(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_HABITS)) {
          db.createObjectStore(STORE_HABITS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_COMPLETIONS)) {
          const compStore = db.createObjectStore(STORE_COMPLETIONS, { keyPath: 'id' });
          compStore.createIndex('habit_date', ['habitId', 'completionDate'], { unique: true });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Failed to open local IndexedDB storage.'));
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('IndexedDB request failed.'));
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('IndexedDB transaction failed.'));
    tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted.'));
  });
}

function readFallback(): LocalWorkspace | null {
  try {
    const raw = window.localStorage.getItem(FALLBACK_LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LocalWorkspace;
  } catch {
    return null;
  }
}

function writeFallback(data: LocalWorkspace): void {
  try {
    window.localStorage.setItem(FALLBACK_LS_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors in fallback
  }
}

function deduplicateCompletions(completions: HabitCompletion[]): HabitCompletion[] {
  const byKey = new Map<string, HabitCompletion>();
  for (const c of completions) {
    if (!c.habitId || !c.completionDate) continue;
    const key = `${c.habitId}::${c.completionDate}`;
    const existing = byKey.get(key);
    if (!existing || c.createdAt >= existing.createdAt) {
      byKey.set(key, {
        ...c,
        id: existing?.id || c.id || generateId(),
        completed: Boolean(c.completed),
      });
    }
  }
  return Array.from(byKey.values());
}

export async function loadLocalWorkspace(defaultTz?: string): Promise<LocalWorkspace> {
  const resolvedTz = normalizeTimezone(defaultTz || getBrowserTimezone());

  if (!hasIndexedDb()) {
    const existing = readFallback();
    if (existing) {
      const normalizedSettings: UserSettings = {
        ...existing.settings,
        timezone: normalizeTimezone(existing.settings.timezone),
      };
      const todayStr = getTodayInTimezone(normalizedSettings.timezone);
      return {
        schemaVersion: TOKA_SCHEMA_VERSION,
        profile: existing.profile,
        settings: normalizedSettings,
        habits: attachHabitStreaks(existing.habits, existing.completions, todayStr),
        completions: existing.completions,
      };
    }
    const fresh: LocalWorkspace = {
      schemaVersion: TOKA_SCHEMA_VERSION,
      profile: createDefaultProfile(),
      settings: createDefaultSettings(resolvedTz),
      habits: [],
      completions: [],
    };
    writeFallback(fresh);
    return fresh;
  }

  const db = await openDb();
  try {
    const tx = db.transaction([STORE_META, STORE_HABITS, STORE_COMPLETIONS], 'readwrite');
    const metaStore = tx.objectStore(STORE_META);
    const habitsStore = tx.objectStore(STORE_HABITS);
    const completionsStore = tx.objectStore(STORE_COMPLETIONS);

    const [profileRow, settingsRow, schemaRow, rawHabits, rawCompletions] = await Promise.all([
      reqToPromise(metaStore.get('profile')) as Promise<{ key: string; value: UserProfile } | undefined>,
      reqToPromise(metaStore.get('settings')) as Promise<{ key: string; value: UserSettings } | undefined>,
      reqToPromise(metaStore.get('schemaVersion')) as Promise<{ key: string; value: number } | undefined>,
      reqToPromise(habitsStore.getAll()) as Promise<Habit[]>,
      reqToPromise(completionsStore.getAll()) as Promise<HabitCompletion[]>,
    ]);

    const profile: UserProfile = profileRow?.value
      ? {
          id: profileRow.value.id || 'local-user',
          name: typeof profileRow.value.name === 'string' ? profileRow.value.name : '',
          avatarUrl: profileRow.value.avatarUrl ?? null,
          createdAt: profileRow.value.createdAt || new Date().toISOString(),
        }
      : createDefaultProfile();

    const settings: UserSettings = settingsRow?.value
      ? {
          ...createDefaultSettings(resolvedTz),
          ...settingsRow.value,
          timezone: normalizeTimezone(settingsRow.value.timezone || resolvedTz),
        }
      : createDefaultSettings(resolvedTz);

    if (!profileRow) {
      metaStore.put({ key: 'profile', value: profile });
    }
    if (!settingsRow || settingsRow.value.timezone !== settings.timezone) {
      metaStore.put({ key: 'settings', value: settings });
    }
    if (!schemaRow || schemaRow.value !== TOKA_SCHEMA_VERSION) {
      metaStore.put({ key: 'schemaVersion', value: TOKA_SCHEMA_VERSION });
    }

    await txDone(tx);

    const completions = deduplicateCompletions(rawCompletions);
    const sortedHabits = [...rawHabits].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const todayStr = getTodayInTimezone(settings.timezone);

    return {
      schemaVersion: TOKA_SCHEMA_VERSION,
      profile,
      settings,
      habits: attachHabitStreaks(sortedHabits, completions, todayStr),
      completions,
    };
  } finally {
    db.close();
  }
}

export async function saveLocalProfile(profile: UserProfile): Promise<UserProfile> {
  if (!hasIndexedDb()) {
    const ws = await loadLocalWorkspace();
    writeFallback({ ...ws, profile });
    return profile;
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORE_META, 'readwrite');
    tx.objectStore(STORE_META).put({ key: 'profile', value: profile });
    await txDone(tx);
    return profile;
  } finally {
    db.close();
  }
}

export async function saveLocalSettings(settings: UserSettings): Promise<UserSettings> {
  const normalized: UserSettings = {
    ...settings,
    timezone: normalizeTimezone(settings.timezone),
  };

  if (!hasIndexedDb()) {
    const ws = await loadLocalWorkspace();
    writeFallback({ ...ws, settings: normalized });
    return normalized;
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORE_META, 'readwrite');
    tx.objectStore(STORE_META).put({ key: 'settings', value: normalized });
    await txDone(tx);
    return normalized;
  } finally {
    db.close();
  }
}

export async function insertLocalHabit(input: HabitInput, timezone: string): Promise<Habit> {
  const now = new Date().toISOString();
  const habit: Habit = {
    id: generateId(),
    userId: 'local-user',
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.category,
    icon: input.icon,
    frequency: input.frequency,
    selectedDays:
      input.frequency === 'daily'
        ? [0, 1, 2, 3, 4, 5, 6]
        : input.frequency === 'weekdays'
        ? [1, 2, 3, 4, 5]
        : input.selectedDays.length > 0
        ? input.selectedDays
        : [1, 2, 3, 4, 5],
    reminderTime: input.reminderTime,
    startDate: input.startDate,
    status: 'active',
    createdAt: now,
    streak: 0,
    bestStreak: 0,
  };

  if (!hasIndexedDb()) {
    const ws = await loadLocalWorkspace(timezone);
    const nextHabits = [...ws.habits, habit];
    writeFallback({ ...ws, habits: nextHabits });
    return habit;
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORE_HABITS, 'readwrite');
    tx.objectStore(STORE_HABITS).put(habit);
    await txDone(tx);
    return habit;
  } finally {
    db.close();
  }
}

export async function insertLocalHabitsBatch(
  items: HabitInput[],
  timezone: string
): Promise<Habit[]> {
  if (items.length === 0) return [];
  const created: Habit[] = [];
  for (const item of items) {
    created.push(await insertLocalHabit(item, timezone));
  }
  return created;
}

export async function updateLocalHabit(
  habitId: string,
  updates: Partial<HabitInput> & { status?: 'active' | 'archived' }
): Promise<Habit | null> {
  if (!hasIndexedDb()) {
    const ws = await loadLocalWorkspace();
    const existing = ws.habits.find((h) => h.id === habitId);
    if (!existing) return null;
    const updated: Habit = { ...existing, ...updates };
    writeFallback({
      ...ws,
      habits: ws.habits.map((h) => (h.id === habitId ? updated : h)),
    });
    return updated;
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORE_HABITS, 'readwrite');
    const store = tx.objectStore(STORE_HABITS);
    const existing = (await reqToPromise(store.get(habitId))) as Habit | undefined;
    if (!existing) return null;

    const updated: Habit = {
      ...existing,
      ...(updates.title !== undefined ? { title: updates.title.trim() } : {}),
      ...(updates.description !== undefined ? { description: updates.description.trim() } : {}),
      ...(updates.category !== undefined ? { category: updates.category } : {}),
      ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
      ...(updates.frequency !== undefined ? { frequency: updates.frequency } : {}),
      ...(updates.selectedDays !== undefined ? { selectedDays: updates.selectedDays } : {}),
      ...(updates.reminderTime !== undefined ? { reminderTime: updates.reminderTime } : {}),
      ...(updates.startDate !== undefined ? { startDate: updates.startDate } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
    };

    store.put(updated);
    await txDone(tx);
    return updated;
  } finally {
    db.close();
  }
}

export async function deleteLocalHabit(habitId: string): Promise<void> {
  if (!hasIndexedDb()) {
    const ws = await loadLocalWorkspace();
    writeFallback({
      ...ws,
      habits: ws.habits.filter((h) => h.id !== habitId),
      completions: ws.completions.filter((c) => c.habitId !== habitId),
    });
    return;
  }

  const db = await openDb();
  try {
    const tx = db.transaction([STORE_HABITS, STORE_COMPLETIONS], 'readwrite');
    tx.objectStore(STORE_HABITS).delete(habitId);
    const compStore = tx.objectStore(STORE_COMPLETIONS);
    const allCompletions = (await reqToPromise(compStore.getAll())) as HabitCompletion[];
    for (const c of allCompletions) {
      if (c.habitId === habitId) {
        compStore.delete(c.id);
      }
    }
    await txDone(tx);
  } finally {
    db.close();
  }
}

export async function upsertLocalCompletion(
  habitId: string,
  completionDate: string,
  completed: boolean
): Promise<HabitCompletion> {
  if (!hasIndexedDb()) {
    const ws = await loadLocalWorkspace();
    const existing = ws.completions.find(
      (c) => c.habitId === habitId && c.completionDate === completionDate
    );
    const record: HabitCompletion = existing
      ? { ...existing, completed }
      : {
          id: generateId(),
          habitId,
          userId: 'local-user',
          completionDate,
          completed,
          createdAt: new Date().toISOString(),
        };
    const nextCompletions = existing
      ? ws.completions.map((c) => (c.id === existing.id ? record : c))
      : [...ws.completions, record];
    writeFallback({ ...ws, completions: nextCompletions });
    return record;
  }

  const db = await openDb();
  try {
    const tx = db.transaction(STORE_COMPLETIONS, 'readwrite');
    const store = tx.objectStore(STORE_COMPLETIONS);
    const index = store.index('habit_date');
    const existing = (await reqToPromise(
      index.get([habitId, completionDate])
    )) as HabitCompletion | undefined;

    const record: HabitCompletion = existing
      ? { ...existing, completed }
      : {
          id: generateId(),
          habitId,
          userId: 'local-user',
          completionDate,
          completed,
          createdAt: new Date().toISOString(),
        };

    store.put(record);
    await txDone(tx);
    return record;
  } finally {
    db.close();
  }
}

export function buildExportJson(workspace: LocalWorkspace): string {
  const payload: TokaExportPayload = {
    schemaVersion: TOKA_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    profile: workspace.profile,
    settings: workspace.settings,
    habits: workspace.habits,
    completions: workspace.completions,
  };
  return JSON.stringify(payload, null, 2);
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildExportCsv(workspace: LocalWorkspace): string {
  const header = [
    'record_type',
    'habit_id',
    'habit_title',
    'category',
    'frequency',
    'selected_days',
    'reminder_time',
    'start_date',
    'status',
    'current_streak',
    'completion_date',
    'completed',
  ];

  const rows: string[] = [header.join(',')];
  const habitById = new Map(workspace.habits.map((h) => [h.id, h]));

  for (const h of workspace.habits) {
    rows.push(
      [
        'habit',
        h.id,
        h.title,
        h.category,
        h.frequency,
        h.selectedDays.join('|'),
        h.reminderTime || '',
        h.startDate,
        h.status,
        h.streak,
        '',
        '',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  for (const c of workspace.completions) {
    const h = habitById.get(c.habitId);
    rows.push(
      [
        'completion',
        c.habitId,
        h?.title || '',
        h?.category || '',
        h?.frequency || '',
        h ? h.selectedDays.join('|') : '',
        h?.reminderTime || '',
        h?.startDate || '',
        h?.status || '',
        h?.streak ?? '',
        c.completionDate,
        c.completed ? 'true' : 'false',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return rows.join('\n');
}

const VALID_CATEGORIES = new Set<HabitCategory>([
  'Personal Development',
  'Learning',
  'Mindfulness',
  'Lifestyle',
  'Productivity',
  'General',
]);

const VALID_FREQUENCIES = new Set<HabitFrequency>(['daily', 'weekdays', 'custom']);

export async function importWorkspaceJson(rawJson: string): Promise<LocalWorkspace> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Selected file is not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Backup file must contain a JSON object.');
  }

  const data = parsed as Record<string, unknown>;
  if (!Array.isArray(data.habits) || !Array.isArray(data.completions)) {
    throw new Error('Backup file is missing habits or completions arrays.');
  }

  const rawProfile = (data.profile && typeof data.profile === 'object'
    ? data.profile
    : {}) as Record<string, unknown>;

  const profile: UserProfile = {
    id: 'local-user',
    name: typeof rawProfile.name === 'string' ? rawProfile.name.trim().slice(0, 60) : '',
    avatarUrl: typeof rawProfile.avatarUrl === 'string' ? rawProfile.avatarUrl : null,
    createdAt:
      typeof rawProfile.createdAt === 'string'
        ? rawProfile.createdAt
        : new Date().toISOString(),
  };

  const rawSettings = (data.settings && typeof data.settings === 'object'
    ? data.settings
    : {}) as Record<string, unknown>;

  const tz = normalizeTimezone(
    typeof rawSettings.timezone === 'string' ? rawSettings.timezone : getBrowserTimezone()
  );

  const settings: UserSettings = {
    id: 'local-settings',
    userId: 'local-user',
    theme: rawSettings.theme === 'light' ? 'light' : 'dark',
    notificationsEnabled:
      typeof rawSettings.notificationsEnabled === 'boolean'
        ? rawSettings.notificationsEnabled
        : true,
    dailyReminderEnabled:
      typeof rawSettings.dailyReminderEnabled === 'boolean'
        ? rawSettings.dailyReminderEnabled
        : true,
    dailyReminderTime:
      typeof rawSettings.dailyReminderTime === 'string' &&
      /^\d{2}:\d{2}$/.test(rawSettings.dailyReminderTime)
        ? rawSettings.dailyReminderTime
        : '08:30',
    timezone: tz,
    onboardingCompleted:
      typeof rawSettings.onboardingCompleted === 'boolean'
        ? rawSettings.onboardingCompleted
        : true,
    createdAt:
      typeof rawSettings.createdAt === 'string'
        ? rawSettings.createdAt
        : new Date().toISOString(),
  };

  const todayStr = getTodayInTimezone(settings.timezone);

  const sanitizedHabits: Habit[] = [];
  const validHabitIds = new Set<string>();

  for (const item of data.habits) {
    if (!item || typeof item !== 'object') continue;
    const h = item as Record<string, unknown>;
    const title = typeof h.title === 'string' ? h.title.trim() : '';
    if (!title) continue;
    const id = typeof h.id === 'string' && h.id ? h.id : generateId();
    validHabitIds.add(id);

    const frequency: HabitFrequency = VALID_FREQUENCIES.has(h.frequency as HabitFrequency)
      ? (h.frequency as HabitFrequency)
      : 'daily';
    const category: HabitCategory = VALID_CATEGORIES.has(h.category as HabitCategory)
      ? (h.category as HabitCategory)
      : 'General';
    const selectedDays = Array.isArray(h.selectedDays)
      ? h.selectedDays.filter((d): d is number => typeof d === 'number' && d >= 0 && d <= 6)
      : frequency === 'weekdays'
      ? [1, 2, 3, 4, 5]
      : [0, 1, 2, 3, 4, 5, 6];

    sanitizedHabits.push({
      id,
      userId: 'local-user',
      title,
      description: typeof h.description === 'string' ? h.description : '',
      category,
      icon: typeof h.icon === 'string' && h.icon ? h.icon : 'Sun',
      frequency,
      selectedDays,
      reminderTime:
        typeof h.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(h.reminderTime)
          ? h.reminderTime
          : null,
      startDate:
        typeof h.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(h.startDate)
          ? h.startDate
          : todayStr,
      status: h.status === 'archived' ? 'archived' : 'active',
      createdAt: typeof h.createdAt === 'string' ? h.createdAt : new Date().toISOString(),
      streak: 0,
      bestStreak: 0,
    });
  }

  const rawCompletions: HabitCompletion[] = [];
  for (const item of data.completions) {
    if (!item || typeof item !== 'object') continue;
    const c = item as Record<string, unknown>;
    const habitId = typeof c.habitId === 'string' ? c.habitId : '';
    const completionDate = typeof c.completionDate === 'string' ? c.completionDate : '';
    if (!habitId || !validHabitIds.has(habitId) || !/^\d{4}-\d{2}-\d{2}$/.test(completionDate)) {
      continue;
    }
    rawCompletions.push({
      id: typeof c.id === 'string' && c.id ? c.id : generateId(),
      habitId,
      userId: 'local-user',
      completionDate,
      completed: typeof c.completed === 'boolean' ? c.completed : true,
      createdAt: typeof c.createdAt === 'string' ? c.createdAt : new Date().toISOString(),
    });
  }

  const completions = deduplicateCompletions(rawCompletions);
  const enrichedHabits = attachHabitStreaks(sanitizedHabits, completions, todayStr);

  if (!hasIndexedDb()) {
    const ws: LocalWorkspace = {
      schemaVersion: TOKA_SCHEMA_VERSION,
      profile,
      settings,
      habits: enrichedHabits,
      completions,
    };
    writeFallback(ws);
    return ws;
  }

  const db = await openDb();
  try {
    const tx = db.transaction([STORE_META, STORE_HABITS, STORE_COMPLETIONS], 'readwrite');
    const metaStore = tx.objectStore(STORE_META);
    const habitsStore = tx.objectStore(STORE_HABITS);
    const compStore = tx.objectStore(STORE_COMPLETIONS);

    metaStore.clear();
    habitsStore.clear();
    compStore.clear();

    metaStore.put({ key: 'schemaVersion', value: TOKA_SCHEMA_VERSION });
    metaStore.put({ key: 'profile', value: profile });
    metaStore.put({ key: 'settings', value: settings });

    for (const h of enrichedHabits) {
      habitsStore.put(h);
    }
    for (const c of completions) {
      compStore.put(c);
    }

    await txDone(tx);

    return {
      schemaVersion: TOKA_SCHEMA_VERSION,
      profile,
      settings,
      habits: enrichedHabits,
      completions,
    };
  } finally {
    db.close();
  }
}

export async function resetAllLocalData(defaultTz?: string): Promise<LocalWorkspace> {
  const resolvedTz = normalizeTimezone(defaultTz || getBrowserTimezone());
  const fresh: LocalWorkspace = {
    schemaVersion: TOKA_SCHEMA_VERSION,
    profile: createDefaultProfile(),
    settings: createDefaultSettings(resolvedTz),
    habits: [],
    completions: [],
  };

  if (!hasIndexedDb()) {
    writeFallback(fresh);
    return fresh;
  }

  const db = await openDb();
  try {
    const tx = db.transaction([STORE_META, STORE_HABITS, STORE_COMPLETIONS], 'readwrite');
    tx.objectStore(STORE_META).clear();
    tx.objectStore(STORE_HABITS).clear();
    tx.objectStore(STORE_COMPLETIONS).clear();

    tx.objectStore(STORE_META).put({ key: 'schemaVersion', value: TOKA_SCHEMA_VERSION });
    tx.objectStore(STORE_META).put({ key: 'profile', value: fresh.profile });
    tx.objectStore(STORE_META).put({ key: 'settings', value: fresh.settings });

    await txDone(tx);
    return fresh;
  } finally {
    db.close();
  }
}
