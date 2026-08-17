import {
  isValidHex,
  type GoogleFont,
  type WidgetTheme,
} from "./widget-config.ts";

const GOOGLE_FONTS: GoogleFont[] = [
  "cormorant-garamond",
  "dm-sans",
  "fraunces",
  "space-grotesk",
];
const HEADING_WEIGHTS = new Set([400, 500, 600, 700]);
const BODY_WEIGHTS = new Set([300, 400, 500, 600, 700]);
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
  "secondaryButtonBorder",
] as const;

type ExtractedThemeKey =
  | (typeof COLOR_ROLES)[number]
  | "containerRadius"
  | "containerBorderWidth"
  | "buttonRadius"
  | "secondaryButtonBorderWidth"
  | "primaryFont"
  | "secondaryFont"
  | "headingFontWeight"
  | "secondaryFontWeight";

export type ExtractedTheme = Partial<Pick<WidgetTheme, ExtractedThemeKey>>;

export const THEME_EXTRACTION_PROMPT = `You are a design-token extractor. Analyze the attached UI screenshot and return only one compact JSON object with exactly this shape:

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
  "secondaryButtonBorder": "#rrggbb",
  "containerRadius": 12,
  "containerBorderWidth": 1,
  "buttonRadius": 8,
  "secondaryButtonBorderWidth": 1,
  "primaryFont": "cormorant-garamond",
  "secondaryFont": "dm-sans",
  "headingFontWeight": 600,
  "secondaryFontWeight": 400
}

Color roles:
- page: the overall page or background color behind everything
- surface: card, panel, or container background
- softSurface: subtle secondary surface, including secondary button fills
- text: primary heading and body text color
- mutedText: secondary or muted text color
- primary: the dominant brand or primary-button color
- primaryText: text used on top of the primary color
- accent: highlight or accent color
- border: container strokes and structural dividers
- secondaryButtonBorder: the outline color used on secondary buttons

Geometry roles, measured in pixels:
- containerRadius: corner radius of the outer card or panel only, from 0 to 24
- containerBorderWidth: visible outer card or panel stroke, from 0 to 4
- buttonRadius: corner radius of buttons only, from 0 to 24
- secondaryButtonBorderWidth: visible outline of secondary buttons only, from 0 to 4; use 0 when the secondary button has no outline

Do not infer container geometry from buttons or button geometry from containers. Ignore radii and strokes on images, logos, icons, dividers, and decorative shapes.

Font choices:
- cormorant-garamond: refined high-contrast serif
- fraunces: warm editorial serif
- dm-sans: clean geometric sans-serif
- space-grotesk: technical modern sans-serif

Rules:
- Always return every field.
- Use six-digit lowercase hex colors sampled from the screenshot.
- Return geometry as numbers, not strings, using whole pixels. Use the nearest even number for radii.
- Estimate font weights from the screenshot.
- When a role is ambiguous, infer it from the closest related element.
- Return nothing but the JSON object. Do not read project files or run commands.`;

function normalizeNumber(
  value: unknown,
  { min, max, step }: { min: number; max: number; step: number },
): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const stepped = Math.round(value / step) * step;
  return Math.min(max, Math.max(min, stepped));
}

export function parseExtractedTheme(raw: unknown): ExtractedTheme {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  const theme: ExtractedTheme = {};

  for (const role of COLOR_ROLES) {
    const value = typeof source[role] === "string" ? source[role].trim().toLowerCase() : "";
    if (isValidHex(value)) theme[role] = value;
  }

  const containerRadius = normalizeNumber(source.containerRadius, { min: 0, max: 24, step: 2 });
  const containerBorderWidth = normalizeNumber(source.containerBorderWidth, { min: 0, max: 4, step: 1 });
  const buttonRadius = normalizeNumber(source.buttonRadius, { min: 0, max: 24, step: 2 });
  const secondaryButtonBorderWidth = normalizeNumber(source.secondaryButtonBorderWidth, { min: 0, max: 4, step: 1 });
  if (containerRadius !== undefined) theme.containerRadius = containerRadius;
  if (containerBorderWidth !== undefined) theme.containerBorderWidth = containerBorderWidth;
  if (buttonRadius !== undefined) theme.buttonRadius = buttonRadius;
  if (secondaryButtonBorderWidth !== undefined) theme.secondaryButtonBorderWidth = secondaryButtonBorderWidth;

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

export function extractThemeJsonContent(content: string): unknown {
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
