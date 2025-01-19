import { relations } from 'drizzle-orm';
import { StoryTable } from './story.schema';
import { CommentTable } from './comment.schema';
import { UserTable } from './user.schema';

export const storyRelations = relations(StoryTable, ({ one, many }) => ({
  comments: many(CommentTable),
  user: one(UserTable, {
    fields: [StoryTable.user_id],
    references: [UserTable.id],
  }),
}));

export const commentRelations = relations(CommentTable, ({ one }) => ({
  story: one(StoryTable, {
    fields: [CommentTable.story_id],
    references: [StoryTable.id],
  }),
  user: one(UserTable, {
    fields: [CommentTable.user_id],
    references: [UserTable.id],
  }),
}));

export const userRelations = relations(UserTable, ({ many }) => ({
  stories: many(StoryTable),
  comments: many(CommentTable),
}));
