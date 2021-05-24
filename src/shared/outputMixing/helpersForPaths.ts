import path from "path";

import { getTerritoryDirPath } from "../territory";

export const getOutputDirPath = (): string =>
  path.resolve(getTerritoryDirPath(), "output");

export const getMixedOutputLayersFilePath = (): string =>
  path.resolve(getOutputDirPath(), "mixed-output-layers.geojson");

export const getMixedPropertyVariantsFilePath = (): string =>
  path.resolve(getOutputDirPath(), "mixed-property-variants.geojson");

export const getUploadFilePath = (): string =>
  path.resolve(getOutputDirPath(), "upload.geojson");
