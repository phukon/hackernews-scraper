import { Router } from 'express';
import { pingController } from '@controllers/pingController';
import { scrapController } from '@controllers/scrapController';

const router: Router = Router();

router.get('/', pingController);
router.get('/scrap', scrapController);

export default router;