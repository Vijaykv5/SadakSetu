import { describe, expect, test } from "bun:test";
import { suggestReportingPlaces } from "@/lib/place-suggestions";

describe("road and area suggestions", () => {
  test("prioritises Bengaluru places when the field opens", () => {
    expect(suggestReportingPlaces("").every((place) => place.cityCode === "BLR")).toBe(true);
  });

  test("matches English road names", () => {
    expect(suggestReportingPlaces("Hosur")[0]?.value.en).toContain("Hosur Road");
  });

  test("matches Hindi place names", () => {
    expect(suggestReportingPlaces("पवई")[0]?.value.en).toBe("Powai, Mumbai");
  });
});
