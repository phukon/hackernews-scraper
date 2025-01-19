import axios from 'axios';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/config/db';
import { StoryTable } from '@/schema/story.schema';
import { UserTable } from '@/schema/user.schema';
import { CommentTable } from '@/schema/comment.schema';

export class StoryCollector {
  private static readonly HN_API_URL = 'https://hacker-news.firebaseio.com/v0';
  private isRunning = false;
  // private intervalId: NodeJS.Timeout | null = null;

  async start() {
    if (this.isRunning) {
      console.log('Story collector is already running');
      return;
    }

    if (!(await this.isDbConnected())) {
      console.error('Database connection could not be established. Skipping story collector.');
      return;
    }

    this.isRunning = true;
    console.log('Starting story collector service...');

    await this.collectStories();

    //TODO: make this configurable and add cleanup
    setInterval(() => {
      this.collectStories();
    }, 30 * 60 * 1000);
  }

  private async isDbConnected(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch (error) {
      console.error('Database connection error:', error);
      return false;
    }
  }

  private async collectStories() {
    try {
      console.log('Fetching new stories...');
      const newStoryIds = await this.fetchNewStoryIds();
      console.log(`Fetched ${newStoryIds.length} story IDs`);

      const existingStories = await db.select({ hn_id: StoryTable.hn_id }).from(StoryTable);
      const existingIds = new Set(existingStories.map((s) => s.hn_id));

      let newIds = newStoryIds.filter((id) => !existingIds.has(id));
      console.log(`Found ${newIds.length} new stories to process`);

      if (newIds.length === 0) {
        console.log('No new stories to process');
        return;
      }

      console.log(`Processing ${newIds.length} new stories...`);
      const stories = await this.fetchStoryDetails(newIds);
      console.log(`Successfully fetched details for ${stories.length} stories`);

      const results = await Promise.allSettled(
        stories.map(async (story, index) => {
          try {
            await this.processStory(story);
            console.log(`Successfully processed story ${story.hn_id}`);
            return story.hn_id;
          } catch (error) {
            console.error(`Error processing story ${story.hn_id}:`, error);
            throw error;
          }
        }),
      );

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      console.log(`Processed ${succeeded} stories successfully, ${failed} failed`);

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(
            `Failed to process story ${stories[index].hn_id}:`,
            result.reason,
            '\nStack trace:',
            result.reason?.stack,
          );
        }
      });
    } catch (error) {
      console.error('Error collecting stories:', error);
      throw error;
    }
  }

  private async fetchNewStoryIds(): Promise<number[]> {
    const response = await axios.get<number[]>(`${StoryCollector.HN_API_URL}/newstories.json`);
    return response.data;
  }

  private async fetchStoryDetails(ids: number[]) {
    const storyPromises = ids.map(async (id) => {
      try {
        const response = await this.retryWithBackoff(
          () => axios.get(`${StoryCollector.HN_API_URL}/item/${id}.json`),
          3,
        );
        const story = response.data;

        if (!story || story.type !== 'story') {
          return null;
        }

        return {
          hn_id: story.id,
          title: story.title,
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          text: story.text || null,
          by: story.by,
          score: story.score || 0,
          descendants: story.descendants || 0,
          dead: story.dead || false,
          deleted: story.deleted || false,
          type: story.type,
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNRESET' || error.code === 'ECONNABORTED') {
            console.warn(`Network connection reset while fetching story ${id}, will retry later`);
          } else if (error.response?.status === 429) {
            console.warn(`Rate limit reached while fetching story ${id}, will retry later`);
          } else {
            console.error(`Failed to fetch story ${id}: ${error.message}`);
          }
        }
        return null;
      }
    });

    const batchSize = 10;
    const results = [];
    for (let i = 0; i < storyPromises.length; i += batchSize) {
      const batch = storyPromises.slice(i, i + batchSize);
      results.push(...(await Promise.all(batch)));
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return results.filter((story): story is NonNullable<typeof story> => story !== null);
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number,
    initialDelay: number = 1000,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (!axios.isAxiosError(error) || error.response?.status === 404) {
          throw error;
        }
        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private async processStory(story: any) {
    try {
      const existingUser = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.username, story.by))
        .limit(1);

      let userId: number;

      try {
        if (existingUser.length === 0) {
          const userResponse = await this.retryWithBackoff(
            () => axios.get(`${StoryCollector.HN_API_URL}/user/${story.by}.json`),
            3,
          );
          const userData = userResponse.data;

          const result = await db
            .insert(UserTable)
            .values({
              username: userData.id,
              about: userData.about ? userData.about.substring(0, 50000) : null,
              karma: userData.karma || 0,
              created: new Date(userData.created * 1000),
            })
            .onDuplicateKeyUpdate({
              set: { username: userData.id },
            });

          userId = Number(result[0].insertId);
        } else {
          userId = existingUser[0].id;
        }
      } catch (error) {
        console.error(`Failed to process user ${story.by}, skipping story ${story.hn_id}`);
        throw error;
      }

      await db.insert(StoryTable).values({
        hn_id: story.hn_id,
        user_id: userId,
        title: story.title,
        url: story.url,
        text: story.text,
        by: story.by,
        score: story.score,
        descendants: story.descendants,
        dead: story.dead,
        deleted: story.deleted,
        type: story.type,
      });

      if (story.descendants > 0) {
        await this.processComments(story.hn_id);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNRESET' || error.code === 'ECONNABORTED') {
          console.warn(`Network connection reset while processing story ${story.hn_id}`);
        } else {
          console.error(`Error processing story ${story.hn_id}: ${error.message}`);
        }
      }
      throw error;
    }
  }

  private async processComments(storyId: number) {
    try {
      const response = await axios.get(`${StoryCollector.HN_API_URL}/item/${storyId}.json`);
      const storyData = response.data;

      if (!storyData.kids || !Array.isArray(storyData.kids)) {
        return;
      }

      await Promise.all(
        storyData.kids.map((commentId: number) => this.processComment(commentId, storyId, null)),
      );
    } catch (error) {
      console.error(`Error processing comments for story ${storyId}:`, error);
    }
  }

  private async processComment(commentId: number, storyId: number, parentId: number | null) {
    try {
      const response = await this.retryWithBackoff(
        () => axios.get(`${StoryCollector.HN_API_URL}/item/${commentId}.json`),
        3,
      );
      const comment = response.data;

      if (!comment || comment.type !== 'comment' || comment.deleted) {
        return;
      }

      const existingUser = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.username, comment.by))
        .limit(1);

      let userId: number;

      if (existingUser.length === 0) {
        const userResponse = await this.retryWithBackoff(
          () => axios.get(`${StoryCollector.HN_API_URL}/user/${comment.by}.json`),
          3,
        );
        const userData = userResponse.data;

        const result = await db
          .insert(UserTable)
          .values({
            username: userData.id,
            about: userData.about ? userData.about.substring(0, 50000) : null,
            karma: userData.karma || 0,
            created: new Date(userData.created * 1000),
          })
          .onDuplicateKeyUpdate({
            set: { username: userData.id },
          });

        userId = Number(result[0].insertId);
      } else {
        userId = existingUser[0].id;
      }

      await db.insert(CommentTable).values({
        hn_id: comment.id,
        story_id: storyId,
        parent_id: parentId || null,
        user_id: userId,
        by: comment.by,
        text: comment.text || null,
        type: 'comment',
        dead: false,
        deleted: false,
      });

      if (comment.kids && Array.isArray(comment.kids)) {
        await Promise.all(
          comment.kids.map((childCommentId: number) =>
            this.processComment(childCommentId, storyId, comment.id),
          ),
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNRESET' || error.code === 'ECONNABORTED') {
          console.warn(`Network connection reset while processing comment ${commentId}`);
        } else {
          console.error(`Failed to process comment ${commentId}: ${error.message}`);
        }
      }
    }
  }
}
