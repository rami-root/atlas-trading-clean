import { z } from 'zod';
import { router, publicProcedure } from '../trpc/trpc';
import { db } from '../db';
import { sql } from 'drizzle-orm';

export const referralRouter = router({
  // Get referral info (code and link)
  info: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    
    if (!userId) {
      throw new Error('Unauthorized');
    }
    
    // Get user's referral code
    const userResult = await db.execute(sql`
      SELECT referral_code FROM users WHERE id = ${userId} LIMIT 1
    `);
    const user = Array.isArray(userResult) ? userResult[0] : (userResult as any).rows?.[0];
    
    if (!user || !user.referral_code) {
      throw new Error('User not found or no referral code');
    }
    
    const baseUrl = process.env.VITE_API_BASE_URL || 'https://atlas-trading-clean.onrender.com';
    
    return {
      referralCode: user.referral_code,
      referralLink: `${baseUrl}/register?ref=${user.referral_code}`,
    };
  }),

  // Get team statistics
  team: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Get level 1 referrals (direct referrals)
    const level1Result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM referrals
      WHERE referrer_id = ${userId} AND level = 1
    `);
    const level1Count = Array.isArray(level1Result) 
      ? Number(level1Result[0]?.count || 0)
      : Number((level1Result as any).rows?.[0]?.count || 0);

    // Get level 2 referrals
    const level2Result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM referrals
      WHERE referrer_id = ${userId} AND level = 2
    `);
    const level2Count = Array.isArray(level2Result)
      ? Number(level2Result[0]?.count || 0)
      : Number((level2Result as any).rows?.[0]?.count || 0);

    // Get level 3 referrals
    const level3Result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM referrals
      WHERE referrer_id = ${userId} AND level = 3
    `);
    const level3Count = Array.isArray(level3Result)
      ? Number(level3Result[0]?.count || 0)
      : Number((level3Result as any).rows?.[0]?.count || 0);

    // Get total rewards earned
    const rewardsResult = await db.execute(sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM referral_rewards
      WHERE user_id = ${userId}
    `);
    const totalRewards = Array.isArray(rewardsResult)
      ? Number(rewardsResult[0]?.total || 0)
      : Number((rewardsResult as any).rows?.[0]?.total || 0);

    const total = level1Count + level2Count + level3Count;

    return {
      level1: level1Count,
      level2: level2Count,
      level3: level3Count,
      total,
      totalRewards,
    };
  }),

  // Get detailed team members
  members: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;
    
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const result = await db.execute(sql`
      SELECT 
        u.id,
        u.username,
        u.email,
        r.level,
        r.created_at,
        COALESCE(SUM(rr.amount), 0) as total_rewards
      FROM referrals r
      JOIN users u ON r.referred_id = u.id
      LEFT JOIN referral_rewards rr ON rr.from_user_id = u.id AND rr.user_id = ${userId}
      WHERE r.referrer_id = ${userId}
      GROUP BY u.id, u.username, u.email, r.level, r.created_at
      ORDER BY r.level ASC, r.created_at DESC
    `);

    const members = Array.isArray(result) ? result : (result as any).rows || [];

    return members.map((m: any) => ({
      id: m.id,
      username: m.username,
      email: m.email,
      level: m.level,
      joinedAt: m.created_at,
      totalRewards: Number(m.total_rewards || 0),
    }));
  }),
});
