// src/auth.ts
import NextAuth, { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
// import { DrizzleAdapter } from "@auth/drizzle-adapter";
// import { db } from "./db"; // Your Drizzle DB instance
// import { users, accounts, sessions, verificationTokens } from "./db/schema"; // Your Drizzle schema
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (credentials?.email === "dakjen@example.com" && credentials?.password === "adminpassword") {
          return {
            id: "1",
            name: "dakjen",
            email: "dakjen@example.com",
            role: "admin",
          };
        }
        return null;
      },
    }),
  ],
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
