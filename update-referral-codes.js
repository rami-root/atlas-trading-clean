import { neon } from '@neondatabase/serverless';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function updateReferralCodes() {
  try {
    console.log('🔄 Starting referral code update...');
    
    // Get all users without referral codes or with ATLAS123
    const users = await sql`
      SELECT id, username, email, referral_code FROM users 
      WHERE referral_code IS NULL OR referral_code = 'ATLAS123' OR referral_code = ''
    `;
    
    console.log(`📊 Found ${users.length} users to update`);
    
    for (const user of users) {
      // Generate unique referral code
      const referralCode = `ATLAS${nanoid()}`;
      
      // Update user with new referral code
      await sql`
        UPDATE users 
        SET referral_code = ${referralCode}
        WHERE id = ${user.id}
      `;
      
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
