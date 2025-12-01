import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt"; // Already imported
import { Session } from "next-auth"; // Added import for Session

export const authOptions = { // Removed explicit type annotation
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials || !credentials.email || typeof credentials.email !== 'string' || !credentials.password || typeof credentials.password !== 'string') {
          return null;
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string));

        if (user.length === 0) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user[0].password
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user[0].id.toString(),
          name: user[0].name,
          email: user[0].email,
          role: user[0].role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt" as const, // Explicitly define as string literal
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) { // Explicitly typed token and user
      if (user) {
        token.id = user.id;
        // @ts-ignore
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) { // Explicitly typed session and token
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id;
        // @ts-ignore
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
