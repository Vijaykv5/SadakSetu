import type { Metadata } from "next";
import { BorrowerFlow } from "@/components/borrower-flow";

export const metadata: Metadata = { title: "Check eligibility" };

export default function BorrowerPage() {
  return <BorrowerFlow />;
}

