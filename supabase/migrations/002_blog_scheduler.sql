-- Add scheduled_at column and update status constraint to support "scheduled"
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- Drop old status check constraint if it exists (may be named differently)
ALTER TABLE blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_status_check;

-- Add updated constraint including "scheduled"
ALTER TABLE blog_posts
  ADD CONSTRAINT blog_posts_status_check
  CHECK (status IN ('draft', 'published', 'scheduled'));
