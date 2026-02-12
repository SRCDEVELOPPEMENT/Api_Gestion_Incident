import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../../../infrastructure/database/prisma';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const SECRET_KEY = process.env.JWT_SECRET || 'access_secret';

  const authHeader = req.headers['authorization'];

  if (
    !authHeader ||
    Array.isArray(authHeader) ||
    !authHeader.startsWith('Bearer ')
  ) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded: any = jwt.verify(token, SECRET_KEY);

    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
      include: {
        roles: {
          include: { role: true }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    (req as any).user = {
      id: user.id,
      username: user.username,
      roles: user.roles.map(ur => ur.role.name)
    };

    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
