import { spawn } from "child_process";
import fs        from "fs";
import path      from "path";

const BASE_TEMP    = path.join(process.cwd(), "temp");
const TIME_LIMIT   = 5000;
const OUTPUT_LIMIT = 100_000; // FIX: added output guard (was missing)

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

export const runCode = async (req, res) => {
  const { language, code, input } = req.body;

  if (!language || !code) {
    return res.status(400).json({ message: "language and code are required" });
  }

  ensureTemp();
  const runDir = makeTempDir();

  try {
    let command, runArgs = [];

    if (language === "javascript") {
      const file = path.join(runDir, "code.js");
      fs.writeFileSync(file, code);
      command = "node";
      runArgs = [file];
    }

    else if (language === "python") {
      const file = path.join(runDir, "code.py");
      fs.writeFileSync(file, code);
      // FIX: was "python" — must be "python3" on Linux
      command = "python3";
      runArgs = [file];
    }

    else if (language === "cpp") {
      const src = path.join(runDir, "code.cpp");
      const bin = path.join(runDir, "code");
      fs.writeFileSync(src, code);
      const { ok, error } = await compile("g++", ["-O2", "-std=c++17", src, "-o", bin]);
      if (!ok) {
        cleanup(runDir);
        return res.json({ output: "", verdict: "Compilation Error", error });
      }
      command = bin;
      runArgs = [];
    }

    else if (language === "java") {
      const src = path.join(runDir, "Main.java");
      fs.writeFileSync(src, code);
      const { ok, error } = await compile("javac", [src]);
      if (!ok) {
        cleanup(runDir);
        return res.json({ output: "", verdict: "Compilation Error", error });
      }
      command = "java";
      runArgs = ["-cp", runDir, "Main"];
    }

    else {
      cleanup(runDir);
      return res.status(400).json({ message: `Unsupported language: ${language}` });
    }

    const child = spawn(command, runArgs);
    let stdout = "", stderr = "", killed = false;

    const timer = setTimeout(() => {
      killed = true;
      try { child.stdin.end(); } catch {}
      child.kill("SIGKILL");
    }, TIME_LIMIT);

    child.stdout.on("data", (d) => {
      stdout += d.toString();
      // FIX: output limit guard was missing
      if (stdout.length > OUTPUT_LIMIT) {
        killed = true;
        try { child.stdin.end(); } catch {}
        child.kill("SIGKILL");
      }
    });
    child.stderr.on("data", (d) => (stderr += d.toString()));

    if (input) {
      try { child.stdin.write(input); } catch {}
    }
    try { child.stdin.end(); } catch {}

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      cleanup(runDir);

      if (killed) {
        return res.json({
          output:  stdout.trim(),
          verdict: "Time Limit Exceeded",
          error:   "Execution exceeded 5 seconds"
        });
      }

      if (exitCode !== 0) {
        return res.json({
          output:  stdout.trim(),
          verdict: "Runtime Error",
          error:   stderr.trim() || `Process exited with code ${exitCode}`
        });
      }

      res.json({
        output:  stdout.trim() || stderr.trim(),
        verdict: "OK",
        error:   null
      });
    });

  } catch (err) {
    cleanup(runDir);
    console.error(err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};