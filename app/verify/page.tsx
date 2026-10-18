import type { Metadata } from "next";
import { VerifierConsole } from "@/components/verifier-console";

export const metadata: Metadata = { title: "Road verification" };

export default function VerifyPage() {
  return <VerifierConsole />;
}
