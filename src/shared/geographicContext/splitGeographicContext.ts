import {
  GeographicContextFeature,
  GeographicContextFeatureCollection,
} from "./types";

export const splitGeographicContext = (
  geographicContext: GeographicContextFeatureCollection,
): {
  backgroundFeatureCollection: GeographicContextFeatureCollection;
  foregroundFeatureCollection: GeographicContextFeatureCollection;
} => {
  const backgroundFeatures: GeographicContextFeature[] = [];
  const foregroundFeatures: GeographicContextFeature[] = [];

  geographicContext.features.forEach((feature) => {
    if (
      "level" in feature.properties &&
      typeof feature.properties.level === "number" &&
      feature.properties.level > 0
    ) {
      foregroundFeatures.push(feature);
    }
    backgroundFeatures.push(feature);
  });

  return {
    backgroundFeatureCollection: {
      type: "FeatureCollection",
      features: backgroundFeatures,
    },
    foregroundFeatureCollection: {
      type: "FeatureCollection",
      features: foregroundFeatures,
    },
  };
};
