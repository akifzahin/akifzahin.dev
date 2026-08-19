import type { APIRoute } from "astro";
import { deleteDadMessage } from "../../../../lib/dadMessages";

export const prerender = false;

export const DELETE: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!id) {
    return new Response(JSON.stringify({ error: "Invalid id" }), {
      status: 400,
    });
  }

  await deleteDadMessage(id);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};