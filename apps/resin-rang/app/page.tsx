import type { Metadata } from "next";
import Storefront from "./storefront";

export const metadata: Metadata = {
  title: "रेज़िन रंग",
  description: "हाथों से बनी रेज़िन ज्वेलरी और गिफ्ट्स खरीदें।",
};

export default function Home() {
  return <Storefront />;
}
