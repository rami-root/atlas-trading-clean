import { inferAsyncReturnType } from '@trpc/server';
import * as express from 'express';

// A simple context function for tRPC
export const createContext = ({ req, res }: { req: express.Request; res: express.Response }) => {
  // Here you would typically parse the user's session or JWT from the request headers/cookies
  // For now, we'll return a basic context
  return {
    req,
    res,
    // Add database connection here if needed, or keep it in the procedure
    // db: db, 
    userId: 'mock-user-id-123', // Mock user ID for now
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
