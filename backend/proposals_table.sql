-- ══════════════════════════════════════════════════════════════════════════════
-- HYPR Command - Proposals Table
-- ══════════════════════════════════════════════════════════════════════════════
-- Run this in BigQuery to create the proposals table
-- Project: site-hypr
-- Dataset: hypr_sales_center
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `site-hypr.hypr_sales_center.proposals` (
  id STRING NOT NULL,
  created_at TIMESTAMP,
  created_by STRING,
  created_by_email STRING,
  client STRING,
  agency STRING,
  period_start DATE,
  period_end DATE,
  praca STRING,
  project_description STRING,
  proposal_title STRING,
  scope_products STRING,  -- JSON array
  contracted_products STRING,  -- JSON array
  bonifications STRING,  -- JSON array
  features ARRAY<STRING>,
  total_display_volume INT64,
  total_video_volume INT64,
  total_gross_value FLOAT64,
  total_net_value FLOAT64,
  total_bonification_value FLOAT64,
  status STRING,  -- draft, sent, approved
  last_updated TIMESTAMP
);

-- ══════════════════════════════════════════════════════════════════════════════
-- Example query to check the table
-- ══════════════════════════════════════════════════════════════════════════════
-- SELECT * FROM `site-hypr.hypr_sales_center.proposals` ORDER BY created_at DESC LIMIT 10;
