const express = require("express");
const app = express();

const { ExpressPeerServer } = require("peer");

const http = require("http");

const server = http.createServer(app);
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/peerjs",
});

const { Server } = require("socket.io");
const io = new Server(server);

const path = require("path");
const { v4: uuidV4 } = require("uuid");
const PORT = process.env.PORT || 3000;
const room = {};

app.use("/", peerServer);
app.use(express.static("public"));

app.get("/", (req, res) => {
  const roomId = uuidV4();
  res.redirect("/room/" + roomId);
});

app.get("/room/:roomid", (req, res) => {
  if (room[req.params.roomid]?.length >= 2) {
    res.send("<h1>Maaf Room Sudah Penuh</h1>");
  } else {
    res.sendFile(path.resolve("./views/index.html"));
  }
});

io.on("connection", (socket) => {
  socket.on("new-user", ({ roomId, peerId }) => {
    socket.join(roomId);
    if (room[roomId]) {
      socket.emit("another-user", room[roomId][0]);
      room[roomId].push(peerId);
    } else {
      room[roomId] = [peerId];
    }
  });
});

server.listen(PORT, () => console.log("Server is Running..."));
