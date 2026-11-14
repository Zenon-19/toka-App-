import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const habits = pgTable(
  'habits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    description: text('description').default('').notNull(),
    category: text('category').notNull().default('General'),
    icon: text('icon').notNull().default('CheckCircle2'),
    frequency: text('frequency').notNull().default('daily'), // 'daily' | 'weekdays' | 'custom'
    selectedDays: integer('selected_days').array().notNull().default([0, 1, 2, 3, 4, 5, 6]),
    reminderTime: text('reminder_time'), // 'HH:MM' or null
    startDate: text('start_date').notNull(), // 'YYYY-MM-DD'
    status: text('status').notNull().default('active'), // 'active' | 'archived'
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('habits_user_id_idx').on(table.userId),
    index('habits_status_idx').on(table.status),
  ]
);

export const habitCompletions = pgTable(
  'habit_completions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    habitId: uuid('habit_id')
      .references(() => habits.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    completionDate: text('completion_date').notNull(), // 'YYYY-MM-DD'
    completed: boolean('completed').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('habit_completions_habit_date_uidx').on(table.habitId, table.completionDate),
    index('habit_completions_user_date_idx').on(table.userId, table.completionDate),
  ]
);

export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  theme: text('theme').notNull().default('dark'), // 'dark' | 'light'
  notificationsEnabled: boolean('notifications_enabled').notNull().default(true),
  dailyReminderEnabled: boolean('daily_reminder_enabled').notNull().default(true),
  dailyReminderTime: text('daily_reminder_time').notNull().default('08:30'),
  timezone: text('timezone').notNull().default('UTC'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  habits: many(habits),
  completions: many(habitCompletions),
  settings: one(userSettings, {
    fields: [users.id],
    references: [userSettings.userId],
  }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  completions: many(habitCompletions),
}));

export const habitCompletionsRelations = relations(habitCompletions, ({ one }) => ({
  habit: one(habits, {
    fields: [habitCompletions.habitId],
    references: [habits.id],
  }),
  user: one(users, {
    fields: [habitCompletions.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));
