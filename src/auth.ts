// src/auth.ts
import NextAuth, { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db"; // Your Drizzle DB instance
import { users, accounts, sessions, verificationTokens } from "./db/schema"; // Your Drizzle schema
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
  },
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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.email, credentials.email as string),
        });

        if (user && user.hashedPassword) { // Check if user and hashedPassword exist
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.hashedPassword // Compare with hashedPassword
          );

          if (isPasswordValid) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role, // Include role in the session
            };
          }
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

export async function signOutAndClearLocalStorage() {
  await signOut();
  localStorage.removeItem("playerId");
  localStorage.removeItem("playerName");
  localStorage.removeItem("teamId");
  localStorage.removeItem("gameId");
}
