import axios from 'axios';
import { JSDOM } from 'jsdom';

interface Story {
  title: string;
  url: string;
  timestamp: Date;
}

export class HNScraper {
  private static readonly HN_URL = 'https://news.ycombinator.com';
  
  async scrapeStories(): Promise<Story[]> {
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
            timestamp: new Date()
          });
        }
      });
      
      return stories;
    } catch (error) {
      console.error('Error scraping HN:', error);
      return [];
    }
  }
} 