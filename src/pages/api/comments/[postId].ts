export const prerender = false;
import type { APIRoute } from "astro";
import { getApprovedComments, createComment } from "../../../lib/comments";
import { containsBlockedWord } from "../../../lib/blocklist";

// GET /api/comments/[postId] — public, approved comments only.
// Accepts an optional ?visitor_id= query param so each comment can report
// whether THIS visitor already liked it (for correct heart icon state on load).
export const GET: APIRoute = async ({ params, url }) => {
  const postId = Number(params.postId);
  if (!postId) {
    return new Response(JSON.stringify({ error: "Invalid post id" }), {
      status: 400,
    });
  }

  const visitorId = url.searchParams.get("visitor_id") ?? undefined;
  const comments = await getApprovedComments(postId, visitorId);

  return new Response(JSON.stringify(comments), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

// POST /api/comments/[postId] — public, submit a new comment
export const POST: APIRoute = async ({ params, request }) => {
  const postId = Number(params.postId);
  if (!postId) {
    return new Response(JSON.stringify({ error: "Invalid post id" }), {
      status: 400,
    });
  }

  const data = await request.json().catch(() => null);
  if (!data) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
    });
  }

  const { name, body, botcheck } = data as {
    name?: string;
    body?: string;
    botcheck?: string;
  };

  if (botcheck) {
    return new Response(JSON.stringify({ error: "Submission rejected" }), {
      status: 400,
    });
  }

  const trimmedName = (name ?? "").trim();
  const trimmedBody = (body ?? "").trim();

  if (!trimmedName || !trimmedBody) {
    return new Response(
      JSON.stringify({ error: "Name and comment are required" }),
      { status: 400 },
    );
  }

  if (trimmedName.length > 80) {
    return new Response(JSON.stringify({ error: "Name is too long" }), {
      status: 400,
    });
  }

  if (trimmedBody.length > 2000) {
    return new Response(JSON.stringify({ error: "Comment is too long" }), {
      status: 400,
    });
  }

  if (containsBlockedWord(trimmedName) || containsBlockedWord(trimmedBody)) {
    return new Response(
      JSON.stringify({
        error:
          "Your comment contains language that isn't allowed — please revise and resubmit.",
      }),
      { status: 400 },
    );
  }

  await createComment(postId, trimmedName, trimmedBody);

  return new Response(
    JSON.stringify({ success: true, message: "Comment submitted — pending review." }),
    { status: 201 },
  );
};