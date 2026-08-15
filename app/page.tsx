"use client";

import { useEffect, useRef, useState } from "react";

type View = "default" | "loading" | "recovery" | "claimed" | "error" | "empty" | "exit";
type Claim = "Morrow" | "Field Notes" | "Ritual";

const viewNames: Record<View, string> = {
  default: "Best match",
  loading: "Finding matches",
  recovery: "Alternatives",
  claimed: "Claimed",
  error: "Error",
  empty: "No match",
  exit: "Dismissed",
};

function ChevronDown() {
  return <span aria-hidden="true" className="chevron">⌄</span>;
}

function CheckIcon() {
  return <span className="check-icon" aria-hidden="true">✓</span>;
}

function BottleArtwork({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`art art-morrow ${compact ? "art-compact" : ""}`} aria-hidden="true">
      <div className="bottle-shadow" />
      <div className="bottle">
        <div className="bottle-cap" />
        <span>M</span>
      </div>
      <span className="art-label">Trail ready</span>
    </div>
  );
}

function JournalArtwork() {
  return (
    <div className="art art-journal" aria-hidden="true">
      <div className="journal-shadow" />
      <div className="journal"><span>FIELD<br />NOTES</span></div>
      <i className="pencil" />
    </div>
  );
}

function SocksArtwork() {
  return (
    <div className="art art-socks" aria-hidden="true">
      <div className="sock sock-one"><span>R</span></div>
      <div className="sock sock-two"><span>R</span></div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("default");
  const [claimedBrand, setClaimedBrand] = useState<Claim>("Morrow");
  const [copied, setCopied] = useState(false);
  const [events, setEvents] = useState<string[]>(["widget_viewed"]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const track = (event: string) => setEvents((current) => [event, ...current].slice(0, 4));

  const reject = () => {
    track("offer_rejected:primary");
    setView("loading");
    timerRef.current = setTimeout(() => {
      setView("recovery");
      track("alternatives_viewed");
    }, 650);
  };

  const claim = (brand: Claim) => {
    setClaimedBrand(brand);
    setView("claimed");
    track(`offer_claimed:${brand.toLowerCase().replace(" ", "_")}`);
  };

  const chooseView = (next: View) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setView(next);
    setCopied(false);
    track(`demo_state:${next}`);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText("NOMA20");
    } catch {
      // Clipboard access can be unavailable in embedded previews.
    }
    setCopied(true);
    track("code_copied");
  };

  return (
    <main>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Noma home">NOMA</a>
        <nav aria-label="Order navigation">
          <button type="button">Help</button>
          <button type="button" className="account">AM</button>
        </nav>
      </header>

      <section className="confirmation" id="top">
        <div className="receipt-column">
          <div className="success-heading">
            <CheckIcon />
            <div>
              <p className="eyebrow">Order #NM-28419</p>
              <h1>Thanks, Aashish.<br />Your order is confirmed.</h1>
              <p className="lede">We&apos;ll email you when it&apos;s on the way.</p>
            </div>
          </div>

          <div className="order-card">
            <div className="order-product">
              <div className="shoe-art" aria-hidden="true">
                <div className="shoe-sole" />
                <div className="shoe-body">N</div>
              </div>
              <div>
                <p className="product-name">All Terrain Runner</p>
                <p className="muted">Sand / EU 42 · Qty 1</p>
              </div>
              <p className="price">$148</p>
            </div>
            <button className="details-toggle" type="button">
              <span>Order details</span><ChevronDown />
            </button>
          </div>
        </div>

        <aside className="offer-column" aria-label="Offer for your order">
          <div className="offer-kicker">
            <span>From Noma</span>
            <i />
            <span>For this order</span>
          </div>

          {view === "default" && (
            <section className="offer-panel primary-offer">
              <div className="offer-intro">
                <p className="eyebrow">A little something for your order</p>
                <h2>Because you chose the trail runner.</h2>
                <p>Meet the bottle built for the miles ahead.</p>
              </div>
              <BottleArtwork />
              <div className="offer-copy">
                <div>
                  <p className="partner-name">Morrow</p>
                  <h3>$20 off the Ridge bottle</h3>
                  <p className="offer-detail">Insulated stainless steel · 24 oz</p>
                </div>
                <p className="expiry">Yours for the next 24 hours</p>
              </div>
              <div className="offer-actions">
                <button className="button button-primary" type="button" onClick={() => claim("Morrow")}>Claim $20 off</button>
                <button className="button button-quiet" type="button" onClick={reject}>Not for me</button>
              </div>
              <p className="disclosure">Offer from a Noma partner, matched to your order.</p>
            </section>
          )}

          {view === "loading" && (
            <section className="offer-panel status-panel loading-panel" aria-live="polite" aria-busy="true">
              <div className="loading-mark"><span /><span /><span /></div>
              <p className="eyebrow">One moment</p>
              <h2>Finding a better match…</h2>
              <p>Looking at what pairs well with your order.</p>
              <div className="loading-lines"><i /><i /><i /></div>
            </section>
          )}

          {view === "recovery" && (
            <section className="recovery" aria-live="polite">
              <div className="recovery-heading">
                <div>
                  <p className="eyebrow">Two more ideas</p>
                  <h2>Maybe one of these?</h2>
                </div>
                <button type="button" onClick={() => { setView("exit"); track("alternatives_rejected"); }}>Neither</button>
              </div>
              <article className="alternative-card">
                <JournalArtwork />
                <div className="alternative-copy">
                  <p className="partner-name">Field Notes</p>
                  <h3>A trail journal, on us</h3>
                  <p>Free 3-pack with your first order.</p>
                  <button className="button button-dark" type="button" onClick={() => claim("Field Notes")}>Claim free set</button>
                </div>
              </article>
              <article className="alternative-card">
                <SocksArtwork />
                <div className="alternative-copy">
                  <p className="partner-name">Ritual Goods</p>
                  <h3>25% off performance socks</h3>
                  <p>Merino comfort for longer runs.</p>
                  <button className="button button-dark" type="button" onClick={() => claim("Ritual")}>Claim 25% off</button>
                </div>
              </article>
              <p className="disclosure">Offers from Noma partners, matched to your order.</p>
            </section>
          )}

          {view === "claimed" && (
            <section className="offer-panel status-panel claimed-panel" aria-live="polite">
              <span className="status-icon">✓</span>
              <p className="eyebrow">Saved for later</p>
              <h2>Your {claimedBrand} offer is claimed.</h2>
              <p>We sent the details to <strong>aashish@gmail.com</strong>, so you don&apos;t need to use it now.</p>
              <button className="coupon" type="button" onClick={copyCode} aria-label="Copy offer code NOMA20">
                <span><small>Your code</small>NOMA20</span>
                <strong>{copied ? "Copied" : "Copy"}</strong>
              </button>
              <a className="button button-primary" href="#partner">Shop {claimedBrand}</a>
              <button className="text-action" type="button" onClick={() => chooseView("default")}>Back to order</button>
            </section>
          )}

          {view === "error" && (
            <section className="offer-panel status-panel error-panel" aria-live="polite">
              <span className="status-icon">↻</span>
              <p className="eyebrow">That didn&apos;t load</p>
              <h2>We couldn&apos;t find your offer.</h2>
              <p>Your order is all set. You can try the offer again without affecting anything.</p>
              <button className="button button-primary" type="button" onClick={reject}>Try again</button>
              <button className="button button-quiet" type="button" onClick={() => chooseView("exit")}>No thanks</button>
            </section>
          )}

          {view === "empty" && (
            <section className="offer-panel status-panel empty-panel" aria-live="polite">
              <span className="status-icon">✦</span>
              <p className="eyebrow">That&apos;s everything</p>
              <h2>Nothing worth showing right now.</h2>
              <p>We&apos;d rather show nothing than something that isn&apos;t a good fit. Enjoy your new runners.</p>
              <button className="text-action" type="button" onClick={() => chooseView("default")}>Return to order</button>
            </section>
          )}

          {view === "exit" && (
            <section className="offer-panel status-panel exit-panel" aria-live="polite">
              <span className="status-icon">✓</span>
              <p className="eyebrow">All done</p>
              <h2>No problem. Enjoy your order.</h2>
              <p>We&apos;ll use your feedback to make the next match more useful.</p>
              <button className="text-action" type="button" onClick={() => chooseView("default")}>Undo</button>
            </section>
          )}
        </aside>
      </section>

      <footer>
        <p>Need a hand? <a href="mailto:hello@noma.example">Contact Noma</a></p>
        <p>© 2026 Noma Supply Co.</p>
      </footer>

      <div className="demo-controller">
        <label htmlFor="demo-state">Prototype state</label>
        <select id="demo-state" value={view} onChange={(event) => chooseView(event.target.value as View)}>
          {(Object.keys(viewNames) as View[]).map((key) => <option key={key} value={key}>{viewNames[key]}</option>)}
        </select>
        <div className="event-log" aria-label="Recent prototype events">
          <span className="event-dot" />
          <span>{events[0]}</span>
        </div>
      </div>
    </main>
  );
}
