import axios from 'axios';
import { eq } from 'drizzle-orm';
import { db } from '@/config/db';
import { StoryTable } from '@/schema/story.schema';
import { UserTable } from '@/schema/user.schema';
import { CommentTable } from '@/schema/comment.schema';

export class StoryCollector {
  private static readonly HN_API_URL = 'https://hacker-news.firebaseio.com/v0';
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  async start() {
    if (this.isRunning) {
      console.log('Story collector is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting story collector service...');
    
    await this.collectStories();
    
    this.intervalId = setInterval(() => {
      this.collectStories();
    }, 5 * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Story collector service stopped');
  }

  private async collectStories() {
    try {
      console.log('Fetching new stories...');
      const newStoryIds = await this.fetchNewStoryIds();
      
      const existingStories = await db
        .select({ hn_id: StoryTable.hn_id })
        .from(StoryTable);
      const existingIds = new Set(existingStories.map(s => s.hn_id));
      
      let newIds = newStoryIds.filter(id => !existingIds.has(id));
      
      if (newIds.length === 0) {
        console.log('No new stories to process');
        return;
      }

      console.log(`Processing ${newIds.length} new stories...`);
      const stories = await this.fetchStoryDetails(newIds);
      
      for (const story of stories) {
        const existingUser = await db
          .select()
          .from(UserTable)
          .where(eq(UserTable.username, story.by))
          .limit(1);

        let userId: number;
        
        if (existingUser.length === 0) {
          const userResponse = await axios.get(
            `${StoryCollector.HN_API_URL}/user/${story.by}.json`
          );
          const userData = userResponse.data;

          const result = await db.insert(UserTable).values({
            username: userData.id,
            about: userData.about || null,
            karma: userData.karma || 0,
            created: new Date(userData.created * 1000),
          });

          userId = Number(result[0].insertId);
        } else {
          userId = existingUser[0].id;
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
      }

      console.log(`Successfully processed ${stories.length} new stories`);
    } catch (error) {
      console.error('Error collecting stories:', error);
    }
  }

  private async fetchNewStoryIds(): Promise<number[]> {
    const response = await axios.get<number[]>(`${StoryCollector.HN_API_URL}/newstories.json`);
    return response.data;
  }

  private async fetchStoryDetails(ids: number[]) {
    const storyPromises = ids.map(async (id) => {
      try {
        const response = await axios.get(`${StoryCollector.HN_API_URL}/item/${id}.json`);
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
        console.error(`Error fetching story ${id}:`, error);
        return null;
      }
    });

    const results = await Promise.all(storyPromises);
    return results.filter((story): story is NonNullable<typeof story> => story !== null);
  }

  private async processComments(storyId: number) {
    try {
      const response = await axios.get(`${StoryCollector.HN_API_URL}/item/${storyId}.json`);
      const storyData = response.data;
      
      if (!storyData.kids || !Array.isArray(storyData.kids)) {
        return;
      }

      for (const commentId of storyData.kids) {
        await this.processComment(commentId, storyId, null);
      }
    } catch (error) {
      console.error(`Error processing comments for story ${storyId}:`, error);
    }
  }

  private async processComment(commentId: number, storyId: number, parentId: number | null) {
    try {
      const response = await axios.get(`${StoryCollector.HN_API_URL}/item/${commentId}.json`);
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
        const userResponse = await axios.get(
          `${StoryCollector.HN_API_URL}/user/${comment.by}.json`
        );
        const userData = userResponse.data;

        const result = await db.insert(UserTable).values({
          username: userData.id,
          about: userData.about || null,
          karma: userData.karma || 0,
          created: new Date(userData.created * 1000),
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
        for (const childCommentId of comment.kids) {
          await this.processComment(childCommentId, storyId, comment.id);
        }
      }
    } catch (error) {
      console.error(`Error processing comment ${commentId}:`, error);
    }
  }
} 