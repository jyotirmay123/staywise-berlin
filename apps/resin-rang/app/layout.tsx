import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Playfair_Display } from "next/font/google";
import "./globals.css";

const hindi = Noto_Sans_Devanagari({
  variable: "--font-hindi",
  subsets: ["devanagari"],
});

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "रेज़िन रंग — हाथों से बना, दिल से चुना", template: "%s | रेज़िन रंग" },
  description: "हैंडमेड रेज़िन कीचेन, रिंग्स, नेकलेस, हेयर क्लिप्स और मैचिंग सेट्स की खूबसूरत दुकान।",
  openGraph: {
    title: "रेज़िन रंग — हर रंग में आपकी कहानी",
    description: "हैंडमेड रेज़िन ज्वेलरी और प्यारे गिफ्ट्स।",
    locale: "hi_IN",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hi">
      <body className={`${hindi.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}
