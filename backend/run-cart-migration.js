import pkg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASS || '123456',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running migration: 002_add_cart_table.sql');

    const migrationPath = join(__dirname, '..', 'database', 'migrations', '002_add_cart_table.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('   - Added cart table');
    console.log('   - Added cart user_id index');

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
