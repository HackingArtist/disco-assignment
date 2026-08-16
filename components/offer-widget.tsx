"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import {
  fontPresetVariables,
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
        ? `Offers from ${config.merchant.name} partners, matched to your order.`
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
    <aside className={`ow-widget ow-density-${config.behavior.density}`} aria-label="Offer for your order">
      <div className="ow-kicker">
        <span>From {config.merchant.name}</span>
        <i />
        <span>For this order</span>
      </div>

      {state === "default" && (
        <section className="ow-panel ow-primary-offer">
          <div className="ow-offer-intro">
            <p className="ow-eyebrow">{config.primaryOffer.eyebrow}</p>
            <h2>{config.primaryOffer.headline}</h2>
            <p>{config.primaryOffer.introduction}</p>
          </div>
          <OfferArtwork asset={config.primaryOffer.image} />
          <div className="ow-offer-copy">
            <div>
              <p className="ow-partner-name">{config.primaryOffer.partnerName}</p>
              <h3>{config.primaryOffer.title}</h3>
              <p className="ow-offer-detail">{config.primaryOffer.detail}</p>
            </div>
            {config.behavior.showExpiry && (
              <p className="ow-expiry">{config.primaryOffer.expiry}</p>
            )}
          </div>
          <div className="ow-offer-actions">
            <button className="ow-button ow-button-primary" type="button" onClick={() => claim(config.primaryOffer)}>
              {config.primaryOffer.claimLabel}
            </button>
            <button className="ow-button ow-button-quiet" type="button" onClick={reject}>Not for me</button>
          </div>
          <OfferDisclosure config={config} />
        </section>
      )}

      {state === "loading" && (
        <section className="ow-panel ow-status-panel ow-loading-panel" aria-live="polite" aria-busy="true">
          <div className="ow-loading-mark"><span /><span /><span /></div>
          <p className="ow-eyebrow">One moment</p>
          <h2>Finding a better match…</h2>
          <p>Looking at what pairs well with your order.</p>
          <div className="ow-loading-lines"><i /><i /><i /></div>
        </section>
      )}

      {state === "recovery" && (
        <section className="ow-recovery" aria-live="polite">
          <div className="ow-recovery-heading">
            <div>
              <p className="ow-eyebrow">Two more ideas</p>
              <h2>Maybe one of these?</h2>
            </div>
            <button type="button" onClick={() => {
              moveTo("exit");
              onEvent("alternatives_rejected");
            }}>Neither</button>
          </div>
          {config.alternativeOffers.map((offer) => (
            <article className="ow-alternative-card" key={offer.id}>
              <OfferArtwork asset={offer.image} />
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
          <p className="ow-eyebrow">Saved for later</p>
          <h2>Your {claimedOffer.partnerName} offer is claimed.</h2>
          <p>We sent the details to <strong>aashish@gmail.com</strong>, so you don&apos;t need to use it now.</p>
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
          <p className="ow-eyebrow">That didn&apos;t load</p>
          <h2>We couldn&apos;t find your offer.</h2>
          <p>Your order is all set. You can try the offer again without affecting anything.</p>
          <button className="ow-button ow-button-primary" type="button" onClick={reject}>Try again</button>
          <button className="ow-button ow-button-quiet" type="button" onClick={() => moveTo("exit")}>No thanks</button>
        </section>
      )}

      {state === "empty" && (
        <section className="ow-panel ow-status-panel ow-empty-panel" aria-live="polite">
          <span className="ow-status-icon">✦</span>
          <p className="ow-eyebrow">That&apos;s everything</p>
          <h2>Nothing worth showing right now.</h2>
          <p>We&apos;d rather show nothing than something that isn&apos;t a good fit. Enjoy your new runners.</p>
          <button className="ow-text-action" type="button" onClick={() => moveTo("default")}>Return to order</button>
        </section>
      )}

      {state === "exit" && (
        <section className="ow-panel ow-status-panel ow-exit-panel" aria-live="polite">
          <span className="ow-status-icon">✓</span>
          <p className="ow-eyebrow">All done</p>
          <h2>No problem. Enjoy your order.</h2>
          <p>We&apos;ll use your feedback to make the next match more useful.</p>
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
  const fonts = fontPresetVariables[config.theme.fontPreset];
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
    "--ow-display-font": fonts.display,
    "--ow-body-font": fonts.body,
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
      {context === "context" ? (
        <MerchantContext config={config}>{widget}</MerchantContext>
      ) : (
        <div className="widget-isolated-stage">{widget}</div>
      )}
    </div>
  );
}
