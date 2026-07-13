-- ============================================================================
-- POSTS
-- ============================================================================
CREATE TABLE posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content_json TEXT NOT NULL,          -- Tiptap JSON, stored as text
  cover_image TEXT,                    -- root-relative path or Vercel Blob URL
  tags_json TEXT,                      -- JSON array, e.g. '["Personal","Grief"]'
  draft INTEGER NOT NULL DEFAULT 1,    -- 0 = published, 1 = draft (matches frontmatter boolean)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  published_at TEXT
);

CREATE INDEX idx_posts_draft ON posts(draft);
CREATE INDEX idx_posts_slug ON posts(slug);

-- ============================================================================
-- CLAPS
-- Medium-style: each visitor (identified by a client-generated UUID stored in
-- localStorage, no login required) can clap up to 50 times per post. One row
-- per (post, visitor) pair — total claps on a post = SUM(count).
-- ============================================================================
CREATE TABLE claps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK (count <= 50),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(post_id, visitor_id)
);

CREATE INDEX idx_claps_post ON claps(post_id);