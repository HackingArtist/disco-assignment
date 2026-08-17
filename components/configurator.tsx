"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Activity,
  AlignCenter,
  AlignLeft,
  Braces,
  Check,
  LockKeyhole,
  Maximize2,
  Minimize2,
  Monitor,
  RotateCcw,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";

import { PreviewCanvas } from "@/components/offer-widget";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ColorPicker } from "@/components/ui/color-picker";
import { Field, FieldControl, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  contrastRatio,
  createDefaultWidgetConfiguration,
  googleFontLabels,
  getUploadedAssets,
  isValidHex,
  widgetStateLabels,
  type GoogleFont,
  type PreviewViewport,
  type PreviewState,
  type WidgetConfiguration,
  type WidgetEvent,
  type WidgetState,
  type WidgetTheme,
} from "@/lib/widget-config";

interface ConfigPanelProps {
  config: WidgetConfiguration;
  setConfig: React.Dispatch<React.SetStateAction<WidgetConfiguration>>;
  idPrefix: string;
}

interface ChoiceOption<Value extends string> {
  value: Value;
  label: string;
  description: string;
  icon: LucideIcon;
}

function ChoiceCards<Value extends string>({
  id,
  label,
  value,
  options,
  onValueChange,
}: {
  id: string;
  label: string;
  value: Value;
  options: readonly ChoiceOption<Value>[];
  onValueChange: (value: Value) => void;
}) {
  return (
    <div id={id} className="studio-choice-cards" role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const selected = value === option.value;
        const Icon = option.icon;
        return (
          <label key={option.value} className="studio-choice-card" data-selected={selected ? "true" : undefined}>
            <input
              className="sr-only"
              type="radio"
              name={id}
              value={option.value}
              checked={selected}
              onChange={() => onValueChange(option.value)}
            />
            <span className="studio-choice-card-icon" aria-hidden="true"><Icon /></span>
            <span className="studio-choice-card-copy">
              <span className="studio-choice-card-label">{option.label}</span>
              <span className="studio-choice-card-description">{option.description}</span>
            </span>
            <span className="studio-choice-card-check" aria-hidden="true"><Check /></span>
          </label>
        );
      })}
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="studio-section-heading">
      <h2>{title}</h2>
    </div>
  );
}

function cssSizeToNumber(value: string): string {
  const size = value.trim();
  const match = /^(\d*\.?\d+)(px|rem|em)?$/i.exec(size);
  if (!match) return "";
  const number = Number(match[1]);
  if (!Number.isFinite(number)) return "";
  const unit = match[2]?.toLowerCase();
  if (unit === "rem" || unit === "em") return String(number * 16);
  return String(number);
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const valid = isValidHex(value);
  return (
    <Field className="studio-field">
      <div className="studio-field-heading">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
      </div>
      <FieldControl>
        <div className="color-input-row">
          <ColorPicker
            value={(valid ? value : "#000000") as `#${string}`}
            type="hex"
            onValueChange={(color) => onChange(color.hex)}
            align="start"
          >
            <button
              id={`${id}-swatch`}
              className="color-swatch"
              type="button"
              style={{ "--color-swatch-value": valid ? value : "#000000" } as React.CSSProperties}
              aria-label={`Open ${label.toLowerCase()} color picker`}
            >
              <span aria-hidden="true" />
            </button>
          </ColorPicker>
          <InputGroup className="studio-input-group">
            <InputGroupAddon align="inline-start">#</InputGroupAddon>
            <InputGroupInput
              id={id}
              value={value.replace(/^#/, "")}
              onChange={(event) => onChange(`#${event.target.value}`)}
              aria-invalid={!valid}
              maxLength={6}
              autoComplete="off"
              spellCheck={false}
              className="studio-mono-input"
            />
          </InputGroup>
        </div>
      </FieldControl>
      {!valid && <FieldError className="studio-error">Use a six-digit hex value.</FieldError>}
    </Field>
  );
}

function formatCssDeclarations(source: string, indent = ""): string {
  const withSeparatedComments = source.replace(/\/\*[\s\S]*?\*\//g, (comment) => `${comment};`);
  return withSeparatedComments
    .split(";")
    .map((rawDeclaration) => {
      const declaration = rawDeclaration.trim();
      if (!declaration) return "";
      if (declaration.startsWith("/*") && declaration.endsWith("*/")) {
        return `${indent}${declaration}`;
      }
      const separator = declaration.indexOf(":");
      if (separator < 1) return `${indent}${declaration}`;
      const property = declaration.slice(0, separator).trim();
      const value = declaration.slice(separator + 1).trim().replace(/\s+/g, " ");
      return `${indent}${property}: ${value};`;
    })
    .filter(Boolean)
    .join("\n");
}

function formatButtonCss(source: string): string {
  if (!source.trim()) return "";
  const statePattern = /(?:&\s*)?:(hover|active|focus-visible|focus|disabled)\s*\{([^{}]*)\}/gi;
  const states = Array.from(source.matchAll(statePattern));
  const base = formatCssDeclarations(source.replace(statePattern, ""));
  const blocks = states.map((match) => {
    const declarations = formatCssDeclarations(match[2] ?? "", "  ");
    return `:${match[1]?.toLowerCase()} {\n${declarations}\n}`;
  });
  return [base, ...blocks].filter(Boolean).join("\n\n");
}

function highlightCssValue(value: string, lineIndex: number): ReactNode[] {
  const tokenPattern = /(#[\da-f]{3,8}\b|(?:rgba?|hsla?|var|calc|clamp|min|max|linear-gradient|radial-gradient|color-mix|brightness|saturate|blur)\([^;]*?\)|-?\d*\.?\d+(?:px|rem|em|%|ms|s|deg)?\b|\b(?:transparent|currentColor|none|solid|dashed|ease|ease-in|ease-out|uppercase|lowercase|pointer|not-allowed)\b)/gi;
  const parts: ReactNode[] = [];
  let cursor = 0;
  let tokenIndex = 0;

  for (const match of value.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push(value.slice(cursor, index));
    const token = match[0];
    const className = token.startsWith("#") || /^(?:rgb|hsl)/i.test(token)
      ? "studio-token-color"
      : /^-?\d/.test(token)
        ? "studio-token-number"
        : token.includes("(")
          ? "studio-token-function"
          : "studio-token-keyword";
    parts.push(<span className={className} key={`${lineIndex}-${tokenIndex}`}>{token}</span>);
    cursor = index + token.length;
    tokenIndex += 1;
  }
  if (cursor < value.length) parts.push(value.slice(cursor));
  return parts;
}

function highlightCss(source: string): ReactNode[] {
  return source.split("\n").map((line, lineIndex) => {
    const trimmed = line.trim();
    const indentation = line.match(/^\s*/)?.[0] ?? "";
    const declaration = /^(\s*)(--?[\w-]+)(\s*:\s*)(.*?)(;?)$/.exec(line);
    const selector = /^(\s*)(:[\w-]+)(\s*)(\{)$/.exec(line);

    let content: ReactNode = line;
    if (trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      content = <span className="studio-token-comment">{line}</span>;
    } else if (selector) {
      content = <>{selector[1]}<span className="studio-token-selector">{selector[2]}</span>{selector[3]}<span className="studio-token-punctuation">{selector[4]}</span></>;
    } else if (trimmed === "}") {
      content = <>{indentation}<span className="studio-token-punctuation">{"}"}</span></>;
    } else if (declaration) {
      content = <>{declaration[1]}<span className={declaration[2]?.startsWith("--") ? "studio-token-variable" : "studio-token-property"}>{declaration[2]}</span><span className="studio-token-punctuation">{declaration[3]}</span><span className="studio-token-value">{highlightCssValue(declaration[4] ?? "", lineIndex)}</span><span className="studio-token-punctuation">{declaration[5]}</span></>;
    }
    return <span key={lineIndex}>{content}{"\n"}</span>;
  });
}

function CssEditor({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const highlightRef = useRef<HTMLPreElement>(null);
  const format = () => {
    const formatted = formatButtonCss(value);
    if (formatted !== value) onChange(formatted);
  };
  const lineCount = value ? value.split(/\r?\n/).length : 1;

  return (
    <Field className="studio-field">
      <div className="studio-field-heading">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
      </div>
      <FieldControl>
        <div className="studio-code-editor">
          <div className="studio-code-toolbar">
            <div className="studio-code-language">
              <span className="studio-code-dots" aria-hidden="true"><i /><i /><i /></span>
              <Braces aria-hidden="true" />
              <span>CSS</span>
              <small>{lineCount} {lineCount === 1 ? "line" : "lines"}</small>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={format}>
              Format
            </Button>
          </div>
          <div className="studio-code-body">
            <pre ref={highlightRef} className="studio-code-highlight" aria-hidden="true">{highlightCss(value)}</pre>
            <Textarea
              id={id}
              className="studio-css-input"
              value={value}
              rows={9}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder={placeholder}
              onChange={(event) => onChange(event.target.value)}
              onBlur={format}
              onScroll={(event) => {
                if (!highlightRef.current) return;
                highlightRef.current.scrollTop = event.currentTarget.scrollTop;
                highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
              }}
              onKeyDown={(event) => {
                if (event.key !== "Tab") return;
                event.preventDefault();
                const textarea = event.currentTarget;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const nextValue = `${value.slice(0, start)}  ${value.slice(end)}`;
                onChange(nextValue);
                window.requestAnimationFrame(() => textarea.setSelectionRange(start + 2, start + 2));
              }}
            />
          </div>
        </div>
      </FieldControl>
    </Field>
  );
}

async function readImageAsDataUrl(file: File): Promise<string> {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that image."));
      img.src = sourceUrl;
    });
    const maxDimension = 1024;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable in this browser.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function ThemeFromImage({
  idPrefix,
  onApply,
}: {
  idPrefix: string;
  onApply: (patch: Partial<WidgetTheme>) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<{ patch: Partial<WidgetTheme>; colors: string[]; fonts: string } | null>(null);
  const [applied, setApplied] = useState(false);
  const [localModelStatus, setLocalModelStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const extractionControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/extract-theme/status", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json().catch(() => null) as { connected?: boolean } | null;
        setLocalModelStatus(response.ok && payload?.connected ? "connected" : "disconnected");
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setLocalModelStatus("disconnected");
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => () => extractionControllerRef.current?.abort(), []);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Upload a PNG, JPEG, or WebP screenshot.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Keep screenshots under 10 MB.");
      return;
    }
    setError("");
    let extractionController: AbortController | null = null;
    try {
      const dataUrl = await readImageAsDataUrl(file);
      extractionControllerRef.current?.abort();
      extractionController = new AbortController();
      extractionControllerRef.current = extractionController;
      setPreview(dataUrl);
      setBusy(true);
      setPending(null);
      setApplied(false);
      const response = await fetch("/api/extract-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
        signal: extractionController.signal,
      });
      const payload = (await response.json().catch(() => null)) as {
        theme?: Partial<WidgetTheme>;
        error?: string;
      } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not read the image. Try again.");
      }
      const patch = payload?.theme ?? {};
      const headingLabel = patch.primaryFont ? googleFontLabels[patch.primaryFont] : "";
      const bodyLabel = patch.secondaryFont ? googleFontLabels[patch.secondaryFont] : "";
      setPending({
        patch,
        colors: [patch.page, patch.surface, patch.softSurface, patch.text, patch.primary, patch.accent, patch.border, patch.secondaryButtonBorder]
          .filter((color): color is string => Boolean(color)),
        fonts: [headingLabel, bodyLabel].filter(Boolean).join(" + "),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Could not read the image. Try again.");
    } finally {
      if (extractionControllerRef.current === extractionController) {
        extractionControllerRef.current = null;
        setBusy(false);
      }
    }
  };

  const approve = () => {
    if (!pending) return;
    onApply(pending.patch);
    setApplied(true);
  };

  const clear = () => {
    extractionControllerRef.current?.abort();
    extractionControllerRef.current = null;
    setPreview(null);
    setBusy(false);
    setPending(null);
    setApplied(false);
    setError("");
  };

  const swatches = (colors: string[]) => (
    <div className="studio-palette" aria-label="Extracted palette">
      {colors.map((color, index) => (
        <span key={`${color}-${index}`} className="studio-palette-swatch" style={{ background: color }} title={color} />
      ))}
    </div>
  );

  return (
    <section className="studio-theme-group studio-theme-image-group" aria-labelledby={`${idPrefix}-heading-from-image`}>
      <div className="studio-theme-image-intro">
        <div className="studio-theme-group-heading studio-theme-image-heading">
          <h3 id={`${idPrefix}-heading-from-image`}>Detect theme from image</h3>
          <div className="studio-theme-badges">
            <Badge className="studio-theme-badge studio-theme-beta-badge" variant="secondary">Beta</Badge>
            <Badge
              className="studio-theme-badge studio-theme-connection-badge"
              variant="outline"
              data-status={localModelStatus}
              aria-live="polite"
              title="Local Codex CLI connection"
            >
              <span className="studio-theme-status-dot" aria-hidden="true" />
              {localModelStatus === "checking"
                ? "Checking Codex CLI"
                : localModelStatus === "connected"
                  ? "Codex CLI connected"
                  : "Codex CLI not connected"}
            </Badge>
          </div>
        </div>
        <p className="studio-theme-image-copy">
          Upload a UI screenshot. The studio reads its color and typography tokens, then you review before applying.
        </p>
      </div>
      {preview ? (
        <div className="studio-theme-image-result">
          <div className="studio-theme-image-preview" data-loading={busy || undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="studio-theme-image-thumb" src={preview} alt="Theme source screenshot" />
            <button
              className="studio-theme-image-clear"
              type="button"
              onClick={clear}
              aria-label="Clear uploaded screenshot"
            >
              <X aria-hidden="true" />
            </button>
          </div>
          {!busy && pending && (
            <div className="studio-theme-image-meta">
              {!applied ? (
                <>
                  {swatches(pending.colors)}
                  {pending.fonts && <p className="studio-theme-image-status">Suggested {pending.fonts} typography.</p>}
                  <div className="asset-actions">
                    <Button type="button" size="sm" onClick={approve}>
                      <Check data-icon="inline-start" /> Apply theme
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {swatches(pending.colors)}
                  <p className="studio-theme-image-status studio-theme-image-status-success">Theme applied.</p>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <label className="asset-upload-button studio-theme-image-upload" htmlFor={`${idPrefix}-theme-image`}>
            <Sparkles aria-hidden="true" /> Upload screenshot
          </label>
          <input
            id={`${idPrefix}-theme-image`}
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFile}
          />
        </>
      )}
      {error && <p className="studio-error">{error}</p>}
    </section>
  );
}

function SwitchRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="studio-switch-row">
      <div>
        <Label htmlFor={id}>{label}</Label>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ConfigPanel({ config, setConfig, idPrefix }: ConfigPanelProps) {
  const updateTheme = <Key extends keyof WidgetConfiguration["theme"]>(
    key: Key,
    value: WidgetConfiguration["theme"][Key],
  ) => setConfig((current) => ({
    ...current,
    theme: { ...current.theme, [key]: value },
  }));
  const updateBehavior = <Key extends keyof WidgetConfiguration["behavior"]>(
    key: Key,
    value: WidgetConfiguration["behavior"][Key],
  ) => setConfig((current) => ({
    ...current,
    behavior: { ...current.behavior, [key]: value },
  }));
  const applyThemePatch = (patch: Partial<WidgetTheme>) => {
    setConfig((current) => ({ ...current, theme: { ...current.theme, ...patch } }));
  };
  const textContrast = contrastRatio(config.theme.text, config.theme.surface);
  const buttonContrast = contrastRatio(config.theme.primaryText, config.theme.primary);

  return (
    <Tabs defaultValue="info" className="studio-config-tabs">
      <h1 className="sr-only">Offer widget</h1>
      <TabsList className="studio-tabs-list">
        <TabsTrigger value="info">Info</TabsTrigger>
        <TabsTrigger value="theme">Theme</TabsTrigger>
        <TabsTrigger value="behavior">Behavior</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="studio-tab-content">
        <div className="studio-theme-stack">
          <ThemeFromImage idPrefix={idPrefix} onApply={applyThemePatch} />
        </div>
        <SectionHeading title="Alignment" />
        <div className="studio-field-stack">
          <Field className="studio-field">
            <div className="studio-field-heading">
              <FieldLabel htmlFor={`${idPrefix}-alignment`}>Content alignment</FieldLabel>
            </div>
            <FieldControl>
              <ChoiceCards
                id={`${idPrefix}-alignment`}
                label="Content alignment"
                value={config.behavior.alignment}
                options={[
                  { value: "left", label: "Left", description: "Logo beside the copy", icon: AlignLeft },
                  { value: "center", label: "Center", description: "Logo above centered copy", icon: AlignCenter },
                ]}
                onValueChange={(value) => updateBehavior("alignment", value)}
              />
            </FieldControl>
          </Field>
          <Field className="studio-field">
            <div className="studio-field-heading">
              <FieldLabel htmlFor={`${idPrefix}-density`}>Default density</FieldLabel>
            </div>
            <FieldControl>
              <ChoiceCards
                id={`${idPrefix}-density`}
                label="Default density"
                value={config.behavior.density}
                options={[
                  { value: "compact", label: "Space-aware", description: "Fits tighter spaces", icon: Minimize2 },
                  { value: "roomy", label: "Roomy", description: "Adds more breathing room", icon: Maximize2 },
                ]}
                onValueChange={(value) => updateBehavior("density", value)}
              />
            </FieldControl>
          </Field>
        </div>
      </TabsContent>

      <TabsContent value="theme" className="studio-tab-content">
        <div className="studio-theme-stack">
          <section className="studio-theme-group" aria-labelledby={`${idPrefix}-heading-typography`}>
            <div className="studio-theme-group-heading">
              <h3 id={`${idPrefix}-heading-typography`}>Heading typography</h3>
            </div>
            <div className="studio-theme-grid">
              <ColorField id={`${idPrefix}-text`} label="Heading Text" value={config.theme.text} onChange={(value) => updateTheme("text", value)} />
              <Field className="studio-field">
                <div className="studio-field-heading">
                  <FieldLabel htmlFor={`${idPrefix}-primary-font`}>Primary Font</FieldLabel>
                </div>
                <FieldControl>
                  <Select value={config.theme.primaryFont} onValueChange={(value) => updateTheme("primaryFont", value as GoogleFont)}>
                    <SelectTrigger id={`${idPrefix}-primary-font`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(googleFontLabels) as [GoogleFont, string][]).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldControl>
              </Field>
              <Field className="studio-field">
                <div className="studio-field-heading">
                  <FieldLabel htmlFor={`${idPrefix}-heading-size`}>Font size</FieldLabel>
                </div>
                <FieldControl>
                  <InputGroup className="studio-input-group">
                    <InputGroupInput
                      id={`${idPrefix}-heading-size`}
                      list={`${idPrefix}-heading-size-options`}
                      className="studio-size-combobox"
                      inputMode="decimal"
                      value={cssSizeToNumber(config.theme.headingFontSize)}
                      placeholder="36"
                      onChange={(event) => updateTheme("headingFontSize", `${event.target.value}px`)}
                    />
                    <InputGroupAddon align="inline-end">px</InputGroupAddon>
                  </InputGroup>
                </FieldControl>
                <datalist id={`${idPrefix}-heading-size-options`}>
                  {["24", "28", "32", "36", "40", "48", "56"].map((size) => <option key={size} value={size} />)}
                </datalist>
              </Field>
              <Field className="studio-field">
                <div className="studio-field-heading">
                  <FieldLabel htmlFor={`${idPrefix}-heading-weight`}>Font weight</FieldLabel>
                </div>
                <FieldControl>
                  <Select value={String(config.theme.headingFontWeight)} onValueChange={(value) => updateTheme("headingFontWeight", Number(value))}>
                    <SelectTrigger id={`${idPrefix}-heading-weight`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[400, 500, 600, 700].map((weight) => <SelectItem key={weight} value={String(weight)}>{weight}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldControl>
              </Field>
            </div>
          </section>

          <section className="studio-theme-group" aria-labelledby={`${idPrefix}-secondary-typography`}>
            <div className="studio-theme-group-heading">
              <h3 id={`${idPrefix}-secondary-typography`}>Secondary typography</h3>
            </div>
            <div className="studio-theme-grid">
              <ColorField id={`${idPrefix}-muted-text`} label="Secondary Text" value={config.theme.mutedText} onChange={(value) => updateTheme("mutedText", value)} />
              <Field className="studio-field">
                <div className="studio-field-heading">
                  <FieldLabel htmlFor={`${idPrefix}-secondary-font`}>Secondary Font</FieldLabel>
                </div>
                <FieldControl>
                  <Select value={config.theme.secondaryFont} onValueChange={(value) => updateTheme("secondaryFont", value as GoogleFont)}>
                    <SelectTrigger id={`${idPrefix}-secondary-font`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(googleFontLabels) as [GoogleFont, string][]).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldControl>
              </Field>
              <Field className="studio-field">
                <div className="studio-field-heading">
                  <FieldLabel htmlFor={`${idPrefix}-secondary-size`}>Font size</FieldLabel>
                </div>
                <FieldControl>
                  <InputGroup className="studio-input-group">
                    <InputGroupInput
                      id={`${idPrefix}-secondary-size`}
                      list={`${idPrefix}-secondary-size-options`}
                      className="studio-size-combobox"
                      inputMode="decimal"
                      value={cssSizeToNumber(config.theme.secondaryFontSize)}
                      placeholder="14"
                      onChange={(event) => updateTheme("secondaryFontSize", `${event.target.value}px`)}
                    />
                    <InputGroupAddon align="inline-end">px</InputGroupAddon>
                  </InputGroup>
                </FieldControl>
                <datalist id={`${idPrefix}-secondary-size-options`}>
                  {["8", "9", "10", "11", "12", "14", "16"].map((size) => <option key={size} value={size} />)}
                </datalist>
              </Field>
              <Field className="studio-field">
                <div className="studio-field-heading">
                  <FieldLabel htmlFor={`${idPrefix}-secondary-weight`}>Font weight</FieldLabel>
                </div>
                <FieldControl>
                  <Select value={String(config.theme.secondaryFontWeight)} onValueChange={(value) => updateTheme("secondaryFontWeight", Number(value))}>
                    <SelectTrigger id={`${idPrefix}-secondary-weight`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[300, 400, 500, 600, 700].map((weight) => <SelectItem key={weight} value={String(weight)}>{weight}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldControl>
              </Field>
            </div>
          </section>

          <section className="studio-theme-group" aria-labelledby={`${idPrefix}-surfaces`}>
            <div className="studio-theme-group-heading">
              <h3 id={`${idPrefix}-surfaces`}>Surfaces</h3>
            </div>
            <div className="studio-theme-grid">
              <ColorField id={`${idPrefix}-surface`} label="Background" value={config.theme.surface} onChange={(value) => updateTheme("surface", value)} />
              <ColorField id={`${idPrefix}-border`} label="Container Border" value={config.theme.border} onChange={(value) => updateTheme("border", value)} />
              <Field className="studio-field">
                <div className="studio-field-heading">
                  <FieldLabel htmlFor={`${idPrefix}-container-radius`}>Container radius</FieldLabel>
                  <span className="studio-count">{config.theme.containerRadius}px</span>
                </div>
                <FieldControl>
                  <Slider id={`${idPrefix}-container-radius`} min={0} max={24} step={2} value={[config.theme.containerRadius]} onValueChange={(value) => updateTheme("containerRadius", Array.isArray(value) ? (value[0] ?? 0) : value)} />
                </FieldControl>
              </Field>
              <Field className="studio-field">
                <div className="studio-field-heading">
                  <FieldLabel htmlFor={`${idPrefix}-container-stroke-width`}>Container stroke</FieldLabel>
                  <span className="studio-count">{config.theme.containerBorderWidth}px</span>
                </div>
                <FieldControl>
                  <Slider id={`${idPrefix}-container-stroke-width`} min={0} max={4} step={1} value={[config.theme.containerBorderWidth]} onValueChange={(value) => updateTheme("containerBorderWidth", Array.isArray(value) ? (value[0] ?? 0) : value)} />
                </FieldControl>
              </Field>
            </div>
          </section>

          <section className="studio-theme-group" aria-labelledby={`${idPrefix}-buttons`}>
            <div className="studio-theme-group-heading">
              <h3 id={`${idPrefix}-buttons`}>Buttons</h3>
            </div>
            <div className="studio-theme-grid">
              <ColorField id={`${idPrefix}-primary`} label="Primary Button" value={config.theme.primary} onChange={(value) => updateTheme("primary", value)} />
              <ColorField id={`${idPrefix}-soft-surface`} label="Secondary Button" value={config.theme.softSurface} onChange={(value) => updateTheme("softSurface", value)} />
              <ColorField id={`${idPrefix}-secondary-button-border`} label="Secondary Border" value={config.theme.secondaryButtonBorder} onChange={(value) => updateTheme("secondaryButtonBorder", value)} />
              <Field className="studio-field">
                <div className="studio-field-heading">
                  <FieldLabel htmlFor={`${idPrefix}-button-radius`}>Button radius</FieldLabel>
                  <span className="studio-count">{config.theme.buttonRadius}px</span>
                </div>
                <FieldControl>
                  <Slider id={`${idPrefix}-button-radius`} min={0} max={24} step={2} value={[config.theme.buttonRadius]} onValueChange={(value) => updateTheme("buttonRadius", Array.isArray(value) ? (value[0] ?? 0) : value)} />
                </FieldControl>
              </Field>
              <Field className="studio-field">
                <div className="studio-field-heading">
                  <FieldLabel htmlFor={`${idPrefix}-secondary-button-stroke-width`}>Secondary stroke</FieldLabel>
                  <span className="studio-count">{config.theme.secondaryButtonBorderWidth}px</span>
                </div>
                <FieldControl>
                  <Slider id={`${idPrefix}-secondary-button-stroke-width`} min={0} max={4} step={1} value={[config.theme.secondaryButtonBorderWidth]} onValueChange={(value) => updateTheme("secondaryButtonBorderWidth", Array.isArray(value) ? (value[0] ?? 0) : value)} />
                </FieldControl>
              </Field>
            </div>
          </section>
        </div>
        {(textContrast < 4.5 || buttonContrast < 4.5) && (
          <Alert variant="destructive" className="studio-contrast-alert">
            <AlertTitle>Low contrast</AlertTitle>
            <AlertDescription>
              {textContrast < 4.5 ? `Text/surface ${textContrast.toFixed(1)}:1. ` : ""}
              {buttonContrast < 4.5 ? `Button ${buttonContrast.toFixed(1)}:1.` : ""}
              {" "}Aim for at least 4.5:1 for normal text.
            </AlertDescription>
          </Alert>
        )}
        <Separator />
        <SectionHeading title="Custom button CSS" />
        <div className="studio-field-stack">
          <CssEditor
            id={`${idPrefix}-primary-button-css`}
            label="Primary button CSS"
            value={config.theme.primaryButtonCss}
            placeholder={`--button-bg: #253a2a;\nbackground: var(--button-bg);\nborder-radius: 12px;\n:hover {\n  filter: brightness(.9);\n}`}
            onChange={(value) => updateTheme("primaryButtonCss", value)}
          />
          <CssEditor
            id={`${idPrefix}-secondary-button-css`}
            label="Secondary button CSS"
            value={config.theme.secondaryButtonCss}
            placeholder={`background: transparent;\nborder: 1px solid currentColor;\n:hover {\n  background: rgba(0, 0, 0, .06);\n}`}
            onChange={(value) => updateTheme("secondaryButtonCss", value)}
          />
        </div>
      </TabsContent>

      <TabsContent value="behavior" className="studio-tab-content">
        <SectionHeading title="Widget behavior" />
        <div className="studio-field-stack">
          <Field className="studio-field">
            <div className="studio-field-heading">
              <FieldLabel htmlFor={`${idPrefix}-rejection`}>After rejection</FieldLabel>
            </div>
            <FieldControl>
              <Select value={config.behavior.rejectionFlow} onValueChange={(value) => updateBehavior("rejectionFlow", value as WidgetConfiguration["behavior"]["rejectionFlow"])}>
                <SelectTrigger id={`${idPrefix}-rejection`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alternatives">Show alternatives</SelectItem>
                  <SelectItem value="dismiss">Dismiss immediately</SelectItem>
                </SelectContent>
              </Select>
            </FieldControl>
          </Field>
          <Field className="studio-field">
            <div className="studio-field-heading">
              <FieldLabel htmlFor={`${idPrefix}-claim-mode`}>After claim</FieldLabel>
            </div>
            <FieldControl>
              <Select value={config.behavior.claimMode} onValueChange={(value) => updateBehavior("claimMode", value as WidgetConfiguration["behavior"]["claimMode"])}>
                <SelectTrigger id={`${idPrefix}-claim-mode`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coupon">Coupon and shop link</SelectItem>
                  <SelectItem value="email">Email confirmation only</SelectItem>
                </SelectContent>
              </Select>
            </FieldControl>
          </Field>
          <Separator />
          <SwitchRow
            id={`${idPrefix}-show-artwork`}
            label="Show offer images"
            checked={config.behavior.showArtwork}
            onCheckedChange={(checked) => updateBehavior("showArtwork", checked)}
          />
          <SwitchRow
            id={`${idPrefix}-show-expiry`}
            label="Show expiry"
            checked={config.behavior.showExpiry}
            onCheckedChange={(checked) => updateBehavior("showExpiry", checked)}
          />
          <SwitchRow
            id={`${idPrefix}-show-disclosure`}
            label="Show disclosure"
            checked={config.behavior.showDisclosure}
            onCheckedChange={(checked) => updateBehavior("showDisclosure", checked)}
          />
        </div>
        <Alert className="studio-session-alert">
          <AlertTitle>Session-only demo</AlertTitle>
          <AlertDescription>Changes reset when this page is refreshed. Saving and integration are intentionally unavailable.</AlertDescription>
        </Alert>
      </TabsContent>
    </Tabs>
  );
}

function PreviewSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="preview-select-group">
      <span>{label}</span>
      <Select value={value} onValueChange={(nextValue) => {
        if (nextValue !== null) onValueChange(nextValue);
      }}>
        <SelectTrigger className="preview-select-trigger">
          <SelectValue>
            {(selectedValue) => options.find((option) => option.value === selectedValue)?.label ?? selectedValue}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function Configurator() {
  const [config, setConfig] = useState<WidgetConfiguration>(() => createDefaultWidgetConfiguration());
  const [previewState, setPreviewState] = useState<PreviewState>("all");
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [events, setEvents] = useState<WidgetEvent[]>(["widget_viewed"]);
  const stateOptions = useMemo(
    () => [
      { value: "all", label: "All states" },
      ...(Object.entries(widgetStateLabels) as [WidgetState, string][]).map(([value, label]) => ({ value, label })),
    ],
    [],
  );

  useEffect(() => {
    if (!window.matchMedia("(max-width: 620px)").matches) return;
    const frame = window.requestAnimationFrame(() => setPreviewViewport("mobile"));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const track = (event: WidgetEvent) => {
    setEvents((current) => [event, ...current].slice(0, 4));
  };

  const choosePreviewState = (state: PreviewState) => {
    setPreviewState(state);
    track(`demo_state:${state}`);
  };

  const reset = () => {
    getUploadedAssets(config).forEach((asset) => URL.revokeObjectURL(asset.src));
    setConfig(createDefaultWidgetConfiguration());
    setPreviewState("all");
    setPreviewViewport("desktop");
    setEvents(["widget_viewed"]);
  };

  return (
    <main className="studio-shell">
      <header className="studio-header">
        <div className="studio-brand">
          <img className="studio-mark" src="/disco-logo.png" alt="Disco logo" />
          <strong>Publisher Studio</strong>
        </div>
        <Breadcrumb className="studio-header-breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Post Purchase Offer Widget</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="studio-header-actions">
          <Badge variant="secondary" className="studio-session-badge">Unsaved session</Badge>
          <Button variant="ghost" type="button" onClick={reset}>
            <RotateCcw data-icon="inline-start" /> Reset
          </Button>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  className="locked-integration-button"
                  aria-disabled="true"
                  onClick={(event) => event.preventDefault()}
                />
              }
            >
              <LockKeyhole data-icon="inline-start" /> Deploy
            </TooltipTrigger>
            <TooltipContent side="bottom">Deployment is coming soon.</TooltipContent>
          </Tooltip>
          <Sheet>
            <SheetTrigger render={<Button className="mobile-config-trigger" variant="outline" size="icon-lg" aria-label="Open configuration" />}>
              <SlidersHorizontal />
            </SheetTrigger>
            <SheetContent side="left" className="mobile-config-sheet">
              <SheetHeader>
                <SheetTitle>Configure widget</SheetTitle>
                <SheetDescription>Changes update the preview instantly.</SheetDescription>
              </SheetHeader>
              <ScrollArea className="mobile-config-scroll">
                <ConfigPanel config={config} setConfig={setConfig} idPrefix="mobile" />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="studio-workspace">
        <aside className="studio-sidebar">
          <ScrollArea className="studio-sidebar-scroll">
            <ConfigPanel config={config} setConfig={setConfig} idPrefix="desktop" />
          </ScrollArea>
        </aside>

        <section className="studio-preview-area" aria-label="Live widget preview">
          <div className="preview-toolbar">
            <div className="preview-toolbar-leading">
              <div className="preview-title">
                <span className="preview-live-dot" />
                <strong>Live preview</strong>
              </div>
            </div>
            <div className="preview-toolbar-controls">
              <div className="preview-viewport-toggle" aria-label="Preview viewport">
                <Tooltip>
                  <TooltipTrigger render={<Button type="button" size="icon-sm" variant={previewViewport === "desktop" ? "secondary" : "ghost"} aria-label="Desktop preview" onClick={() => setPreviewViewport("desktop")} />}>
                    <Monitor />
                  </TooltipTrigger>
                  <TooltipContent>Desktop</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger render={<Button type="button" size="icon-sm" variant={previewViewport === "mobile" ? "secondary" : "ghost"} aria-label="Mobile preview" onClick={() => setPreviewViewport("mobile")} />}>
                    <Smartphone />
                  </TooltipTrigger>
                  <TooltipContent>Mobile</TooltipContent>
                </Tooltip>
              </div>
              <PreviewSelect
                label="State"
                value={previewState}
                onValueChange={(value) => choosePreviewState(value as PreviewState)}
                options={stateOptions}
              />
            </div>
          </div>

          <div className="preview-stage">
            <Card className={`preview-frame preview-frame-${previewViewport}${previewState === "all" ? " preview-frame-all" : ""}`}>
              <CardContent className="preview-frame-content">
                <PreviewCanvas
                  config={config}
                  state={previewState}
                  onStateChange={setPreviewState}
                  onEvent={track}
                  viewport={previewViewport}
                />
              </CardContent>
            </Card>
          </div>

          <div className="preview-statusbar">
            <div><Activity aria-hidden="true" /><span>Latest event</span><code>{events[0]}</code></div>
            <span>{previewViewport === "desktop" ? "1440 × 900" : "390 × 844"}</span>
          </div>
        </section>
      </div>
    </main>
  );
}
