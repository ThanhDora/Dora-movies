ALTER TABLE movie_approvals
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_movie_approvals_is_visible ON movie_approvals(is_visible);

UPDATE movie_approvals SET is_visible = true WHERE is_visible IS NULL;
