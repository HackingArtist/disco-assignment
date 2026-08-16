import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  Cormorant_Garamond,
  DM_Sans,
  Fraunces,
  Space_Grotesk,
} from "next/font/google";
import { AgentationToolbar } from "@/components/agentation-toolbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "Disco Offer Studio",
    description: "Configure and demo a branded post-purchase offer widget.",
    openGraph: {
      title: "Disco Offer Studio",
      description: "Configure and demo a branded post-purchase offer widget.",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1733, height: 901, alt: "Noma post-purchase offer prototype" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Disco Offer Studio",
      description: "Configure and demo a branded post-purchase offer widget.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${fraunces.variable} ${spaceGrotesk.variable}`}>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
        <AgentationToolbar />
      </body>
    </html>
  );
}
