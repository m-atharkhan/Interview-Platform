import { useEffect, useRef, useState } from "react";
import useWebRTC from "../hooks/useWebRTC";
import VideoTile from "./VideoTile";
import Whiteboard from "./Whiteboard";
import socket from "../socket/socket";
import {
  FaMicrophone, FaMicrophoneSlash,
  FaVideo, FaVideoSlash,
  FaDesktop, FaStopCircle,
  FaChalkboard, FaPhoneSlash,
  FaExpandAlt, FaCompressAlt,
  FaSearchPlus, FaSearchMinus,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function VideoPanel({ roomId, user, isApproved }) {
  const navigate = useNavigate();

  const {
    peers, localStream, screenStream,
    mediaState, joinRoom,
    toggleAudio, toggleVideo,
    startScreen, stopScreen,
    leaveRoom
  } = useWebRTC(roomId, user);

  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [collapsed,      setCollapsed]      = useState(false);
  const [zoomedId,       setZoomedId]       = useState(null); // socketId | "local" | null

  const [pos,     setPos]     = useState({ x: 16, y: 16 });
  const dragging  = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const onMouseDown = (e) => {
    if (e.target.closest("button") || e.target.closest("video")) return;
    dragging.current  = true;
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      setPos({
        x: dragStart.current.px + (e.clientX - dragStart.current.mx),
        y: dragStart.current.py + (e.clientY - dragStart.current.my),
      });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  /* ── join on approval ────────────────────────────────────────── */
  useEffect(() => {
    if (!isApproved) return;
    const delay = user?.role === "interviewer" ? 0 : 500;
    const timer = setTimeout(() => joinRoom(), delay);
    return () => { clearTimeout(timer); leaveRoom(); };
  }, [isApproved]); // eslint-disable-line

  /* ── whiteboard sync — open/close for everyone ───────────────── */
  const openWhiteboard = () => {
    setShowWhiteboard(true);
    socket.emit("whiteboard:open", { roomId });
  };

  const closeWhiteboard = () => {
    setShowWhiteboard(false);
    socket.emit("whiteboard:close", { roomId });
  };

  useEffect(() => {
    const onOpen  = () => setShowWhiteboard(true);
    const onClose = () => setShowWhiteboard(false);
    socket.on("whiteboard:open",  onOpen);
    socket.on("whiteboard:close", onClose);
    return () => {
      socket.off("whiteboard:open",  onOpen);
      socket.off("whiteboard:close", onClose);
    };
  }, []);

  /* ── need socket import ──────────────────────────────────────── */
  // already imported via useWebRTC indirectly — import directly here:

  const peerList   = [...peers.entries()];
  const totalTiles = 1 + peerList.length;

  const handleLeave = () => { leaveRoom(); navigate("/dashboard"); };

  const gridCls =
    totalTiles === 1 ? "grid-cols-1 w-64"      :
    totalTiles === 2 ? "grid-cols-2 w-[480px]" :
    totalTiles === 3 ? "grid-cols-3 w-[600px]" :
                       "grid-cols-2 w-[480px]";

  return (
    <>
      {/* ── zoomed video overlay ─────────────────────────────────── */}
      {zoomedId && (
        <div
          style={{ zIndex: 60 }}
          className="fixed inset-0 bg-black/90 flex items-center justify-center"
          onClick={() => setZoomedId(null)}
        >
          <div
            className="relative w-[80vw] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {zoomedId === "local" ? (
              <VideoTile
                stream={screenStream ?? localStream}
                label={`${user?.name ?? "You"} (you)`}
                muted={true}
                mediaState={mediaState}
                isScreen={!!screenStream}
              />
            ) : (
              (() => {
                const peer = peers.get(zoomedId);
                return peer ? (
                  <VideoTile
                    stream={peer.stream}
                    label={peer.userName}
                    muted={false}
                    mediaState={peer.state}
                  />
                ) : null;
              })()
            )}
            <button
              onClick={() => setZoomedId(null)}
              className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
            >
              <FaCompressAlt />
            </button>
          </div>
        </div>
      )}

      {/* ── floating draggable panel ──────────────────────────────── */}
      <div
        style={{ left: pos.x, top: pos.y, zIndex: 50 }}
        className="fixed select-none shadow-2xl rounded-2xl overflow-hidden bg-gray-950 border border-white/10 flex flex-col"
        onMouseDown={onMouseDown}
      >
        {/* header */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-900 cursor-grab active:cursor-grabbing">
          <span className="text-white/70 text-xs font-medium">
            📹 {totalTiles} participant{totalTiles !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-white/50 hover:text-white text-xs p-1"
          >
            {collapsed ? <FaExpandAlt /> : <FaCompressAlt />}
          </button>
        </div>

        {!collapsed && (
          <>
            {/* video grid */}
            <div className={`p-2 gap-2 grid ${gridCls}`}>

              {/* local tile */}
              <div className="relative group">
                <VideoTile
                  stream={screenStream ?? localStream}
                  label={`${user?.name ?? "You"} (you)`}
                  muted={true}
                  mediaState={mediaState}
                  isScreen={!!screenStream}
                />
                <button
                  onClick={() => setZoomedId("local")}
                  title="Zoom in"
                  className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-1 rounded-full text-xs"
                >
                  <FaSearchPlus />
                </button>
              </div>

              {/* remote tiles */}
              {peerList.map(([socketId, { stream, userName, state }]) => (
                <div key={socketId} className="relative group">
                  <VideoTile
                    stream={stream}
                    label={userName}
                    muted={false}
                    mediaState={state}
                  />
                  <button
                    onClick={() => setZoomedId(socketId)}
                    title="Zoom in"
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-1 rounded-full text-xs"
                  >
                    <FaSearchPlus />
                  </button>
                </div>
              ))}
            </div>

            {/* controls */}
            <div className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-900 border-t border-white/10">
              <ControlBtn
                active={mediaState.audio}
                activeIcon={FaMicrophone}
                inactiveIcon={FaMicrophoneSlash}
                activeClass="bg-white/10 hover:bg-white/20 text-white"
                inactiveClass="bg-red-500/80 hover:bg-red-500 text-white"
                onClick={toggleAudio}
                title={mediaState.audio ? "Mute" : "Unmute"}
              />
              <ControlBtn
                active={mediaState.video}
                activeIcon={FaVideo}
                inactiveIcon={FaVideoSlash}
                activeClass="bg-white/10 hover:bg-white/20 text-white"
                inactiveClass="bg-red-500/80 hover:bg-red-500 text-white"
                onClick={toggleVideo}
                title={mediaState.video ? "Stop camera" : "Start camera"}
              />
              <ControlBtn
                active={!mediaState.screen}
                activeIcon={FaDesktop}
                inactiveIcon={FaStopCircle}
                activeClass="bg-white/10 hover:bg-white/20 text-white"
                inactiveClass="bg-green-500/80 hover:bg-green-600 text-white"
                onClick={mediaState.screen ? stopScreen : startScreen}
                title={mediaState.screen ? "Stop sharing" : "Share screen"}
              />
              <button
                onClick={showWhiteboard ? closeWhiteboard : openWhiteboard}
                title="Whiteboard"
                className={`p-2 rounded-full text-sm transition-colors ${
                  showWhiteboard
                    ? "bg-amu-primary text-white"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                <FaChalkboard />
              </button>
              <button
                onClick={handleLeave}
                title="Leave"
                className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-sm"
              >
                <FaPhoneSlash />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── whiteboard overlay ────────────────────────────────────── */}
      {showWhiteboard && (
        <div
          style={{ zIndex: 49 }}
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeWhiteboard(); }}
        >
          <Whiteboard roomId={roomId} onClose={closeWhiteboard} />
        </div>
      )}
    </>
  );
}

function ControlBtn({ active, activeIcon: ActiveIcon, inactiveIcon: InactiveIcon, activeClass, inactiveClass, onClick, title }) {
  const Icon = active ? ActiveIcon : InactiveIcon;
  return (
    <button onClick={onClick} title={title} className={`p-2 rounded-full text-sm transition-colors ${active ? activeClass : inactiveClass}`}>
      <Icon />
    </button>
  );
}