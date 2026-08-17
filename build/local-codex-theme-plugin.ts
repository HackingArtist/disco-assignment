import { execFile, spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { Plugin } from "vite";
import {
  extractThemeJsonContent,
  parseExtractedTheme,
  THEME_EXTRACTION_PROMPT,
  type ExtractedTheme,
} from "../lib/theme-extraction.ts";

const execFileAsync = promisify(execFile);
const MAX_BODY_BYTES = 15 * 1024 * 1024;
const CODEX_TIMEOUT_MS = 120_000;
type CodexRunner = (args: string[]) => Promise<string>;
type CodexProbe = (candidate: string, args: string[]) => Promise<void>;

const CODEX_PROMPT = `Analyze the attached screenshot of an order-completed page. Extract its visual design tokens so a benefits widget placed on that page can feel native to the host UI.

${THEME_EXTRACTION_PROMPT}`;

function jsonResponse(response: ServerResponse, status: number, payload: unknown) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("IMAGE_TOO_LARGE");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function decodeImage(image: string): { bytes: Buffer; extension: string } {
  const match = /^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/=]+)$/.exec(image);
  if (!match) throw new Error("INVALID_IMAGE");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0 || bytes.length > 10 * 1024 * 1024) throw new Error("IMAGE_TOO_LARGE");
  return { bytes, extension: match[1] === "jpeg" ? "jpg" : match[1] };
}

export async function resolveCodexBinary(probe?: CodexProbe): Promise<string | null> {
  const candidates = [
    process.env.CODEX_CLI_PATH?.trim(),
    "codex",
    "/opt/homebrew/bin/codex",
    "/usr/local/bin/codex",
  ].filter((candidate): candidate is string => Boolean(candidate));
  const runProbe = probe ?? (async (candidate, args) => {
    await execFileAsync(candidate, args, { timeout: 5_000 });
  });

  for (const candidate of candidates) {
    try {
      if (candidate.includes("/")) await access(candidate, constants.X_OK);
      await runProbe(candidate, ["--version"]);
      await runProbe(candidate, ["login", "status"]);
      return candidate;
    } catch {
      // Try the next common installation path.
    }
  }
  return null;
}

function runCodexProcess(codexBinary: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(codexBinary, args, {
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(stdout);
    };
    const append = (target: "stdout" | "stderr", chunk: Buffer) => {
      if (target === "stdout") stdout += chunk.toString();
      else stderr += chunk.toString();
      if (stdout.length + stderr.length > 1024 * 1024) {
        child.kill();
        finish(new Error("Codex CLI output exceeded 1 MB."));
      }
    };
    const timer = setTimeout(() => {
      child.kill();
      finish(new Error("Codex CLI timed out while analyzing the screenshot."));
    }, CODEX_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => append("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => append("stderr", chunk));
    child.on("error", finish);
    child.on("close", (code, signal) => {
      if (code === 0) finish();
      else finish(new Error(`Codex CLI exited with ${signal ?? code}: ${stderr.trim()}`));
    });
  });
}

export async function extractThemeWithCodex(
  image: string,
  codexBinary: string,
  runner?: CodexRunner,
): Promise<ExtractedTheme> {
  const { bytes, extension } = decodeImage(image);
  const directory = await mkdtemp(join(tmpdir(), "offer-widget-theme-"));
  const imagePath = join(directory, `screenshot.${extension}`);

  try {
    await writeFile(imagePath, bytes);
    const args = [
      "exec",
      CODEX_PROMPT,
      "--ephemeral",
      "--ignore-user-config",
      "--ignore-rules",
      "--sandbox",
      "read-only",
      "--skip-git-repo-check",
      "--cd",
      directory,
      "--config",
      'model_reasoning_effort="low"',
      "--image",
      imagePath,
    ];
    const run = runner ?? ((cliArgs) => runCodexProcess(codexBinary, cliArgs));
    const theme = parseExtractedTheme(extractThemeJsonContent(await run(args)));
    if (Object.keys(theme).length === 0) throw new Error("INVALID_THEME");
    return theme;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

// Local-only bridge: Vite runs in Node and can launch the authenticated Codex
// CLI. The Cloudflare worker route remains the production API-key fallback.
export function localCodexTheme(): Plugin {
  let codexBinaryPromise: Promise<string | null> | null = null;

  return {
    name: "local-codex-theme",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
        if (pathname === "/api/extract-theme/status" && request.method === "GET") {
          codexBinaryPromise ??= resolveCodexBinary();
          const codexBinary = await codexBinaryPromise;
          jsonResponse(response, 200, {
            connected: Boolean(codexBinary),
            provider: codexBinary ? "Codex CLI" : null,
          });
          return;
        }
        if (pathname !== "/api/extract-theme" || request.method !== "POST") return next();

        codexBinaryPromise ??= resolveCodexBinary();
        const codexBinary = await codexBinaryPromise;
        if (!codexBinary) return next();

        try {
          const body = JSON.parse(await readBody(request)) as { image?: unknown };
          const image = typeof body.image === "string" ? body.image : "";
          const theme = await extractThemeWithCodex(image, codexBinary);
          jsonResponse(response, 200, { theme, source: "codex-cli" });
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (message === "INVALID_IMAGE") {
            jsonResponse(response, 400, { error: "Upload a PNG, JPEG, or WebP screenshot." });
          } else if (message === "IMAGE_TOO_LARGE") {
            jsonResponse(response, 413, { error: "Keep screenshots under 10 MB." });
          } else {
            server.config.logger.error(`[local-codex-theme] ${error instanceof Error ? error.stack : String(error)}`);
            jsonResponse(response, 502, {
              error: "Local Codex could not analyze the screenshot. Run `codex login`, then try again.",
            });
          }
        }
      });
    },
  };
}
