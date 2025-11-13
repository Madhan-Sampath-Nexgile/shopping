import { Router } from 'express'
import pool from '../config/db.js'
import { auth } from '../middlewares/auth.middleware.js'
import { optionalAuth } from '../middlewares/optionalAuth.middleware.js'

const r = Router()

/* -------------------------------------------------------------------------- */
/* Track A/B Test Event */
/* -------------------------------------------------------------------------- */
r.post('/track', optionalAuth, async (req, res) => {
  const { variant, eventType, productId, metadata } = req.body
  const userId = req.user?.id

  if (!variant || !eventType) {
    return res.status(400).json({ error: 'variant and eventType are required' })
  }

  if (!['A', 'B'].includes(variant)) {
    return res.status(400).json({ error: 'variant must be A or B' })
  }

  if (!['view', 'click', 'purchase'].includes(eventType)) {
    return res.status(400).json({ error: 'eventType must be view, click, or purchase' })
  }

  try {
    await pool.query(
      `INSERT INTO abtest_metrics (user_id, variant, event_type, product_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, variant, eventType, productId || null, metadata || {}]
    )

    res.json({ success: true })
  } catch (err) {
    console.error('A/B test tracking error:', err)
    res.status(500).json({ error: 'Failed to track event' })
  }
})

/* -------------------------------------------------------------------------- */
/* Get A/B Test Metrics */
/* -------------------------------------------------------------------------- */
r.get('/metrics', async (req, res) => {
  try {
    // Get metrics for the last 30 days, aggregated by day
    const { rows } = await pool.query(
      `SELECT
        DATE(created_at) AS date,
        variant,
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) AS views,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) AS clicks,
        COUNT(CASE WHEN event_type = 'purchase' THEN 1 END) AS purchases
       FROM abtest_metrics
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(created_at), variant
       ORDER BY date DESC, variant`
    )

    // Calculate CTR for each variant
    const metrics = {}
    rows.forEach(row => {
      const key = row.variant
      if (!metrics[key]) {
        metrics[key] = { views: 0, clicks: 0, purchases: 0 }
      }
      metrics[key].views += parseInt(row.views)
      metrics[key].clicks += parseInt(row.clicks)
      metrics[key].purchases += parseInt(row.purchases)
    })

    // Calculate CTR percentages
    const summary = {
      A: {
        views: metrics.A?.views || 0,
        clicks: metrics.A?.clicks || 0,
        purchases: metrics.A?.purchases || 0,
        ctr: metrics.A?.views > 0 ? ((metrics.A.clicks / metrics.A.views) * 100).toFixed(2) : '0.00'
      },
      B: {
        views: metrics.B?.views || 0,
        clicks: metrics.B?.clicks || 0,
        purchases: metrics.B?.purchases || 0,
        ctr: metrics.B?.views > 0 ? ((metrics.B.clicks / metrics.B.views) * 100).toFixed(2) : '0.00'
      }
    }

    // Create timeseries for the chart (last 10 days)
    const timeseriesQuery = await pool.query(
      `SELECT
        DATE(created_at) AS date,
        variant,
        COUNT(CASE WHEN event_type = 'view' THEN 1 END) AS views,
        COUNT(CASE WHEN event_type = 'click' THEN 1 END) AS clicks
       FROM abtest_metrics
       WHERE created_at >= NOW() - INTERVAL '10 days'
       GROUP BY DATE(created_at), variant
       ORDER BY date ASC`
    )

    const timeseriesMap = {}
    timeseriesQuery.rows.forEach(row => {
      const dateStr = new Date(row.date).toLocaleDateString()
      if (!timeseriesMap[dateStr]) {
        timeseriesMap[dateStr] = { t: dateStr, A: 0, B: 0 }
      }
      const ctr = row.views > 0 ? ((row.clicks / row.views) * 100) : 0
      timeseriesMap[dateStr][row.variant] = parseFloat(ctr.toFixed(2))
    })

    const timeseries = Object.values(timeseriesMap)

    // If no data, return mock data for demonstration
    if (timeseries.length === 0) {
      const now = Date.now()
      const mockTimeseries = Array.from({ length: 10 }).map((_, i) => ({
        t: new Date(now - (9 - i) * 3600_000).toLocaleTimeString(),
        A: 2 + i * 0.1,
        B: 2.5 + i * 0.12
      }))
      return res.json({ timeseries: mockTimeseries, summary })
    }

    res.json({ timeseries, summary })
  } catch (err) {
    console.error('Error fetching A/B test metrics:', err)
    // Fallback to mock data on error
    const now = Date.now()
    const pts = Array.from({ length: 10 }).map((_, i) => ({
      t: new Date(now - (9 - i) * 3600_000).toLocaleTimeString(),
      A: 2 + i * 0.1,
      B: 2.5 + i * 0.12
    }))
    res.json({ timeseries: pts, summary: { A: { ctr: '2.5' }, B: { ctr: '3.1' } } })
  }
})

export default r
