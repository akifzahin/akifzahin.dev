import type { APIRoute } from "astro";
import { db } from "../../../../lib/db";

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const postId = params.id;
  const visitorId = url.searchParams.get("visitor_id");

  const totalResult = await db.execute({
    sql: "SELECT COALESCE(SUM(count), 0) as total FROM claps WHERE post_id = ?",
    args: [postId!],
  });
  const total = totalResult.rows[0].total as number;

  let mine = 0;
  if (visitorId) {
    const mineResult = await db.execute({
      sql: "SELECT count FROM claps WHERE post_id = ? AND visitor_id = ?",
      args: [postId!, visitorId],
    });
    mine = mineResult.rows.length > 0 ? (mineResult.rows[0].count as number) : 0;
  }

  return new Response(JSON.stringify({ total, mine }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ params, request }) => {
  const postId = params.id;
  const { visitor_id } = await request.json();

  if (!visitor_id) {
    return new Response(JSON.stringify({ error: "Missing visitor_id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const existing = await db.execute({
    sql: "SELECT count FROM claps WHERE post_id = ? AND visitor_id = ?",
    args: [postId!, visitor_id],
  });

  const currentCount = existing.rows.length > 0 ? (existing.rows[0].count as number) : 0;

  if (currentCount >= 50) {
    const totalResult = await db.execute({
      sql: "SELECT COALESCE(SUM(count), 0) as total FROM claps WHERE post_id = ?",
      args: [postId!],
    });
    return new Response(
      JSON.stringify({ total: totalResult.rows[0].total, mine: 50, capped: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const newCount = currentCount + 1;

  await db.execute({
    sql: `INSERT INTO claps (post_id, visitor_id, count)
          VALUES (?, ?, 1)
          ON CONFLICT(post_id, visitor_id)
          DO UPDATE SET count = ?, updated_at = datetime('now')`,
    args: [postId!, visitor_id, newCount],
  });

  const totalResult = await db.execute({
    sql: "SELECT COALESCE(SUM(count), 0) as total FROM claps WHERE post_id = ?",
    args: [postId!],
  });

  return new Response(
    JSON.stringify({ total: totalResult.rows[0].total, mine: newCount, capped: false }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};