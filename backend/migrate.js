import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '123456',
  port: 5432,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running migration...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '..', 'database', 'migration_add_images.sql'),
      'utf8'
    );

    await client.query(migrationSQL);
    console.log('Migration completed successfully!');

    // Verify the changes
    const result = await client.query('SELECT name, images FROM products LIMIT 3');
    console.log('\nSample products with images:');
    result.rows.forEach(row => {
      console.log(`- ${row.name}: ${row.images ? row.images.length + ' images' : 'no images'}`);
    });

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
