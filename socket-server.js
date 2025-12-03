const { createServer } = require("http");
const { Server } = require("socket.io");

const port = process.env.PORT || 3001; // Use a different port for the socket server

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_WEB_URL || "*", // Allow connections from your Next.js frontend
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("a user connected to socket server");

  socket.on("disconnect", () => {
    console.log("user disconnected from socket server");
  });

  // Example: Join a room for a specific game or team
  socket.on("joinRoom", ({ gameId, teamId }) => {
    if (gameId) {
      socket.join(`game-${gameId}`);
      console.log(`User joined game room: game-${gameId}`);
    }
    if (teamId) {
      socket.join(`team-${teamId}`);
      console.log(`User joined team room: team-${teamId}`);
    }
  });

  // Example: Leave a room
  socket.on("leaveRoom", ({ gameId, teamId }) => {
    if (gameId) {
      socket.leave(`game-${gameId}`);
      console.log(`User left game room: game-${gameId}`);
    }
    if (teamId) {
      socket.leave(`team-${teamId}`);
      console.log(`User left team room: team-${teamId}`);
    }
  });

  // Handle messages from clients and broadcast them
  socket.on("sendMessage", (messageData) => {
    console.log("Received message:", messageData);
    // Broadcast to the relevant room (team or game)
    if (messageData.type === "team" && messageData.teamId) {
      io.to(`team-${messageData.teamId}`).emit("message", messageData);
    } else if (messageData.type === "game" && messageData.gameId) {
      io.to(`game-${messageData.gameId}`).emit("message", messageData);
    } else {
      // If no specific room, broadcast to all connected clients (e.g., for admin messages)
      io.emit("message", messageData);
    }
  });
});

httpServer
  .once("error", (err) => {
    console.error("Socket server error:", err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`> Socket server ready on port ${port}`);
  });

// Export the io instance for use in other files if needed (e.g., API routes)
module.exports = io;
