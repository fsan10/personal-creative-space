import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const contents = sqliteTable('contents', {
  id: text('id').primaryKey(), kind: text('kind').notNull(), slug: text('slug').notNull(),
  dataJson: text('data_json').notNull(), liveJson: text('live_json'), publicAt: text('public_at'),
  revision: integer('revision').notNull().default(1), updatedAt: text('updated_at').notNull(), trashedAt: text('trashed_at'),
}, table => [uniqueIndex('contents_kind_slug_unique').on(table.kind, table.slug)]);
export const revisions = sqliteTable('revisions', {
  id: text('id').primaryKey(), contentId: text('content_id').notNull(), revision: integer('revision').notNull(),
  dataJson: text('data_json').notNull(), createdAt: text('created_at').notNull(),
});
export const media = sqliteTable('media', {
  id: text('id').primaryKey(), name: text('name').notNull(), objectKey: text('object_key').notNull(),
  mime: text('mime').notNull(), size: integer('size').notNull(), sha256: text('sha256').notNull(), createdAt: text('created_at').notNull(),
});
export const settings = sqliteTable('settings', { key: text('key').primaryKey(), dataJson: text('data_json').notNull(), updatedAt: text('updated_at').notNull() });
export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(), kind: text('kind').notNull(), contentId: text('content_id').notNull(),
  platform: text('platform').notNull(), status: text('status').notNull(), idempotencyKey: text('idempotency_key').notNull(),
  dataJson: text('data_json').notNull(), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, table => [uniqueIndex('jobs_idempotency_unique').on(table.idempotencyKey)]);
