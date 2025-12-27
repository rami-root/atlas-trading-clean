import { inferAsyncReturnType } from '@trpc/server';
import * as express from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'atlas-secret-key-2025';

// A simple context function for tRPC
export const createContext = ({ req, res }: { req: express.Request; res: express.Response }) => {
  // Extract user from JWT token
  let userId: string | null = null;
  
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      userId = decoded.sub || null;
    }
  } catch (error) {
    // Token invalid or expired, userId remains null
  }
  
  return {
    req,
    res,
    userId,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
