import { router } from './trpc';
import { userRouter } from '../routers/user';
import { capitalRouter } from '../routers/capital';
import { cryptoRouter } from '../routers/crypto';

// Define the main application router
export const appRouter = router({
  user: userRouter,
  capital: capitalRouter,
  crypto: cryptoRouter, // تم إضافة راوتر العملات هنا
});

// Export type for the app router
export type AppRouter = typeof appRouter;
