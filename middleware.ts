import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const userId = req.cookies.get("userId")?.value;

  // Alle geschützten Routen (nur eingeloggte User)
  const protectedRoutes = ["/asdf"];
  if (protectedRoutes.some((r) => req.nextUrl.pathname.startsWith(r))) {
    if (!userId) {
      // redirect zu deiner Login-Seite
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Alles andere erlauben
  return NextResponse.next();
}

export const config = {
  matcher:
    [
        "/asdf/:path*",
    ],
};
