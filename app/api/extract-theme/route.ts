import { NextResponse } from "next/server";
import {
  extractThemeJsonContent,
  parseExtractedTheme,
  THEME_EXTRACTION_PROMPT,
  type ExtractedTheme,
} from "@/lib/theme-extraction";

const OPENAI_MODEL = process.env.EXTRACT_THEME_MODEL ?? "gpt-4o-mini";
const ANTHROPIC_MODEL = process.env.EXTRACT_THEME_MODEL ?? "claude-sonnet-4-5";

interface LocalCliKeys {
  openai?: string;
  anthropic?: string;
}

async function readLocalCliKeys(): Promise<LocalCliKeys> {
  const keys: LocalCliKeys = {};
  try {
    const { readFile } = await import("node:fs/promises");
    const home = process.env.HOME ?? process.env.USERPROFILE ?? "";
    if (!home) return keys;

    for (const file of [".codex/auth.json", ".openai/auth.json"]) {
      try {
        const raw = await readFile(`${home}/${file}`, "utf8");
        const parsed = JSON.parse(raw) as { OPENAI_API_KEY?: unknown };
        if (typeof parsed.OPENAI_API_KEY === "string" && parsed.OPENAI_API_KEY.trim()) {
          keys.openai = parsed.OPENAI_API_KEY.trim();
          break;
        }
      } catch {
        // Missing file or unparseable JSON — try the next candidate.
      }
    }

    try {
      const raw = await readFile(`${home}/.claude/.credentials.json`, "utf8");
      const parsed = JSON.parse(raw) as { primaryApiKey?: { apiKey?: unknown } };
      if (typeof parsed.primaryApiKey?.apiKey === "string" && parsed.primaryApiKey.apiKey.trim()) {
        keys.anthropic = parsed.primaryApiKey.apiKey.trim();
      }
    } catch {
      // No Claude Code credentials on this machine.
    }
  } catch {
    // Filesystem unavailable (e.g. deployed worker) — no local CLI auth.
  }
  return keys;
}

function themeResponse(theme: ExtractedTheme): Response {
  if (Object.keys(theme).length === 0) {
    return NextResponse.json(
      { error: "Could not extract a theme from that image. Try a cleaner screenshot." },
      { status: 422 },
    );
  }
  return NextResponse.json({ theme });
}

async function callOpenAi(apiKey: string, image: string): Promise<Response> {
  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 1200,
      messages: [
        { role: "system", content: THEME_EXTRACTION_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the design tokens from this UI screenshot.",
            },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    }),
  });

  if (!completion.ok) {
    return NextResponse.json(
      { error: `The vision model could not process the image (${completion.status}).` },
      { status: 502 },
    );
  }

  const data = (await completion.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  return themeResponse(content ? parseExtractedTheme(extractThemeJsonContent(content)) : {});
}

async function callAnthropic(apiKey: string, image: string): Promise<Response> {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,(.+)$/.exec(image);
  if (!match) {
    return NextResponse.json(
      { error: "Send the screenshot as a PNG, JPEG, or WebP base64 data URL in an { image } body." },
      { status: 400 },
    );
  }
  const [, mediaType, base64] = match;

  const completion = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1200,
      system: THEME_EXTRACTION_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: "Extract the design tokens from this UI screenshot.",
            },
          ],
        },
      ],
    }),
  });

  if (!completion.ok) {
    return NextResponse.json(
      { error: `The vision model could not process the image (${completion.status}).` },
      { status: 502 },
    );
  }

  const data = (await completion.json()) as {
    content?: { type?: string; text?: string }[];
  };
  const text = data.content?.find((block) => block.type === "text")?.text;
  return themeResponse(text ? parseExtractedTheme(extractThemeJsonContent(text)) : {});
}

export async function POST(request: Request): Promise<Response> {
  const envOpenAi = process.env.OPENAI_API_KEY?.trim();
  const envCodex = process.env.CODEX_API_KEY?.trim();
  const envAnthropic = process.env.ANTHROPIC_API_KEY?.trim();
  const cliKeys = await readLocalCliKeys();

  const openAiKey = envOpenAi || envCodex || cliKeys.openai;
  const anthropicKey = envAnthropic || cliKeys.anthropic;
  if (!openAiKey && !anthropicKey) {
    return NextResponse.json(
      {
        error: "Theme extraction needs an OPENAI_API_KEY or ANTHROPIC_API_KEY in this environment. Local development can also use an authenticated Codex CLI.",
      },
      { status: 501 },
    );
  }

  let image: string;
  try {
    const body = (await request.json()) as { image?: unknown };
    image = typeof body.image === "string" ? body.image : "";
  } catch {
    image = "";
  }
  if (!image.startsWith("data:image/")) {
    return NextResponse.json({ error: "Send the screenshot as a base64 data URL in an { image } body." }, { status: 400 });
  }

  if (openAiKey) return callOpenAi(openAiKey, image);
  return callAnthropic(anthropicKey as string, image);
}
