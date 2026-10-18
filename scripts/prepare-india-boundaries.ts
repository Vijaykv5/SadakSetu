import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type Point = [number, number];
type Ring = Point[];
type Polygon = Ring[];
type SourceFeature = {
  properties: { state?: string; state_name?: string; stcode?: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: Polygon | Polygon[] };
};

type SourceCollection = {
  features: SourceFeature[];
};

const SIMPLIFY_TOLERANCE_METRES = 6_000;
const MIN_ISLAND_AREA_SQUARE_METRES = 18_000_000;

function perpendicularDistanceSquared(point: Point, start: Point, end: Point) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) {
    return (point[0] - start[0]) ** 2 + (point[1] - start[1]) ** 2;
  }

  const progress = Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx ** 2 + dy ** 2)));
  const projectedX = start[0] + progress * dx;
  const projectedY = start[1] + progress * dy;
  return (point[0] - projectedX) ** 2 + (point[1] - projectedY) ** 2;
}

function simplifyLine(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;
  let farthestIndex = 0;
  let farthestDistance = 0;
  const threshold = tolerance ** 2;

  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = perpendicularDistanceSquared(points[index], points[0], points.at(-1)!);
    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestIndex = index;
    }
  }

  if (farthestDistance <= threshold) return [points[0], points.at(-1)!];
  const before = simplifyLine(points.slice(0, farthestIndex + 1), tolerance);
  const after = simplifyLine(points.slice(farthestIndex), tolerance);
  return [...before.slice(0, -1), ...after];
}

function ringArea(ring: Ring) {
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    area += ring[index][0] * ring[index + 1][1] - ring[index + 1][0] * ring[index][1];
  }
  return Math.abs(area / 2);
}

function simplifyRing(sourceRing: Ring): Ring {
  const toScreenCoordinates = (points: Ring): Ring => points.map(([x, y]) => [Math.round(x), Math.round(-y)]);
  const ring = sourceRing[0][0] === sourceRing.at(-1)?.[0] && sourceRing[0][1] === sourceRing.at(-1)?.[1]
    ? sourceRing.slice(0, -1)
    : [...sourceRing];
  if (ring.length < 4) return toScreenCoordinates(sourceRing);

  let westIndex = 0;
  let eastIndex = 0;
  for (let index = 1; index < ring.length; index += 1) {
    if (ring[index][0] < ring[westIndex][0]) westIndex = index;
    if (ring[index][0] > ring[eastIndex][0]) eastIndex = index;
  }

  const walk = (start: number, end: number) => {
    const points: Point[] = [];
    for (let index = start; ; index = (index + 1) % ring.length) {
      points.push(ring[index]);
      if (index === end) break;
    }
    return points;
  };

  const top = simplifyLine(walk(westIndex, eastIndex), SIMPLIFY_TOLERANCE_METRES);
  const bottom = simplifyLine(walk(eastIndex, westIndex), SIMPLIFY_TOLERANCE_METRES);
  const joined = [...top.slice(0, -1), ...bottom.slice(0, -1)];
  if (joined.length < 3) return toScreenCoordinates(sourceRing);
  joined.push(joined[0]);
  return toScreenCoordinates(joined);
}

function simplifyPolygon(polygon: Polygon): Polygon | null {
  if (ringArea(polygon[0]) < MIN_ISLAND_AREA_SQUARE_METRES) return null;
  const outer = simplifyRing(polygon[0]);
  const holes = polygon.slice(1)
    .filter((ring) => ringArea(ring) >= MIN_ISLAND_AREA_SQUARE_METRES)
    .map(simplifyRing);
  return [outer, ...holes];
}

const inputPath = process.argv[2];
const outputPath = process.argv[3] ?? "public/data/india-states.json";
if (!inputPath) throw new Error("Usage: bun scripts/prepare-india-boundaries.ts <source.geojson> [output.json]");

const source = await Bun.file(resolve(inputPath)).json() as SourceCollection;
const features = source.features.map((feature) => {
  const polygons = feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates as Polygon]
    : feature.geometry.coordinates as Polygon[];
  return {
    code: feature.properties.state ?? feature.properties.stcode ?? "",
    name: feature.properties.state_name ?? "Unknown state",
    polygons: polygons.map(simplifyPolygon).filter((polygon): polygon is Polygon => polygon !== null),
  };
});

const points = features.flatMap((feature) => feature.polygons.flat(2));
const xs = points.map(([x]) => x);
const ys = points.map(([, y]) => y);
const output = {
  source: {
    name: "Survey of India state and union-territory boundaries via the National Water Data Portal",
    url: "https://nwdp.nwic.gov.in/dataset/state-boundary",
    crs: "EPSG:7755 (WGS 84 / India NSF LCC)",
  },
  bounds: {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  },
  features,
};

const absoluteOutput = resolve(outputPath);
await mkdir(dirname(absoluteOutput), { recursive: true });
await Bun.write(absoluteOutput, `${JSON.stringify(output)}\n`);
console.log(`Wrote ${features.length} boundaries to ${absoluteOutput}`);
