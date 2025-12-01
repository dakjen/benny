import NextAuth from "next-auth";
import { authOptions } from "./auth.config";

export default NextAuth(authOptions).auth;

export const config = { matcher: ["/admin/:path*"] };
