import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

async function createUsers() {
  try {
    console.log('🔧 Creating default users...');

    // Admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminEmail = 'admin@smartshop.ai';

    try {
      const adminResult = await pool.query(
        `INSERT INTO users (email, password, name, preferences, price_range, shopping_frequency, variant)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, name`,
        [
          adminEmail,
          adminPassword,
          'Admin User',
          ['Electronics', 'Smart Home'],
          { min: 0, max: 100000 },
          'Daily',
          'A'
        ]
      );
      console.log('✅ Admin user created:', adminResult.rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        console.log('ℹ️  Admin user already exists');
      } else {
        throw err;
      }
    }

    // Demo user
    const demoPassword = await bcrypt.hash('demo123', 10);
    const demoEmail = 'demo@example.com';

    try {
      const demoResult = await pool.query(
        `INSERT INTO users (email, password, name, preferences, price_range, shopping_frequency, variant)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, name`,
        [
          demoEmail,
          demoPassword,
          'Demo User',
          ['Fashion', 'Books'],
          { min: 0, max: 50000 },
          'Weekly',
          'B'
        ]
      );
      console.log('✅ Demo user created:', demoResult.rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        console.log('ℹ️  Demo user already exists');
      } else {
        throw err;
      }
    }

    // Guest user for testing (no authentication required)
    const guestPassword = await bcrypt.hash('guest123', 10);
    const guestEmail = 'guest@test.com';
    const guestId = '00000000-0000-0000-0000-000000000000';

    try {
      const guestResult = await pool.query(
        `INSERT INTO users (id, email, password, name, preferences, price_range, shopping_frequency, variant)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING
         RETURNING id, email, name`,
        [
          guestId,
          guestEmail,
          guestPassword,
          'Guest User',
          [],
          { min: 0, max: 100000 },
          'Occasional',
          'A'
        ]
      );
      if (guestResult.rows.length > 0) {
        console.log('✅ Guest user created:', guestResult.rows[0]);
      } else {
        console.log('ℹ️  Guest user already exists');
      }
    } catch (err) {
      if (err.code === '23505') {
        console.log('ℹ️  Guest user already exists');
      } else {
        throw err;
      }
    }

    console.log('\n📋 User Credentials:');
    console.log('─────────────────────────────────');
    console.log('👑 Admin:');
    console.log('   Email: admin@smartshop.ai');
    console.log('   Password: admin123');
    console.log('');
    console.log('👤 Demo User:');
    console.log('   Email: demo@example.com');
    console.log('   Password: demo123');
    console.log('');
    console.log('👥 Guest User (auto-login for testing):');
    console.log('   Email: guest@test.com');
    console.log('   No login required');
    console.log('─────────────────────────────────\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating users:', error);
    process.exit(1);
  }
}

createUsers();
