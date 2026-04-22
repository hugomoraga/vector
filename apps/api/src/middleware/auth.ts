import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  const { getAuth } = require('firebase-admin/auth');
  
  getAuth()
    .verifyIdToken(token)
    .then((decodedToken: { uid: string }) => {
      (req as any).user = { uid: decodedToken.uid };
      next();
    })
    .catch(() => {
      res.status(401).json({ error: 'Invalid token' });
    });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}