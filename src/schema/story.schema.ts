import { mysqlTable, serial, varchar, text, timestamp, int, boolean } from 'drizzle-orm/mysql-core';

export const StoryTable = mysqlTable('story', {
  id: serial('id').primaryKey(),
  hn_id: int('hn_id').notNull().unique(),
  user_id: int('user_id').notNull(),
  title: varchar('title', { length: 256 }).notNull(),
  url: varchar('url', { length: 512 }),
  text: text('text'),
  by: varchar('by', { length: 128 }).notNull(),
  score: int('score').default(0),
  descendants: int('descendants').default(0),
  dead: boolean('dead').default(false),
  deleted: boolean('deleted').default(false),
  type: varchar('type', { length: 20 }).notNull().default('story'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});