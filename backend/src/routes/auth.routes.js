import { Router } from 'express'
import { register, login, me } from '../controllers/auth.controller.js'
import { auth } from '../middlewares/auth.middleware.js'
import { validateRegistration, validateLogin } from '../middlewares/validation.middleware.js'
const r = Router()

r.post('/register', validateRegistration, register)
r.post('/login', validateLogin, login)
r.get('/me', auth, me)

export default r
