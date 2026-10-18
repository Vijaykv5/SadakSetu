import type { Metadata } from "next";
import { RoadReportDetail } from "@/components/road-report-detail";

export const metadata: Metadata = { title: "Road report" };
export const instant = false;

export default async function RoadReportPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return <RoadReportDetail entityKey={key} />;
}
