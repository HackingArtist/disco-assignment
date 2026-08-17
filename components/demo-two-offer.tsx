"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";

import { OfferWidget } from "@/components/offer-widget";
import {
  createDefaultWidgetConfiguration,
  type WidgetConfiguration,
  type WidgetEvent,
  type WidgetState,
} from "@/lib/widget-config";

type DemoTwoTheme = CSSProperties & Record<`--ow-${string}`, string>;

const demoTwoTheme: DemoTwoTheme = {
  "--ow-page": "#ffffff",
  "--ow-surface": "#ffffff",
  "--ow-soft-surface": "#ffffff",
  "--ow-text": "#111111",
  "--ow-muted": "#8b8b8b",
  "--ow-primary": "#111111",
  "--ow-primary-text": "#ffffff",
  "--ow-accent": "#c9a3ff",
  "--ow-border": "#e6e6e6",
  "--ow-primary-button-border": "#111111",
  "--ow-secondary-button-border": "#e6e6e6",
  "--ow-container-radius": "24px",
  "--ow-container-stroke-width": "0px",
  "--ow-button-radius": "9999px",
  "--ow-secondary-button-radius": "9999px",
  "--ow-primary-button-stroke-width": "0px",
  "--ow-secondary-button-stroke-width": "1px",
  "--ow-display-font": "Outfit, system-ui, sans-serif",
  "--ow-body-font": "Outfit, system-ui, sans-serif",
  "--ow-heading-size": "36px",
  "--ow-heading-weight": "600",
  "--ow-body-size": "14px",
  "--ow-body-weight": "400",
};
const demoTwoOverrides = String.raw`
  :host { all: initial; display: block; }
  .demo-two-offer-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    isolation: isolate;
    font-family: Outfit, system-ui, sans-serif;
  }
  .demo-two-offer-backdrop {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: rgba(17, 17, 17, .34);
    backdrop-filter: blur(1.5px);
    cursor: pointer;
    animation: demo-two-backdrop-in 180ms ease-out both;
  }
  .demo-two-offer-sheet {
    position: relative;
    z-index: 1;
    container-type: inline-size;
    width: 100%;
    max-height: 94%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 8px 18px calc(18px + env(safe-area-inset-bottom, 0px));
    border-radius: 26px 26px 0 0;
    background: #fff;
    box-shadow: 0 -18px 50px rgba(17, 17, 17, .18);
    animation: demo-two-sheet-in 260ms cubic-bezier(.2, 0, 0, 1) both;
  }
  .demo-two-offer-handle {
    flex: none;
    width: 36px;
    height: 5px;
    margin: 0 auto 14px;
    border-radius: 9999px;
    background: #d2d2d2;
  }
  .demo-two-mobile-widget.preview-document {
    min-height: 0;
    display: flex;
    flex: 1;
    color: var(--ow-text);
    background: transparent;
    font-family: Outfit, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .demo-two-mobile-widget h1,
  .demo-two-mobile-widget h2,
  .demo-two-mobile-widget h3 {
    font-family: Outfit, system-ui, sans-serif;
    font-weight: 600;
    letter-spacing: -.035em;
  }
  .demo-two-mobile-widget .ow-widget { width: 100%; display: flex; flex-direction: column; }

  /* Mobile copy variants (normally supplied by .preview-mobile). */
  .demo-two-mobile-widget .ow-desktop-copy { display: none; }
  .demo-two-mobile-widget .ow-mobile-copy { display: inline; }

  /* The sheet is the surface, so the widget drops its own card chrome. */
  .demo-two-mobile-widget .ow-panel,
  .demo-two-mobile-widget .ow-recovery,
  .demo-two-mobile-widget .ow-status-panel {
    min-height: 0;
    flex: 1;
    padding: 0;
    overflow: visible;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
  .demo-two-mobile-widget .ow-alternative-card,
  .demo-two-mobile-widget .ow-artwork-image,
  .demo-two-mobile-widget .ow-coupon { background: transparent; }

  /* Copy scales against the sheet width rather than a fixed mobile ramp. */
  .demo-two-mobile-widget .ow-offer-intro h2,
  .demo-two-mobile-widget .ow-status-panel h2,
  .demo-two-mobile-widget .ow-recovery-heading h2 {
    margin-bottom: 16px;
    font-size: clamp(19px, 6cqw, 23px);
    line-height: 1.12;
  }
  .demo-two-mobile-widget .ow-mobile-copy { white-space: normal; text-wrap: balance; }
  .demo-two-mobile-widget .ow-offer-summary { min-height: 0; gap: 14px; align-items: center; }
  .demo-two-mobile-widget .ow-offer-summary > p {
    max-width: 320px;
    font-size: clamp(12px, 3.7cqw, 13.5px);
    line-height: 1.5;
    -webkit-line-clamp: 4;
  }
  /* The partner mark is a wide lockup, so the box tracks its ~4:1 ratio. */
  .demo-two-mobile-widget .ow-density-compact.ow-alignment-center .ow-offer-summary > .ow-artwork {
    width: clamp(120px, 38cqw, 152px);
    height: auto;
    margin-bottom: 0;
  }
  .demo-two-mobile-widget .ow-density-compact.ow-alignment-center .ow-offer-summary > .ow-fallback-partner-logo {
    width: clamp(120px, 38cqw, 152px);
    height: clamp(32px, 10cqw, 40px);
  }
  .demo-two-mobile-widget .ow-artwork.ow-fallback-partner-logo > img { padding: 0; }

  /* Two full-width actions sit at the bottom of the sheet. */
  .demo-two-mobile-widget .ow-offer-actions,
  .demo-two-mobile-widget .ow-status-actions {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 9px;
    margin-top: 18px;
  }
  .demo-two-mobile-widget .ow-offer-actions-single,
  .demo-two-mobile-widget .ow-claimed-actions { grid-template-columns: minmax(0, 1fr); }
  .demo-two-mobile-widget .ow-button,
  .demo-two-mobile-widget .ow-status-actions .ow-button,
  .demo-two-mobile-widget .ow-claimed-actions .ow-button,
  .demo-two-mobile-widget .ow-claimed-actions .ow-coupon {
    min-width: 0;
    min-height: 46px;
    padding-inline: 12px;
    font-size: clamp(12.5px, 3.8cqw, 14px);
    font-weight: 600;
  }
  .demo-two-mobile-widget .ow-button-quiet {
    background: #fff;
    box-shadow: 0 0 0 var(--ow-secondary-button-stroke-width) var(--ow-secondary-button-border);
  }
  .demo-two-mobile-widget .ow-claimed-actions .ow-coupon { margin: 0; padding: 8px 16px; }
  .demo-two-mobile-widget .ow-coupon span { font-size: clamp(12px, 3.7cqw, 13.5px); letter-spacing: .1em; }
  .demo-two-mobile-widget .ow-coupon strong { font-size: 10px; }

  /* Alternatives read as plain rows on white. */
  .demo-two-mobile-widget .ow-recovery { display: flex; flex-direction: column; }
  .demo-two-mobile-widget .ow-recovery-heading { min-height: 0; margin: 0 0 2px; padding: 0; gap: 14px; }
  .demo-two-mobile-widget .ow-recovery-heading h2 { margin-bottom: 0; }
  .demo-two-mobile-widget .ow-recovery-heading button { min-height: 30px; font-size: 11px; }
  .demo-two-mobile-widget .ow-alternative-card {
    grid-template-columns: 44px minmax(0, 1fr) auto;
    gap: 12px;
    padding: 11px 0;
  }
  .demo-two-mobile-widget .ow-alternative-logo { width: 44px; height: 44px; }
  .demo-two-mobile-widget .ow-alternative-copy h3 { font-size: clamp(13px, 4cqw, 14.5px); }
  .demo-two-mobile-widget .ow-alternative-copy > p { font-size: clamp(11px, 3.3cqw, 12px); line-height: 1.35; }
  .demo-two-mobile-widget .ow-alternative-action {
    min-width: 66px;
    min-height: 34px;
    padding-inline: 12px;
    font-size: 11px;
  }
  .demo-two-mobile-widget .ow-alternative-divider { min-height: 0; padding: 0; font-size: 8px; }

  /* Footer is a quiet attribution line under the actions. */
  .demo-two-mobile-widget .ow-widget-footer,
  .demo-two-mobile-widget .ow-primary-offer > .ow-widget-footer,
  .demo-two-mobile-widget .ow-status-panel > .ow-widget-footer {
    margin-top: 14px;
    padding-top: 11px;
    box-shadow: inset 0 1px var(--ow-border);
  }
  .demo-two-mobile-widget .ow-powered-by,
  .demo-two-mobile-widget .ow-widget-footer .ow-disclosure { font-size: 8.5px; }
  .demo-two-mobile-widget .ow-powered-by img { height: 10px; }
  .demo-two-mobile-widget .ow-status-content { margin: 0 0 auto; gap: 5px; }
  .demo-two-mobile-widget .ow-status-content > p {
    margin-bottom: 0;
    font-size: clamp(12px, 3.7cqw, 13.5px);
    line-height: 1.45;
  }
  @keyframes demo-two-backdrop-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes demo-two-sheet-in {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .demo-two-offer-backdrop,
    .demo-two-offer-sheet { animation-duration: .01ms; }
  }
`;

function createDemoTwoConfiguration(): WidgetConfiguration {
  const config = createDefaultWidgetConfiguration();

  return {
    ...config,
    theme: {
      ...config.theme,
      surface: "#ffffff",
      softSurface: "#ffffff",
      text: "#111111",
      mutedText: "#8b8b8b",
      primary: "#111111",
      primaryText: "#ffffff",
      accent: "#c9a3ff",
      border: "#e6e6e6",
      primaryButtonBorder: "#111111",
      secondaryButtonBorder: "#e6e6e6",
      containerRadius: 24,
      buttonRadius: 999,
      secondaryButtonRadius: 999,
      secondaryButtonBorderWidth: 1,
    },
    behavior: {
      ...config.behavior,
      alignment: "center",
    },
    disclosure: "A partner benefit unlocked by this order.",
  };
}

export function DemoTwoOffer() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [frameLoadCount, setFrameLoadCount] = useState(0);
  const [widgetState, setWidgetState] = useState<WidgetState>("default");
  const [sheetOpen, setSheetOpen] = useState(true);
  const [config] = useState(createDemoTwoConfiguration);

  useEffect(() => {
    let attempt = 0;
    const tryMount = () => {
      const frameDocument = frameRef.current?.contentDocument;
      const screen = frameDocument?.querySelector<HTMLElement>("[data-screen-label='Order placed']");
      if (!screen) return false;

      let host = frameDocument.getElementById("demo-two-offer-host");
      if (!host) {
        host = frameDocument.createElement("div");
        host.id = "demo-two-offer-host";
        Object.assign(host.style, {
          position: "absolute",
          zIndex: "6",
          inset: "0",
        });
        screen.appendChild(host);
      }

      const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
      let mountPoint = shadow.querySelector<HTMLElement>("#demo-two-offer-mount");
      if (!mountPoint) {
        for (const stylesheet of document.head.querySelectorAll("link[rel='stylesheet'], style")) {
          shadow.appendChild(stylesheet.cloneNode(true));
        }
        mountPoint = frameDocument.createElement("div");
        mountPoint.id = "demo-two-offer-mount";
        shadow.appendChild(mountPoint);
      }

      setPortalTarget(mountPoint);
      return true;
    };

    if (tryMount()) return;

    const interval = window.setInterval(() => {
      attempt += 1;
      if (tryMount() || attempt >= 80) window.clearInterval(interval);
    }, 50);

    return () => window.clearInterval(interval);
  }, [frameLoadCount]);

  // The device mock renders at its natural size, so scale it down to the window.
  useEffect(() => {
    if (!portalTarget) return;
    const frameDocument = frameRef.current?.contentDocument;
    const frameWindow = frameRef.current?.contentWindow;
    const screen = frameDocument?.querySelector<HTMLElement>("[data-screen-label='Order placed']");
    if (!frameDocument || !frameWindow || !screen) return;

    let device = screen;
    while (
      device.parentElement &&
      device.parentElement !== frameDocument.body &&
      device.parentElement.tagName !== "X-DC"
    ) {
      device = device.parentElement;
    }

    Object.assign(frameDocument.documentElement.style, { overflow: "hidden" });
    Object.assign(frameDocument.body.style, { overflow: "hidden" });

    // `zoom` rather than `transform` so the shrunk box also reflows, letting the
    // page's flex centering keep the device centred instead of clipping it.
    const fit = (target: HTMLElement) => {
      Object.assign(target.style, { zoom: "" });
      const { width, height } = target.getBoundingClientRect();
      const viewWidth = frameDocument.documentElement.clientWidth;
      const viewHeight = frameDocument.documentElement.clientHeight;
      if (!width || !height || !viewWidth || !viewHeight) return;
      const scale = Math.min(1, (viewWidth - 24) / width, (viewHeight - 24) / height);
      if (scale < 1) Object.assign(target.style, { zoom: String(scale) });
    };

    const handleResize = () => fit(device);
    handleResize();

    // The device mock sizes itself asynchronously, so re-fit as it settles.
    const { ResizeObserver: FrameResizeObserver } = frameWindow as Window & typeof globalThis;
    const observer = new FrameResizeObserver(handleResize);
    observer.observe(device);
    frameWindow.addEventListener("resize", handleResize);
    frameWindow.addEventListener("load", handleResize);

    return () => {
      observer.disconnect();
      frameWindow.removeEventListener("resize", handleResize);
      frameWindow.removeEventListener("load", handleResize);
    };
  }, [portalTarget, frameLoadCount]);

  useEffect(() => {
    if (!sheetOpen || !portalTarget) return;
    const frameWindow = frameRef.current?.contentWindow;
    if (!frameWindow) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheetOpen(false);
    };
    frameWindow.addEventListener("keydown", handleKeyDown);
    return () => frameWindow.removeEventListener("keydown", handleKeyDown);
  }, [portalTarget, sheetOpen]);

  const handleFrameLoad = () => {
    setPortalTarget(null);
    setSheetOpen(true);
    setWidgetState("default");
    setFrameLoadCount((count) => count + 1);
  };

  const handleEvent: (event: WidgetEvent) => void = () => {
    // The embedded demo keeps events local while exercising the widget flow.
  };

  const handleStateChange = (state: WidgetState) => {
    setWidgetState(state);
    if (state === "exit") setSheetOpen(false);
  };

  return (
    <>
      <iframe
        ref={frameRef}
        src="/demo/2-source.html"
        title="H34W order confirmation"
        onLoad={handleFrameLoad}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
          background: "white",
        }}
      />
      {portalTarget && sheetOpen && createPortal(
        <div
          className="demo-two-offer-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Benefit unlocked by your order"
        >
          <style>{demoTwoOverrides}</style>
          <button
            className="demo-two-offer-backdrop"
            type="button"
            aria-label="Dismiss offer"
            onClick={() => setSheetOpen(false)}
          />
          <div className="demo-two-offer-sheet">
            <div className="demo-two-offer-handle" aria-hidden="true" />
            <div className="demo-two-mobile-widget preview-document" style={demoTwoTheme}>
              <OfferWidget
                config={config}
                experiment="claim-and-not-for-me"
                state={widgetState}
                onStateChange={handleStateChange}
                onEvent={handleEvent}
              />
            </div>
          </div>
        </div>,
        portalTarget,
      )}
    </>
  );
}
