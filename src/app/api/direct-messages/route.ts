import { db } from "@/db";
import { directMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamName = searchParams.get("teamName");

    if (!teamName) {
      return NextResponse.json(
        { message: "Team name is required." },
        { status: 400 }
      );
    }

    const messages = await db
      .select()
      .from(directMessages)
      .where(eq(directMessages.teamName, teamName))
      .orderBy(directMessages.createdAt);

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while fetching messages." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { sender, recipient, message, teamName } = await request.json();

    if (!sender || !recipient || !message || !teamName) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    const newMessage = await db
      .insert(directMessages)
      .values({
        sender,
        recipient,
        message,
        teamName,
      })
      .returning();

    return NextResponse.json(newMessage[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "An error occurred while sending the message." },
      { status: 500 }
    );
  }
}
