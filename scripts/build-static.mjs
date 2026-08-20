import { mkdir, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const backupRoot = join(root, ".static-build-runtime-backup");
const runtimePaths = [
  "app/api/shopify",
  "app/account/login",
  "app/account/authorize",
  "app/account/logout",
];
const moved = [];

async function pathExists(path) {
  try {
    await import("node:fs/promises").then(({ access }) => access(path));
    return true;
  } catch {
    return false;
  }
}

async function moveRuntimeRoutesOut() {
  await rm(backupRoot, { recursive: true, force: true });

  for (const relativePath of runtimePaths) {
    const source = join(root, relativePath);
    if (!(await pathExists(source))) {
      continue;
    }

    const destination = join(backupRoot, relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await rename(source, destination);
    moved.push({ source, destination });
  }
}

async function restoreRuntimeRoutes() {
  for (const { source, destination } of moved.reverse()) {
    await mkdir(dirname(source), { recursive: true });
    await rename(destination, source);
  }

  await rm(backupRoot, { recursive: true, force: true });
}

function runNextBuild() {
  return new Promise((resolve, reject) => {
    const command = process.platform === "win32" ? "npx.cmd" : "npx";
    const child = spawn(command, ["next", "build"], {
      cwd: root,
      env: {
        ...process.env,
        STATIC_EXPORT: "true",
        BASE_PATH: process.env.BASE_PATH ?? "/test",
        NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH ?? "/test",
      },
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            signal
              ? `next build terminated by ${signal}`
              : `next build exited with code ${code}`
          )
        );
      }
    });
  });
}

try {
  await moveRuntimeRoutesOut();
  await runNextBuild();
} finally {
  await restoreRuntimeRoutes();
}
