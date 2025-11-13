import { Router } from 'express'
import { ragPOST } from '../services/rag.service.js'
const r = Router()

r.post('/recommend', async (req,res)=>{
  const data = await ragPOST('/recommend', { userId: req.body.userId || 'demo-user' })
  res.json(data)
})
r.post('/search', async (req,res)=>{
  const data = await ragPOST('/search', { query: req.body.query || '' })
  res.json(data)
})
r.post('/qa', async (req,res)=>{
  const data = await ragPOST('/qa', { question: req.body.question || '', productId: req.body.productId || null })
  res.json(data)
})

export default r
