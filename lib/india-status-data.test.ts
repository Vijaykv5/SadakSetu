import { describe, expect, test } from "bun:test";
import { INDIA_CITIES, incidentsForCity, projectIndiaCoordinate } from "@/lib/india-status-data";

describe("India status map data", () => {
  test("projects every monitored city into the India boundary coordinate range", () => {
    for (const city of INDIA_CITIES) {
      const point = projectIndiaCoordinate(city.latitude, city.longitude);
      expect(point.x).toBeGreaterThan(2_800_000);
      expect(point.x).toBeLessThan(5_700_000);
      expect(point.y).toBeGreaterThan(-5_500_000);
      expect(point.y).toBeLessThan(-2_100_000);
    }
  });

  test("caps city previews at ten unique incident markers", () => {
    INDIA_CITIES.forEach((city, index) => {
      const incidents = incidentsForCity(city, index);
      expect(incidents).toHaveLength(Math.min(city.issueCount, 10));
      expect(new Set(incidents.map((incident) => incident.id)).size).toBe(incidents.length);
    });
  });
});
