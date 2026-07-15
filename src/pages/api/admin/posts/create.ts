import type { APIRoute } from "astro";
import { db } from "../../../../lib/db";

export const prerender = false;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const title = body.title?.trim() || "Untitled";

  const baseSlug = slugify(title) || "untitled";
  let slug = baseSlug;
  let suffix = 1;

  // Ensure slug uniqueness — append -2, -3, etc. if needed
  while (true) {
    const existing = await db.execute({
      sql: "SELECT id FROM posts WHERE slug = ?",
      args: [slug],
    });
    if (existing.rows.length === 0) break;
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }

  const result = await db.execute({
    sql: `INSERT INTO posts (slug, title, description, content_json, cover_image, tags_json, draft)
          VALUES (?, ?, '', '{}', NULL, '[]', 1)`,
    args: [slug, title],
  });

  return new Response(
    JSON.stringify({ id: Number(result.lastInsertRowid), slug }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};