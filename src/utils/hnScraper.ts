import axios from 'axios';
import { Story } from '@/types';
import { JSDOM } from 'jsdom';

export class HNScraper {
  private static readonly HN_URL = 'https://news.ycombinator.com';
  private static readonly HN_API_URL = 'https://hacker-news.firebaseio.com/v0';

  async scrapeHTMLStories(): Promise<Story[]> {
    try {
      const response = await axios.get(HNScraper.HN_URL);
      const dom = new JSDOM(response.data);
      const document = dom.window.document;

      const stories: Story[] = [];
      const storyRows = document.querySelectorAll('.athing');

      storyRows.forEach((row) => {
        const titleElement = row.querySelector('.titleline > a');
        if (titleElement) {
          stories.push({
            title: titleElement.textContent || '',
            url: titleElement.getAttribute('href') || '',
            timestamp: new Date(),
          });
        }
      });

      return stories;
    } catch (error) {
      console.error('Error scraping HN:', error);
      return [];
    }
  }

  async scrapeAPIStories(): Promise<Story[]> {
    try {
      const response = await axios.get(`${HNScraper.HN_API_URL}/newstories.json`);
      const storyIds = response.data as number[];

      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const storyPromises = storyIds
        .slice(0, 100)
        .map((id) => axios.get(`${HNScraper.HN_API_URL}/item/${id}.json`));

      const stories = await Promise.all(storyPromises);

      return stories
        .map((story) => story.data)
        .filter((story) => story && story.type === 'story' && story.time * 1000 > fiveMinutesAgo)
        .map((story) => ({
          title: story.title,
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          timestamp: new Date(story.time * 1000),
        }));
    } catch (error) {
      console.error('Error scraping HN:', error);
      return [];
    }
  }
}
