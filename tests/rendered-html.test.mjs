import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
  assert.match(html, /Post-purchase widget configurator/);
  assert.match(html, /Unsaved session/);
  assert.match(html, /aria-disabled="true"[^>]*>.*Integrate/s);
  assert.match(html, /Live preview/);
  assert.match(html, /Your order unlocked a trail perk\./);
  assert.match(html, /Powered by Disco/);
  assert.match(html, /src="\/disco-logo\.png"/);
  assert.match(html, /Morrow/);
  assert.match(html, /You’ve earned \$20 toward/);
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
  assert.doesNotMatch(configurator, /localStorage|sessionStorage/);
  assert.doesNotMatch(widget, /localStorage|sessionStorage/);

  for (const state of ["default", "loading", "recovery", "claimed", "error", "empty", "exit"]) {
    assert.match(config, new RegExp(`\\b${state}:`));
    assert.match(widget, new RegExp(`state === ["']${state}["']`));
  }

  assert.match(config, /alternativeOffers: \[/);
  assert.match(config, /rejectionFlow: "alternatives"/);
  assert.match(config, /claimMode: "coupon"/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.preview-mobile/);
  assert.match(css, /outline:\s*1px solid rgba\(0, 0, 0, \.1\)/);
  assert.doesNotMatch(css, /transition:\s*all\b/);
  assert.match(packageJson, /"@base-ui\/react"/);
  assert.match(packageJson, /"lucide-react"/);
});
