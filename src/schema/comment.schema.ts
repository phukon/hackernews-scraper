import { mysqlTable, serial, varchar, text, timestamp, int, boolean } from 'drizzle-orm/mysql-core';
import { StoryTable } from './story.schema';

export const CommentTable = mysqlTable('comment', {
  id: serial('id').primaryKey(), // .references(() => StoryTable.id).notNull(),
  hn_id: int('hn_id').notNull().unique(),
  parent_id: int('parent_id').notNull(),
  by: varchar('by', { length: 128 }).notNull(),
  text: text('text').notNull(),
  dead: boolean('dead').default(false),
  deleted: boolean('deleted').default(false),
  type: varchar('type', { length: 20 }).notNull().default('comment'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});