import { describe, expect, test } from "bun:test";
import { suggestReportingPlaces } from "@/lib/place-suggestions";

describe("road and area suggestions", () => {
  test("features cities from several states when the field opens", () => {
    const featured = suggestReportingPlaces("");
    expect(new Set(featured.map((place) => place.stateCode)).size).toBeGreaterThan(4);
    expect(featured.some((place) => place.cityCode === "BLR")).toBe(true);
  });

  test("matches English road names", () => {
    expect(suggestReportingPlaces("Hosur")[0]?.value.en).toContain("Hosur Road");
  });

  test("matches Hindi place names", () => {
    expect(suggestReportingPlaces("पवई")[0]?.value.en).toBe("Powai, Mumbai, Maharashtra");
  });

  test("searches states and keeps state context in every result", () => {
    const matches = suggestReportingPlaces("Karnataka");
    expect(matches[0]?.kind).toBe("state");
    expect(matches.every((place) => place.stateCode === "KA")).toBe(true);
    expect(matches.some((place) => place.value.en.includes("Karnataka"))).toBe(true);
  });
});
