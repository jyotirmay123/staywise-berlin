import type { Metadata, Viewport } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Manrope({
  variable: "--font-display",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host ?? "localhost:3000"}`);
  const description =
    "Private, offline-first investment tracking across euros and Indian rupees.";

  return {
    metadataBase,
    title: {
      default: "Aster — Portfolio, in perspective",
      template: "%s · Aster",
    },
    description,
    applicationName: "Aster",
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Aster",
    },
    icons: {
      icon: "/icon-192.png",
      apple: "/icon-192.png",
    },
    openGraph: {
      title: "Your wealth, in perspective.",
      description,
      type: "website",
      images: [{ url: new URL("/og.png", metadataBase).toString(), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Your wealth, in perspective.",
      description,
      images: [new URL("/og.png", metadataBase).toString()],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#10261f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        {children}
      </body>
    </html>
  );
}
