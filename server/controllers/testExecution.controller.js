import { spawn } from "child_process";
import fs        from "fs";
import path      from "path";

const BASE_TEMP    = path.join(process.cwd(), "temp");
const TIME_LIMIT   = 5000;
const OUTPUT_LIMIT = 100_000;

function ensureTemp() {
  if (!fs.existsSync(BASE_TEMP)) fs.mkdirSync(BASE_TEMP, { recursive: true });
}
function makeTempDir() {
  const id  = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const dir = path.join(BASE_TEMP, `run-${id}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
function cleanup(dir) {
  fs.rm(dir, { recursive: true, force: true }, () => {});
}
function compile(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args);
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => resolve({ ok: code === 0, error: stderr.trim() }));
  });
}
function executeWithStdin(command, args, stdinData) {
  return new Promise((resolve) => {
    const child = spawn(command, args);
    let stdout = "", stderr = "", killed = false;

    const timer = setTimeout(() => {
      killed = true;
      try { child.stdin.end(); } catch {}
      child.kill("SIGKILL");
    }, TIME_LIMIT);

    child.stdout.on("data", (d) => {
      stdout += d.toString();
      if (stdout.length > OUTPUT_LIMIT) {
        killed = true;
        try { child.stdin.end(); } catch {}
        child.kill("SIGKILL");
      }
    });
    child.stderr.on("data", (d) => (stderr += d.toString()));

    if (stdinData != null) {
      try { child.stdin.write(stdinData); } catch {}
    }
    try { child.stdin.end(); } catch {}

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode: code, timedOut: killed });
    });
  });
}
function normalise(str) {
  try { return JSON.stringify(JSON.parse(str)); } catch { return str.trim(); }
}

function extractFunctionName(code) {
  const patterns = [
    /function\s+([a-zA-Z_$][\w$]*)\s*\(/,
    /(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*(?:\(|async\s*\(|[a-zA-Z_$][\w$]*\s*=>)/,
    /(?:const|let|var)\s+([a-zA-Z_$][\w$]*)\s*=\s*function/,
  ];
  for (const p of patterns) {
    const m = code.match(p);
    if (m) return m[1];
  }
  return null;
}

/* ── JS wrapper (dynamic lang — wrapper still works fine) ───────── */
function buildJS(userCode, argsJson) {
  const fnName = extractFunctionName(userCode);
  if (!fnName) throw new Error("Could not detect a function name in your JavaScript code.");
  return `
${userCode}

;(function () {
  const __args   = ${argsJson};
  const __result = ${fnName}(...__args);
  process.stdout.write(JSON.stringify(__result));
})();
`;
}

/* ── Python wrapper (dynamic lang — wrapper still works fine) ───── */
function buildPython(userCode, argsJson) {
  const fnMatch = userCode.match(/def\s+([a-zA-Z_]\w*)\s*\(/);
  if (!fnMatch) throw new Error("Could not detect a function name in your Python code.");
  const fnName  = fnMatch[1];
  const safeArgs = argsJson.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `
import json, sys

${userCode}

_args   = json.loads('${safeArgs}')
_result = ${fnName}(*_args)
sys.stdout.write(json.dumps(_result))
`;
}

/* ── C++ and Java: user writes the full program ─────────────────────
   The starter code already includes main() + stdin JSON parsing.
   Backend just compiles and runs — passes args as a JSON line on stdin.
   No wrapper generation at all.
─────────────────────────────────────────────────────────────────── */

async function buildExecutable(language, source, runDir, suffix = "") {
  if (language === "javascript") {
    const file = path.join(runDir, `code${suffix}.js`);
    fs.writeFileSync(file, source);
    return { command: "node", runArgs: [file] };
  }
  if (language === "python") {
    const file = path.join(runDir, `code${suffix}.py`);
    fs.writeFileSync(file, source);
    return { command: "python3", runArgs: [file] };
  }
  if (language === "cpp") {
    const src = path.join(runDir, `code${suffix}.cpp`);
    const bin = path.join(runDir, `code${suffix}`);
    fs.writeFileSync(src, source);
    const { ok, error } = await compile("g++", ["-O2", "-std=c++17", src, "-o", bin]);
    if (!ok) return { error: `Compilation Error:\n${error}` };
    return { command: bin, runArgs: [] };
  }
  if (language === "java") {
    const tcDir = path.join(runDir, `tc${suffix}`);
    fs.mkdirSync(tcDir, { recursive: true });
    const src = path.join(tcDir, "Main.java");
    fs.writeFileSync(src, source);
    const { ok, error } = await compile("javac", [src]);
    if (!ok) return { error: `Compilation Error:\n${error}` };
    return { command: "java", runArgs: ["-cp", tcDir, "Main"] };
  }
  return { error: `Unsupported language: ${language}` };
}

export const runTests = async (req, res) => {
  const { language, code, testCases } = req.body;

  if (!language || !code || !Array.isArray(testCases) || testCases.length === 0) {
    return res.status(400).json({ message: "language, code, and testCases are required" });
  }

  ensureTemp();
  const runDir = makeTempDir();
  const results = [];

  try {
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];

      /* ── build source ─────────────────────────────────────────── */
      let source;
      try {
        if      (language === "javascript") source = buildJS(code, tc.args);
        else if (language === "python")     source = buildPython(code, tc.args);
        else if (language === "cpp")        source = code;  // user wrote full program
        else if (language === "java")       source = code;  // user wrote full program
        else throw new Error(`Unsupported language: ${language}`);
      } catch (e) {
        results.push({ passed: false, output: null, expected: tc.expected, error: e.message, verdict: "Compilation Error" });
        continue;
      }

      /* ── compile / prepare ────────────────────────────────────── */
      const built = await buildExecutable(language, source, runDir, `_${i}`);
      if (built.error) {
        results.push({ passed: false, output: null, expected: tc.expected, error: built.error, verdict: "Compilation Error" });
        continue;
      }

      /* ── execute — pass args as JSON line on stdin ────────────── */
      const stdinData = (language === "cpp" || language === "java") ? tc.args + "\n" : null;
      const { stdout, stderr, exitCode, timedOut } =
        await executeWithStdin(built.command, built.runArgs, stdinData);

      /* ── verdict ──────────────────────────────────────────────── */
      if (timedOut) {
        results.push({ passed: false, output: null, expected: tc.expected, error: "Execution exceeded 5 seconds", verdict: "Time Limit Exceeded" });
        continue;
      }
      if (exitCode !== 0 || (!stdout && stderr)) {
        results.push({ passed: false, output: null, expected: tc.expected, error: stderr || `Process exited with code ${exitCode}`, verdict: "Runtime Error" });
        continue;
      }
      const pass = normalise(stdout) === normalise(tc.expected);
      results.push({ passed: pass, output: stdout, expected: tc.expected, error: stderr || null, verdict: pass ? "Accepted" : "Wrong Answer" });
    }

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    cleanup(runDir);
  }
};