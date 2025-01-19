import { mysqlTable, serial, varchar, text, timestamp, int } from 'drizzle-orm/mysql-core';

export const PostTable = mysqlTable('post', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 256 }).notNull(),
  url: varchar('url', { length: 512 }).notNull(),
  author: varchar('author', { length: 128 }).notNull(),
  points: int('points').default(0),
  num_comments: int('num_comments').default(0),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});
