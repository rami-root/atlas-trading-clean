import { publicProcedure, router } from '../trpc/trpc';
import { db } from '../db';
import { capital, transactions } from '../schema';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';

// Define the core logic for capital management
const calculateCapital = async (userId: string) => {
  try {
    // Fetch the user's capital from the database
    const userCapital = await db
      .select()
      .from(capital)
      .where(eq(capital.userId, userId))
      .limit(1);

    if (userCapital.length === 0) {
      // If no capital record exists, create one with default values
      await db.insert(capital).values({
        userId,
        funding: 0.00,
        profitBuffer: 0.00,
        availableCapital: 0.00,
        updatedAt: new Date(),
      });

      return {
        userId,
        feeding: 0.00,
        profits: 0.00,
        available: 0.00,
        lastUpdated: new Date(),
      };
    }

    const record = userCapital[0];
    return {
      userId: record.userId,
      feeding: record.funding,
      profits: record.profitBuffer,
      available: record.availableCapital,
      lastUpdated: record.updatedAt || new Date(),
    };
  } catch (error) {
    console.error('Error fetching capital:', error);
    throw new Error('Failed to fetch capital data');
  }
};

// Define the core logic for applying a transaction
const applyTransaction = async (userId: string, type: 'compliant' | 'non_compliant', amount: number) => {
  try {
    // Fetch current capital
    const userCapital = await db
      .select()
      .from(capital)
      .where(eq(capital.userId, userId))
      .limit(1);

    if (userCapital.length === 0) {
      throw new Error('Capital record not found. Please initialize capital first.');
    }

    const currentCapital = userCapital[0];
    let newProfitBuffer = currentCapital.profitBuffer;
    let newFunding = currentCapital.funding;

    // Apply transaction logic based on type
    if (type === 'compliant') {
      // Compliant transaction: Add to profit buffer
      newProfitBuffer += amount;
    } else {
      // Non-compliant transaction: Deduct from profit buffer first, then from funding
      if (currentCapital.profitBuffer >= amount) {
        newProfitBuffer -= amount;
      } else {
        const remainingDeduction = amount - currentCapital.profitBuffer;
        newProfitBuffer = 0;
        newFunding -= remainingDeduction;

        if (newFunding < 0) {
          throw new Error('Insufficient capital to complete transaction');
        }
      }
    }

    const newAvailableCapital = newFunding + newProfitBuffer;

    // Update capital table
    await db
      .update(capital)
      .set({
        funding: newFunding,
        profitBuffer: newProfitBuffer,
        availableCapital: newAvailableCapital,
        updatedAt: new Date(),
      })
      .where(eq(capital.userId, userId));

    // Insert transaction record
    await db.insert(transactions).values({
      userId,
      type: type === 'compliant' ? 'compliant' : 'non_compliant',
      amount,
      isCompliant: type === 'compliant' ? 1 : 0,
      description: `${type === 'compliant' ? 'Compliant' : 'Non-compliant'} transaction of $${amount}`,
      createdAt: new Date(),
    });

    return {
      success: true,
      message: `Transaction applied successfully: ${type} of $${amount}`,
      newCapital: {
        feeding: newFunding,
        profits: newProfitBuffer,
        available: newAvailableCapital,
      },
    };
  } catch (error) {
    console.error('Error applying transaction:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to apply transaction');
  }
};

// Add funding to capital
const addFunding = async (userId: string, amount: number) => {
  try {
    // Fetch current capital
    const userCapital = await db
      .select()
      .from(capital)
      .where(eq(capital.userId, userId))
      .limit(1);

    if (userCapital.length === 0) {
      // Create new capital record with funding
      await db.insert(capital).values({
        userId,
        funding: amount,
        profitBuffer: 0.00,
        availableCapital: amount,
        updatedAt: new Date(),
      });
    } else {
      // Update existing capital record
      const currentCapital = userCapital[0];
      const newFunding = currentCapital.funding + amount;
      const newAvailableCapital = newFunding + currentCapital.profitBuffer;

      await db
        .update(capital)
        .set({
          funding: newFunding,
          availableCapital: newAvailableCapital,
          updatedAt: new Date(),
        })
        .where(eq(capital.userId, userId));
    }

    // Record the funding transaction
    await db.insert(transactions).values({
      userId,
      type: 'deposit',
      amount,
      isCompliant: 1,
      description: `Funding deposit of $${amount}`,
      createdAt: new Date(),
    });

    return {
      success: true,
      message: `Funding of $${amount} added successfully`,
    };
  } catch (error) {
    console.error('Error adding funding:', error);
    throw new Error('Failed to add funding');
  }
};

// Get transaction history
const getTransactionHistory = async (userId: string) => {
  try {
    const history = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(50);

    return history;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw new Error('Failed to fetch transaction history');
  }
};

export const capitalRouter = router({
  getCapital: publicProcedure
    .input(z.object({ userId: z.string().default('mock_user_1') }))
    .query(async ({ input }) => {
      return calculateCapital(input.userId);
    }),

  applyTransaction: publicProcedure
    .input(z.object({
      userId: z.string().default('mock_user_1'),
      type: z.enum(['compliant', 'non_compliant']),
      amount: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      return applyTransaction(input.userId, input.type, input.amount);
    }),

  addFunding: publicProcedure
    .input(z.object({
      userId: z.string().default('mock_user_1'),
      amount: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      return addFunding(input.userId, input.amount);
    }),

  getTransactionHistory: publicProcedure
    .input(z.object({ userId: z.string().default('mock_user_1') }))
    .query(async ({ input }) => {
      return getTransactionHistory(input.userId);
    }),
});
