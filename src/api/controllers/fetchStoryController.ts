import { db } from '@/config/db';
import { StoryTable } from '@/schema';
import { CommentTable } from '@/schema/comment.schema';
import { eq } from 'drizzle-orm';
import { Request, Response } from 'express';

export const fetchStoryController = async (req: Request, res: Response) => {
  try {
    const hackerNewsId = parseInt(req.params.hn_id);
    if (isNaN(hackerNewsId)) {
      res.status(400).json({ error: 'Invalid story ID' });
    }

    const story = await db
      .select()
      .from(StoryTable)
      .leftJoin(CommentTable, eq(StoryTable.id, CommentTable.story_id))
      .where(eq(StoryTable.hn_id, hackerNewsId));

    if (story.length === 0) {
      res.status(404).json({ error: 'Story not found' });
    }

    res.json(story[0]);
  } catch (error) {
    console.error('Error fetching story:', error);
    res.status(500).json({ error: 'Failed to fetch story' });
  }
};
