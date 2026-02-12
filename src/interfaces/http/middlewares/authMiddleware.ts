import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../../../infrastructure/database/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    roles: string[];
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const SECRET_KEY = process.env.JWT_SECRET || 'access_secret';

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { id: number };

    // ✅ Charger l'utilisateur depuis la DB
    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is locked or inactive' });
    }

    // ✅ Extraction simple des noms de rôles
    const roleNames = user.roles.map(ur => ur.role.name);

    req.user = {
      id: user.id,
      username: user.username,
      roles: roleNames
    };

    return next();

  } catch (err) {
    return res.status(401).json({ message: 'Invalid or Expired Token' });
  }
};


export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userRoles: string[] = user.roles ?? [];

    const hasAccess = userRoles.some(role =>
      allowedRoles.includes(role)
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};
