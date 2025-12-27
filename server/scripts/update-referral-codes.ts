import { db } from '../src/db';
import { sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

async function updateReferralCodes() {
  try {
    console.log('🔄 Starting referral code update...');
    
    // Get all users without referral codes or with ATLAS123
    const usersResult = await db.execute(sql`
      SELECT id, username, email FROM users 
      WHERE referral_code IS NULL OR referral_code = 'ATLAS123'
    `);
    
    const users = usersResult.rows as Array<{ id: string; username: string; email: string }>;
    
    console.log(`📊 Found ${users.length} users to update`);
    
    for (const user of users) {
      // Generate unique referral code
      const referralCode = `ATLAS${nanoid(6).toUpperCase()}`;
      
      // Update user with new referral code
      await db.execute(sql`
        UPDATE users 
        SET referral_code = ${referralCode}
        WHERE id = ${user.id}
      `);
      
      console.log(`✅ Updated user ${user.username} (${user.email}) with code: ${referralCode}`);
    }
    
    console.log('✅ All users updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating referral codes:', error);
    process.exit(1);
  }
}

updateReferralCodes();
