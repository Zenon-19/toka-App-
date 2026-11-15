import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { habitCompletions, habits, userSettings, users } from './schema.ts';

export async function getOrCreateUserWithSettings(params: {
  uid: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  timezone?: string;
}) {
  try {
    const [existing] = await db.select().from(users).where(eq(users.uid, params.uid));

    let userRecord = existing;
    if (!userRecord) {
      const [inserted] = await db
        .insert(users)
        .values({
          uid: params.uid,
          email: params.email,
          name: params.name,
          avatarUrl: params.avatarUrl,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email: params.email,
          },
        })
        .returning();
      userRecord = inserted;
    }

    let [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userRecord.id));

    if (!settings) {
      const [insertedSettings] = await db
        .insert(userSettings)
        .values({
          userId: userRecord.id,
          theme: 'dark',
          notificationsEnabled: true,
          dailyReminderEnabled: true,
          dailyReminderTime: '08:30',
          timezone: params.timezone || 'UTC',
          onboardingCompleted: false,
        })
        .onConflictDoNothing({ target: userSettings.userId })
        .returning();

      if (insertedSettings) {
        settings = insertedSettings;
      } else {
        const [refetched] = await db
          .select()
          .from(userSettings)
          .where(eq(userSettings.userId, userRecord.id));
        settings = refetched;
      }
    }

    return { user: userRecord, settings };
  } catch (error) {
    console.error('Database error in getOrCreateUserWithSettings:', error);
    throw new Error('Failed to load user workspace. Please try again.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.uid, uid));
    return user || null;
  } catch (error) {
    console.error('Database error in getUserByUid:', error);
    throw new Error('Failed to retrieve user profile.', { cause: error });
  }
}

export async function getUserSettings(userId: string) {
  try {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings || null;
  } catch (error) {
    console.error('Database error in getUserSettings:', error);
    throw new Error('Failed to retrieve user settings.', { cause: error });
  }
}

export async function updateUserProfile(
  userId: string,
  updates: { name?: string; avatarUrl?: string | null }
) {
  try {
    const [updated] = await db
      .update(users)
      .set({
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error in updateUserProfile:', error);
    throw new Error('Failed to update profile.', { cause: error });
  }
}

export async function updateUserSettings(
  userId: string,
  updates: {
    theme?: string;
    notificationsEnabled?: boolean;
    dailyReminderEnabled?: boolean;
    dailyReminderTime?: string;
    timezone?: string;
    onboardingCompleted?: boolean;
  }
) {
  try {
    const [updated] = await db
      .update(userSettings)
      .set({
        ...(updates.theme !== undefined ? { theme: updates.theme } : {}),
        ...(updates.notificationsEnabled !== undefined
          ? { notificationsEnabled: updates.notificationsEnabled }
          : {}),
        ...(updates.dailyReminderEnabled !== undefined
          ? { dailyReminderEnabled: updates.dailyReminderEnabled }
          : {}),
        ...(updates.dailyReminderTime !== undefined
          ? { dailyReminderTime: updates.dailyReminderTime }
          : {}),
        ...(updates.timezone !== undefined ? { timezone: updates.timezone } : {}),
        ...(updates.onboardingCompleted !== undefined
          ? { onboardingCompleted: updates.onboardingCompleted }
          : {}),
      })
      .where(eq(userSettings.userId, userId))
      .returning();
    return updated;
  } catch (error) {
    console.error('Database error in updateUserSettings:', error);
    throw new Error('Failed to update settings.', { cause: error });
  }
}

export async function deleteUserAccount(userId: string) {
  try {
    await db.delete(users).where(eq(users.id, userId));
  } catch (error) {
    console.error('Database error in deleteUserAccount:', error);
    throw new Error('Failed to delete account data.', { cause: error });
  }
}

export async function getUserHabits(userId: string) {
  try {
    return await db
      .select()
      .from(habits)
      .where(eq(habits.userId, userId))
      .orderBy(asc(habits.createdAt));
  } catch (error) {
    console.error('Database error in getUserHabits:', error);
    throw new Error('Failed to load habits.', { cause: error });
  }
}

export async function createHabit(
  userId: string,
  input: {
    title: string;
    description: string;
    category: string;
    icon: string;
    frequency: string;
    selectedDays: number[];
    reminderTime: string | null;
    startDate: string;
  }
) {
  try {
    const [created] = await db
      .insert(habits)
      .values({
        userId,
        title: input.title,
        description: input.description,
        category: input.category,
        icon: input.icon,
        frequency: input.frequency,
        selectedDays: input.selectedDays,
        reminderTime: input.reminderTime,
        startDate: input.startDate,
        status: 'active',
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Database error in createHabit:', error);
    throw new Error('Failed to create habit.', { cause: error });
  }
}

export async function createHabitsBatch(
  userId: string,
  items: {
    title: string;
    description: string;
    category: string;
    icon: string;
    frequency: string;
    selectedDays: number[];
    reminderTime: string | null;
    startDate: string;
  }[]
) {
  if (items.length === 0) return [];
  try {
    return await db
      .insert(habits)
      .values(
        items.map((input) => ({
          userId,
          title: input.title,
          description: input.description,
          category: input.category,
          icon: input.icon,
          frequency: input.frequency,
          selectedDays: input.selectedDays,
          reminderTime: input.reminderTime,
          startDate: input.startDate,
          status: 'active',
        }))
      )
      .returning();
  } catch (error) {
    console.error('Database error in createHabitsBatch:', error);
    throw new Error('Failed to create starter habits.', { cause: error });
  }
}

export async function updateHabit(
  userId: string,
  habitId: string,
  updates: {
    title?: string;
    description?: string;
    category?: string;
    icon?: string;
    frequency?: string;
    selectedDays?: number[];
    reminderTime?: string | null;
    startDate?: string;
    status?: string;
  }
) {
  try {
    const [updated] = await db
      .update(habits)
      .set({
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.category !== undefined ? { category: updates.category } : {}),
        ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
        ...(updates.frequency !== undefined ? { frequency: updates.frequency } : {}),
        ...(updates.selectedDays !== undefined ? { selectedDays: updates.selectedDays } : {}),
        ...(updates.reminderTime !== undefined ? { reminderTime: updates.reminderTime } : {}),
        ...(updates.startDate !== undefined ? { startDate: updates.startDate } : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {}),
      })
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .returning();
    return updated || null;
  } catch (error) {
    console.error('Database error in updateHabit:', error);
    throw new Error('Failed to update habit.', { cause: error });
  }
}

export async function deleteHabit(userId: string, habitId: string) {
  try {
    const deleted = await db
      .delete(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)))
      .returning();
    return deleted.length > 0;
  } catch (error) {
    console.error('Database error in deleteHabit:', error);
    throw new Error('Failed to delete habit.', { cause: error });
  }
}

export async function getUserCompletions(userId: string) {
  try {
    return await db
      .select()
      .from(habitCompletions)
      .where(eq(habitCompletions.userId, userId))
      .orderBy(desc(habitCompletions.completionDate));
  } catch (error) {
    console.error('Database error in getUserCompletions:', error);
    throw new Error('Failed to load completion records.', { cause: error });
  }
}

export async function upsertHabitCompletion(
  userId: string,
  habitId: string,
  completionDate: string,
  completed: boolean
) {
  try {
    const [habit] = await db
      .select()
      .from(habits)
      .where(and(eq(habits.id, habitId), eq(habits.userId, userId)));

    if (!habit) {
      return null;
    }

    const [record] = await db
      .insert(habitCompletions)
      .values({
        habitId,
        userId,
        completionDate,
        completed,
      })
      .onConflictDoUpdate({
        target: [habitCompletions.habitId, habitCompletions.completionDate],
        set: {
          completed,
        },
      })
      .returning();

    return record;
  } catch (error) {
    console.error('Database error in upsertHabitCompletion:', error);
    throw new Error('Failed to save completion state.', { cause: error });
  }
}
