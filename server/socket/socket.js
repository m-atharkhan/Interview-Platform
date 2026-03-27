import { registerVideoHandlers } from "./videoSocket.js";

export default function setupSocket(io) {

  const roomParticipants = {};

  const addParticipant = (roomId, socketId, user) => {
    if (!roomParticipants[roomId]) roomParticipants[roomId] = [];
    const exists = roomParticipants[roomId].some((p) => p.userId === user._id);
    if (!exists) {
      roomParticipants[roomId].push({
        socketId,
        userId: user._id,
        name:   user.name,
        role:   user.role
      });
    }
  };

  const removeParticipant = (roomId, socketId) => {
    if (!roomParticipants[roomId]) return;
    roomParticipants[roomId] = roomParticipants[roomId].filter(
      (p) => p.socketId !== socketId
    );
  };

  const isParticipant = (roomId, userId) => {
    if (!roomParticipants[roomId]) return false;
    return roomParticipants[roomId].some((p) => p.userId === userId);
  };

  io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    socket.on("join-as-host", ({ roomId, user }) => {
      socket.join(roomId);
      addParticipant(roomId, socket.id, user);
      io.to(roomId).emit("participants", roomParticipants[roomId]);
    });

    socket.on("request-join", ({ roomId, user }) => {
      if (isParticipant(roomId, user._id)) {
        socket.join(roomId);
        socket.emit("join-approved");
        return;
      }
      io.to(roomId).emit("join-request", { socketId: socket.id, user });
    });

    socket.on("approve-join", ({ socketId, roomId, user }) => {
      const target = io.sockets.sockets.get(socketId);
      if (!target) return;
      target.join(roomId);
      addParticipant(roomId, socketId, user);
      target.emit("join-approved");
      io.to(roomId).emit("participants", roomParticipants[roomId]);
    });

    socket.on("reject-join", ({ socketId }) => {
      const target = io.sockets.sockets.get(socketId);
      if (target) target.emit("join-rejected");
    });

    socket.on("leave-room", ({ roomId }) => {
      removeParticipant(roomId, socket.id);
      socket.leave(roomId);
      io.to(roomId).emit("participants", roomParticipants[roomId]);
    });

    socket.on("end-interview", ({ roomId }) => {
  // Broadcast to everyone in the room that it's over
      io.to(roomId).emit("interview-ended");
    });

    socket.on("code-change", ({ roomId, code }) => {
      socket.to(roomId).emit("code-update", code);
    });

    socket.on("language-change", ({ roomId, language }) => {
      socket.to(roomId).emit("language-update", language);
    });

    socket.on("cursor-change", ({ roomId, position, user }) => {
      socket.to(roomId).emit("cursor-update", { position, user });
    });

    socket.on("select-question", ({ roomId, question }) => {
      socket.to(roomId).emit("question-update", question);
    });

    registerVideoHandlers(io, socket);

    socket.on("disconnect", () => {
      for (const roomId in roomParticipants) {
        const wasMember = roomParticipants[roomId]?.some(
          (p) => p.socketId === socket.id
        );
        removeParticipant(roomId, socket.id);
        if (wasMember) {
          io.to(roomId).emit("participants", roomParticipants[roomId]);
        }
      }
    });

  });
}