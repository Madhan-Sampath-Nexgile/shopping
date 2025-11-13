import pkg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '123456',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function runMigrations() {
  const client = await pool.connect();

  try {
    // Run cart table migration
    console.log('🔄 Running migration: 002_add_cart_table.sql');
    const cartMigrationPath = join(__dirname, '..', 'database', 'migrations', '002_add_cart_table.sql');
    const cartMigrationSQL = readFileSync(cartMigrationPath, 'utf8');
    await client.query(cartMigrationSQL);
    console.log('✅ Cart table migration completed!');

    // Run saved_for_later migration
    console.log('🔄 Running migration: 005_add_saved_for_later.sql');
    const savedMigrationPath = join(__dirname, '..', 'database', 'migrations', '005_add_saved_for_later.sql');
    const savedMigrationSQL = readFileSync(savedMigrationPath, 'utf8');
    await client.query(savedMigrationSQL);
    console.log('✅ Saved for later table migration completed!');

    console.log('🎉 All cart migrations completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
