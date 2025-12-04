import { db } from "@/db";
import { users } from "@/db/schema";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/auth";

export const dynamic = 'force-dynamic'; // Opt out of static rendering

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
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
