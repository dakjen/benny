import { NextResponse } from "next/server";

// Access the globally stored io instance
const io = globalThis.io;

export async function POST(request: Request) {
  try {
    const { message, gameId, teamId, type } = await request.json();

    if (!message) {
      return NextResponse.json({ message: "Message content is required." }, { status: 400 });
    }

    // Emit the message using socket.io
    if (type === "team" && teamId) {
      io.to(`team-${teamId}`).emit("message", message);
    } else if (type === "game" && gameId) {
      io.to(`game-${gameId}`).emit("message", message);
    } else {
      // Fallback to emitting to all connected clients if no specific room
      io.emit("message", message);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error emitting message via socket:", error);
    return NextResponse.json(
      { message: "An error occurred while emitting message." },
      { status: 500 }
    );
  }
}
