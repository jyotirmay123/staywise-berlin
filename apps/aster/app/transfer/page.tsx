import type { Metadata } from "next";
import { PortfolioTransfer } from "@/components/portfolio-transfer";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { isTransferNonce } from "@/lib/hosted-transfer";

export const metadata: Metadata = {
  title: "Transfer your portfolio — Aster",
  robots: { index: false, follow: false },
};

export default async function TransferPage({
  searchParams,
}: {
  searchParams: Promise<{ nonce?: string | string[] }>;
}) {
  const params = await searchParams;
  const nonce = isTransferNonce(params.nonce) ? params.nonce : null;
  await requireChatGPTUser(nonce ? `/transfer?nonce=${nonce}` : "/transfer");
  return <PortfolioTransfer nonce={nonce} />;
}
