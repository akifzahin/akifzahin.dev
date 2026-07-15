import type { APIRoute } from "astro";
import { db } from "../../../lib/db";

export const prerender = false;

export const GET: APIRoute = async () => {
  const result = await db.execute(
    "SELECT id, slug, title, description, cover_image, draft, created_at, updated_at, published_at FROM posts ORDER BY updated_at DESC"
  );

  return new Response(JSON.stringify(result.rows), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};