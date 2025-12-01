import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // Import Clerk's auth

type RouteContext = { params: Promise<{ id: string }> }; // Explicitly define params as a Promise

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session || (session.sessionClaims?.publicMetadata as { role?: string })?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params; // Await the promise
    const { role } = await request.json();

    if (!role) {
      return NextResponse.json(
        { message: "Role is required" },
        { status: 400 }
      );
    }

    await db.update(users).set({ role }).where(eq(users.id, parseInt(id)));

    return NextResponse.json(
      { message: "User role updated successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred." },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    if (!session || (session.sessionClaims?.publicMetadata as { role?: string })?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params; // Await the promise

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)));

    if (user.length === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user[0], { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred." },
      { status: 500 }
    );
  }
}
