import type { Metadata } from "next";
import { AuthorityDashboard } from "@/components/authority-dashboard";
import { AuthorityOperationsGate } from "@/components/authority-operations-gate";

export const metadata: Metadata = { title: "Authority operations" };

export default function OperationsPage() {
  return <AuthorityOperationsGate><AuthorityDashboard /></AuthorityOperationsGate>;
}
