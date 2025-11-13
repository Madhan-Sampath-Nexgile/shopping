import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const migrationFile = process.argv[2];

  if (!migrationFile) {
    console.error('❌ Please provide migration file name');
    console.log('Usage: node runMigration.js <migration-file>');
    process.exit(1);
  }

  try {
    // Read migration file
    const migrationPath = join(__dirname, '../../../database/migrations', migrationFile);
    console.log(`📄 Reading migration: ${migrationFile}`);

    const sql = readFileSync(migrationPath, 'utf8');

    // Execute migration
    console.log('⚙️  Running migration...');
    await pool.query(sql);

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
