import type { Metadata } from "next";
import { RoadDiscovery } from "@/components/road-discovery";

export const metadata: Metadata = {
  title: "India road explorer",
  description: "Explore India road conditions and inspect live privacy-safe Arkiv reports in one place.",
};

export default function RoadsPage() {
  return <RoadDiscovery />;
}
