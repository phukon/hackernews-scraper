import { Request, Response } from 'express';
import { HNScraper } from '@/utils/hnScraper';
import { Story } from '@/types';

const scraper = new HNScraper();

export const htmlScraperController = async (_: Request, res: Response): Promise<void> => {
  try {
    const stories: Story[] = await scraper.scrapeHTMLStories();
    console.log(`Scrapped ${stories.length} stories from the Hackernew HTML DOM`);
    res.json({ message: 'Stories scraped', length: stories.length });
  } catch (error) {
    console.error('Error scraping stories:', error);
    res.status(500).json({ message: 'Failed to scrape stories' });
  }
};
