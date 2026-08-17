export type WidgetState =
  | "default"
  | "recovery"
  | "claimed"
  | "error"
  | "empty"
  | "exit";

export type PreviewState = WidgetState | "all";

export type WidgetDensity = "compact" | "roomy";
export type WidgetAlignment = "left" | "center";
export type PreviewViewport = "desktop" | "mobile";
export type WidgetExperiment = "claim-only" | "claim-and-not-for-me" | "both";
export type GoogleFont = "cormorant-garamond" | "dm-sans" | "fraunces" | "space-grotesk";
export type ArtworkKind = "bottle" | "journal" | "socks";

export type WidgetEvent =
  | "widget_viewed"
  | "offer_rejected:primary"
  | "alternatives_viewed"
  | `offer_claimed:${string}`
  | "alternatives_rejected"
  | "code_copied"
  | `demo_state:${PreviewState}`;

export interface AssetReference {
  kind: "fallback" | "url" | "upload";
  src: string;
  alt: string;
  fallback: ArtworkKind;
  fileName?: string;
}

export interface MerchantBrand {
  name: string;
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
  primaryButtonBorder: string;
  secondaryButtonBorder: string;
  containerRadius: number;
  containerBorderWidth: number;
  buttonRadius: number;
  secondaryButtonRadius: number;
  primaryButtonBorderWidth: number;
  secondaryButtonBorderWidth: number;
  primaryFont: GoogleFont;
  secondaryFont: GoogleFont;
  headingFontSize: string;
  headingFontWeight: number;
  secondaryFontSize: string;
  secondaryFontWeight: number;
  primaryButtonCss: string;
  secondaryButtonCss: string;
}

export interface OfferConfig {
  id: string;
  partnerName: string;
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
  experiment: WidgetExperiment;
  density: WidgetDensity;
  alignment: WidgetAlignment;
  rejectionFlow: "alternatives" | "dismiss";
  claimMode: "coupon" | "email";
  showArtwork: boolean;
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
  recovery: "Alternatives",
  claimed: "Claimed",
  error: "Error",
  empty: "No match",
  exit: "Dismissed",
};

export const widgetStates = Object.keys(widgetStateLabels) as WidgetState[];

export const googleFontLabels: Record<GoogleFont, string> = {
  "cormorant-garamond": "Cormorant Garamond",
  "dm-sans": "DM Sans",
  fraunces: "Fraunces",
  "space-grotesk": "Space Grotesk",
};

export const googleFontVariables: Record<GoogleFont, string> = {
  "cormorant-garamond": "var(--font-cormorant)",
  "dm-sans": "var(--font-dm-sans)",
  fraunces: "var(--font-fraunces)",
  "space-grotesk": "var(--font-space-grotesk)",
};

export const defaultWidgetConfiguration: WidgetConfiguration = {
  merchant: {
    name: "Disco Network",
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
    primaryButtonBorder: "#253a2a",
    secondaryButtonBorder: "#d8d3c9",
    containerRadius: 0,
    containerBorderWidth: 0,
    buttonRadius: 0,
    secondaryButtonRadius: 0,
    primaryButtonBorderWidth: 0,
    secondaryButtonBorderWidth: 0,
    primaryFont: "cormorant-garamond",
    secondaryFont: "dm-sans",
    headingFontSize: "36px",
    headingFontWeight: 600,
    secondaryFontSize: "14px",
    secondaryFontWeight: 400,
    primaryButtonCss: "",
    secondaryButtonCss: "",
  },
  primaryOffer: {
    id: "morrow",
    partnerName: "45 degrees",
    headline: "Your order unlocked a 1 month free trial.",
    introduction: "45 Degrees' premium trekking club membership. Join the group of elite adventurers every month for exclusive experiences.",
    title: "Your Morrow bottle benefit",
    detail: "Premium trekking club membership · 1 month free trial",
    expiry: "Your perk is available for the next 24 hours",
    claimLabel: "Use my benefit",
    couponCode: "MORROW20",
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
      headline: "Your order includes trail notes",
      introduction: "A place for routes, notes, and new ideas.",
      title: "Your order unlocks a complimentary 3-pack ",
      detail: "Camelin's Field Notes trail journal, perfect for your next adventure.",
      expiry: "Your perk is available for 24 hours",
      claimLabel: "Choose this benefit",
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
      headline: "Your order unlocked trail comfort",
      introduction: "A 25% benefit on Ritual Goods merino running socks.",
      title: "Your order unlocks 25% off",
      detail: "Merino running socks pack of 6, made in the USA.",
      expiry: "Your perk is available for 24 hours",
      claimLabel: "Choose this benefit",
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
    experiment: "claim-and-not-for-me",
    density: "compact",
    alignment: "left",
    rejectionFlow: "alternatives",
    claimMode: "coupon",
    showArtwork: true,
    showExpiry: true,
    showDisclosure: true,
  },
  disclosure: "A partner benefit unlocked by your Noma order.",
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
