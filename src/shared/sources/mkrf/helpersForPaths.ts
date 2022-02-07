import envalid from "envalid";
import path from "node:path";

import { cleanEnv } from "../../cleanEnv";
import { getTerritoryDirPath } from "../../territory";

export const getMkrfJsonsDumpFilePath = (): string => {
  const env = cleanEnv({
    MKRF_JSONS_DUMP_FILE_PATH: envalid.str({}),
  });

  return path.resolve(env.MKRF_JSONS_DUMP_FILE_PATH);
};

export const getMkrfDirPath = () => {
  return path.resolve(getTerritoryDirPath(), "sources", "mkrf");
};

export const getMkrfObjectDirPath = (): string => {
  return path.resolve(getMkrfDirPath(), "objects");
};

export const getMkrfObjectFilePath = (nativeId: string): string => {
  const noramlizedId = nativeId.padStart(6, "0");

  return path.resolve(getMkrfObjectDirPath(), `${noramlizedId}--info.json`);
};
