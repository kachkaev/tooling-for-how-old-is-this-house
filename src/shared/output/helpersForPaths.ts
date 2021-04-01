import path from "path";

import { gettTerritoryDirPath } from "../territory";

export const getOutputLayerFileName = (): string => "output-layer.geojson";

export const getOutputDirPath = (): string =>
  path.resolve(gettTerritoryDirPath(), "output");

export const getMixedOutputLayersFileName = (): string =>
  path.resolve(getOutputDirPath(), "mixed-output-layers.geojson");

export const getMixedPropertyVariantsFileName = (): string =>
  path.resolve(getOutputDirPath(), "mixed-property-variants.geojson");
