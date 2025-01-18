import { Request, Response } from 'express';

export const pingController = (req: Request, res: Response) => {
  res.json({ message: 'pong' });
};