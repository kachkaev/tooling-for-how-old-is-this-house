export const buildGlobalFeatureOrVariantId = (
  featureSource: string,
  featureIdProperty: string,
) => `${featureSource}|${featureIdProperty}`;
