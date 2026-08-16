"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import {
  Activity,
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  fontPresetLabels,
  getUploadedAssets,
  isValidHex,
  isValidImageUrl,
  widgetStateLabels,
  type AssetReference,
  type FontPreset,
  type OfferConfig,
  type PreviewContext,
  type PreviewViewport,
  type WidgetConfiguration,
  type WidgetEvent,
  type WidgetState,
} from "@/lib/widget-config";

interface FieldProps {
  id: string;
  label: string;
  description?: string;
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
  fallbackLabel: string;
}

function Field({ id, label, description, count, children }: FieldProps) {
  return (
    <div className="studio-field">
      <div className="studio-field-heading">
        <Label htmlFor={id}>{label}</Label>
        {count && <span className="studio-count">{count}</span>}
      </div>
      {children}
      {description && <p className="studio-field-description">{description}</p>}
    </div>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="studio-section-heading">
      <h2>{title}</h2>
      <p>{description}</p>
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

function AssetField({ id, label, asset, onChange, fallbackLabel }: AssetFieldProps) {
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
        <Badge variant="outline">{asset.kind === "fallback" ? fallbackLabel : asset.kind}</Badge>
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
      <Field id={`${id}-alt`} label="Image description" description="Used when the image carries useful product information.">
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

function OfferEditor({
  offer,
  onChange,
  idPrefix,
}: {
  offer: OfferConfig;
  onChange: (offer: OfferConfig) => void;
  idPrefix: string;
}) {
  const update = <Key extends keyof OfferConfig>(key: Key, value: OfferConfig[Key]) => {
    onChange({ ...offer, [key]: value });
  };
  const textField = (
    key: Exclude<keyof OfferConfig, "id" | "image">,
    label: string,
    maxLength: number,
    multiline = false,
  ) => {
    const id = `${idPrefix}-${key}`;
    const value = offer[key];
    return (
      <Field id={id} label={label} count={`${value.length}/${maxLength}`}>
        {multiline ? (
          <Textarea
            id={id}
            value={value}
            maxLength={maxLength}
            rows={2}
            onChange={(event) => update(key, event.target.value)}
          />
        ) : (
          <Input
            id={id}
            value={value}
            maxLength={maxLength}
            onChange={(event) => update(key, event.target.value)}
          />
        )}
      </Field>
    );
  };

  return (
    <div className="studio-field-stack">
      <AssetField
        id={`${idPrefix}-image`}
        label="Offer image"
        asset={offer.image}
        fallbackLabel={offer.image.fallback}
        onChange={(image) => update("image", image)}
      />
      {textField("partnerName", "Partner name", 40)}
      {textField("eyebrow", "Eyebrow", 56)}
      {textField("headline", "Headline", 80, true)}
      {textField("introduction", "Introduction", 120, true)}
      {textField("title", "Offer title", 72, true)}
      {textField("detail", "Offer detail", 96, true)}
      {textField("expiry", "Expiry message", 56)}
      {textField("claimLabel", "Claim button", 32)}
      <div className="studio-field-grid">
        {textField("couponCode", "Coupon code", 24)}
        {textField("destinationLabel", "Shop button", 36)}
      </div>
    </div>
  );
}

function SwitchRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="studio-switch-row">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p>{description}</p>
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
  const updateAlternative = (index: 0 | 1, offer: OfferConfig) => {
    setConfig((current) => {
      const alternatives: [OfferConfig, OfferConfig] = [...current.alternativeOffers];
      alternatives[index] = offer;
      return { ...current, alternativeOffers: alternatives };
    });
  };
  const textContrast = contrastRatio(config.theme.text, config.theme.surface);
  const buttonContrast = contrastRatio(config.theme.primaryText, config.theme.primary);

  return (
    <Tabs defaultValue="brand" className="studio-config-tabs">
      <TabsList className="studio-tabs-list">
        <TabsTrigger value="brand">Brand</TabsTrigger>
        <TabsTrigger value="offers">Offers</TabsTrigger>
        <TabsTrigger value="behavior">Behavior</TabsTrigger>
      </TabsList>

      <TabsContent value="brand" className="studio-tab-content">
        <SectionHeading title="Merchant identity" description="Apply the host brand to the confirmation page and widget frame." />
        <div className="studio-field-stack">
          <AssetField
            id={`${idPrefix}-merchant-logo`}
            label="Merchant logo"
            asset={config.merchant.logo}
            fallbackLabel="Wordmark"
            onChange={(logo) => updateMerchant("logo", logo)}
          />
          <Field id={`${idPrefix}-merchant-name`} label="Merchant name" count={`${config.merchant.name.length}/32`}>
            <Input
              id={`${idPrefix}-merchant-name`}
              value={config.merchant.name}
              maxLength={32}
              onChange={(event) => updateMerchant("name", event.target.value)}
            />
          </Field>
          <Field id={`${idPrefix}-wordmark`} label="Wordmark" count={`${config.merchant.wordmark.length}/18`}>
            <Input
              id={`${idPrefix}-wordmark`}
              value={config.merchant.wordmark}
              maxLength={18}
              onChange={(event) => updateMerchant("wordmark", event.target.value)}
            />
          </Field>
          <Field id={`${idPrefix}-contact-email`} label="Contact email">
            <Input
              id={`${idPrefix}-contact-email`}
              type="email"
              value={config.merchant.contactEmail}
              onChange={(event) => updateMerchant("contactEmail", event.target.value)}
            />
          </Field>
        </div>

        <Separator />
        <SectionHeading title="Theme" description="These tokens stay scoped to the preview and never recolor the studio." />
        <div className="studio-color-grid">
          <ColorField id={`${idPrefix}-page`} label="Page" value={config.theme.page} onChange={(value) => updateTheme("page", value)} />
          <ColorField id={`${idPrefix}-surface`} label="Surface" value={config.theme.surface} onChange={(value) => updateTheme("surface", value)} />
          <ColorField id={`${idPrefix}-soft-surface`} label="Soft surface" value={config.theme.softSurface} onChange={(value) => updateTheme("softSurface", value)} />
          <ColorField id={`${idPrefix}-text`} label="Text" value={config.theme.text} onChange={(value) => updateTheme("text", value)} />
          <ColorField id={`${idPrefix}-muted-text`} label="Muted text" value={config.theme.mutedText} onChange={(value) => updateTheme("mutedText", value)} />
          <ColorField id={`${idPrefix}-primary`} label="Primary" value={config.theme.primary} onChange={(value) => updateTheme("primary", value)} />
          <ColorField id={`${idPrefix}-primary-text`} label="Button text" value={config.theme.primaryText} onChange={(value) => updateTheme("primaryText", value)} />
          <ColorField id={`${idPrefix}-accent`} label="Accent" value={config.theme.accent} onChange={(value) => updateTheme("accent", value)} />
          <ColorField id={`${idPrefix}-border`} label="Border" value={config.theme.border} onChange={(value) => updateTheme("border", value)} />
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
        <Field id={`${idPrefix}-font`} label="Font pairing">
          <Select value={config.theme.fontPreset} onValueChange={(value) => updateTheme("fontPreset", value as FontPreset)}>
            <SelectTrigger id={`${idPrefix}-font`} className="studio-select-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(fontPresetLabels) as [FontPreset, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field id={`${idPrefix}-radius`} label="Corner radius" count={`${config.theme.radius}px`} description="Applies to cards, buttons, and image surfaces.">
          <Slider
            id={`${idPrefix}-radius`}
            min={0}
            max={20}
            step={2}
            value={[config.theme.radius]}
            onValueChange={(value) => updateTheme("radius", Array.isArray(value) ? (value[0] ?? 0) : value)}
          />
        </Field>
      </TabsContent>

      <TabsContent value="offers" className="studio-tab-content">
        <SectionHeading title="Offer content" description="Edit the best match and both recovery alternatives." />
        <Accordion multiple defaultValue={["primary"]} className="studio-offer-accordion">
          <AccordionItem value="primary">
            <AccordionTrigger>
              <span><strong>Primary offer</strong><small>{config.primaryOffer.partnerName}</small></span>
            </AccordionTrigger>
            <AccordionContent>
              <OfferEditor
                offer={config.primaryOffer}
                idPrefix={`${idPrefix}-primary`}
                onChange={(primaryOffer) => setConfig((current) => ({ ...current, primaryOffer }))}
              />
            </AccordionContent>
          </AccordionItem>
          {config.alternativeOffers.map((offer, index) => (
            <AccordionItem value={`alternative-${index}`} key={offer.id}>
              <AccordionTrigger>
                <span><strong>Alternative {index + 1}</strong><small>{offer.partnerName}</small></span>
              </AccordionTrigger>
              <AccordionContent>
                <OfferEditor
                  offer={offer}
                  idPrefix={`${idPrefix}-alternative-${index}`}
                  onChange={(nextOffer) => updateAlternative(index as 0 | 1, nextOffer)}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <Field id={`${idPrefix}-disclosure`} label="Partner disclosure" count={`${config.disclosure.length}/100`}>
          <Textarea
            id={`${idPrefix}-disclosure`}
            rows={2}
            value={config.disclosure}
            maxLength={100}
            onChange={(event) => setConfig((current) => ({ ...current, disclosure: event.target.value }))}
          />
        </Field>
      </TabsContent>

      <TabsContent value="behavior" className="studio-tab-content">
        <SectionHeading title="Widget behavior" description="Choose how the offer fits, recovers, and hands customers off." />
        <div className="studio-field-stack">
          <Field id={`${idPrefix}-density`} label="Default density" description="Compact is designed for constrained confirmation-page placements.">
            <Select value={config.behavior.density} onValueChange={(value) => updateBehavior("density", value as WidgetConfiguration["behavior"]["density"])}>
              <SelectTrigger id={`${idPrefix}-density`} className="studio-select-trigger"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Space-aware</SelectItem>
                <SelectItem value="roomy">Roomy</SelectItem>
              </SelectContent>
            </Select>
          </Field>
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
            id={`${idPrefix}-show-expiry`}
            label="Show expiry"
            description="Keep urgency visible on the primary offer."
            checked={config.behavior.showExpiry}
            onCheckedChange={(checked) => updateBehavior("showExpiry", checked)}
          />
          <SwitchRow
            id={`${idPrefix}-show-disclosure`}
            label="Show disclosure"
            description="Identify offers as coming from merchant partners."
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
  const [previewContext, setPreviewContext] = useState<PreviewContext>("context");
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
    setPreviewContext("context");
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
            <Card className={`preview-frame preview-frame-${previewViewport}`}>
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
