import { Request, Response } from 'express';
import { HNScraper } from '@/scraper/hnScraper';

const scraper = new HNScraper();

export const scrapController = (_: Request, res: Response): void => {
  scraper
    .scrapeStories()
    .then((stories) => {
      console.log(`Initially scraped ${stories.length} stories`);
      res.json({ message: 'Stories scraped', length: stories.length });
    })
    .catch((error) => {
      console.error('Error scraping stories:', error);
      res.status(500).json({ message: 'Failed to scrape stories' });
    });
};
