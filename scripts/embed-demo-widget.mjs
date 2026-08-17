#!/usr/bin/env node
/**
 * Injects the Disco offer widget into public/demo/1.html.
 *
 * That file is a self-contained "bundled page" export: the real markup lives
 * JSON-encoded inside a <script type="__bundler/template"> tag, next to a few
 * megabytes of base64 assets. Hand-editing it is impractical, so this script
 * decodes the template, splices the widget in between marker comments, and
 * re-encodes. Re-running replaces the previous injection, so it is safe to run
 * after editing anything under scripts/demo-widget/ — or after re-exporting the
 * bundle (the markers just won't be there yet).
 *
 *   node scripts/embed-demo-widget.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const bundlePath = resolve(root, "public/demo/1.html");

const css = readFileSync(resolve(here, "demo-widget/widget.css"), "utf8").trim();
const js = readFileSync(resolve(here, "demo-widget/widget.js"), "utf8").trim();

// The bundle is meant to be self-contained, so partner logos get inlined
// rather than left as /public paths that only resolve when Next serves them.
const html = readFileSync(resolve(here, "demo-widget/widget.html"), "utf8")
  .trim()
  .replace(/"\/partner-logos\/([\w-]+\.svg)"/g, (_match, file) => {
    const svg = readFileSync(resolve(root, "public/partner-logos", file));
    return `"data:image/svg+xml;base64,${svg.toString("base64")}"`;
  });

const bundle = readFileSync(bundlePath, "utf8");
const lines = bundle.split("\n");

const templateLine = lines.findIndex(
  (line, index) => index > 0 && lines[index - 1].trim() === '<script type="__bundler/template">',
);
if (templateLine === -1) throw new Error("No __bundler/template script found in the bundle.");

let template = JSON.parse(lines[templateLine]);

/**
 * Replace an already-injected block, or splice a fresh one in.
 * `anchor` is [before, after]: the two halves must sit next to each other
 * exactly once in the template, and the block lands between them.
 */
function splice(source, { name, payload, anchor: [before, after], open, close }) {
  const block = `${open}\n${payload}\n${close}`;
  const existing = new RegExp(`${escapeRegExp(open)}[\\s\\S]*?${escapeRegExp(close)}`);
  if (existing.test(source)) return source.replace(existing, block);

  const anchor = before + after;
  const at = source.indexOf(anchor);
  if (at === -1) throw new Error(`Anchor for "${name}" not found in the bundled template.`);
  if (source.indexOf(anchor, at + 1) !== -1) {
    throw new Error(`Anchor for "${name}" is ambiguous — it matches more than once.`);
  }
  const cut = at + before.length;
  return source.slice(0, cut) + block + "\n" + source.slice(cut);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Drop the whole-line span from the line holding `from` through the line
 * holding `to`. A no-op once the region is gone, so re-runs stay safe.
 */
function cut(source, { name, from, to }) {
  const start = source.indexOf(from);
  if (start === -1) return source;
  const end = source.indexOf(to, start);
  if (end === -1) throw new Error(`End of the "${name}" region was not found.`);
  const lineStart = source.lastIndexOf("\n", start) + 1;
  const lineEnd = source.indexOf("\n", end + to.length);
  return source.slice(0, lineStart) + source.slice(lineEnd === -1 ? source.length : lineEnd + 1);
}

// The confirmation card keeps its delivery date + Track row, then hands the
// space below the divider to the widget.
template = cut(template, {
  name: "delivery address block and Get help button",
  from: '">Delivery address</div>',
  to: ">Get help</button>",
});

// The Autoship promo card goes away entirely.
template = cut(template, {
  name: "Autoship promo card",
  from: '<sc-if value="{{ showPromoCard }}"',
  to: "          </sc-if>",
});

// Styles ride in <helmet>, which the x-dc runtime hoists into <head>.
template = splice(template, {
  name: "widget styles",
  payload: `<style>\n${css}\n</style>`,
  anchor: ["", "</helmet>"],
  open: "<!-- ow:style:start -->",
  close: "<!-- ow:style:end -->",
});

// Markup sits inside the confirmation card, below its divider.
template = splice(template, {
  name: "widget markup",
  payload: html,
  anchor: ['<div style="height: 1px; background: #e6e2d3; margin: 26px 0;"></div>\n', ""],
  open: "<!-- ow:markup:start -->",
  close: "<!-- ow:markup:end -->",
});

// Behaviour goes outside <x-dc> so it runs as a plain script after render.
template = splice(template, {
  name: "widget behaviour",
  payload: `<script>\n${js}\n</script>`,
  anchor: ["", "</body></html>"],
  open: "<!-- ow:script:start -->",
  close: "<!-- ow:script:end -->",
});

// The loader locates its own <script> tags by scanning the raw HTML, so any
// "</" inside the encoded template has to stay escaped the way the exporter
// wrote it.
lines[templateLine] = JSON.stringify(template).replace(/<\//g, "<\\u002F");
writeFileSync(bundlePath, lines.join("\n"));

console.log(`Embedded offer widget into ${bundlePath} (template now ${template.length} chars).`);
