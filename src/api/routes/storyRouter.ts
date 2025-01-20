import express, { Router } from "express";
import { fetchStoryController } from "@controllers/fetchStoryController";
import { getAllStoriesController } from "@controllers/getAllStoriesController";
const router: Router = express.Router();

router.get('/all', getAllStoriesController);
router.get('/:hn_id', fetchStoryController);

export default router;
