import pkg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '123456',
  port: 5432,
});

async function createAdmin() {
  const client = await pool.connect();
  try {
    // Check if admin exists
    const check = await client.query("SELECT * FROM users WHERE email = 'admin@smartshop.com'");

    if (check.rows.length > 0) {
      console.log('Admin user already exists!');
      console.log('Email: admin@smartshop.com');
      console.log('Password: admin123');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await client.query(
      `INSERT INTO users (email, password, name, preferences, variant)
       VALUES ($1, $2, $3, $4, $5)`,
      ['admin@smartshop.com', hashedPassword, 'Admin User', ['Electronics', 'Fashion'], 'A']
    );

    console.log('Admin user created successfully!');
    console.log('\nLogin Credentials:');
    console.log('Email: admin@smartshop.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();
