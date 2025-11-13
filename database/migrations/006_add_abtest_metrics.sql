-- Migration: Add A/B test metrics table
-- Created: 2025-01-12
-- Description: Track A/B test recommendation clicks for analytics

CREATE TABLE IF NOT EXISTS abtest_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    variant VARCHAR(1) NOT NULL CHECK (variant IN ('A', 'B')),
    event_type VARCHAR(50) NOT NULL, -- 'view', 'click', 'purchase'
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_abtest_metrics_variant ON abtest_metrics(variant);
CREATE INDEX IF NOT EXISTS idx_abtest_metrics_event_type ON abtest_metrics(event_type);
CREATE INDEX IF NOT EXISTS idx_abtest_metrics_created_at ON abtest_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_abtest_metrics_user_variant ON abtest_metrics(user_id, variant);

-- Comment on table
COMMENT ON TABLE abtest_metrics IS 'Stores A/B test events for recommendation analytics';
