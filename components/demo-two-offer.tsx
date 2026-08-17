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
  "--ow-surface": "#f6f6f5",
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
    width: 100%;
    padding: 10px 16px 24px;
    border-radius: 30px 30px 0 0;
    background: #fff;
    box-shadow: 0 -18px 50px rgba(17, 17, 17, .18);
    animation: demo-two-sheet-in 260ms cubic-bezier(.2, 0, 0, 1) both;
  }
  .demo-two-offer-handle {
    width: 38px;
    height: 5px;
    margin: 0 auto 10px;
    border-radius: 9999px;
    background: #d2d2d2;
  }
  .demo-two-mobile-widget.preview-document {
    min-height: 0;
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
  .demo-two-mobile-widget .ow-widget { width: 100%; }
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
      surface: "#f6f6f5",
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
          top: "0",
          right: "0",
          left: "0",
          height: "min(100%, 100vh)",
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
            <div className="demo-two-mobile-widget preview-document preview-mobile" style={demoTwoTheme}>
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
