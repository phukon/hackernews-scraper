import { db } from '@/config/db';
import { StoryTable } from '@/schema';
import { desc } from 'drizzle-orm';
import { Request, Response } from 'express';

export const getAllStoriesController = async (req: Request, res: Response) => {
  try {
    const stories = await db.select().from(StoryTable).orderBy(desc(StoryTable.hackernews_time));

    if (stories.length === 0) {
      res.status(404).json({ error: 'No stories found' });
    }

    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ error: 'Failed to fetch stories' });
  }
};
