import { createBboxFeature } from "../helpersForGeometry";
import { TerritoryExtent } from "../territory";
import { GeographicContextFeature } from "./types";

export const generateGeographicContextExtent = (
  territoryExtent: TerritoryExtent,
): GeographicContextFeature & {
  geometry: { type: "Polygon" };
  properties: { category: "geographicContextExtent" };
} => ({
  type: "Feature",
  geometry: createBboxFeature(territoryExtent, 20000).geometry,
  properties: { category: "geographicContextExtent" },
});
