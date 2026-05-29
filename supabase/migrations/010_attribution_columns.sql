-- =============================================================
-- SC Security Summit 2026 — Migration 010: Extended Attribution
--
-- Purpose: add marketing attribution columns the registration Server
-- Action now writes (UTM term/content, ad click IDs, landing page,
-- client referrer, first/last touch timestamps).
--
-- The application is forward-compatible: create-lead.ts retries the
-- insert WITHOUT these columns if they are missing, so registrations
-- never break — but apply this so the data is actually captured.
--
-- All operations are IF NOT EXISTS — safe to re-run.
--
-- Apply via:  Supabase Dashboard → SQL Editor → paste & run
--   (or)      supabase db push
-- =============================================================

ALTER TABLE public.registros
  ADD COLUMN IF NOT EXISTS utm_term              TEXT,
  ADD COLUMN IF NOT EXISTS utm_content           TEXT,
  ADD COLUMN IF NOT EXISTS gclid                 TEXT,
  ADD COLUMN IF NOT EXISTS gbraid                TEXT,
  ADD COLUMN IF NOT EXISTS wbraid                TEXT,
  ADD COLUMN IF NOT EXISTS fbclid                TEXT,
  ADD COLUMN IF NOT EXISTS li_fat_id             TEXT,
  ADD COLUMN IF NOT EXISTS msclkid               TEXT,
  ADD COLUMN IF NOT EXISTS landing_page          TEXT,
  -- `referer` (HTTP header, server-side) already exists from migration 008.
  -- `referrer` here is the client document.referrer captured at first touch.
  ADD COLUMN IF NOT EXISTS referrer              TEXT,
  ADD COLUMN IF NOT EXISTS first_touch_timestamp TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_touch_timestamp  TIMESTAMPTZ;

-- Helpful indexes for paid-channel reporting (partial: only rows with a value)
CREATE INDEX IF NOT EXISTS registros_gclid_idx
  ON public.registros(gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS registros_utm_campaign_idx
  ON public.registros(utm_campaign) WHERE utm_campaign IS NOT NULL;

-- =============================================================
-- Post-apply sanity check:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema='public' AND table_name='registros'
--     AND column_name IN ('gclid','utm_term','last_touch_timestamp');
-- =============================================================
