import fs from "fs-extra";

import { writeFormattedJson } from "../../helpersForJson";
import { rosreestrObjectInfoPageSize } from "./helpersForObjectInfoPages";
import { getObjectInfoPageFilePath } from "./helpersForPaths";
import {
  CreationReasonForObjectInInfoPage,
  InfoPageData,
  InfoPageObject,
} from "./types";

export const ensureRosreestrInfoPage = async ({
  blockCn,
  pageNumber,
  creationReasonByObjectCn,
}: {
  blockCn: string;
  pageNumber: number;
  creationReasonByObjectCn: Record<string, CreationReasonForObjectInInfoPage>;
}): Promise<boolean> => {
  const infoPageFilePath = getObjectInfoPageFilePath(blockCn, pageNumber);

  const existingInfoPageObjectByCn: Record<string, InfoPageObject> = {};
  try {
    const existingInfoPageData = (await fs.readJson(
      infoPageFilePath,
    )) as InfoPageData;
    existingInfoPageData.forEach((infoPageObject) => {
      existingInfoPageObjectByCn[infoPageObject.cn] = infoPageObject;
    });
  } catch {
    // Noop (page does not exist)
  }

  const newInfoPageData: InfoPageData = [];

  for (let index = 0; index < rosreestrObjectInfoPageSize; index += 1) {
    if (index === 0 && pageNumber === 0) {
      continue;
    }
    const objectCn = `${blockCn}:${
      pageNumber * rosreestrObjectInfoPageSize + index
    }`;
    const creationReason = creationReasonByObjectCn[objectCn] ?? "gap";

    const existingInfoPageObject = existingInfoPageObjectByCn[objectCn];
    if (existingInfoPageObject) {
      if (
        existingInfoPageObject.creationReason === "gap" &&
        creationReason !== "gap"
      ) {
        const existingInfoPageObjectClone = { ...existingInfoPageObject };
        existingInfoPageObjectClone.creationReason = creationReason;
        newInfoPageData.push(existingInfoPageObjectClone);
      } else {
        newInfoPageData.push(existingInfoPageObject);
      }
      continue;
    }

    const newInfoPageObject: InfoPageObject = {
      cn: objectCn,
      creationReason,
      firFetchedAt: null, // This line reduces git diff
      pkkFetchedAt: null, // This line reduces git diff
    };
    newInfoPageData.push(newInfoPageObject);
  }

  const fileNeedsWriting = newInfoPageData.some(
    (infoPageObject) =>
      infoPageObject !== existingInfoPageObjectByCn[infoPageObject.cn],
  );

  if (!fileNeedsWriting) {
    return false;
  }

  await writeFormattedJson(infoPageFilePath, newInfoPageData);

  return true;
};
