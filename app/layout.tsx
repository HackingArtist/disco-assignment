import type { Metadata } from "next";
import { headers } from "next/headers";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "Order confirmed — Noma",
    description: "A trust-first post-purchase offer experience.",
    openGraph: {
      title: "Your order, thoughtfully continued.",
      description: "A trust-first post-purchase offer prototype.",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1733, height: 901, alt: "Noma post-purchase offer prototype" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Your order, thoughtfully continued.",
      description: "A trust-first post-purchase offer prototype.",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
