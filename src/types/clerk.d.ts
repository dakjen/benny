// src/types/clerk.d.ts
import { UserPublicMetadata } from "@clerk/nextjs/server";

declare module "@clerk/nextjs/server" {
  interface UserPublicMetadata {
    role?: "admin" | "user"; // Add the role property
  }
}