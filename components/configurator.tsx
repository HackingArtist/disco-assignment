"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Activity,
  Braces,
  ImageIcon,
  LayoutPanelLeft,
  Link2,
  LockKeyhole,
  Monitor,
  RotateCcw,
  SlidersHorizontal,
  Smartphone,
  Upload,
} from "lucide-react";

import { PreviewCanvas } from "@/components/offer-widget";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  isValidImageUrl,
  widgetStateLabels,
  type AssetReference,
  type GoogleFont,
  type PreviewContext,
  type PreviewViewport,
  type WidgetConfiguration,
  type WidgetEvent,
  type WidgetState,
} from "@/lib/widget-config";

interface FieldProps {
  id: string;
  label: string;
  count?: string;
  children: ReactNode;
}

interface ConfigPanelProps {
  config: WidgetConfiguration;
  setConfig: React.Dispatch<React.SetStateAction<WidgetConfiguration>>;
  idPrefix: string;
}

interface AssetFieldProps {
  id: string;
  label: string;
  asset: AssetReference;
  onChange: (asset: AssetReference) => void;
}

function Field({ id, label, count, children }: FieldProps) {
  return (
    <div className="studio-field">
      <div className="studio-field-heading">
        <Label htmlFor={id}>{label}</Label>
        {count && <span className="studio-count">{count}</span>}
      </div>
      {children}
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
    <Field id={id} label={label}>
      <div className="color-input-row">
        <input
          id={`${id}-swatch`}
          className="color-swatch"
          type="color"
          value={valid ? value : "#000000"}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} color picker`}
        />
        <Input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={!valid}
          maxLength={7}
          className="studio-mono-input"
        />
      </div>
      {!valid && <p className="studio-error">Use a six-digit hex value.</p>}
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
    <Field id={id} label={label}>
      <div className="studio-code-editor">
        <div className="studio-code-toolbar">
          <div className="studio-code-language">
            <span className="studio-code-dots" aria-hidden="true"><i /><i /><i /></span>
            <Braces aria-hidden="true" />
            <span>CSS</span>
            <small>{lineCount} {lineCount === 1 ? "line" : "lines"}</small>
          </div>
          <Button type="button" variant="ghost" size="sm" className="studio-code-format" onClick={format}>
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
    </Field>
  );
}

function AssetField({ id, label, asset, onChange }: AssetFieldProps) {
  const [error, setError] = useState("");
  const validUrl = isValidImageUrl(asset.kind === "url" ? asset.src : "");

  const replaceAsset = (next: AssetReference) => {
    if (asset.kind === "upload" && asset.src && asset.src !== next.src) {
      URL.revokeObjectURL(asset.src);
    }
    onChange(next);
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Upload a PNG, JPEG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Keep image files under 5 MB.");
      return;
    }
    setError("");
    replaceAsset({
      ...asset,
      kind: "upload",
      src: URL.createObjectURL(file),
      fileName: file.name,
    });
  };

  return (
    <div className="studio-asset-field">
      <div className="studio-field-heading">
        <Label>{label}</Label>
      </div>
      <div className="asset-actions">
        <label className="asset-upload-button" htmlFor={`${id}-upload`}>
          <Upload aria-hidden="true" /> Upload
        </label>
        <input
          id={`${id}-upload`}
          className="sr-only"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleUpload}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setError("");
            replaceAsset({ ...asset, kind: "fallback", src: "", fileName: undefined });
          }}
        >
          <ImageIcon data-icon="inline-start" /> Fallback
        </Button>
      </div>
      {asset.kind === "upload" && asset.fileName && (
        <p className="asset-file-name">{asset.fileName}</p>
      )}
      <div className="asset-url-row">
        <Link2 aria-hidden="true" />
        <Input
          id={`${id}-url`}
          value={asset.kind === "url" ? asset.src : ""}
          placeholder="https://…"
          aria-label={`${label} URL`}
          aria-invalid={!validUrl}
          onChange={(event) => {
            const src = event.target.value;
            setError("");
            replaceAsset({
              ...asset,
              kind: src ? "url" : "fallback",
              src,
              fileName: undefined,
            });
          }}
        />
      </div>
      {!validUrl && <p className="studio-error">Use a complete http:// or https:// image URL.</p>}
      {error && <p className="studio-error">{error}</p>}
      <Field id={`${id}-alt`} label="Image description">
        <Input
          id={`${id}-alt`}
          value={asset.alt}
          maxLength={90}
          onChange={(event) => onChange({ ...asset, alt: event.target.value })}
        />
      </Field>
    </div>
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
  const updateMerchant = <Key extends keyof WidgetConfiguration["merchant"]>(
    key: Key,
    value: WidgetConfiguration["merchant"][Key],
  ) => setConfig((current) => ({
    ...current,
    merchant: { ...current.merchant, [key]: value },
  }));
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
  const textContrast = contrastRatio(config.theme.text, config.theme.surface);
  const buttonContrast = contrastRatio(config.theme.primaryText, config.theme.primary);

  return (
    <Tabs defaultValue="info" className="studio-config-tabs">
      <div className="studio-panel-header">
        <div>
          <h1>Offer widget</h1>
        </div>
      </div>
      <TabsList className="studio-tabs-list">
        <TabsTrigger value="info">Info</TabsTrigger>
        <TabsTrigger value="theme">Theme</TabsTrigger>
        <TabsTrigger value="behavior">Behavior</TabsTrigger>
      </TabsList>

      <TabsContent value="info" className="studio-tab-content">
        <SectionHeading title="Merchant identity" />
        <div className="studio-field-stack">
          <AssetField
            id={`${idPrefix}-merchant-logo`}
            label="Merchant logo"
            asset={config.merchant.logo}
            onChange={(logo) => updateMerchant("logo", logo)}
          />
          <Field id={`${idPrefix}-density`} label="Default density">
            <Select value={config.behavior.density} onValueChange={(value) => updateBehavior("density", value as WidgetConfiguration["behavior"]["density"])}>
              <SelectTrigger id={`${idPrefix}-density`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Space-aware</SelectItem>
                <SelectItem value="roomy">Roomy</SelectItem>
              </SelectContent>
            </Select>
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
              <Field id={`${idPrefix}-primary-font`} label="Primary Font">
                <Select value={config.theme.primaryFont} onValueChange={(value) => updateTheme("primaryFont", value as GoogleFont)}>
                  <SelectTrigger id={`${idPrefix}-primary-font`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(googleFontLabels) as [GoogleFont, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id={`${idPrefix}-heading-size`} label="Font size">
                <Input
                  id={`${idPrefix}-heading-size`}
                  list={`${idPrefix}-heading-size-options`}
                  className="studio-size-combobox"
                  value={config.theme.headingFontSize}
                  placeholder="36px"
                  onChange={(event) => updateTheme("headingFontSize", event.target.value)}
                />
                <datalist id={`${idPrefix}-heading-size-options`}>
                  {["24px", "28px", "32px", "36px", "40px", "48px", "56px", "2.25rem"].map((size) => <option key={size} value={size} />)}
                </datalist>
              </Field>
              <Field id={`${idPrefix}-heading-weight`} label="Font weight">
                <Select value={String(config.theme.headingFontWeight)} onValueChange={(value) => updateTheme("headingFontWeight", Number(value))}>
                  <SelectTrigger id={`${idPrefix}-heading-weight`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[400, 500, 600, 700].map((weight) => <SelectItem key={weight} value={String(weight)}>{weight}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          <section className="studio-theme-group" aria-labelledby={`${idPrefix}-secondary-typography`}>
            <div className="studio-theme-group-heading">
              <h3 id={`${idPrefix}-secondary-typography`}>Secondary typography</h3>
            </div>
            <div className="studio-theme-grid">
              <ColorField id={`${idPrefix}-muted-text`} label="Secondary Text" value={config.theme.mutedText} onChange={(value) => updateTheme("mutedText", value)} />
              <Field id={`${idPrefix}-secondary-font`} label="Secondary Font">
                <Select value={config.theme.secondaryFont} onValueChange={(value) => updateTheme("secondaryFont", value as GoogleFont)}>
                  <SelectTrigger id={`${idPrefix}-secondary-font`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(googleFontLabels) as [GoogleFont, string][]).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id={`${idPrefix}-secondary-size`} label="Font size">
                <Input
                  id={`${idPrefix}-secondary-size`}
                  list={`${idPrefix}-secondary-size-options`}
                  className="studio-size-combobox"
                  value={config.theme.secondaryFontSize}
                  placeholder="14px"
                  onChange={(event) => updateTheme("secondaryFontSize", event.target.value)}
                />
                <datalist id={`${idPrefix}-secondary-size-options`}>
                  {["8px", "9px", "10px", "11px", "12px", "14px", "16px", "1rem"].map((size) => <option key={size} value={size} />)}
                </datalist>
              </Field>
              <Field id={`${idPrefix}-secondary-weight`} label="Font weight">
                <Select value={String(config.theme.secondaryFontWeight)} onValueChange={(value) => updateTheme("secondaryFontWeight", Number(value))}>
                  <SelectTrigger id={`${idPrefix}-secondary-weight`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[300, 400, 500, 600, 700].map((weight) => <SelectItem key={weight} value={String(weight)}>{weight}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          <section className="studio-theme-group" aria-labelledby={`${idPrefix}-surfaces`}>
            <div className="studio-theme-group-heading">
              <h3 id={`${idPrefix}-surfaces`}>Surfaces</h3>
            </div>
            <div className="studio-theme-grid">
              <ColorField id={`${idPrefix}-surface`} label="Background" value={config.theme.surface} onChange={(value) => updateTheme("surface", value)} />
              <ColorField id={`${idPrefix}-border`} label="Border" value={config.theme.border} onChange={(value) => updateTheme("border", value)} />
              <ColorField id={`${idPrefix}-primary`} label="Primary Button" value={config.theme.primary} onChange={(value) => updateTheme("primary", value)} />
              <ColorField id={`${idPrefix}-soft-surface`} label="Secondary Button" value={config.theme.softSurface} onChange={(value) => updateTheme("softSurface", value)} />
              <Field id={`${idPrefix}-radius`} label="Corner radius" count={`${config.theme.radius}px`}>
                <Slider id={`${idPrefix}-radius`} min={0} max={20} step={2} value={[config.theme.radius]} onValueChange={(value) => updateTheme("radius", Array.isArray(value) ? (value[0] ?? 0) : value)} />
              </Field>
              <Field id={`${idPrefix}-stroke-width`} label="Stroke" count={`${config.theme.borderWidth}px`}>
                <Slider id={`${idPrefix}-stroke-width`} min={0} max={4} step={1} value={[config.theme.borderWidth]} onValueChange={(value) => updateTheme("borderWidth", Array.isArray(value) ? (value[0] ?? 1) : value)} />
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
          <Field id={`${idPrefix}-rejection`} label="After rejection">
            <Select value={config.behavior.rejectionFlow} onValueChange={(value) => updateBehavior("rejectionFlow", value as WidgetConfiguration["behavior"]["rejectionFlow"])}>
              <SelectTrigger id={`${idPrefix}-rejection`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="alternatives">Show alternatives</SelectItem>
                <SelectItem value="dismiss">Dismiss immediately</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field id={`${idPrefix}-claim-mode`} label="After claim">
            <Select value={config.behavior.claimMode} onValueChange={(value) => updateBehavior("claimMode", value as WidgetConfiguration["behavior"]["claimMode"])}>
              <SelectTrigger id={`${idPrefix}-claim-mode`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="coupon">Coupon and shop link</SelectItem>
                <SelectItem value="email">Email confirmation only</SelectItem>
              </SelectContent>
            </Select>
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
        <SelectTrigger className="preview-select-trigger"><SelectValue /></SelectTrigger>
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
  const [previewState, setPreviewState] = useState<WidgetState>("default");
  const [previewContext, setPreviewContext] = useState<PreviewContext>("isolated");
  const [previewViewport, setPreviewViewport] = useState<PreviewViewport>("desktop");
  const [events, setEvents] = useState<WidgetEvent[]>(["widget_viewed"]);
  const stateOptions = useMemo(
    () => (Object.entries(widgetStateLabels) as [WidgetState, string][]).map(([value, label]) => ({ value, label })),
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

  const choosePreviewState = (state: WidgetState) => {
    setPreviewState(state);
    track(`demo_state:${state}`);
  };

  const reset = () => {
    getUploadedAssets(config).forEach((asset) => URL.revokeObjectURL(asset.src));
    setConfig(createDefaultWidgetConfiguration());
    setPreviewState("default");
    setPreviewContext("isolated");
    setPreviewViewport("desktop");
    setEvents(["widget_viewed"]);
  };

  return (
    <main className="studio-shell">
      <header className="studio-header">
        <div className="studio-brand">
          <span className="studio-mark" aria-hidden="true"><LayoutPanelLeft /></span>
          <div>
            <strong>Disco Offer Studio</strong>
            <span>Post-purchase widget configurator</span>
          </div>
        </div>
        <div className="studio-header-actions">
          <Badge variant="secondary" className="studio-session-badge">Unsaved session</Badge>
          <Button variant="ghost" size="sm" type="button" onClick={reset}>
            <RotateCcw data-icon="inline-start" /> Reset
          </Button>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="lg"
                  className="locked-integration-button"
                  aria-disabled="true"
                  onClick={(event) => event.preventDefault()}
                />
              }
            >
              <LockKeyhole data-icon="inline-start" /> Integrate
            </TooltipTrigger>
            <TooltipContent side="bottom">Integration is coming soon.</TooltipContent>
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
              <div className="preview-context-toggle" aria-label="Preview context">
                <Button
                  type="button"
                  size="sm"
                  variant={previewContext === "context" ? "secondary" : "ghost"}
                  onClick={() => setPreviewContext("context")}
                >
                  <LayoutPanelLeft data-icon="inline-start" /> Context
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewContext === "isolated" ? "secondary" : "ghost"}
                  onClick={() => setPreviewContext("isolated")}
                >
                  <SlidersHorizontal data-icon="inline-start" /> Isolated
                </Button>
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
                onValueChange={(value) => choosePreviewState(value as WidgetState)}
                options={stateOptions}
              />
            </div>
          </div>

          <div className="preview-stage">
            <Card className={`preview-frame preview-frame-${previewViewport} preview-frame-${previewContext}`}>
              <CardContent className="preview-frame-content">
                <PreviewCanvas
                  config={config}
                  state={previewState}
                  onStateChange={setPreviewState}
                  onEvent={track}
                  context={previewContext}
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
