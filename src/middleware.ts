// src/middleware.ts
import { auth } from "@/auth"; // Import auth from your NextAuth.js configuration

export default auth((req: any) => {
  // Example: Protect /admin routes
  if (req.nextUrl.pathname.startsWith("/admin")) {
    // If not authenticated, redirect to login
    if (!req.auth) {
      const url = new URL("/login", req.nextUrl.origin);
      return Response.redirect(url);
    }
    // If authenticated, but not admin, redirect to unauthorized
    // This requires fetching user role from session, which is not directly available in middleware without custom logic
    // For now, we'll rely on the admin/layout.tsx to handle role-based access
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
