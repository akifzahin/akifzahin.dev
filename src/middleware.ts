import { defineMiddleware } from "astro:middleware";
import { verifySessionToken, COOKIE_NAME } from "./lib/session";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  const isLoginRoute =
    pathname === "/admin/login" || pathname === "/api/admin/login";

  if (!isProtected || isLoginRoute) {
    return next();
  }

  const token = context.cookies.get(COOKIE_NAME)?.value;
  const valid = token ? await verifySessionToken(token) : false;

  if (!valid) {
    if (pathname.startsWith("/api/admin")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return context.redirect("/admin/login");
  }

  return next();
});
