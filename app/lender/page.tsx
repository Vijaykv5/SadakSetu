import type { Metadata } from "next";
import { LenderDashboard } from "@/components/lender-dashboard";

export const metadata: Metadata = { title: "Lender workspace" };

export default function LenderPage() {
  return <LenderDashboard />;
}

