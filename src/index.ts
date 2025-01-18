import { startServer } from './server';
import { HNScraper } from './scraper/hnScraper';

const scraper = new HNScraper();

startServer();

scraper.scrapeStories().then(stories => {
  console.log(`Initially scraped ${stories.length} stories`);
});
