import type { APIRoute } from "astro";
import { db } from "../../../../lib/db";

export const prerender = false;

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

  await db.execute({
    sql: `UPDATE posts
          SET title = ?, description = ?, content_json = ?, cover_image = ?, tags_json = ?, updated_at = datetime('now')
          WHERE id = ?`,
    args: [
      title ?? "",
      description ?? "",
      JSON.stringify(content_json ?? {}),
      cover_image ?? null,
      JSON.stringify(tags ?? []),
      id!,
    ],
  });

  return new Response(JSON.stringify({ success: true }), {
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
