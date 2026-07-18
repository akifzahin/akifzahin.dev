export const prerender = false;
import type { APIRoute } from "astro";
import { toggleCommentLike } from "../../../../lib/comments";

// POST /api/comments/[id]/like — public, toggles a like for this visitor
export const POST: APIRoute = async ({ params, request }) => {
  const commentId = Number(params.id);
  if (!commentId) {
    return new Response(JSON.stringify({ error: "Invalid comment id" }), {
      status: 400,
    });
  }

  const data = await request.json().catch(() => null);
  const visitorId = (data as { visitor_id?: string } | null)?.visitor_id;

  if (!visitorId || typeof visitorId !== "string") {
    return new Response(JSON.stringify({ error: "Missing visitor_id" }), {
      status: 400,
    });
  }

  const result = await toggleCommentLike(commentId, visitorId);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};