import { mysqlTable, serial, varchar, text, timestamp, int, boolean } from 'drizzle-orm/mysql-core';

export const CommentTable = mysqlTable('comment', {
  id: serial('id').primaryKey(),
  hn_id: int('hn_id').notNull().unique(),
  story_id: int('story_id').notNull(),
  user_id: int('user_id').notNull(),
  parent_id: int('parent_id'),
  by: varchar('by', { length: 128 }).notNull(),
  text: text('text').notNull(),
  dead: boolean('dead').default(false),
  deleted: boolean('deleted').default(false),
  type: varchar('type', { length: 20 }).notNull().default('comment'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});