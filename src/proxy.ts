// src/proxy.ts
import { withAuth } from "next-auth/middleware";
import { authOptions } from "@/auth";

export default withAuth(
  async function middleware(req) {
    const url = req.nextUrl.pathname;
    const isAdminRoute = url.startsWith("/admin");

    if (isAdminRoute && req.nextauth.token?.role !== "admin") {
      return Response.redirect(new URL("/unauthorized", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // This is called before the middleware function
        // If this returns false, the middleware function will not be called
        // and the user will be redirected to the sign-in page
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
