import { publicProcedure, router } from '../trpc/trpc';
import { db } from '../db';
import { z } from 'zod';
import { sql } from 'drizzle-orm';

export const depositRouter = router({
  // Create deposit request
  create: publicProcedure
    .input(z.object({
      amount: z.string().or(z.number()).transform(val => typeof val === 'string' ? parseFloat(val) : val),
      walletAddress: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId;
      
      if (!userId) {
        throw new Error('Unauthorized - Please login');
      }
      
      const amount = input.amount;
      
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      try {
        const result = await db.execute(sql`
          INSERT INTO deposit_requests (user_id, amount, status, notes)
          VALUES (${userId}, ${amount}, 'pending', ${input.walletAddress ? `Wallet: ${input.walletAddress}` : null})
          RETURNING id
        `);
        
        const requestId = Array.isArray(result) ? result[0]?.id : (result as any).rows?.[0]?.id;
        
        return {
          success: true,
          message: 'Deposit request created successfully. Waiting for admin approval.',
          requestId,
        };
      } catch (error) {
        console.error('Error creating deposit request:', error);
        throw new Error('Failed to create deposit request');
      }
    }),

  // Get user's deposit requests
  myRequests: publicProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.userId;
      
      if (!userId) {
        throw new Error('Unauthorized - Please login');
      }
      
      try {
        const result = await db.execute(sql`
          SELECT * FROM deposit_requests 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `);
        return Array.isArray(result) ? result : (result as any).rows || [];
      } catch (error) {
        console.error('Error fetching deposit requests:', error);
        throw new Error('Failed to fetch deposit requests');
      }
    }),
});
