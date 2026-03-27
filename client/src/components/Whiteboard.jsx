import { useEffect, useRef, useState, useCallback } from "react";
import * as fabricModule from "fabric";
import socket from "../socket/socket";
import {
  FaPencilAlt, FaEraser, FaMinus, FaSquare, FaCircle,
  FaFont, FaArrowRight, FaTrash, FaTimes, FaUndo, FaRedo,
  FaDownload, FaLock, FaLockOpen,
} from "react-icons/fa";

const { Canvas, Line, Rect, Circle, Triangle, Path,
        PencilBrush, IText, util } =
  fabricModule.fabric ?? fabricModule;

const COLORS = [
  "#ffffff", "#f87171", "#60a5fa", "#4ade80",
  "#fbbf24", "#a78bfa", "#fb923c", "#f472b6",
  "#000000", "#94a3b8",
];

const TOOLS = [
  { id: "pen",      icon: FaPencilAlt,  label: "Pen"      },
  { id: "line",     icon: FaMinus,      label: "Line"     },
  { id: "arrow",    icon: FaArrowRight, label: "Arrow"    },
  { id: "rect",     icon: FaSquare,     label: "Rectangle"},
  { id: "circle",   icon: FaCircle,     label: "Circle"   },
  { id: "triangle", icon: FaArrowRight, label: "Triangle" },
  { id: "text",     icon: FaFont,       label: "Text"     },
  { id: "eraser",   icon: FaEraser,     label: "Eraser"   },
  { id: "select",   icon: FaLockOpen,   label: "Select"   },
];

export default function Whiteboard({ roomId, onClose }) {
  const canvasElRef = useRef(null);
  const fabricRef   = useRef(null);
  const suppress    = useRef(false);
  const historyRef  = useRef({ undo: [], redo: [] });

  const [tool,      setTool]      = useState("pen");
  const [color,     setColor]     = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(3);
  const [fillShape, setFillShape] = useState(false);

  /* ── init ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (fabricRef.current) return;

    const canvas = new Canvas(canvasElRef.current, {
      isDrawingMode:   true,
      backgroundColor: "#1e1e2e",
      width:           900,
      height:          540,
    });

    canvas.freeDrawingBrush       = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = "#ffffff";
    canvas.freeDrawingBrush.width = 3;

    const pushHistory = () => {
      historyRef.current.undo.push(JSON.stringify(canvas.toJSON()));
      historyRef.current.redo = [];
    };

    canvas.on("object:added",    (e) => {
      if (!suppress.current) {
        pushHistory();
        socket.emit("whiteboard:draw", { roomId, delta: { type: "add", obj: e.target.toJSON() } });
      }
    });
    canvas.on("object:modified", (e) => {
      if (!suppress.current) {
        pushHistory();
        socket.emit("whiteboard:draw", { roomId, delta: { type: "modify", obj: e.target.toJSON() } });
      }
    });
    canvas.on("object:removed",  () => {
      if (!suppress.current) pushHistory();
    });

    fabricRef.current = canvas;
    return () => { canvas.dispose(); fabricRef.current = null; };
  }, []); // eslint-disable-line

  /* ── sync brush when tool/color/width/fill changes ─────────── */
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (tool === "pen") {
      canvas.isDrawingMode          = true;
      canvas.selection              = false;
      canvas.freeDrawingBrush.color = color;
      canvas.freeDrawingBrush.width = lineWidth;
      return;
    }
    if (tool === "eraser") {
      canvas.isDrawingMode          = true;
      canvas.selection              = false;
      canvas.freeDrawingBrush.color = "#1e1e2e";
      canvas.freeDrawingBrush.width = lineWidth * 5;
      return;
    }
    if (tool === "select") {
      canvas.isDrawingMode = false;
      canvas.selection     = true;
      return;
    }
    canvas.isDrawingMode = false;
    canvas.selection     = false;
  }, [tool, color, lineWidth]);

  /* ── shape / text drawing ───────────────────────────────────── */
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (tool === "pen" || tool === "eraser" || tool === "select") return;

    let isDown = false, origin = { x: 0, y: 0 }, shape = null;

    const base = () => ({
      stroke:      color,
      strokeWidth: lineWidth,
      fill:        fillShape ? color + "55" : "transparent",
      selectable:  false,
    });

    const onDown = (opt) => {
      if (tool === "text") {
        const ptr  = canvas.getScenePoint(opt.e);
        const text = new IText("Click to edit", {
          left:     ptr.x,
          top:      ptr.y,
          fontSize: lineWidth * 6 + 10,
          fill:     color,
          fontFamily: "monospace",
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        return;
      }
      isDown = true;
      const ptr = canvas.getScenePoint(opt.e);
      origin = { x: ptr.x, y: ptr.y };

      if (tool === "line" || tool === "arrow") {
        shape = new Line([ptr.x, ptr.y, ptr.x, ptr.y], {
          ...base(), fill: "",
        });
      }
      if (tool === "rect") {
        shape = new Rect({ ...base(), left: ptr.x, top: ptr.y, width: 0, height: 0 });
      }
      if (tool === "circle") {
        shape = new Circle({ ...base(), left: ptr.x, top: ptr.y, radius: 0, originX: "center", originY: "center" });
      }
      if (tool === "triangle") {
        shape = new Triangle({ ...base(), left: ptr.x, top: ptr.y, width: 0, height: 0 });
      }
      if (shape) canvas.add(shape);
    };

    const onMove = (opt) => {
      if (!isDown || !shape) return;
      const ptr = canvas.getScenePoint(opt.e);
      if (tool === "line" || tool === "arrow") {
        shape.set({ x2: ptr.x, y2: ptr.y });
      }
      if (tool === "rect") {
        shape.set({
          width:  Math.abs(ptr.x - origin.x),
          height: Math.abs(ptr.y - origin.y),
          left:   Math.min(ptr.x, origin.x),
          top:    Math.min(ptr.y, origin.y),
        });
      }
      if (tool === "circle") {
        const r = Math.hypot(ptr.x - origin.x, ptr.y - origin.y) / 2;
        shape.set({ radius: r, left: (ptr.x + origin.x) / 2, top: (ptr.y + origin.y) / 2 });
      }
      if (tool === "triangle") {
        shape.set({
          width:  Math.abs(ptr.x - origin.x),
          height: Math.abs(ptr.y - origin.y),
          left:   Math.min(ptr.x, origin.x),
          top:    Math.min(ptr.y, origin.y),
        });
      }
      canvas.renderAll();
    };

    const onUp = () => {
      if (!isDown || !shape) return;
      isDown = false;
      if (tool === "arrow") {
        const { x1, y1, x2, y2 } = shape;
        const angle  = Math.atan2(y2 - y1, x2 - x1);
        const len    = 14;
        const arrowPath = `M ${x2} ${y2}
          L ${x2 - len * Math.cos(angle - Math.PI / 6)} ${y2 - len * Math.sin(angle - Math.PI / 6)}
          M ${x2} ${y2}
          L ${x2 - len * Math.cos(angle + Math.PI / 6)} ${y2 - len * Math.sin(angle + Math.PI / 6)}`;
        const head = new Path(arrowPath, {
          stroke: color, strokeWidth: lineWidth,
          fill: "", selectable: false,
        });
        canvas.add(head);
        socket.emit("whiteboard:draw", { roomId, delta: { type: "add", obj: head.toJSON() } });
      }
      socket.emit("whiteboard:draw", { roomId, delta: { type: "add", obj: shape.toJSON() } });
      shape = null;
    };

    canvas.on("mouse:down", onDown);
    canvas.on("mouse:move", onMove);
    canvas.on("mouse:up",   onUp);
    return () => {
      canvas.off("mouse:down", onDown);
      canvas.off("mouse:move", onMove);
      canvas.off("mouse:up",   onUp);
    };
  }, [tool, color, lineWidth, fillShape, roomId]);

  /* ── receive remote events ──────────────────────────────────── */
  useEffect(() => {
    const onDraw = ({ delta }) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      suppress.current = true;
      util.enlivenObjects([delta.obj]).then((objects) => {
        objects.forEach((obj) => { if (obj) canvas.add(obj); });
        canvas.renderAll();
        suppress.current = false;
      });
    };

    const onClear = () => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      suppress.current = true;
      canvas.clear();
      canvas.backgroundColor = "#1e1e2e";
      canvas.renderAll();
      suppress.current = false;
    };

    socket.on("whiteboard:draw",  onDraw);
    socket.on("whiteboard:clear", onClear);
    return () => {
      socket.off("whiteboard:draw",  onDraw);
      socket.off("whiteboard:clear", onClear);
    };
  }, []);

  /* ── undo / redo ─────────────────────────────────────────────── */
  const undo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const { undo: u, redo: r } = historyRef.current;
    if (u.length === 0) return;
    r.push(JSON.stringify(canvas.toJSON()));
    const prev = u.pop();
    suppress.current = true;
    canvas.loadFromJSON(prev, () => { canvas.renderAll(); suppress.current = false; });
  }, []);

  const redo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const { undo: u, redo: r } = historyRef.current;
    if (r.length === 0) return;
    u.push(JSON.stringify(canvas.toJSON()));
    const next = r.pop();
    suppress.current = true;
    canvas.loadFromJSON(next, () => { canvas.renderAll(); suppress.current = false; });
  }, []);

  /* ── delete selected ─────────────────────────────────────────── */
  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    active.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    socket.emit("whiteboard:clear", { roomId }); // full sync after delete
    socket.emit("whiteboard:draw", {
      roomId,
      delta: { type: "full", json: JSON.stringify(canvas.toJSON()) }
    });
  }, [roomId]);

  /* ── download ────────────────────────────────────────────────── */
  const download = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL({ format: "png", multiplier: 2 });
    const a   = document.createElement("a");
    a.href     = url;
    a.download = "whiteboard.png";
    a.click();
  }, []);

  /* ── clear ───────────────────────────────────────────────────── */
  const clearBoard = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = "#1e1e2e";
    canvas.renderAll();
    historyRef.current = { undo: [], redo: [] };
    socket.emit("whiteboard:clear", { roomId });
  }, [roomId]);

  /* ── keyboard shortcuts ──────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) undo();
      if (e.key === "z" && (e.ctrlKey || e.metaKey) &&  e.shiftKey) redo();
      if (e.key === "y" && (e.ctrlKey || e.metaKey)) redo();
      if ((e.key === "Delete" || e.key === "Backspace") && tool === "select") deleteSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, deleteSelected, tool]);

  return (
    <div className="flex flex-col bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl">

      {/* toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-b border-white/10 flex-wrap">

        {/* tools */}
        <div className="flex gap-0.5">
          {TOOLS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              title={label}
              onClick={() => setTool(id)}
              className={`p-2 rounded-lg text-sm transition-colors ${
                tool === id
                  ? "bg-amu-primary text-white"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon />
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* colors */}
        <div className="flex gap-1 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{ background: c, border: color === c ? "2px solid #7c3aed" : "2px solid transparent" }}
              className="w-5 h-5 rounded-full transition-transform hover:scale-110"
            />
          ))}
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* stroke width */}
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs">Size</span>
          <input
            type="range" min="1" max="20" value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-20 accent-amu-primary"
          />
          <span className="text-white/40 text-xs w-4">{lineWidth}</span>
        </div>

        <div className="w-px h-5 bg-white/10" />

        {/* fill toggle */}
        <button
          title="Toggle fill"
          onClick={() => setFillShape((v) => !v)}
          className={`p-2 rounded-lg text-sm transition-colors ${
            fillShape ? "bg-amu-primary text-white" : "text-white/50 hover:text-white hover:bg-white/10"
          }`}
        >
          {fillShape ? <FaLock /> : <FaLockOpen />}
        </button>

        <div className="w-px h-5 bg-white/10" />

        {/* undo / redo */}
        <button title="Undo (Ctrl+Z)" onClick={undo} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-sm">
          <FaUndo />
        </button>
        <button title="Redo (Ctrl+Shift+Z)" onClick={redo} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-sm">
          <FaRedo />
        </button>

        <div className="ml-auto flex gap-1">
          <button title="Download as PNG" onClick={download} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-sm">
            <FaDownload />
          </button>
          <button title="Clear board" onClick={clearBoard} className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm">
            <FaTrash />
          </button>
          <button title="Close" onClick={onClose} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-sm">
            <FaTimes />
          </button>
        </div>
      </div>

      {/* canvas */}
      <div className="overflow-auto bg-[#1e1e2e]">
        <canvas ref={canvasElRef} />
      </div>

      {/* status bar */}
      <div className="flex items-center gap-4 px-3 py-1.5 bg-gray-800 border-t border-white/10 text-xs text-white/30">
        <span>Tool: <span className="text-white/60">{tool}</span></span>
        <span>Size: <span className="text-white/60">{lineWidth}</span></span>
        <span>Fill: <span className="text-white/60">{fillShape ? "on" : "off"}</span></span>
        <span className="ml-auto">Ctrl+Z undo · Ctrl+Shift+Z redo · Del to delete selected</span>
      </div>
    </div>
  );
}