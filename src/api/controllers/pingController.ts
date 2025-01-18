import { Request, Response } from 'express';

export const pingController = ( _: Request, res: Response) => {
  res.json({ message: 'pong' });
};