import type { Metadata } from "next";
import { IssuerConsole } from "@/components/issuer-console";

export const metadata: Metadata = { title: "Issuer operations" };

export default function IssuerPage() {
  return <IssuerConsole />;
}

