import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';

export interface WorkspaceUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
}

export interface AuthRequest extends Request {
  user?: DecodedIdToken | WorkspaceUser;
}

const DEFAULT_WORKSPACE_USER: WorkspaceUser = {
  uid: 'toka-local-workspace',
  email: '',
  name: 'TOKA Member',
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = DEFAULT_WORKSPACE_USER;
    next();
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    req.user = DEFAULT_WORKSPACE_USER;
    next();
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};
