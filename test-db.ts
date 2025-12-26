import { db } from './server/db';
import { users, capital, transactions } from './server/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function testDatabase() {
  console.log('🧪 Testing database connection and operations...\n');

  try {
    // 1. Create a test user
    console.log('1️⃣ Creating test user...');
    const testUserId = 'test_user_001';
    const passwordHash = await bcrypt.hash('testpassword123', 10);

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: testUserId,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash,
        createdAt: new Date(),
      });
      console.log('✅ Test user created successfully');
    } else {
      console.log('ℹ️  Test user already exists');
    }

    // 2. Add initial funding
    console.log('\n2️⃣ Adding initial funding...');
    const existingCapital = await db
      .select()
      .from(capital)
      .where(eq(capital.userId, testUserId))
      .limit(1);

    if (existingCapital.length === 0) {
      await db.insert(capital).values({
        userId: testUserId,
        funding: 1000.00,
        profitBuffer: 0.00,
        availableCapital: 1000.00,
        updatedAt: new Date(),
      });
      console.log('✅ Initial funding of $1000 added');
    } else {
      console.log('ℹ️  Capital record already exists');
    }

    // 3. Add a compliant transaction (profit)
    console.log('\n3️⃣ Adding compliant transaction (profit)...');
    await db.insert(transactions).values({
      userId: testUserId,
      type: 'trade',
      amount: 150.00,
      isCompliant: 1,
      description: 'Compliant trade profit',
      createdAt: new Date(),
    });

    // Update capital with profit
    const currentCapital = await db
      .select()
      .from(capital)
      .where(eq(capital.userId, testUserId))
      .limit(1);

    if (currentCapital.length > 0) {
      const newProfitBuffer = currentCapital[0].profitBuffer + 150.00;
      const newAvailableCapital = currentCapital[0].funding + newProfitBuffer;

      await db
        .update(capital)
        .set({
          profitBuffer: newProfitBuffer,
          availableCapital: newAvailableCapital,
          updatedAt: new Date(),
        })
        .where(eq(capital.userId, testUserId));

      console.log('✅ Compliant transaction added: +$150 profit');
    }

    // 4. Add a non-compliant transaction (loss)
    console.log('\n4️⃣ Adding non-compliant transaction (loss)...');
    await db.insert(transactions).values({
      userId: testUserId,
      type: 'trade',
      amount: 50.00,
      isCompliant: 0,
      description: 'Non-compliant trade loss',
      createdAt: new Date(),
    });

    // Update capital with loss (deduct from profit buffer first)
    const updatedCapital = await db
      .select()
      .from(capital)
      .where(eq(capital.userId, testUserId))
      .limit(1);

    if (updatedCapital.length > 0) {
      let newProfitBuffer = updatedCapital[0].profitBuffer - 50.00;
      let newFunding = updatedCapital[0].funding;

      if (newProfitBuffer < 0) {
        newFunding += newProfitBuffer; // Deduct from funding
        newProfitBuffer = 0;
      }

      const newAvailableCapital = newFunding + newProfitBuffer;

      await db
        .update(capital)
        .set({
          funding: newFunding,
          profitBuffer: newProfitBuffer,
          availableCapital: newAvailableCapital,
          updatedAt: new Date(),
        })
        .where(eq(capital.userId, testUserId));

      console.log('✅ Non-compliant transaction added: -$50 loss');
    }

    // 5. Display final capital state
    console.log('\n5️⃣ Final capital state:');
    const finalCapital = await db
      .select()
      .from(capital)
      .where(eq(capital.userId, testUserId))
      .limit(1);

    if (finalCapital.length > 0) {
      console.log('   📊 Funding (التغذية):', `$${finalCapital[0].funding.toFixed(2)}`);
      console.log('   📊 Profit Buffer (الأرباح):', `$${finalCapital[0].profitBuffer.toFixed(2)}`);
      console.log('   📊 Available Capital (المتاح):', `$${finalCapital[0].availableCapital.toFixed(2)}`);
    }

    // 6. Display transaction history
    console.log('\n6️⃣ Transaction history:');
    const history = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, testUserId));

    history.forEach((tx, index) => {
      const sign = tx.isCompliant ? '+' : '-';
      const status = tx.isCompliant ? '✅ Compliant' : '❌ Non-compliant';
      console.log(`   ${index + 1}. ${status} | ${sign}$${tx.amount.toFixed(2)} | ${tx.description}`);
    });

    console.log('\n✅ Database test completed successfully!');
    console.log('🎉 All operations are working correctly.\n');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
}

// Run the test
testDatabase();
