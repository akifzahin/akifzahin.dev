import type { APIRoute } from "astro";
import { createSessionToken, COOKIE_NAME } from "../../../lib/session";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const { password } = await request.json();

  if (password !== import.meta.env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: "Invalid password" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = await createSessionToken();

  cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};