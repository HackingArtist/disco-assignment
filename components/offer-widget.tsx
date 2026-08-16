"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  googleFontVariables,
  type AssetReference,
  type OfferConfig,
  type PreviewContext,
  type PreviewViewport,
  type WidgetConfiguration,
  type WidgetEvent,
  type WidgetState,
} from "@/lib/widget-config";

type ThemeProperties = CSSProperties & Record<`--ow-${string}`, string>;

interface OfferWidgetProps {
  config: WidgetConfiguration;
  state: WidgetState;
  onStateChange: (state: WidgetState) => void;
  onEvent: (event: WidgetEvent) => void;
}

interface PreviewCanvasProps extends OfferWidgetProps {
  context: PreviewContext;
  viewport: PreviewViewport;
}

const CUSTOM_BUTTON_STATES = ["hover", "active", "focus", "focus-visible", "disabled"] as const;

function sanitizeCssDeclarations(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(";")
    .map((declaration) => {
      const separator = declaration.indexOf(":");
      if (separator < 1) return "";
      const property = declaration.slice(0, separator).trim();
      const value = declaration.slice(separator + 1).trim();
      const validProperty = /^(?:--[\w-]+|-?[a-z][\w-]*)$/i.test(property);
      const unsafeValue = /[{}<>]|@import|expression\s*\(|javascript:/i.test(value);
      return validProperty && value && !unsafeValue ? `${property}: ${value};` : "";
    })
    .filter(Boolean)
    .join("\n");
}

function compileButtonCss(source: string, selector: string): string {
  let baseSource = source;
  const stateRules: string[] = [];

  for (const state of CUSTOM_BUTTON_STATES) {
    const pattern = new RegExp(`(?:&\\s*)?:${state}\\s*\\{([^{}]*)\\}`, "gi");
    baseSource = baseSource.replace(pattern, (_match, declarations: string) => {
      const safeDeclarations = sanitizeCssDeclarations(declarations);
      if (safeDeclarations) stateRules.push(`${selector}:${state} {\n${safeDeclarations}\n}`);
      return "";
    });
  }

  const baseDeclarations = sanitizeCssDeclarations(baseSource);
  return [baseDeclarations ? `${selector} {\n${baseDeclarations}\n}` : "", ...stateRules]
    .filter(Boolean)
    .join("\n");
}

function normalizeCssSize(value: string, fallback: string): string {
  const size = value.trim();
  if (/^(?:0|\d*\.?\d+(?:px|rem|em|%|vw|vh|vmin|vmax|ch|ex))$/i.test(size)) return size;
  if (/^\d*\.?\d+$/.test(size)) return `${size}px`;
  if (/^(?:calc|clamp|min|max|var)\([^{};]+\)$/i.test(size)) return size;
  return fallback;
}

function FallbackArtwork({ kind }: { kind: AssetReference["fallback"] }) {
  if (kind === "journal") {
    return (
      <div className="ow-artwork ow-artwork-journal" aria-hidden="true">
        <div className="ow-journal-shadow" />
        <div className="ow-journal"><span>FIELD<br />NOTES</span></div>
        <i className="ow-pencil" />
      </div>
    );
  }

  if (kind === "socks") {
    return (
      <div className="ow-artwork ow-artwork-socks" aria-hidden="true">
        <div className="ow-sock ow-sock-one"><span>R</span></div>
        <div className="ow-sock ow-sock-two"><span>R</span></div>
      </div>
    );
  }

  return (
    <div className="ow-artwork ow-artwork-bottle" aria-hidden="true">
      <div className="ow-bottle-shadow" />
      <div className="ow-bottle">
        <div className="ow-bottle-cap" />
        <span>M</span>
      </div>
      <span className="ow-art-label">Trail ready</span>
    </div>
  );
}

function OfferArtwork({ asset }: { asset: AssetReference }) {
  const [failedSrc, setFailedSrc] = useState("");
  const failed = Boolean(asset.src) && failedSrc === asset.src;

  if (asset.kind === "fallback" || !asset.src || failed) {
    return <FallbackArtwork kind={asset.fallback} />;
  }

  return (
    <div className="ow-artwork ow-artwork-image">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.src} alt={asset.alt} onError={() => setFailedSrc(asset.src)} />
    </div>
  );
}

function OfferDisclosure({ config, plural = false }: { config: WidgetConfiguration; plural?: boolean }) {
  if (!config.behavior.showDisclosure) return null;
  return (
    <p className="ow-disclosure">
      {plural
        ? `Partner benefits unlocked by your ${config.merchant.name} order.`
        : config.disclosure}
    </p>
  );
}

export function OfferWidget({
  config,
  state,
  onStateChange,
  onEvent,
}: OfferWidgetProps) {
  const [claimedOfferId, setClaimedOfferId] = useState(config.primaryOffer.id);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allOffers = useMemo(
    () => [config.primaryOffer, ...config.alternativeOffers],
    [config.primaryOffer, config.alternativeOffers],
  );
  const claimedOffer =
    allOffers.find((offer) => offer.id === claimedOfferId) ?? config.primaryOffer;

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const moveTo = (nextState: WidgetState) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopied(false);
    onStateChange(nextState);
  };

  const reject = () => {
    onEvent("offer_rejected:primary");
    if (config.behavior.rejectionFlow === "dismiss") {
      moveTo("exit");
      return;
    }
    moveTo("loading");
    timerRef.current = setTimeout(() => {
      onStateChange("recovery");
      onEvent("alternatives_viewed");
    }, 650);
  };

  const claim = (offer: OfferConfig) => {
    setClaimedOfferId(offer.id);
    moveTo("claimed");
    onEvent(`offer_claimed:${offer.id}`);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(claimedOffer.couponCode);
    } catch {
      // Clipboard access can be unavailable inside embedded previews.
    }
    setCopied(true);
    onEvent("code_copied");
  };

  return (
    <aside className={`ow-widget ow-density-${config.behavior.density}${config.behavior.showArtwork ? "" : " ow-without-artwork"}`} aria-label="Benefit unlocked by your order">
      <div className="ow-kicker">
        <span>Order perk unlocked</span>
        <i />
        <span>From {config.merchant.name}</span>
      </div>

      {state === "default" && (
        <section className="ow-panel ow-primary-offer">
          <div className="ow-offer-intro">
            <h2>{config.primaryOffer.headline}</h2>
            <p>{config.primaryOffer.introduction}</p>
          </div>
          {config.behavior.showArtwork && <OfferArtwork asset={config.primaryOffer.image} />}
          {config.behavior.showExpiry && (
            <p className="ow-expiry">{config.primaryOffer.expiry}</p>
          )}
          <div className="ow-offer-actions">
            <button className="ow-button ow-button-primary" type="button" onClick={() => claim(config.primaryOffer)}>
              {config.primaryOffer.claimLabel}
            </button>
            <button className="ow-button ow-button-quiet" type="button" onClick={reject}>No, thanks</button>
          </div>
          <footer className="ow-offer-footer">
            <p className="ow-powered-by" aria-label="Powered by Disco">
              <span>Powered by</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/disco-logo.png" alt="" />
            </p>
            <OfferDisclosure config={config} />
          </footer>
        </section>
      )}

      {state === "loading" && (
        <section className="ow-panel ow-status-panel ow-loading-panel" aria-live="polite" aria-busy="true">
          <div className="ow-loading-mark"><span /><span /><span /></div>
          <p className="ow-eyebrow">One sec</p>
          <h2>Checking your other unlocked perks…</h2>
          <p>These benefits come with your order.</p>
          <div className="ow-loading-lines"><i /><i /><i /></div>
        </section>
      )}

      {state === "recovery" && (
        <section className="ow-recovery" aria-live="polite">
          <div className="ow-recovery-heading">
            <div>
              <p className="ow-eyebrow">Also unlocked</p>
              <h2>Your order comes with more perks.</h2>
            </div>
            <button type="button" onClick={() => {
              moveTo("exit");
              onEvent("alternatives_rejected");
            }}>No, thanks</button>
          </div>
          {config.alternativeOffers.map((offer) => (
            <article className="ow-alternative-card" key={offer.id}>
              {config.behavior.showArtwork && <OfferArtwork asset={offer.image} />}
              <div className="ow-alternative-copy">
                <p className="ow-partner-name">{offer.partnerName}</p>
                <h3>{offer.title}</h3>
                <p>{offer.detail}</p>
                <button className="ow-button ow-button-dark" type="button" onClick={() => claim(offer)}>
                  {offer.claimLabel}
                </button>
              </div>
            </article>
          ))}
          <OfferDisclosure config={config} plural />
        </section>
      )}

      {state === "claimed" && (
        <section className="ow-panel ow-status-panel ow-claimed-panel" aria-live="polite">
          <span className="ow-status-icon">✓</span>
          <p className="ow-eyebrow">It&apos;s yours</p>
          <h2>Your {claimedOffer.partnerName} benefit is ready.</h2>
          <p>We added it to your order and emailed the details to <strong>aashish@gmail.com</strong>.</p>
          {config.behavior.claimMode === "coupon" && (
            <>
              <button className="ow-coupon" type="button" onClick={copyCode} aria-label={`Copy offer code ${claimedOffer.couponCode}`}>
                <span><small>Your code</small>{claimedOffer.couponCode}</span>
                <strong>{copied ? "Copied" : "Copy"}</strong>
              </button>
              <a className="ow-button ow-button-primary" href="#partner">{claimedOffer.destinationLabel}</a>
            </>
          )}
          <button className="ow-text-action" type="button" onClick={() => moveTo("default")}>Back to order</button>
        </section>
      )}

      {state === "error" && (
        <section className="ow-panel ow-status-panel ow-error-panel" aria-live="polite">
          <span className="ow-status-icon">↻</span>
          <p className="ow-eyebrow">Sorry about that</p>
          <h2>That didn&apos;t work.</h2>
          <p>Your order is safe. Want to try again?</p>
          <button className="ow-button ow-button-primary" type="button" onClick={reject}>Try again</button>
          <button className="ow-button ow-button-quiet" type="button" onClick={() => moveTo("exit")}>No thanks</button>
        </section>
      )}

      {state === "empty" && (
        <section className="ow-panel ow-status-panel ow-empty-panel" aria-live="polite">
          <span className="ow-status-icon">✦</span>
          <p className="ow-eyebrow">That&apos;s all</p>
          <h2>Nothing else for now.</h2>
          <p>Enjoy your new runners.</p>
          <button className="ow-text-action" type="button" onClick={() => moveTo("default")}>Return to order</button>
        </section>
      )}

      {state === "exit" && (
        <section className="ow-panel ow-status-panel ow-exit-panel" aria-live="polite">
          <span className="ow-status-icon">✓</span>
          <p className="ow-eyebrow">All good</p>
          <h2>Enjoy your order.</h2>
          <p>Thanks for letting us know.</p>
          <button className="ow-text-action" type="button" onClick={() => moveTo("default")}>Undo</button>
        </section>
      )}
    </aside>
  );
}

function MerchantWordmark({ config }: { config: WidgetConfiguration }) {
  const logo = config.merchant.logo;
  if (logo.kind !== "fallback" && logo.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className="merchant-wordmark-image" src={logo.src} alt={logo.alt} />
    );
  }
  return <span className="merchant-wordmark-text">{config.merchant.wordmark}</span>;
}

function MerchantContext({ children, config }: { children: React.ReactNode; config: WidgetConfiguration }) {
  return (
    <div className="merchant-page">
      <header className="merchant-header">
        <div className="merchant-wordmark"><MerchantWordmark config={config} /></div>
        <nav aria-label="Order navigation">
          <button type="button">Help</button>
          <button type="button" className="merchant-account">AM</button>
        </nav>
      </header>
      <section className="merchant-confirmation">
        <div className="merchant-receipt-column">
          <div className="merchant-success-heading">
            <span className="merchant-check" aria-hidden="true">✓</span>
            <div>
              <p className="merchant-eyebrow">Order #NM-28419</p>
              <h1>Thanks, Aashish.<br />Your order is confirmed.</h1>
              <p className="merchant-lede">We&apos;ll email you when it&apos;s on the way.</p>
            </div>
          </div>
          <div className="merchant-order-card">
            <div className="merchant-order-product">
              <div className="merchant-shoe-art" aria-hidden="true">
                <div className="merchant-shoe-sole" />
                <div className="merchant-shoe-body">N</div>
              </div>
              <div>
                <p className="merchant-product-name">All Terrain Runner</p>
                <p className="merchant-muted">Sand / EU 42 · Qty 1</p>
              </div>
              <p className="merchant-price">$148</p>
            </div>
            <button className="merchant-details-toggle" type="button">
              <span>Order details</span><span aria-hidden="true">⌄</span>
            </button>
          </div>
        </div>
        <div className="merchant-offer-column">{children}</div>
      </section>
      <footer className="merchant-footer">
        <p>Need a hand? <a href={`mailto:${config.merchant.contactEmail}`}>Contact {config.merchant.name}</a></p>
        <p>© 2026 {config.merchant.name}</p>
      </footer>
    </div>
  );
}

export function PreviewCanvas({
  config,
  state,
  onStateChange,
  onEvent,
  context,
  viewport,
}: PreviewCanvasProps) {
  const customButtonCss = [
    compileButtonCss(config.theme.primaryButtonCss, ".preview-document .ow-button-primary"),
    compileButtonCss(config.theme.secondaryButtonCss, ".preview-document .ow-button-quiet"),
  ].filter(Boolean).join("\n");
  const style: ThemeProperties = {
    "--ow-page": config.theme.page,
    "--ow-surface": config.theme.surface,
    "--ow-soft-surface": config.theme.softSurface,
    "--ow-text": config.theme.text,
    "--ow-muted": config.theme.mutedText,
    "--ow-primary": config.theme.primary,
    "--ow-primary-text": config.theme.primaryText,
    "--ow-accent": config.theme.accent,
    "--ow-border": config.theme.border,
    "--ow-radius": `${config.theme.radius}px`,
    "--ow-stroke-width": `${config.theme.borderWidth}px`,
    "--ow-display-font": googleFontVariables[config.theme.primaryFont],
    "--ow-body-font": googleFontVariables[config.theme.secondaryFont],
    "--ow-heading-size": normalizeCssSize(config.theme.headingFontSize, "36px"),
    "--ow-heading-weight": String(config.theme.headingFontWeight),
    "--ow-body-size": normalizeCssSize(config.theme.secondaryFontSize, "14px"),
    "--ow-body-weight": String(config.theme.secondaryFontWeight),
  };
  const widget = (
    <OfferWidget
      config={config}
      state={state}
      onStateChange={onStateChange}
      onEvent={onEvent}
    />
  );

  return (
    <div
      className={`preview-document preview-${viewport} preview-${context}`}
      style={style}
      data-testid="preview-document"
    >
      {customButtonCss && <style>{customButtonCss}</style>}
      {context === "context" ? (
        <MerchantContext config={config}>{widget}</MerchantContext>
      ) : (
        <div className="widget-isolated-stage">{widget}</div>
      )}
    </div>
  );
}
