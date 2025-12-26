import { publicProcedure, router } from '../trpc/trpc';
import { z } from 'zod';

export const userRouter = router({
  // Example procedure for getting user details
  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      // Mock data for now
      return {
        id: input.userId,
        username: 'MockUser',
        email: 'mock@example.com',
        // In a real app, you would fetch from the database
      };
    }),
});
