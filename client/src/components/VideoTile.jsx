import { useRef, useEffect } from "react";
import { FaMicrophoneSlash, FaVideoSlash } from "react-icons/fa";

export default function VideoTile({ stream, label, muted = false, mediaState, isScreen = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!stream) return;

    console.log(`[VideoTile] ${label} | attaching stream ${stream.id} | tracks: ${stream.getTracks().map(t => t.kind + ":" + t.readyState).join(", ")}`);

    video.srcObject = stream;
    video.muted     = muted;

    video.play().catch((err) => {
      if (err.name !== "AbortError") {
        console.warn(`[VideoTile] play() failed for ${label}:`, err.message);
      }
    });

    return () => {
      video.srcObject = null;
    };
  }, [stream]); // eslint-disable-line

  return (
    <div
      className="relative rounded-xl overflow-hidden bg-gray-900 aspect-video flex items-center justify-center"
      style={{ minHeight: 120, minWidth: 160 }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />

      {!stream && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl font-semibold">
            {label?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="text-xs">Connecting...</span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1.5">
        {isScreen ? <span className="text-green-400">● Screen</span> : label}
      </div>

      <div className="absolute top-2 right-2 flex gap-1">
        {mediaState?.audio === false && (
          <span className="bg-red-500/80 text-white p-1 rounded-full">
            <FaMicrophoneSlash style={{ fontSize: 10 }} />
          </span>
        )}
        {mediaState?.video === false && !isScreen && (
          <span className="bg-red-500/80 text-white p-1 rounded-full">
            <FaVideoSlash style={{ fontSize: 10 }} />
          </span>
        )}
      </div>
    </div>
  );
}