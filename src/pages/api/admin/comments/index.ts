export const prerender = false;
import type { APIRoute } from "astro";
import { getPendingComments } from "../../../../lib/comments"

// GET /api/admin/comments — pending queue only
// Auth is handled by src/middleware.ts, which guards all /api/admin/* routes.
export const GET: APIRoute = async () => {
  const comments = await getPendingComments();

  return new Response(JSON.stringify(comments), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};