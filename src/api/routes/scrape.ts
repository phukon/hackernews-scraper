import { Router } from 'express';
import { htmlScraperController } from '@/api/controllers/htmlScraperController';
import { apiScraperController } from '@/api/controllers/apiScraperController';
const router: Router = Router();

router.get('/html', htmlScraperController);
router.get('/firebase', apiScraperController);
export default router;