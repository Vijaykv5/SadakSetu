import type { Metadata } from "next";
import { TrustExplorer } from "@/components/trust-explorer";

export const metadata: Metadata = { title: "Public registry" };

export default function TrustPage() {
  return <TrustExplorer />;
}

