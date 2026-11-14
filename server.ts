import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireAuth } from './src/middleware/auth.ts';
import type { AuthRequest } from './src/middleware/auth.ts';
import {
  createHabit,
  createHabitsBatch,
  deleteHabit,
  deleteUserAccount,
  getOrCreateUserWithSettings,
  getUserByUid,
  getUserCompletions,
  getUserHabits,
  updateHabit,
  updateUserProfile,
  updateUserSettings,
  upsertHabitCompletion,
} from './src/db/queries.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Bootstrap authenticated user workspace (user profile + settings + habits + completions)
app.get('/api/workspace', requireAuth, async (req: AuthRequest, res) => {
  try {
    const authUser = req.user!;
    const timezone = typeof req.query.tz === 'string' ? req.query.tz : 'UTC';
    const { user, settings } = await getOrCreateUserWithSettings({
      uid: authUser.uid,
      email: authUser.email || '',
      name: authUser.name || (authUser.email ? authUser.email.split('@')[0] : 'TOKA Member'),
      avatarUrl: authUser.picture || null,
      timezone,
    });

    const [habitsList, completionsList] = await Promise.all([
      getUserHabits(user.id),
      getUserCompletions(user.id),
    ]);

    res.json({
      user,
      settings,
      habits: habitsList,
      completions: completionsList,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load workspace.';
    res.status(500).json({ error: message });
  }
});

// Update user profile
app.patch('/api/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getUserByUid(req.user!.uid);
    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    const name = typeof req.body.name === 'string' ? req.body.name.trim() : undefined;
    if (name !== undefined && name.length === 0) {
      res.status(400).json({ error: 'Name cannot be empty.' });
      return;
    }

    const avatarUrl =
      req.body.avatarUrl === null || typeof req.body.avatarUrl === 'string'
        ? req.body.avatarUrl
        : undefined;

    const updated = await updateUserProfile(user.id, { name, avatarUrl });
    res.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update profile.';
    res.status(500).json({ error: message });
  }
});

// Update user settings
app.patch('/api/settings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getUserByUid(req.user!.uid);
    if (!user) {
      res.status(404).json({ error: 'User profile not found.' });
      return;
    }

    const theme =
      req.body.theme === 'dark' || req.body.theme === 'light' ? req.body.theme : undefined;
    const notificationsEnabled =
      typeof req.body.notificationsEnabled === 'boolean'
        ? req.body.notificationsEnabled
        : undefined;
    const dailyReminderEnabled =
      typeof req.body.dailyReminderEnabled === 'boolean'
        ? req.body.dailyReminderEnabled
        : undefined;
    const dailyReminderTime =
      typeof req.body.dailyReminderTime === 'string' &&
      /^\d{2}:\d{2}$/.test(req.body.dailyReminderTime)
        ? req.body.dailyReminderTime
        : undefined;
    const timezone = typeof req.body.timezone === 'string' ? req.body.timezone : undefined;
    const onboardingCompleted =
      typeof req.body.onboardingCompleted === 'boolean'
        ? req.body.onboardingCompleted
        : undefined;

    const updated = await updateUserSettings(user.id, {
      theme,
      notificationsEnabled,
      dailyReminderEnabled,
      dailyReminderTime,
      timezone,
      onboardingCompleted,
    });
    res.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update settings.';
    res.status(500).json({ error: message });
  }
});

// Delete user account and all associated data
app.delete('/api/account', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getUserByUid(req.user!.uid);
    if (!user) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }
    await deleteUserAccount(user.id);
    res.json({ deleted: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete account.';
    res.status(500).json({ error: message });
  }
});

// Create habit
app.post('/api/habits', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getUserByUid(req.user!.uid);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) {
      res.status(400).json({ error: 'Habit title is required.' });
      return;
    }

    const frequency = ['daily', 'weekdays', 'custom'].includes(req.body.frequency)
      ? req.body.frequency
      : 'daily';
    const selectedDays = Array.isArray(req.body.selectedDays)
      ? req.body.selectedDays.filter((d: unknown) => typeof d === 'number' && d >= 0 && d <= 6)
      : [0, 1, 2, 3, 4, 5, 6];

    const created = await createHabit(user.id, {
      title,
      description: typeof req.body.description === 'string' ? req.body.description.trim() : '',
      category: typeof req.body.category === 'string' ? req.body.category : 'General',
      icon: typeof req.body.icon === 'string' ? req.body.icon : 'CheckCircle2',
      frequency,
      selectedDays:
        frequency === 'daily'
          ? [0, 1, 2, 3, 4, 5, 6]
          : frequency === 'weekdays'
          ? [1, 2, 3, 4, 5]
          : selectedDays.length > 0
          ? selectedDays
          : [1, 2, 3, 4, 5],
      reminderTime:
        typeof req.body.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(req.body.reminderTime)
          ? req.body.reminderTime
          : null,
      startDate:
        typeof req.body.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.body.startDate)
          ? req.body.startDate
          : new Date().toISOString().slice(0, 10),
    });

    res.status(201).json(created);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create habit.';
    res.status(500).json({ error: message });
  }
});

// Batch create starter habits (onboarding)
app.post('/api/habits/batch', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getUserByUid(req.user!.uid);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const items = Array.isArray(req.body.habits) ? req.body.habits : [];
    const sanitized = items
      .filter((item: unknown) => typeof item === 'object' && item !== null)
      .map((item: Record<string, unknown>) => ({
        title: typeof item.title === 'string' ? item.title.trim() : '',
        description: typeof item.description === 'string' ? item.description.trim() : '',
        category: typeof item.category === 'string' ? item.category : 'General',
        icon: typeof item.icon === 'string' ? item.icon : 'CheckCircle2',
        frequency: ['daily', 'weekdays', 'custom'].includes(String(item.frequency))
          ? String(item.frequency)
          : 'daily',
        selectedDays: Array.isArray(item.selectedDays)
          ? item.selectedDays.filter((d): d is number => typeof d === 'number' && d >= 0 && d <= 6)
          : [0, 1, 2, 3, 4, 5, 6],
        reminderTime:
          typeof item.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(item.reminderTime)
            ? item.reminderTime
            : null,
        startDate:
          typeof item.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.startDate)
            ? item.startDate
            : new Date().toISOString().slice(0, 10),
      }))
      .filter((item: { title: string }) => item.title.length > 0);

    const created = await createHabitsBatch(user.id, sanitized);
    res.status(201).json(created);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create habits.';
    res.status(500).json({ error: message });
  }
});

// Update habit
app.patch('/api/habits/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getUserByUid(req.user!.uid);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const habitId = String(req.params.id);
    const updates: Record<string, unknown> = {};

    if (typeof req.body.title === 'string') {
      const trimmed = req.body.title.trim();
      if (!trimmed) {
        res.status(400).json({ error: 'Habit title cannot be empty.' });
        return;
      }
      updates.title = trimmed;
    }
    if (typeof req.body.description === 'string') updates.description = req.body.description.trim();
    if (typeof req.body.category === 'string') updates.category = req.body.category;
    if (typeof req.body.icon === 'string') updates.icon = req.body.icon;
    if (['daily', 'weekdays', 'custom'].includes(req.body.frequency)) {
      updates.frequency = req.body.frequency;
    }
    if (Array.isArray(req.body.selectedDays)) {
      updates.selectedDays = req.body.selectedDays.filter(
        (d: unknown) => typeof d === 'number' && d >= 0 && d <= 6
      );
    }
    if (req.body.reminderTime === null || typeof req.body.reminderTime === 'string') {
      updates.reminderTime =
        req.body.reminderTime && /^\d{2}:\d{2}$/.test(req.body.reminderTime)
          ? req.body.reminderTime
          : null;
    }
    if (typeof req.body.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.body.startDate)) {
      updates.startDate = req.body.startDate;
    }
    if (req.body.status === 'active' || req.body.status === 'archived') {
      updates.status = req.body.status;
    }

    const updated = await updateHabit(user.id, habitId, updates);
    if (!updated) {
      res.status(404).json({ error: 'Habit not found.' });
      return;
    }
    res.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update habit.';
    res.status(500).json({ error: message });
  }
});

// Delete habit
app.delete('/api/habits/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getUserByUid(req.user!.uid);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    const habitId = String(req.params.id);
    const removed = await deleteHabit(user.id, habitId);
    if (!removed) {
      res.status(404).json({ error: 'Habit not found.' });
      return;
    }
    res.json({ deleted: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete habit.';
    res.status(500).json({ error: message });
  }
});

// Toggle / upsert completion for (habitId, completionDate)
app.post('/api/completions/toggle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await getUserByUid(req.user!.uid);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const habitId = typeof req.body.habitId === 'string' ? req.body.habitId : '';
    const completionDate =
      typeof req.body.completionDate === 'string' ? req.body.completionDate : '';
    const completed = typeof req.body.completed === 'boolean' ? req.body.completed : true;

    if (!habitId || !/^\d{4}-\d{2}-\d{2}$/.test(completionDate)) {
      res.status(400).json({ error: 'Valid habitId and completionDate (YYYY-MM-DD) are required.' });
      return;
    }

    const record = await upsertHabitCompletion(user.id, habitId, completionDate, completed);
    if (!record) {
      res.status(404).json({ error: 'Habit not found.' });
      return;
    }

    res.json(record);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to toggle completion.';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TOKA server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
