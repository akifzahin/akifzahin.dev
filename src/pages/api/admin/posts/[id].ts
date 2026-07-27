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

export const GET: APIRoute = async ({ params }) => {
  const id = params.id;

  const result = await db.execute({
    sql: "SELECT * FROM posts WHERE id = ?",
    args: [id!],
  });

  if (result.rows.length === 0) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const post = result.rows[0];

  return new Response(
    JSON.stringify({
      id: post.id,
      slug: post.slug,
      title: post.title,
      description: post.description,
      content_json: JSON.parse(post.content_json as string),
      cover_image: post.cover_image,
      tags: post.tags_json ? JSON.parse(post.tags_json as string) : [],
      draft: post.draft,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
};

export const PUT: APIRoute = async ({ params, request }) => {
  const id = params.id;
  const body = await request.json();

  const { title, description, content_json, cover_image, tags } = body;

  const current = await db.execute({
    sql: "SELECT slug, draft FROM posts WHERE id = ?",
    args: [id!],
  });

  if (current.rows.length === 0) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  let slug = current.rows[0].slug as string;

  // Only re-slugify while still a draft — don't move a URL once published
  if (current.rows[0].draft === 1 && title?.trim()) {
    const baseSlug = slugify(title) || "untitled";
    let candidate = baseSlug;
    let suffix = 1;

    while (true) {
      const existing = await db.execute({
        sql: "SELECT id FROM posts WHERE slug = ? AND id != ?",
        args: [candidate, id!],
      });
      if (existing.rows.length === 0) break;
      suffix++;
      candidate = `${baseSlug}-${suffix}`;
    }

    slug = candidate;
  }

  await db.execute({
    sql: `UPDATE posts
          SET title = ?, slug = ?, description = ?, content_json = ?, cover_image = ?, tags_json = ?, updated_at = datetime('now')
          WHERE id = ?`,
    args: [
      title ?? "",
      slug,
      description ?? "",
      JSON.stringify(content_json ?? {}),
      cover_image ?? null,
      JSON.stringify(tags ?? []),
      id!,
    ],
  });

  return new Response(JSON.stringify({ success: true, slug }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id;

  await db.execute({
    sql: "DELETE FROM posts WHERE id = ?",
    args: [id!],
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
