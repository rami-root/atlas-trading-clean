import { router } from './trpc';
import { userRouter } from '../routers/user';
import { capitalRouter } from '../routers/capital';
import { cryptoRouter } from '../routers/crypto';
import { referralRouter } from '../routers/referral';
import { depositRouter } from '../routers/deposit';

// Define the main application router
export const appRouter = router({
  user: userRouter,
  capital: capitalRouter,
  crypto: cryptoRouter,
  referral: referralRouter,
  deposit: depositRouter,
});

// Export type for the app router
export type AppRouter = typeof appRouter;
