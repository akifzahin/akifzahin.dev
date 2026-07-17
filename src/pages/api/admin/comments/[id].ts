export const prerender = false;
import type { APIRoute } from "astro";
import { approveComment, deleteComment } from "../../../../lib/comments";

// Auth is handled by src/middleware.ts, which guards all /api/admin/* routes.

// POST /api/admin/comments/[id] — approve
export const POST: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: "Invalid comment id" }), {
      status: 400,
    });
  }

  await approveComment(id);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

// DELETE /api/admin/comments/[id] — reject
export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: "Invalid comment id" }), {
      status: 400,
    });
  }

  await deleteComment(id);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};