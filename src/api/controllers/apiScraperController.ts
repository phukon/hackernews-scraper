import { Request, Response } from 'express';
import { HNScraper } from '@/lib/hnScraper';

const scraper = new HNScraper();

export const apiScraperController = async (_: Request, res: Response): Promise<void> => {
  try {
    const stories = await scraper.scrapeAPIStories();
    console.log(`Initially scraped ${stories.length} stories`);
    res.json({ message: 'Stories scraped', length: stories.length });
  } catch (error) {
    console.error('Error scraping stories:', error);
    res.status(500).json({ message: 'Failed to scrape stories' });
  }
};
