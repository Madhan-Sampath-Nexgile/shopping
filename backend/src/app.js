import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import { apiLimiter, authLimiter, searchLimiter } from './middlewares/rateLimit.middleware.js'
import userRoutes from './routes/user.routes.js'
import productRoutes from './routes/product.routes.js'
import cartRoutes from './routes/cart.routes.js'
import orderRoutes from './routes/order.routes.js'
import ragRoutes from './routes/rag.routes.js'
import abRoutes from './routes/abtest.routes.js'
import adminRoutes from './routes/admin.routes.js'
import authRoutes from './routes/auth.routes.js'
import profileRoutes from './routes/profile.routes.js'
import wishlistRoutes from './routes/wishlist.routes.js'


const app = express()

// Security middleware
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(morgan('dev'))

// Apply general rate limiter to all API routes
app.use('/api/', apiLimiter)

app.get('/api/health', (_,res)=>res.json({ ok:true, ts: Date.now() }))
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/rag', searchLimiter, ragRoutes)
app.use('/api/abtest', abRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/profile', profileRoutes)

app.use((err, req, res, next)=>{
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

export default app
