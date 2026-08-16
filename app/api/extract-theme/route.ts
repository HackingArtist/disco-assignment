import { NextResponse } from "next/server";
import { isValidHex, type GoogleFont, type WidgetTheme } from "@/lib/widget-config";

const GOOGLE_FONTS: GoogleFont[] = [
  "cormorant-garamond",
  "dm-sans",
  "fraunces",
  "space-grotesk",
];
const HEADING_WEIGHTS = new Set([400, 500, 600, 700]);
const BODY_WEIGHTS = new Set([300, 400, 500, 600, 700]);
const OPENAI_MODEL = process.env.EXTRACT_THEME_MODEL ?? "gpt-4o-mini";
const ANTHROPIC_MODEL = process.env.EXTRACT_THEME_MODEL ?? "claude-sonnet-4-5";

const COLOR_ROLES = [
  "page",
  "surface",
  "softSurface",
  "text",
  "mutedText",
  "primary",
  "primaryText",
  "accent",
  "border",
] as const;

type ExtractedTheme = Partial<
  Pick<
    WidgetTheme,
    | "page"
    | "surface"
    | "softSurface"
    | "text"
    | "mutedText"
    | "primary"
    | "primaryText"
    | "accent"
    | "border"
    | "primaryFont"
    | "secondaryFont"
    | "headingFontWeight"
    | "secondaryFontWeight"
  >
>;

const SYSTEM_PROMPT = `You are a design-token extractor. You are given a UI screenshot and must describe its design system so another interface can be restyled to match. Analyze the image and return ONLY a valid JSON object with exactly this shape:

{
  "page": "#rrggbb",
  "surface": "#rrggbb",
  "softSurface": "#rrggbb",
  "text": "#rrggbb",
  "mutedText": "#rrggbb",
  "primary": "#rrggbb",
  "primaryText": "#rrggbb",
  "accent": "#rrggbb",
  "border": "#rrggbb",
  "primaryFont": "cormorant-garamond",
  "secondaryFont": "dm-sans",
  "headingFontWeight": 600,
  "secondaryFontWeight": 400
}

Color roles:
- page: the overall page or background color behind everything
- surface: card, panel, or container background
- softSurface: subtle secondary surface (secondary buttons, muted fills)
- text: primary heading and body text color
- mutedText: secondary or muted text color
- primary: the dominant brand or action color (primary button)
- primaryText: the text color used on top of the primary color
- accent: highlight or accent color
- border: stroke and divider color

Font choices (match the closest visual style to the UI in the screenshot):
- cormorant-garamond: refined high-contrast serif, elegant editorial display
- fraunces: soft, slightly quirky old-style serif, warm editorial display
- dm-sans: clean geometric sans-serif, modern minimal body
- space-grotesk: technical, slightly offbeat sans-serif, modern UI body

Rules:
- Always return every field, with six-digit lowercase hex colors.
- Sample the actual pixels: prefer exact colors you can see over invented ones.
- Estimate weights by how bold headings and body text appear in the image.
- When a role is ambiguous, infer it from the closest related color in the image.
- Return nothing but the JSON object — no markdown, no commentary.`;

function parseExtractedTheme(raw: unknown): ExtractedTheme {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const theme: ExtractedTheme = {};

  for (const role of COLOR_ROLES) {
    const value = typeof source[role] === "string" ? (source[role] as string).trim().toLowerCase() : "";
    if (isValidHex(value)) theme[role] = value as ExtractedTheme[typeof role];
  }

  if (typeof source.primaryFont === "string" && GOOGLE_FONTS.includes(source.primaryFont as GoogleFont)) {
    theme.primaryFont = source.primaryFont as GoogleFont;
  }
  if (typeof source.secondaryFont === "string" && GOOGLE_FONTS.includes(source.secondaryFont as GoogleFont)) {
    theme.secondaryFont = source.secondaryFont as GoogleFont;
  }
  if (typeof source.headingFontWeight === "number" && HEADING_WEIGHTS.has(source.headingFontWeight)) {
    theme.headingFontWeight = source.headingFontWeight;
  }
  if (typeof source.secondaryFontWeight === "number" && BODY_WEIGHTS.has(source.secondaryFontWeight)) {
    theme.secondaryFontWeight = source.secondaryFontWeight;
  }

  return theme;
}

function extractJsonContent(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = /\{[\s\S]*\}/.exec(content);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

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
        { role: "system", content: SYSTEM_PROMPT },
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
  return themeResponse(content ? parseExtractedTheme(extractJsonContent(content)) : {});
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
      system: SYSTEM_PROMPT,
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
  return themeResponse(text ? parseExtractedTheme(extractJsonContent(text)) : {});
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
        error: "Theme extraction needs an OPENAI_API_KEY, ANTHROPIC_API_KEY, or local CLI authentication (codex/openai/claude). Configure one, then try again.",
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
