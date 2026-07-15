import type { APIRoute } from "astro";
import { put } from "@vercel/blob";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const blob = await put(file.name, file, {
    access: "public",
    addRandomSuffix: true,
    token: import.meta.env.BLOB_READ_WRITE_TOKEN,
  });

  return new Response(JSON.stringify({ url: blob.url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};