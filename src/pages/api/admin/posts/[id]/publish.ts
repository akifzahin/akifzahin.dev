import type { APIRoute } from "astro";
import { db } from "../../../../../lib/db";

export const prerender = false;

export const POST: APIRoute = async ({ params }) => {
  const id = params.id;

  const current = await db.execute({
    sql: "SELECT draft FROM posts WHERE id = ?",
    args: [id!],
  });

  if (current.rows.length === 0) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isDraft = current.rows[0].draft === 1;

  if (isDraft) {
    // Publishing: set published_at only if it's never been published before
    await db.execute({
      sql: `UPDATE posts
            SET draft = 0,
                published_at = COALESCE(published_at, datetime('now')),
                updated_at = datetime('now')
            WHERE id = ?`,
      args: [id!],
    });
  } else {
    // Unpublishing: revert to draft, keep published_at as history (don't null it)
    await db.execute({
      sql: `UPDATE posts
            SET draft = 1, updated_at = datetime('now')
            WHERE id = ?`,
      args: [id!],
    });
  }

  return new Response(
    JSON.stringify({ success: true, draft: isDraft ? 0 : 1 }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};