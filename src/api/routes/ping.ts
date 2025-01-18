import { Router } from 'express';
import { pingController } from '@controllers/pingController';

export const pingRouter: Router = Router();

pingRouter.get('/', pingController);