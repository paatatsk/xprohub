-- ============================================================
-- XProHub — Make listing photos readable by all authenticated users
--
-- The original "Job parties read photos" SELECT policy is
-- party-scoped (customer_id OR worker_id), which correctly
-- protects before/after evidence photos. But listing photos
-- must be visible to anyone browsing the Market feed or Job
-- Detail — they're the job's public advertisement.
--
-- This adds a second SELECT policy for listing photos only.
-- PostgreSQL RLS is permissive-OR: a row is visible if ANY
-- policy grants access. So party-scoped evidence photos stay
-- protected while listing photos become broadly readable.
--
-- Migration: 20260610000001_listing_photos_public_read.sql
-- ============================================================

CREATE POLICY "Authenticated users read listing photos"
  ON public.job_photos FOR SELECT
  TO authenticated
  USING (photo_type = 'listing');
