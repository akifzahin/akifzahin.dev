import { db } from "./db";

export interface Comment {
  id: number;
  post_id: number;
  name: string;
  body: string;
  approved: boolean;
  created_at: string;
}

export interface PendingComment extends Comment {
  post_title: string;
  post_slug: string;
}

function rowToComment(row: any): Comment {
  return {
    id: row.id,
    post_id: row.post_id,
    name: row.name,
    body: row.body,
    approved: row.approved === 1,
    created_at: row.created_at,
  };
}

function rowToPendingComment(row: any): PendingComment {
  return {
    ...rowToComment(row),
    post_title: row.post_title,
    post_slug: row.post_slug,
  };
}

// Public — approved comments for a post, oldest first
export async function getApprovedComments(postId: number): Promise<Comment[]> {
  const result = await db.execute({
    sql: `SELECT id, post_id, name, body, approved, created_at FROM comments
          WHERE post_id = ? AND approved = 1
          ORDER BY created_at ASC`,
    args: [postId],
  });
  return result.rows.map(rowToComment);
}

// Public — insert a new comment, always pending (approved = 0)
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

// Admin — all pending comments across all posts, oldest first, joined with post info
export async function getPendingComments(): Promise<PendingComment[]> {
  const result = await db.execute(`
    SELECT c.id, c.post_id, c.name, c.body, c.approved, c.created_at,
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