import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { extractThemeWithCodex, resolveCodexBinary } from "../build/local-codex-theme-plugin.ts";
import { parseExtractedTheme, THEME_EXTRACTION_PROMPT } from "../lib/theme-extraction.ts";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the configuration studio and default widget", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Disco Offer Studio<\/title>/i);
  assert.match(html, /Publisher Studio/);
  assert.match(html, /Unsaved session/);
  assert.match(html, /aria-disabled="true"[^>]*>.*Deploy/s);
  assert.match(html, /Live preview/);
  assert.match(html, /Your order unlocked a 1 month free trial\./);
  assert.match(html, /aria-label="Powered by Disco Network"/);
  assert.match(html, /ow-powered-by-name">Disco Network<\/span>/);
  assert.match(html, /Morrow/);
  assert.match(html, /premium trekking club membership/i);
  assert.match(html, /Use my benefit/);
  assert.doesNotMatch(html, /\$20 off/);
  assert.match(html, /Latest event/);
  assert.doesNotMatch(html, /class="demo-controller"/);
});

test("keeps configuration session-only and covers every widget state", async () => {
  const [configurator, widget, config, css, packageJson] = await Promise.all([
    readFile(new URL("../components/configurator.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/offer-widget.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/widget-config.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(configurator, /createDefaultWidgetConfiguration/);
  assert.match(configurator, /getUploadedAssets\(config\)/);
  assert.match(configurator, /URL\.revokeObjectURL/);
  assert.match(configurator, /useState<PreviewState>\("all"\)/);
  assert.match(widget, /preview-state-canvas/);
  assert.match(widget, /<OfferLogo asset=\{offer\.image\}/);
  assert.match(widget, /Choose one perk to claim\./);
  assert.match(widget, /ow-button-primary ow-alternative-action/);
  assert.match(widget, /ow-alternative-divider/);
  assert.doesNotMatch(widget, /ow-partner-name|Also unlocked/);
  assert.doesNotMatch(widget, /Choose this benefit/);
  assert.doesNotMatch(widget, /ow-eyebrow/);
  assert.doesNotMatch(config, /\beyebrow:/);
  assert.match(widget, /className="ow-button ow-button-quiet"[^\n]*Return to order/);
  assert.match(widget, /className="ow-button ow-button-quiet"[^\n]*Undo/);
  assert.doesNotMatch(widget, /ow-text-action/);
  assert.doesNotMatch(css, /ow-text-action/);
  assert.doesNotMatch(configurator, /localStorage|sessionStorage/);
  assert.doesNotMatch(widget, /localStorage|sessionStorage/);
  assert.match(configurator, />Beta<\/Badge>/);
  assert.match(configurator, /Codex CLI connected/);
  assert.match(configurator, />Container radius</);
  assert.match(configurator, />Container stroke</);
  assert.match(configurator, />Button radius</);
  assert.match(configurator, /label="Secondary Border"/);
  assert.match(configurator, />Secondary stroke</);
  assert.match(css, /\.studio-theme-image-copy[^}]*font-size:\s*11px/);
  assert.match(configurator, /aria-label="Clear uploaded screenshot"/);
  assert.doesNotMatch(configurator, /Try another|>\s*Discard\s*</);
  assert.doesNotMatch(configurator, /Reading design/);
  assert.match(css, /@keyframes studio-image-shimmer/);

  for (const state of ["default", "loading", "recovery", "claimed", "error", "empty", "exit"]) {
    assert.match(config, new RegExp(`\\b${state}:`));
    assert.match(widget, new RegExp(`state === ["']${state}["']`));
  }

  assert.match(config, /alternativeOffers: \[/);
  assert.match(config, /rejectionFlow: "alternatives"/);
  assert.match(config, /claimMode: "coupon"/);
  assert.match(config, /alignment: "left"/);
  assert.match(config, /containerRadius:\s*0/);
  assert.match(config, /secondaryButtonBorder:\s*"#d8d3c9"/);
  assert.match(config, /containerBorderWidth:\s*0/);
  assert.match(config, /buttonRadius:\s*0/);
  assert.match(config, /secondaryButtonBorderWidth:\s*0/);
  assert.match(configurator, /Logo above centered copy/);
  assert.match(widget, /ow-alignment-/);
  assert.match(widget, /"--ow-container-radius"/);
  assert.match(widget, /"--ow-container-stroke-width"/);
  assert.match(widget, /"--ow-button-radius"/);
  assert.match(widget, /"--ow-secondary-button-border"/);
  assert.match(widget, /"--ow-secondary-button-stroke-width"/);
  assert.match(css, /\.ow-button\s*\{[^}]*border-radius:\s*var\(--ow-button-radius\)/);
  assert.match(css, /\.ow-button-quiet\s*\{[^}]*var\(--ow-secondary-button-stroke-width\)[^}]*var\(--ow-secondary-button-border\)/);
  assert.match(css, /\.ow-density-compact \.ow-panel\s*\{[^}]*var\(--ow-container-stroke-width\)[^}]*border-radius:\s*var\(--ow-container-radius\)/);
  assert.match(css, /\.ow-artwork\s*\{[^}]*border-radius:\s*0/);
  assert.match(css, /\.ow-status-icon\s*\{[^}]*border:\s*1px solid/);
  assert.doesNotMatch(css, /--ow-radius|--ow-stroke-width/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.preview-mobile/);
  assert.match(css, /outline:\s*1px solid rgba\(0, 0, 0, \.1\)/);
  assert.doesNotMatch(css, /transition:\s*all\b/);
  assert.match(packageJson, /"@base-ui\/react"/);
  assert.match(packageJson, /"lucide-react"/);
});

test("extract-theme route degrades gracefully without any credentials", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-theme`);
  const { default: worker } = await import(workerUrl.href);

  // Force the route to find no env var and no local CLI auth, regardless of
  // the machine's real credentials.
  const previousKey = process.env.OPENAI_API_KEY;
  const previousCodexKey = process.env.CODEX_API_KEY;
  const previousAnthropicKey = process.env.ANTHROPIC_API_KEY;
  const previousHome = process.env.HOME;
  delete process.env.OPENAI_API_KEY;
  delete process.env.CODEX_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  process.env.HOME = "/nonexistent-codebuff-home";

  try {
    const response = await worker.fetch(
      new Request("http://localhost/api/extract-theme", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: "data:image/png;base64,iVBORw0KGgo=" }),
      }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );

    assert.equal(response.status, 501);
    const payload = await response.json();
    assert.match(payload.error ?? "", /OPENAI_API_KEY/);
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previousKey;
    if (previousCodexKey === undefined) delete process.env.CODEX_API_KEY;
    else process.env.CODEX_API_KEY = previousCodexKey;
    if (previousAnthropicKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previousAnthropicKey;
    if (previousHome === undefined) delete process.env.HOME;
    else process.env.HOME = previousHome;
  }
});

test("local Codex theme extraction sends the screenshot to the CLI and validates its theme", async () => {
  const imageBytes = Buffer.from("fake-png-data");
  const image = `data:image/png;base64,${imageBytes.toString("base64")}`;
  let invocation = null;
  const theme = await extractThemeWithCodex(image, "codex", async (args) => {
    invocation = args;
    const imageIndex = args.indexOf("--image");
    assert.ok(imageIndex > 1);
    assert.equal(args[0], "exec");
    assert.match(args[1], /order-completed page/);
    assert.match(args[1], /containerRadius/);
    assert.match(args[1], /secondaryButtonBorder/);
    assert.match(args[1], /secondaryButtonBorderWidth/);
    assert.equal(args.at(-2), "--image");
    assert.deepEqual(await readFile(args.at(-1)), imageBytes);
    assert.ok(args.includes("--ignore-user-config"));
    assert.ok(args.includes("read-only"));
    return JSON.stringify({
      page: "#f5f1e8",
      surface: "#ffffff",
      softSurface: "#eee9df",
      text: "#201d18",
      mutedText: "#746f65",
      primary: "#315943",
      primaryText: "#ffffff",
      accent: "#d9a441",
      border: "#d8d1c5",
      secondaryButtonBorder: "#a7a097",
      containerRadius: 12,
      containerBorderWidth: 1,
      buttonRadius: 8,
      secondaryButtonBorderWidth: 2,
      primaryFont: "fraunces",
      secondaryFont: "dm-sans",
      headingFontWeight: 600,
      secondaryFontWeight: 400,
    });
  });

  assert.ok(invocation);
  assert.equal(theme.primary, "#315943");
  assert.equal(theme.primaryFont, "fraunces");
  assert.equal(theme.containerRadius, 12);
  assert.equal(theme.secondaryButtonBorder, "#a7a097");
  assert.equal(theme.containerBorderWidth, 1);
  assert.equal(theme.buttonRadius, 8);
  assert.equal(theme.secondaryButtonBorderWidth, 2);
});

test("theme extraction normalizes container and button geometry independently", () => {
  assert.match(THEME_EXTRACTION_PROMPT, /Do not infer container geometry from buttons/);

  const theme = parseExtractedTheme({
    containerRadius: 25,
    containerBorderWidth: 1.4,
    buttonRadius: 7,
    secondaryButtonBorderWidth: -2,
  });

  assert.deepEqual(theme, {
    containerRadius: 24,
    containerBorderWidth: 1,
    buttonRadius: 8,
    secondaryButtonBorderWidth: 0,
  });
});

test("local model status requires both the Codex CLI and an authenticated session", async () => {
  const calls = [];
  const binary = await resolveCodexBinary(async (candidate, args) => {
    calls.push([candidate, ...args]);
  });

  assert.equal(binary, "codex");
  assert.deepEqual(calls, [
    ["codex", "--version"],
    ["codex", "login", "status"],
  ]);
});
