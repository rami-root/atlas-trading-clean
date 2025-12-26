import { initTRPC } from '@trpc/server';
import { createContext } from './context';

// Initialize tRPC
const t = initTRPC.context<typeof createContext>().create();

// Export tRPC procedures and middleware
export const router = t.router;
export const publicProcedure = t.procedure;
