import { router, publicProcedure } from './trpc';
import { createContext } from './context';
import { userRouter } from '../routers/user';
import { capitalRouter } from '../routers/capital'; // New router for capital logic








// Define the main application router
export const appRouter = router({
  user: userRouter,
  capital: capitalRouter, // Include the new capital router
  // Add other routers here (e.g., trading, investments)
});

// Export type for the app router
export type AppRouter = typeof appRouter;
