import Editor from "@monaco-editor/react";
import { useState, useEffect, useRef, useCallback } from "react";
import socket from "../socket/socket";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";

const languages = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python",     value: "python"     }
  // { label: "Java",       value: "java"        },
  // { label: "C++",        value: "cpp"         }
];

export const CURSOR_COLORS = [
  "#ff4d4f",
  "#1890ff",
  "#52c41a",
  "#fa8c16",
  "#722ed1"
];

export function getColorForId(id) {
  if (!id) return CURSOR_COLORS[0];
  return CURSOR_COLORS[
    Math.abs(
      id.split("").reduce((a, b) => a + b.charCodeAt(0), 0)
    ) % CURSOR_COLORS.length
  ];
}

export default function CodeEditor({ question = null }) {

  const { roomId } = useParams();
  const { user }   = useAuth();

  const [language,  setLanguage]  = useState("javascript");
  const [code,      setCode]      = useState("");
  const [testCases, setTestCases] = useState([{ args: "", expected: "" }]);
  const [results,   setResults]   = useState([]);
  const [running,   setRunning]   = useState(false);

  const editorRef      = useRef(null);
  const monacoRef      = useRef(null);
  const overlayWidgets = useRef({});
  const lastCursorEmit = useRef(0);
  const pendingCursors = useRef([]);
  const editorReady    = useRef(false);

  /* ── autofill when question or language changes ─────────────────
     FIX: was mapping to { input, expected } — inputs read t.args,
          so test-case fields always appeared blank.
          Unified to { args, expected } everywhere.
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!question) return;

    const starter = question.starterCode?.[language] ?? "";
    setCode(starter);

    if (question.testCases?.length > 0) {
      setTestCases(
        question.testCases.map((tc) => ({
          args:     tc.args     ?? "",
          expected: tc.expected ?? ""
        }))
      );
    }

    setResults([]);
  }, [question, language]);

  /* ── pixel position ─────────────────────────────────────────── */
  const getPixelPosition = useCallback((editor, lineNumber, column) => {
    const monaco = monacoRef.current;
    if (!monaco) return null;
    try {
      const top        = editor.getTopForLineNumber(lineNumber);
      const scrollTop  = editor.getScrollTop();
      const lineHeight = editor.getOption(monaco.editor.EditorOption.lineHeight);
      const { contentLeft } = editor.getLayoutInfo();
      const charWidth  = editor.getOption(
        monaco.editor.EditorOption.fontInfo
      ).typicalHalfwidthCharacterWidth;
      return { top: top - scrollTop, left: contentLeft + (column - 1) * charWidth, lineHeight };
    } catch {
      return null;
    }
  }, []);

  /* ── reposition widget ──────────────────────────────────────── */
  const repositionWidget = useCallback((editor, userId) => {
    const entry = overlayWidgets.current[userId];
    if (!entry?.position) return;
    const { lineNumber, column } = entry.position;
    const coords = getPixelPosition(editor, lineNumber, column);
    if (!coords) return;
    entry.container.style.transform = `translate(${coords.left}px, ${coords.top}px)`;
    entry.cursorLine.style.height   = `${coords.lineHeight}px`;
  }, [getPixelPosition]);

  /* ── upsert overlay widget ──────────────────────────────────── */
  const upsertOverlayWidget = useCallback((editor, remoteUser, position) => {
    const userId = remoteUser._id;
    const color  = getColorForId(userId);

    if (!overlayWidgets.current[userId]) {
      const container = document.createElement("div");
      container.style.cssText = `position:absolute;top:0;left:0;pointer-events:none;z-index:1000;`;

      const cursorLine = document.createElement("div");
      cursorLine.style.cssText = `
        position:absolute;width:2px;top:0;left:0;
        background-color:${color};
        animation:blink-cursor 1s step-start infinite;
      `;

      const label = document.createElement("div");
      label.textContent = remoteUser.name ?? "user";
      label.style.cssText = `
        position:absolute;top:-20px;left:0;
        background:${color};color:#fff;
        font-size:10px;font-family:sans-serif;
        padding:1px 5px;border-radius:3px;
        white-space:nowrap;pointer-events:none;line-height:16px;
      `;

      container.appendChild(cursorLine);
      container.appendChild(label);

      editor.addOverlayWidget({
        getId:       () => `remote-cursor-${userId}`,
        getDomNode:  () => container,
        getPosition: () => null
      });

      overlayWidgets.current[userId] = { container, cursorLine, position };
    } else {
      overlayWidgets.current[userId].position = position;
    }

    repositionWidget(editor, userId);
  }, [repositionWidget]);

  /* ── flush pre-mount cursor queue ───────────────────────────── */
  const flushPendingCursors = useCallback((editor) => {
    pendingCursors.current.forEach(({ remoteUser, position }) =>
      upsertOverlayWidget(editor, remoteUser, position)
    );
    pendingCursors.current = [];
  }, [upsertOverlayWidget]);

  /* ── socket: code & language ────────────────────────────────────
     FIX: cleanup in return, not before .on()
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const onCode = (newCode) => setCode(newCode);
    const onLang = (lang)    => setLanguage(lang);
    socket.on("code-update",     onCode);
    socket.on("language-update", onLang);
    return () => {
      socket.off("code-update",     onCode);
      socket.off("language-update", onLang);
    };
  }, []);

  /* ── socket: cursors ────────────────────────────────────────────
     FIX: named handler so .off() targets it precisely
  ─────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const handleCursorUpdate = ({ position, user: remoteUser }) => {
      if (!remoteUser?._id)                    return;
      if (user && remoteUser._id === user._id) return;

      if (!editorReady.current) {
        const existing = pendingCursors.current.findIndex(
          (c) => c.remoteUser._id === remoteUser._id
        );
        if (existing !== -1) {
          pendingCursors.current[existing] = { remoteUser, position };
        } else {
          pendingCursors.current.push({ remoteUser, position });
        }
        return;
      }

      upsertOverlayWidget(editorRef.current, remoteUser, position);
    };

    socket.on("cursor-update", handleCursorUpdate);
    return () => socket.off("cursor-update", handleCursorUpdate);
  }, [user, upsertOverlayWidget]);

  /* ── handlers ───────────────────────────────────────────────── */
  const handleCodeChange = (value) => {
    setCode(value);
    socket.emit("code-change", { roomId, code: value });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socket.emit("language-change", { roomId, language: newLang });
  };

  // FIX: functional update — no direct mutation
  const updateTestCase = (index, field, value) => {
    setTestCases((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addTestCase = () =>
    setTestCases((prev) => [...prev, { args: "", expected: "" }]);

  // FIX: new — allows removing a test case
  const removeTestCase = (index) =>
    setTestCases((prev) => prev.filter((_, i) => i !== index));

  /* ── runTests ────────────────────────────────────────────────────
     FIX: removed guard blocking runs when question has no testCases
          — custom user-added cases must always work.
  ─────────────────────────────────────────────────────────────── */
  const runTests = async () => {
    if (testCases.length === 0) {
      toast.error("Add at least one test case to run");
      return;
    }
    try {
      setRunning(true);
      setResults([]);
      const { data } = await api.post("/tests", {
        language,
        code,
        testCases: testCases.map((tc) => ({
          args:         tc.args,
          expected:     tc.expected,
          functionName: question?.functionName ?? "solution"
        }))
      });
      setResults(data.results);
    } catch {
      toast.error("Execution failed");
    } finally {
      setRunning(false);
    }
  };

  /* ── render ─────────────────────────────────────────────────── */
  return (
    <div className="w-full">

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">Code Editor</h3>

        <div className="flex gap-3">
          <select
            value={language}
            onChange={handleLanguageChange}
            className="
              px-3 py-1
              border border-light-border dark:border-dark-border
              rounded-md bg-white dark:bg-dark-card text-sm
            "
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>

          <button
            onClick={runTests}
            disabled={running}
            className="
              bg-amu-primary hover:bg-amu-secondary
              text-white px-4 py-1 rounded-md text-sm
              disabled:opacity-50
            "
          >
            {running ? "Running..." : "Run Tests"}
          </button>
        </div>
      </div>

      {/* Monaco */}
      <div className="h-[420px] rounded-lg border border-light-border dark:border-dark-border">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}

          onMount={(editor, monaco) => {
            editorRef.current   = editor;
            monacoRef.current   = monaco;
            editorReady.current = true;

            flushPendingCursors(editor);

            editor.onDidChangeCursorPosition((e) => {
              if (!user) return;
              const now = Date.now();
              if (now - lastCursorEmit.current > 100) {
                lastCursorEmit.current = now;
                socket.emit("cursor-change", {
                  roomId,
                  position: { lineNumber: e.position.lineNumber, column: e.position.column },
                  user
                });
              }
            });

            editor.onDidScrollChange(() => {
              Object.keys(overlayWidgets.current).forEach((uid) =>
                repositionWidget(editor, uid)
              );
            });

            editor.onDidLayoutChange(() => {
              Object.keys(overlayWidgets.current).forEach((uid) =>
                repositionWidget(editor, uid)
              );
            });
          }}

          options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true }}
        />
      </div>

      {/* Test Cases */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Test Cases</h4>
          <button
            onClick={addTestCase}
            className="text-sm px-3 py-1 border border-light-border dark:border-dark-border rounded"
          >
            + Add
          </button>
        </div>

        {testCases.map((t, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3 mb-3 items-center">
            {/* FIX: value is t.args (was t.input in the buggy version) */}
            <input
              value={t.args}
              placeholder="Args JSON e.g. [[2,7,11,15],9]"
              onChange={(e) => updateTestCase(i, "args", e.target.value)}
              className="border border-light-border dark:border-dark-border rounded px-2 py-1 text-sm"
            />
            <input
              value={t.expected}
              placeholder="Expected Output"
              onChange={(e) => updateTestCase(i, "expected", e.target.value)}
              className="border border-light-border dark:border-dark-border rounded px-2 py-1 text-sm"
            />
            {/* FIX: remove button */}
            <button
              onClick={() => removeTestCase(i)}
              className="text-red-400 hover:text-red-600 text-lg leading-none px-1"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-3">Results</h4>
          {results.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded mb-2 text-sm ${
                r.passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              <div className="font-medium">
                Test {i + 1} — {r.verdict ?? (r.passed ? "Accepted" : "Wrong Answer")}
              </div>
              <div>Output: {r.output ?? "None"}</div>
              {r.error && (
                <div className="font-mono text-xs mt-1 opacity-75 whitespace-pre-wrap">
                  {r.error}
                </div>
              )}
              {/* FIX: check !== undefined so falsy values like 0 or false still show */}
              {!r.passed && r.expected !== undefined && (
                <div>Expected: {r.expected}</div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}