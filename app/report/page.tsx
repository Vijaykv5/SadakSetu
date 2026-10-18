import type { Metadata } from "next";
import { CitizenReportFlow } from "@/components/citizen-report-flow";

export const metadata: Metadata = { title: "Report a road problem" };

export default function ReportPage() {
  return <CitizenReportFlow />;
}
