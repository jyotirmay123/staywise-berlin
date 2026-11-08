import type { Metadata } from "next";
import { PortfolioApp } from "@/components/portfolio-app";

export const metadata: Metadata = {
  title: "Aster — Portfolio, in perspective",
  description:
    "Private, offline-first investment tracking across euros and Indian rupees.",
};

export default function Home() {
  return <PortfolioApp />;
}
