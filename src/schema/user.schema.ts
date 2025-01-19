import { mysqlTable, serial, varchar, text, timestamp, int, boolean } from 'drizzle-orm/mysql-core';

export const UserTable = mysqlTable('user', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 128 }).notNull().unique(),
  about: text('about'),
  karma: int('karma').default(0),
  created: timestamp('created').notNull(),
  delay: int('delay').default(0),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow().onUpdateNow(),
});