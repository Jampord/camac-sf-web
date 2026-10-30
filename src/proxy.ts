import { NextResponse, type NextRequest } from "next/server";

// Optimistic check: no session cookie -> straight to sign-in, before any admin HTML is sent.
// Without this, the static admin layout (header, nav, "Events") streams first and flashes on
// screen until requireAdmin() redirects inside <Suspense>.
//
// This is NOT the security check. A cookie can be expired, forged or belong to someone no
// longer on the allowlist; requireAdmin() in every admin page and Server Action still decides.

// Auth.js session cookie: "__Secure-" prefix on HTTPS, plain on http://localhost.
// Large sessions are split into chunks named "<name>.0", "<name>.1", ...
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name }) => SESSION_COOKIES.some((base) => name === base || name.startsWith(`${base}.`)));
}

export function proxy(request: NextRequest) {
  if (hasSessionCookie(request)) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/sign-in", request.url));
}

export const config = {
  // Every admin route except the sign-in page itself (else it would redirect to itself).
  matcher: ["/admin", "/admin/((?!sign-in).*)"],
};
