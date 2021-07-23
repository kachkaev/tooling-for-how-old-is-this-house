import path from "path";

import {
  ensureTerritoryGitignoreContainsLine,
  getTerritoryDirPath,
} from "../territory";

export const getMixingDirPath = (): string =>
  path.resolve(getTerritoryDirPath(), "mixing");

export const getMixedOutputLayersFilePath = (): string =>
  path.resolve(getMixingDirPath(), "mixed-output-layers.geojson");

export const getMixedPropertyVariantsFilePath = (): string =>
  path.resolve(getMixingDirPath(), "mixed-property-variants.geojson");

export const ensureTerritoryGitignoreContainsMixing = async (): Promise<void> => {
  await ensureTerritoryGitignoreContainsLine("/mixing");
};
