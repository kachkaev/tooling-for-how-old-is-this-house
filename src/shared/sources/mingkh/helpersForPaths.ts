import path from "path";

import { getSourceDirPath } from "../../helpersForPaths";

export const getMingkhDirPath = () => {
  return getSourceDirPath("mingkh");
};

export const getMingkhHousesDirPath = () => {
  return path.resolve(getMingkhDirPath(), "houses");
};

export const getHouseListFilePath = (
  mingkhRegionUrl: string,
  mingkhCityUrl: string,
) => {
  return path.resolve(
    getMingkhDirPath(),
    "house-lists",
    `${mingkhRegionUrl}--${mingkhCityUrl}.json`,
  );
};

export const getHouseFilePath = (houseId: number, fileNameSuffix: string) => {
  const normalisedHouseId = `${houseId}`.padStart(7, "0");

  return path.resolve(
    getMingkhHousesDirPath(),
    `${normalisedHouseId.substring(0, 4)}xxx`,
    `${normalisedHouseId}--${fileNameSuffix}`,
  );
};
