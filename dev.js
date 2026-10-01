const { fork, spawn } = require("node:child_process");
const path = require("node:path");

const ROOT = __dirname;
const children = [];
let shuttingDown = false;

function stopAll(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill("SIGTERM");
  }
  process.exitCode = exitCode;
}

function watchChild(label, child) {
  children.push(child);
  child.once("error", (error) => {
    console.error(`[${label}] Could not start: ${error.message}`);
    stopAll(1);
  });
  child.once("exit", (code, signal) => {
    if (shuttingDown) return;
    const failed = code !== 0;
    if (failed) {
      console.error(
        `[${label}] stopped (${signal || `exit ${code}`}); stopping the other development process.`,
      );
    }
    stopAll(failed ? code || 1 : 0);
  });
}

function startFrontend(apiPort) {
  const vite = spawn(
    process.execPath,
    [path.join(ROOT, "node_modules", "vite", "bin", "vite.js")],
    {
      cwd: path.join(ROOT, "frontend"),
      env: {
        ...process.env,
        API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
      },
      stdio: "inherit",
    },
  );
  watchChild("Vite", vite);
}

function startBackend() {
  const backend = fork(path.join(ROOT, "backend", "server.js"), [], {
    cwd: path.join(ROOT, "backend"),
    env: { ...process.env, PORT: "0" },
    stdio: ["inherit", "inherit", "inherit", "ipc"],
  });
  watchChild("API", backend);
  backend.on("message", (message) => {
    if (message?.type === "api-ready") startFrontend(message.port);
  });
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));

startBackend();
