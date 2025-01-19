import { relations } from 'drizzle-orm';
import { StoryTable } from './story.schema';
import { CommentTable } from './comment.schema';
import { UserTable } from './user.schema';

export const storyRelations = relations(StoryTable, ({ many }) => ({
  comments: many(CommentTable),
}));

export const commentRelations = relations(CommentTable, ({ one }) => ({
  story: one(StoryTable),
}));

export const userRelations = relations(UserTable, ({ many }) => ({
  stories: many(StoryTable),
  comments: many(CommentTable),
}));
