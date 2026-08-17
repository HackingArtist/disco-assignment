"use client";

import { Fragment, useMemo, useState, type CSSProperties } from "react";

import {
  googleFontVariables,
  type AssetReference,
  type OfferConfig,
  type PreviewState,
  type PreviewViewport,
  type WidgetConfiguration,
  type WidgetEvent,
  type WidgetExperiment,
  type WidgetState,
  widgetStateLabels,
  widgetStates,
} from "@/lib/widget-config";

type ThemeProperties = CSSProperties & Record<`--ow-${string}`, string>;

interface OfferWidgetProps {
  config: WidgetConfiguration;
  experiment: Exclude<WidgetExperiment, "both">;
  state: WidgetState;
  onStateChange: (state: WidgetState) => void;
  onEvent: (event: WidgetEvent) => void;
}

interface PreviewCanvasProps {
  config: WidgetConfiguration;
  state: PreviewState;
  onStateChange: (state: WidgetState) => void;
  onEvent: (event: WidgetEvent) => void;
  viewport: PreviewViewport;
}

const CUSTOM_BUTTON_STATES = ["hover", "active", "focus", "focus-visible", "disabled"] as const;

const FALLBACK_LOGOS: Record<AssetReference["fallback"], string> = {
  bottle: "/partner-logos/45-degrees.svg",
  journal: "/partner-logos/blue-wave.svg",
  socks: "/partner-logos/green-bars.svg",
};

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
  return (
    <div className={`ow-artwork ow-fallback-partner-logo ow-fallback-partner-logo-${kind}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={FALLBACK_LOGOS[kind]} alt="" />
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

function OfferLogo({ asset }: { asset: AssetReference }) {
  const [failedSrc, setFailedSrc] = useState("");
  const failed = Boolean(asset.src) && failedSrc === asset.src;

  if (asset.kind === "fallback" || !asset.src || failed) {
    return (
      <div className="ow-alternative-logo ow-fallback-partner-logo" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={FALLBACK_LOGOS[asset.fallback]} alt="" />
      </div>
    );
  }

  return (
    <div className="ow-alternative-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset.src} alt={asset.alt} onError={() => setFailedSrc(asset.src)} />
    </div>
  );
}

function WidgetFooter({ config }: { config: WidgetConfiguration }) {
  const [failedLogo, setFailedLogo] = useState(false);
  const logo = config.merchant.logo;
  const showLogo = logo.kind !== "fallback" && Boolean(logo.src) && !failedLogo;

  return (
    <footer className="ow-widget-footer">
      <p className="ow-powered-by" aria-label={`Powered by ${config.merchant.name}`}>
        <span>Powered by</span>
        {showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo.src} alt="" onError={() => setFailedLogo(true)} />
        ) : (
          <span className="ow-powered-by-name">{config.merchant.name}</span>
        )}
      </p>
      {config.behavior.showDisclosure && (
        <p className="ow-disclosure">
          <span className="ow-desktop-copy">{config.disclosure}</span>
          <span className="ow-mobile-copy">Benefit unlocked by your Order</span>
        </p>
      )}
    </footer>
  );
}

export function OfferWidget({
  config,
  experiment,
  state,
  onStateChange,
  onEvent,
}: OfferWidgetProps) {
  const showsRejection = experiment === "claim-and-not-for-me";
  const [claimedOfferId, setClaimedOfferId] = useState(config.primaryOffer.id);
  const [copied, setCopied] = useState(false);
  const allOffers = useMemo(
    () => [config.primaryOffer, ...config.alternativeOffers],
    [config.primaryOffer, config.alternativeOffers],
  );
  const claimedOffer =
    allOffers.find((offer) => offer.id === claimedOfferId) ?? config.primaryOffer;

  const moveTo = (nextState: WidgetState) => {
    setCopied(false);
    onStateChange(nextState);
  };

  const reject = () => {
    onEvent("offer_rejected:primary");
    if (config.behavior.rejectionFlow === "dismiss") {
      moveTo("exit");
      return;
    }
    moveTo("recovery");
    onEvent("alternatives_viewed");
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
    <aside className={`ow-widget ow-density-${config.behavior.density} ow-alignment-${config.behavior.alignment}${config.behavior.showArtwork ? "" : " ow-without-artwork"}`} aria-label="Benefit unlocked by your order">
      {state === "default" && (
        <section className="ow-panel ow-primary-offer">
          <div className="ow-offer-intro">
            <h2>
              <span className="ow-desktop-copy">{config.primaryOffer.headline}</span>
              <span className="ow-mobile-copy">You unlocked free trial</span>
            </h2>
            <div className="ow-offer-summary">
              {config.behavior.showArtwork && <OfferArtwork asset={config.primaryOffer.image} />}
              <p>{config.primaryOffer.introduction}</p>
            </div>
          </div>
          {config.behavior.showExpiry && (
            <p className="ow-expiry">{config.primaryOffer.expiry}</p>
          )}
          <div className={`ow-offer-actions${showsRejection ? "" : " ow-offer-actions-single"}`}>
            <button className="ow-button ow-button-primary" type="button" onClick={() => claim(config.primaryOffer)}>
              {config.primaryOffer.claimLabel}
            </button>
            {showsRejection && <button className="ow-button ow-button-quiet" type="button" onClick={reject}>Not for me</button>}
          </div>
          <WidgetFooter config={config} />
        </section>
      )}

      {state === "recovery" && (
        <section className="ow-recovery" aria-live="polite">
          <div className="ow-recovery-heading">
            <h2>
              <span className="ow-desktop-copy">You can unlock one of these instead.</span>
              <span className="ow-mobile-copy">Unlock one of these instead.</span>
            </h2>
            <button type="button" onClick={() => {
              moveTo("exit");
              onEvent("alternatives_rejected");
            }}>No, thanks</button>
          </div>
          {config.alternativeOffers.map((offer, index) => (
            <Fragment key={offer.id}>
              <article className="ow-alternative-card">
                {config.behavior.showArtwork && <OfferLogo asset={offer.image} />}
                <div className="ow-alternative-copy">
                  <h3>{offer.title}</h3>
                  <p>{offer.detail}</p>
                </div>
                <button className="ow-button ow-button-primary ow-alternative-action" type="button" onClick={() => claim(offer)}>
                  Claim
                </button>
              </article>
              {index < config.alternativeOffers.length - 1 && (
                <div className="ow-alternative-divider" role="separator" aria-label="or">
                  <span>or</span>
                </div>
              )}
            </Fragment>
          ))}
        </section>
      )}

      {state === "claimed" && (
        <section className="ow-panel ow-status-panel ow-claimed-panel" aria-live="polite">
          <div className="ow-status-content">
            <h2>Your {claimedOffer.partnerName} benefit is ready.</h2>
            <p>We added it to your order and emailed the details to <strong>aashish@gmail.com</strong>.</p>
            {config.behavior.claimMode === "coupon" && (
              <div className="ow-status-actions ow-claimed-actions">
                <button className="ow-coupon" type="button" onClick={copyCode} aria-label={`Copy offer code ${claimedOffer.couponCode}`}>
                  <span>{claimedOffer.couponCode}</span>
                  <strong>{copied ? "Copied" : "Copy"}</strong>
                </button>
                <a className="ow-button ow-button-primary" href="#partner">{claimedOffer.destinationLabel}</a>
              </div>
            )}
          </div>
          <WidgetFooter config={config} />
        </section>
      )}

      {state === "error" && (
        <section className="ow-panel ow-status-panel ow-error-panel" aria-live="polite">
          <div className="ow-status-content">
            <h2>That didn&apos;t work.</h2>
            <p>Your order is safe. Want to try again?</p>
            <div className="ow-status-actions">
              <button className="ow-button ow-button-primary" type="button" onClick={() => moveTo("default")}>Try again</button>
              <button className="ow-button ow-button-quiet" type="button" onClick={() => moveTo("exit")}>No thanks</button>
            </div>
          </div>
          <WidgetFooter config={config} />
        </section>
      )}

      {state === "empty" && (
        <section className="ow-panel ow-status-panel ow-empty-panel" aria-live="polite">
          <div className="ow-status-content">
            <h2>Nothing else for now.</h2>
            <p>Enjoy your new runners.</p>
            <button className="ow-button ow-button-quiet" type="button" onClick={() => moveTo("default")}>Return to order</button>
          </div>
          <WidgetFooter config={config} />
        </section>
      )}

      {state === "exit" && (
        <section className="ow-panel ow-status-panel ow-exit-panel" aria-live="polite">
          <div className="ow-status-content">
            <h2>Enjoy your order.</h2>
            <p>Thanks for letting us know.</p>
            <button className="ow-button ow-button-quiet" type="button" onClick={() => moveTo("default")}>Undo</button>
          </div>
          <WidgetFooter config={config} />
        </section>
      )}
    </aside>
  );
}

export function PreviewCanvas({
  config,
  state,
  onStateChange,
  onEvent,
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
    "--ow-primary-button-border": config.theme.primaryButtonBorder,
    "--ow-secondary-button-border": config.theme.secondaryButtonBorder,
    "--ow-container-radius": `${config.theme.containerRadius}px`,
    "--ow-container-stroke-width": `${config.theme.containerBorderWidth}px`,
    "--ow-button-radius": `${config.theme.buttonRadius}px`,
    "--ow-secondary-button-radius": `${config.theme.secondaryButtonRadius}px`,
    "--ow-primary-button-stroke-width": `${config.theme.primaryButtonBorderWidth}px`,
    "--ow-secondary-button-stroke-width": `${config.theme.secondaryButtonBorderWidth}px`,
    "--ow-display-font": googleFontVariables[config.theme.primaryFont],
    "--ow-body-font": googleFontVariables[config.theme.secondaryFont],
    "--ow-heading-size": normalizeCssSize(config.theme.headingFontSize, "36px"),
    "--ow-heading-weight": String(config.theme.headingFontWeight),
    "--ow-body-size": normalizeCssSize(config.theme.secondaryFontSize, "14px"),
    "--ow-body-weight": String(config.theme.secondaryFontWeight),
  };
  const renderWidget = (widgetState: WidgetState, experiment: Exclude<WidgetExperiment, "both">) => (
    <OfferWidget
      config={config}
      experiment={experiment}
      state={widgetState}
      onStateChange={onStateChange}
      onEvent={onEvent}
    />
  );
  const experiments: Exclude<WidgetExperiment, "both">[] = config.behavior.experiment === "both"
    ? ["claim-only", "claim-and-not-for-me"]
    : [config.behavior.experiment];
  const experimentLabels: Record<Exclude<WidgetExperiment, "both">, string> = {
    "claim-only": "Single offer · Claim only",
    "claim-and-not-for-me": "Single offer · Claim + Not for me",
  };
  const statesForExperiment = (experiment: Exclude<WidgetExperiment, "both">) => experiment === "claim-only"
    ? widgetStates.filter((widgetState) => widgetState === "default" || widgetState === "claimed" || widgetState === "error")
    : widgetStates;

  return (
    <div
      className={`preview-document preview-${viewport}${state === "all" ? " preview-all-states" : ""}`}
      style={style}
      data-testid="preview-document"
    >
      {customButtonCss && <style>{customButtonCss}</style>}
      <div className={`preview-experiment-stack${experiments.length > 1 ? " preview-experiment-stack-both" : ""}`}>
        {experiments.map((experiment) => (
          <section className="preview-experiment-group" key={experiment} aria-label={experimentLabels[experiment]}>
            {experiments.length > 1 && <h2 className="preview-experiment-label">{experimentLabels[experiment]}</h2>}
            {state === "all" ? (
              <div className="preview-state-canvas" aria-label={`All widget states for ${experimentLabels[experiment]}`}>
                {statesForExperiment(experiment).map((widgetState) => (
                  <figure className="preview-state-item" key={widgetState} aria-label={`${widgetStateLabels[widgetState]} state`}>
                    <div className="widget-isolated-stage">{renderWidget(widgetState, experiment)}</div>
                    <figcaption>{widgetStateLabels[widgetState]}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <div className="widget-isolated-stage">
                {renderWidget(statesForExperiment(experiment).includes(state) ? state : "default", experiment)}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
