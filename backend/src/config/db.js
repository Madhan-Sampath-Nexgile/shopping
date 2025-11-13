import pkg from 'pg'
import { config } from 'dotenv'

// Load environment variables
config()

const { Pool } = pkg

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASS || '',
  port: parseInt(process.env.DB_PORT || '5432', 10),
})

pool.on('connect', ()=> console.log('🟢 Connected to PostgreSQL'))
pool.on('error', (err)=> console.error('🔴 DB error:', err))

export default pool
