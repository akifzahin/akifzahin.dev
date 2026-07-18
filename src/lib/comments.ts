import { db } from "./db";

export const REPLY_AUTHOR_NAME = "Akif";

export interface Comment {
  id: number;
  post_id: number;
  parent_id: number | null;
  name: string;
  body: string;
  approved: boolean;
  created_at: string;
  like_count: number;
  liked: boolean;
}

export interface CommentWithReplies extends Comment {
  replies: Comment[];
}

export interface PendingComment extends Comment {
  post_title: string;
  post_slug: string;
}

function rowToComment(row: any): Comment {
  return {
    id: row.id,
    post_id: row.post_id,
    parent_id: row.parent_id ?? null,
    name: row.name,
    body: row.body,
    approved: row.approved === 1,
    created_at: row.created_at,
    like_count: Number(row.like_count ?? 0),
    liked: Number(row.liked_by_visitor ?? 0) > 0,
  };
}

function rowToPendingComment(row: any): PendingComment {
  return {
    ...rowToComment(row),
    post_title: row.post_title,
    post_slug: row.post_slug,
  };
}

// Public — approved comments for a post, nested (top-level + replies[]),
// each with a live like count. If visitorId is provided, each comment also
// reports whether THIS visitor has already liked it, so the heart icon can
// render correctly filled/unfilled on page load, not just after a click.
export async function getApprovedComments(
  postId: number,
  visitorId?: string,
): Promise<CommentWithReplies[]> {
  const result = await db.execute({
    sql: `
      SELECT c.id, c.post_id, c.parent_id, c.name, c.body, c.approved, c.created_at,
             COUNT(cl.id) AS like_count,
             MAX(CASE WHEN cl.visitor_id = ? THEN 1 ELSE 0 END) AS liked_by_visitor
      FROM comments c
      LEFT JOIN comment_likes cl ON cl.comment_id = c.id
      WHERE c.post_id = ? AND c.approved = 1
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `,
    args: [visitorId ?? "", postId],
  });

  const all = result.rows.map(rowToComment);

  const topLevel = all.filter((c) => c.parent_id === null);
  const repliesByParent = new Map<number, Comment[]>();

  for (const c of all) {
    if (c.parent_id !== null) {
      const list = repliesByParent.get(c.parent_id) ?? [];
      list.push(c);
      repliesByParent.set(c.parent_id, list);
    }
  }

  return topLevel.map((c) => ({
    ...c,
    replies: repliesByParent.get(c.id) ?? [],
  }));
}

// Public — insert a new top-level comment, always pending (approved = 0)
export async function createComment(
  postId: number,
  name: string,
  body: string,
): Promise<void> {
  await db.execute({
    sql: `INSERT INTO comments (post_id, name, body, approved)
          VALUES (?, ?, ?, 0)`,
    args: [postId, name, body],
  });
}

// Admin — reply to an existing (top-level) comment. Auto-approved, name
// hardcoded — this is only ever called from an authenticated /admin route.
export async function createReply(
  parentId: number,
  body: string,
): Promise<void> {
  const parent = await db.execute({
    sql: `SELECT post_id FROM comments WHERE id = ?`,
    args: [parentId],
  });

  if (parent.rows.length === 0) {
    throw new Error("Parent comment not found");
  }

  const postId = parent.rows[0].post_id;

  await db.execute({
    sql: `INSERT INTO comments (post_id, parent_id, name, body, approved)
          VALUES (?, ?, ?, ?, 1)`,
    args: [postId, parentId, REPLY_AUTHOR_NAME, body],
  });
}

// Public — toggle a like on a comment for a given visitor. Returns the new
// state so the caller doesn't need a second query to know what happened.
export async function toggleCommentLike(
  commentId: number,
  visitorId: string,
): Promise<{ liked: boolean; count: number }> {
  const existing = await db.execute({
    sql: `SELECT id FROM comment_likes WHERE comment_id = ? AND visitor_id = ?`,
    args: [commentId, visitorId],
  });

  if (existing.rows.length > 0) {
    await db.execute({
      sql: `DELETE FROM comment_likes WHERE comment_id = ? AND visitor_id = ?`,
      args: [commentId, visitorId],
    });
  } else {
    await db.execute({
      sql: `INSERT INTO comment_likes (comment_id, visitor_id) VALUES (?, ?)`,
      args: [commentId, visitorId],
    });
  }

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) AS count FROM comment_likes WHERE comment_id = ?`,
    args: [commentId],
  });

  return {
    liked: existing.rows.length === 0, // we just inserted if it wasn't there before
    count: Number(countResult.rows[0].count),
  };
}

// Admin — all pending (top-level only — replies are never pending) comments
// across all posts, oldest first, joined with post info
export async function getPendingComments(): Promise<PendingComment[]> {
  const result = await db.execute(`
    SELECT c.id, c.post_id, c.parent_id, c.name, c.body, c.approved, c.created_at,
           0 AS like_count, 0 AS liked_by_visitor,
           p.title AS post_title, p.slug AS post_slug
    FROM comments c
    JOIN posts p ON p.id = c.post_id
    WHERE c.approved = 0
    ORDER BY c.created_at ASC
  `);
  return result.rows.map(rowToPendingComment);
}

// Admin — approve a pending comment
export async function approveComment(id: number): Promise<void> {
  await db.execute({
    sql: `UPDATE comments SET approved = 1 WHERE id = ?`,
    args: [id],
  });
}

// Admin — reject (delete) a pending comment
export async function deleteComment(id: number): Promise<void> {
  await db.execute({
    sql: `DELETE FROM comments WHERE id = ?`,
    args: [id],
  });
}