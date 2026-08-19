import type { APIRoute } from "astro";
import { getDadMessages, createDadMessage } from "../../../lib/dadMessages";

export const prerender = false;

export const GET: APIRoute = async () => {
  const messages = await getDadMessages();

  return new Response(JSON.stringify(messages), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json().catch(() => null);
  if (!data) {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
    });
  }

  const { type, body, image_url } = data as {
    type?: "text" | "image";
    body?: string;
    image_url?: string;
  };

  if (type !== "text" && type !== "image") {
    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400,
    });
  }

  const trimmedBody = (body ?? "").trim() || null;

  if (type === "text" && !trimmedBody) {
    return new Response(JSON.stringify({ error: "Message body required" }), {
      status: 400,
    });
  }

  if (type === "image" && !image_url) {
    return new Response(JSON.stringify({ error: "image_url required" }), {
      status: 400,
    });
  }

  const id = await createDadMessage(type, trimmedBody, image_url ?? null);

  return new Response(JSON.stringify({ success: true, id }), { status: 201 });
};