export function registerVideoHandlers(io, socket) {

  socket.on("video:join", ({ roomId, userId, userName }) => {
    socket.data.userName = userName;
    socket.data.userId   = userId;
    socket.data.roomId   = roomId;

    socket.join(roomId);

    const room   = io.sockets.adapter.rooms.get(roomId);
    const others = room ? [...room].filter((sid) => sid !== socket.id) : [];

    console.log(`[video] ${userName} joined ${roomId} | peers: ${others.length}`);

    socket.emit("video:all-peers", {
      peers: others.map((socketId) => {
        const s = io.sockets.sockets.get(socketId);
        return { socketId, userName: s?.data?.userName ?? "User" };
      })
    });

    socket.to(roomId).emit("video:user-joined", { socketId: socket.id, userId, userName });
  });

  socket.on("video:signal", ({ to, signal }) => {
    io.to(to).emit("video:signal", { from: socket.id, signal });
  });

  socket.on("video:media-state", ({ roomId, state }) => {
    socket.to(roomId).emit("video:media-state", { socketId: socket.id, state });
  });

  socket.on("whiteboard:draw",  ({ roomId, delta }) => {
    socket.to(roomId).emit("whiteboard:draw", { delta });
  });

  socket.on("whiteboard:clear", ({ roomId }) => {
    socket.to(roomId).emit("whiteboard:clear");
  });

  // sync open/close for all participants
  socket.on("whiteboard:open",  ({ roomId }) => {
    socket.to(roomId).emit("whiteboard:open");
  });

  socket.on("whiteboard:close", ({ roomId }) => {
    socket.to(roomId).emit("whiteboard:close");
  });

  socket.on("disconnect", () => {
    const roomId = socket.data?.roomId;
    if (roomId) socket.to(roomId).emit("video:user-left", { socketId: socket.id });
  });
}