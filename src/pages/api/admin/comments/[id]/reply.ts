export const prerender = false;
import type { APIRoute } from "astro";
import { createReply } from "../../../../../lib/comments";

// POST /api/admin/comments/[id]/reply — admin-only, auto-approved
// Auth is handled by src/middleware.ts, which guards all /api/admin/* routes.
export const POST: APIRoute = async ({ params, request }) => {
  const parentId = Number(params.id);
  if (!parentId) {
    return new Response(JSON.stringify({ error: "Invalid comment id" }), {
      status: 400,
    });
  }

  const data = await request.json().catch(() => null);
  if (!data) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
    });
  }

  const { body } = data as { body?: string };
  const trimmedBody = (body ?? "").trim();

  if (!trimmedBody) {
    return new Response(JSON.stringify({ error: "Reply cannot be empty" }), {
      status: 400,
    });
  }

  if (trimmedBody.length > 2000) {
    return new Response(JSON.stringify({ error: "Reply is too long" }), {
      status: 400,
    });
  }

  try {
    await createReply(parentId, trimmedBody);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Comment not found" }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 201 });
};