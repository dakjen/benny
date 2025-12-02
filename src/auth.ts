// src/auth.ts
import NextAuth, { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
// import { DrizzleAdapter } from "@auth/drizzle-adapter";
// import { db } from "./db"; // Your Drizzle DB instance
// import { users, accounts, sessions, verificationTokens } from "./db/schema"; // Your Drizzle schema
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  // adapter: DrizzleAdapter(db, {
  //   usersTable: users,
  //   accountsTable: accounts,
  //   sessionsTable: sessions,
  //   verificationTokensTable: verificationTokens,
  // }),
  // session: {
  //   strategy: "jwt",
  // },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/login", // Error code passed in query string as ?error=
    verifyRequest: "/verify-request", // (used for check email message)
    newUser: "/signup", // New users will be directed here on first sign in (leave this out if you want to redirect to the default start page)
  },
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
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
