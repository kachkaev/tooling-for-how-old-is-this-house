import path from "path";

import { getRegionDirPath } from "../region";

export const getOutputLayerFileName = (): string => "output-layer.geojson";

export const getOutputDirPath = (): string =>
  path.resolve(getRegionDirPath(), "output");

export const getMixedOutputLayersFileName = (): string =>
  path.resolve(getOutputDirPath(), "mixed-output-layers.geojson");
