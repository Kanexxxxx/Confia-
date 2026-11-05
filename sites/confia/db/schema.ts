import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const profiles = sqliteTable('confia_profiles', {
  userId: text('user_id').primaryKey(), name: text('name').notNull(),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
});
export const analyses = sqliteTable('confia_analyses', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), target: text('target').notNull(),
  hostname: text('hostname').notNull(), verdict: text('verdict').notNull(),
  resultJson: text('result_json').notNull(), createdAt: integer('created_at').notNull(),
}, t => [index('analyses_owner_time').on(t.userId, t.createdAt)]);
export const reports = sqliteTable('confia_reports', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), target: text('target').notNull(),
  category: text('category').notNull(), description: text('description').notNull(),
  status: text('status').notNull().default('pendente'), reviewNote: text('review_note'),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
}, t => [index('reports_owner_time').on(t.userId,t.createdAt)]);
export const businesses = sqliteTable('confia_businesses', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(), cnpj: text('cnpj').notNull(),
  name: text('name').notNull(), domain: text('domain').notNull(),
  status: text('status').notNull().default('pendente'), reviewNote: text('review_note'),
  createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
},t=>[uniqueIndex('business_owner_domain').on(t.userId,t.domain)]);
export const audit = sqliteTable('confia_audit', {
  id: text('id').primaryKey(), actorId: text('actor_id').notNull(), action: text('action').notNull(),
  entityId: text('entity_id').notNull(), createdAt: integer('created_at').notNull(),
});
export const templates = sqliteTable('confia_meta_templates', {
  name: text('name').primaryKey(), remoteId: text('remote_id'), status: text('status').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
export const webhookEvents = sqliteTable('confia_meta_events', {
  hash: text('hash').primaryKey(), createdAt: integer('created_at').notNull(),
});
export const adminSettings = sqliteTable('confia_admin_settings', {
  userId:text('user_id').primaryKey(), enabledAt:integer('enabled_at').notNull(),
});
