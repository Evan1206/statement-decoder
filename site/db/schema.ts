import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventType: text('event_type').notNull(),
  category: text('category'),
  contextType: text('context_type'),
  visitorId: text('visitor_id'),
  eventLabel: text('event_label'),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_events_type_created').on(table.eventType, table.createdAt),
  index('idx_events_category').on(table.category),
  index('idx_events_visitor_created').on(table.visitorId, table.createdAt),
  index('idx_events_type_label').on(table.eventType, table.eventLabel),
]);

export const submissions = sqliteTable('submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  statement: text('statement').notNull(),
  context: text('context').notNull(),
  primaryCategory: text('primary_category').notNull(),
  secondaryCategories: text('secondary_categories').notNull().default('[]'),
  interpretation: text('interpretation'),
  status: text('status').notNull().default('pending'),
  privacyConfirmed: integer('privacy_confirmed', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [
  index('idx_submissions_status_created').on(table.status, table.createdAt),
]);
