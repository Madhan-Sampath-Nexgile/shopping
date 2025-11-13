import { Router } from 'express'
import { getProfile, updateProfile, getPurchaseHistory,
  getBrowsingHistory,
  deleteAccount,
  updateNotifications } from '../controllers/profile.controller.js'
import { auth } from '../middlewares/auth.middleware.js'

const r = Router()

r.get('/', auth, getProfile)
r.put('/', auth, updateProfile)
r.get('/purchases', auth, getPurchaseHistory)
r.get('/browsing', auth, getBrowsingHistory)
r.delete('/delete', auth, deleteAccount)
r.put('/notifications', auth, updateNotifications)

export default r
