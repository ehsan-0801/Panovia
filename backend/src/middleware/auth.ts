import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../lib/auth.js';
import { ApiError } from '../utils/ApiError.js';

export interface AuthUser {
  id: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/** Verifies the access token this API issued (HS256, verified in-process). */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');

    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      throw new ApiError(401, 'Invalid or expired session');
    }
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(err);
  }
}
