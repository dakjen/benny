// src/middleware.ts
import { auth } from "@/auth"; // Import auth from your NextAuth.js configuration

export default auth((req: any) => {
  console.log("middleware", req.nextUrl.pathname);
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
