import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // Import Clerk's auth

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || (session.sessionClaims?.publicMetadata as { role?: string })?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const allUsers = await db.select().from(users);

    return NextResponse.json(allUsers, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred." },
      { status: 500 }
    );
  }
}
