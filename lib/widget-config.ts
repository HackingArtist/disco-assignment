export type WidgetState =
  | "default"
  | "loading"
  | "recovery"
  | "claimed"
  | "error"
  | "empty"
  | "exit";

export type WidgetDensity = "compact" | "roomy";
export type PreviewContext = "context" | "isolated";
export type PreviewViewport = "desktop" | "mobile";
export type FontPreset = "editorial" | "serif" | "modern";
export type ArtworkKind = "bottle" | "journal" | "socks";

export type WidgetEvent =
  | "widget_viewed"
  | "offer_rejected:primary"
  | "alternatives_viewed"
  | `offer_claimed:${string}`
  | "alternatives_rejected"
  | "code_copied"
  | `demo_state:${WidgetState}`;

export interface AssetReference {
  kind: "fallback" | "url" | "upload";
  src: string;
  alt: string;
  fallback: ArtworkKind;
  fileName?: string;
}

export interface MerchantBrand {
  name: string;
  wordmark: string;
  contactEmail: string;
  logo: AssetReference;
}

export interface WidgetTheme {
  page: string;
  surface: string;
  softSurface: string;
  text: string;
  mutedText: string;
  primary: string;
  primaryText: string;
  accent: string;
  border: string;
  radius: number;
  fontPreset: FontPreset;
}

export interface OfferConfig {
  id: string;
  partnerName: string;
  eyebrow: string;
  headline: string;
  introduction: string;
  title: string;
  detail: string;
  expiry: string;
  claimLabel: string;
  couponCode: string;
  destinationLabel: string;
  image: AssetReference;
}

export interface WidgetBehavior {
  density: WidgetDensity;
  rejectionFlow: "alternatives" | "dismiss";
  claimMode: "coupon" | "email";
  showExpiry: boolean;
  showDisclosure: boolean;
}

export interface WidgetConfiguration {
  merchant: MerchantBrand;
  theme: WidgetTheme;
  primaryOffer: OfferConfig;
  alternativeOffers: [OfferConfig, OfferConfig];
  behavior: WidgetBehavior;
  disclosure: string;
}

export const widgetStateLabels: Record<WidgetState, string> = {
  default: "Best match",
  loading: "Finding matches",
  recovery: "Alternatives",
  claimed: "Claimed",
  error: "Error",
  empty: "No match",
  exit: "Dismissed",
};

export const fontPresetLabels: Record<FontPreset, string> = {
  editorial: "Editorial",
  serif: "Contemporary serif",
  modern: "Modern sans",
};

export const fontPresetVariables: Record<
  FontPreset,
  { display: string; body: string }
> = {
  editorial: {
    display: "var(--font-cormorant)",
    body: "var(--font-dm-sans)",
  },
  serif: {
    display: "var(--font-fraunces)",
    body: "var(--font-dm-sans)",
  },
  modern: {
    display: "var(--font-space-grotesk)",
    body: "var(--font-space-grotesk)",
  },
};

export const defaultWidgetConfiguration: WidgetConfiguration = {
  merchant: {
    name: "Noma",
    wordmark: "NOMA",
    contactEmail: "hello@noma.example",
    logo: {
      kind: "fallback",
      src: "",
      alt: "Noma",
      fallback: "bottle",
    },
  },
  theme: {
    page: "#f5f2eb",
    surface: "#fffdf9",
    softSurface: "#ebe5d8",
    text: "#20231e",
    mutedText: "#686b64",
    primary: "#253a2a",
    primaryText: "#fffdf9",
    accent: "#d39c72",
    border: "#d8d3c9",
    radius: 0,
    fontPreset: "editorial",
  },
  primaryOffer: {
    id: "morrow",
    partnerName: "Morrow",
    eyebrow: "A little something for your order",
    headline: "Because you chose the trail runner.",
    introduction: "Meet the bottle built for the miles ahead.",
    title: "$20 off the Ridge bottle",
    detail: "Insulated stainless steel · 24 oz",
    expiry: "Yours for the next 24 hours",
    claimLabel: "Claim $20 off",
    couponCode: "NOMA20",
    destinationLabel: "Shop Morrow",
    image: {
      kind: "fallback",
      src: "",
      alt: "Morrow Ridge bottle",
      fallback: "bottle",
    },
  },
  alternativeOffers: [
    {
      id: "field-notes",
      partnerName: "Field Notes",
      eyebrow: "Alternative offer",
      headline: "A trail journal, on us",
      introduction: "A useful place for routes, notes, and new ideas.",
      title: "A trail journal, on us",
      detail: "Free 3-pack with your first order.",
      expiry: "Available for 24 hours",
      claimLabel: "Claim free set",
      couponCode: "TRAILSET",
      destinationLabel: "Shop Field Notes",
      image: {
        kind: "fallback",
        src: "",
        alt: "Field Notes trail journal",
        fallback: "journal",
      },
    },
    {
      id: "ritual",
      partnerName: "Ritual Goods",
      eyebrow: "Alternative offer",
      headline: "25% off performance socks",
      introduction: "Built for long days and longer trails.",
      title: "25% off performance socks",
      detail: "Merino comfort for longer runs.",
      expiry: "Available for 24 hours",
      claimLabel: "Claim 25% off",
      couponCode: "RITUAL25",
      destinationLabel: "Shop Ritual Goods",
      image: {
        kind: "fallback",
        src: "",
        alt: "Ritual Goods performance socks",
        fallback: "socks",
      },
    },
  ],
  behavior: {
    density: "compact",
    rejectionFlow: "alternatives",
    claimMode: "coupon",
    showExpiry: true,
    showDisclosure: true,
  },
  disclosure: "Offer from a Noma partner, matched to your order.",
};

export function createDefaultWidgetConfiguration(): WidgetConfiguration {
  return structuredClone(defaultWidgetConfiguration);
}

export function getUploadedAssets(config: WidgetConfiguration): AssetReference[] {
  return [
    config.merchant.logo,
    config.primaryOffer.image,
    ...config.alternativeOffers.map((offer) => offer.image),
  ].filter((asset) => asset.kind === "upload" && asset.src);
}

function channelToLinear(channel: number): number {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(foreground: string, background: string): number {
  const readHex = (value: string) => {
    const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value);
    if (!match) return null;
    const [, red, green, blue] = match;
    const luminance =
      0.2126 * channelToLinear(Number.parseInt(red, 16)) +
      0.7152 * channelToLinear(Number.parseInt(green, 16)) +
      0.0722 * channelToLinear(Number.parseInt(blue, 16));
    return luminance;
  };

  const foregroundLuminance = readHex(foreground);
  const backgroundLuminance = readHex(background);
  if (foregroundLuminance === null || backgroundLuminance === null) return 0;
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function isValidHex(value: string): boolean {
  return /^#[\da-f]{6}$/i.test(value);
}

export function isValidImageUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
