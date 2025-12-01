import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware(); // No options passed directly

export const config = {
  matcher: [
    // Public routes that don't require authentication
    "/",
    "/login",
    "/signup",
    "/unauthorized",
    // Match all routes except static files and _next
    "/((?!.+\\.[\\w]+$|_next).*)",
    // Match API routes
    "/(api|trpc)(.*)",
  ],
};
