import { useEffect, useRef, useState, useCallback } from "react";
import socket from "../socket/socket";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302"  },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ]
};

export default function useWebRTC(roomId, user) {
  const [localStream,  setLocalStream]  = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [peers,        setPeers]        = useState(new Map());
  const [mediaState,   setMediaState]   = useState({ audio: true, video: true, screen: false });

  const pcsRef                = useRef(new Map());
  const localStreamRef        = useRef(null);
  const userNamesRef          = useRef(new Map());
  const screenStreamRef       = useRef(null);
  const iceCandidateBufferRef = useRef(new Map());

  const emitMediaState = useCallback((state) => {
    socket.emit("video:media-state", { roomId, state });
  }, [roomId]);

  const removePeer = useCallback((socketId) => {
    const pc = pcsRef.current.get(socketId);
    if (pc) pc.close();
    pcsRef.current.delete(socketId);
    iceCandidateBufferRef.current.delete(socketId);
    setPeers((prev) => { const n = new Map(prev); n.delete(socketId); return n; });
  }, []);

  /* ── update peer stream in state ────────────────────────────── */
const setPeerStream = useCallback((socketId, remoteStream) => {
  const userName = userNamesRef.current.get(socketId) ?? "User";
  // store the raw stream — do NOT wrap in new MediaStream()
  setPeers((prev) => {
    const next  = new Map(prev);
    const entry = next.get(socketId);
    next.set(socketId, {
      stream:   remoteStream,
      userName: entry?.userName ?? userName,
      state:    entry?.state ?? { audio: true, video: true, screen: false }
    });
    return next;
  });
}, []);

  const createPC = useCallback((socketId, initiator) => {
    if (pcsRef.current.has(socketId)) {
      pcsRef.current.get(socketId).close();
      pcsRef.current.delete(socketId);
    }

    console.log(`createPC | ${socketId} | initiator=${initiator} | stream=${!!localStreamRef.current}`);

    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcsRef.current.set(socketId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit("video:signal", {
          to:     socketId,
          signal: { type: "candidate", candidate }
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE [${socketId}]:`, pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") removePeer(socketId);
    };

    // accumulate tracks — ontrack fires once per track, not once per stream
const incomingTracks = new Map(); // kind → track

pc.ontrack = ({ track, streams }) => {
  console.log(`✅ ontrack from ${socketId} | kind=${track.kind} | readyState=${track.readyState}`);

  incomingTracks.set(track.kind, track);

  // build a fresh MediaStream from all accumulated tracks
  const combined = new MediaStream([...incomingTracks.values()]);

  // attach to a dedicated stream held in a ref so VideoTile always gets it
  setPeerStream(socketId, combined);

  // when track becomes live, force re-attach
  track.onunmute = () => {
    console.log(`Track unmuted: ${track.kind} from ${socketId}`);
    const updated = new MediaStream([...incomingTracks.values()]);
    setPeerStream(socketId, updated);
  };
};

    if (initiator) {
      pc.onnegotiationneeded = () => {
        if (pc.signalingState !== "stable") return;
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            console.log(`Sending offer to ${socketId}`);
            socket.emit("video:signal", {
              to:     socketId,
              signal: { type: pc.localDescription.type, sdp: pc.localDescription.sdp }
            });
          })
          .catch(console.error);
      };
    }

    return pc;
  }, [removePeer, setPeerStream]);

  const handleSignal = useCallback(async ({ from, signal }) => {
    console.log(`Signal from ${from}:`, signal.type ?? "candidate");

    let pc = pcsRef.current.get(from);
    if (!pc) pc = createPC(from, false);

    try {
      if (signal.type === "offer") {
        // FIX: if already stable with a remote desc, ignore duplicate offer
        if (pc.signalingState === "stable" && pc.remoteDescription?.type) {
          console.log(`Ignoring duplicate offer from ${from}`);
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription({
          type: signal.type,
          sdp:  signal.sdp
        }));

        const buffered = iceCandidateBufferRef.current.get(from) ?? [];
        for (const c of buffered) await pc.addIceCandidate(c).catch(console.warn);
        iceCandidateBufferRef.current.delete(from);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log(`Sending answer to ${from}`);
        socket.emit("video:signal", {
          to:     from,
          signal: { type: pc.localDescription.type, sdp: pc.localDescription.sdp }
        });
      }
      else if (signal.type === "answer") {
        // FIX: ignore answer if already stable (glare condition)
        if (pc.signalingState === "stable") {
          console.log(`Ignoring answer from ${from} — already stable`);
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription({
          type: signal.type,
          sdp:  signal.sdp
        }));

        const buffered = iceCandidateBufferRef.current.get(from) ?? [];
        for (const c of buffered) await pc.addIceCandidate(c).catch(console.warn);
        iceCandidateBufferRef.current.delete(from);
      }
      else if (signal.type === "candidate") {
        if (pc.remoteDescription?.type) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } else {
          console.log(`Buffering ICE candidate from ${from}`);
          const existing = iceCandidateBufferRef.current.get(from) ?? [];
          iceCandidateBufferRef.current.set(from, [
            ...existing,
            new RTCIceCandidate(signal.candidate)
          ]);
        }
      }
    } catch (err) {
      console.warn("Signal handling error:", err.message);
    }
  }, [createPC]);

  useEffect(() => {
    const onAllPeers = ({ peers: existingPeers }) => {
      console.log("video:all-peers →", existingPeers);
      existingPeers.forEach(({ socketId, userName }) => {
        if (userName) userNamesRef.current.set(socketId, userName);
        createPC(socketId, true);
      });
    };

    const onUserJoined = ({ socketId, userName }) => {
      console.log("video:user-joined →", socketId, userName);
      if (userName) userNamesRef.current.set(socketId, userName);
      createPC(socketId, true);
    };

    const onMediaState = ({ socketId, state }) => {
      setPeers((prev) => {
        const next  = new Map(prev);
        const entry = next.get(socketId);
        if (entry) next.set(socketId, { ...entry, state });
        return next;
      });
    };

    const onUserLeft = ({ socketId }) => {
      console.log("video:user-left →", socketId);
      removePeer(socketId);
    };

    socket.on("video:all-peers",   onAllPeers);
    socket.on("video:user-joined", onUserJoined);
    socket.on("video:signal",      handleSignal);
    socket.on("video:media-state", onMediaState);
    socket.on("video:user-left",   onUserLeft);

    return () => {
      socket.off("video:all-peers",   onAllPeers);
      socket.off("video:user-joined", onUserJoined);
      socket.off("video:signal",      handleSignal);
      socket.off("video:media-state", onMediaState);
      socket.off("video:user-left",   onUserLeft);
    };
  }, [createPC, handleSignal, removePeer]);

  const joinRoom = useCallback(async (delayMs = 0) => {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: true
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      pcsRef.current.forEach((pc) => {
      const existingSenders = pc.getSenders().map((s) => s.track);
      stream.getTracks().forEach((track) => {
        if (!existingSenders.includes(track)) {
          pc.addTrack(track, stream);
        }
      });
    });
      console.log("✅ Got local stream");
    } catch (err) {
      console.warn("⚠️ Camera/mic denied:", err.message);
    }

    socket.emit("video:join", {
      roomId,
      userId:   user?._id,
      userName: user?.name ?? "Anon"
    });
  }, [roomId, user]);

  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    const next = { ...mediaState, audio: !mediaState.audio };
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = next.audio));
    setMediaState(next);
    emitMediaState(next);
  }, [mediaState, emitMediaState]);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const next = { ...mediaState, video: !mediaState.video };
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = next.video));
    setMediaState(next);
    emitMediaState(next);
  }, [mediaState, emitMediaState]);

  /* ── startScreen ─────────────────────────────────────────────────
     FIX: renegotiate the peer connection instead of just replacing
     the track — this ensures the remote side gets the new stream
  ─────────────────────────────────────────────────────────────── */
  const startScreen = useCallback(async () => {
    try {
      const screen      = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const screenTrack = screen.getVideoTracks()[0];
      screenStreamRef.current = screen;
      setScreenStream(screen);

      pcsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(screenTrack).catch(console.warn);
        } else {
          // no video sender yet — add the track
          pc.addTrack(screenTrack, screen);
        }
      });

      const next = { ...mediaState, screen: true };
      setMediaState(next);
      emitMediaState(next);
      screenTrack.onended = () => stopScreen();
    } catch (err) {
      console.warn("Screen share cancelled:", err.message);
    }
  }, [mediaState, emitMediaState]);

  const stopScreen = useCallback(() => {
    const screen = screenStreamRef.current;
    if (!screen) return;
    screen.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setScreenStream(null);

    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) {
      pcsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) sender.replaceTrack(camTrack).catch(console.warn);
      });
    }

    const next = { ...mediaState, screen: false };
    setMediaState(next);
    emitMediaState(next);
  }, [mediaState, emitMediaState]);

  const leaveRoom = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcsRef.current.forEach((pc) => pc.close());
    pcsRef.current.clear();
    userNamesRef.current.clear();
    iceCandidateBufferRef.current.clear();
    screenStreamRef.current = null;
    setPeers(new Map());
    setLocalStream(null);
    setScreenStream(null);
  }, []);

  return {
    peers, localStream, screenStream, mediaState,
    joinRoom, toggleAudio, toggleVideo,
    startScreen, stopScreen, leaveRoom
  };
}