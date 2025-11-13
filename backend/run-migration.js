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

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running migration: 001_add_missing_tables.sql');

    const migrationPath = join(__dirname, '..', 'database', 'migrations', '001_add_missing_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('   - Added wishlist table');
    console.log('   - Added browsing_history table');
    console.log('   - Added product_questions table');
    console.log('   - Added performance indexes');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
