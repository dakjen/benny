const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// when using middleware `hostname` and `port` might be different.
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);

  const io = new Server(httpServer);

  // Export the io instance
  module.exports.io = io;

  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on("disconnect", () => {
      console.log("user disconnected");
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
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
