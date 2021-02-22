import envalid from "envalid";
import path from "path";

import { customEnvalidReporter } from "../../customEnvalidReporter";
import { getRegionDirPath } from "../../region";

export const getMkrfJsonsDumpFilePath = (): string => {
  const env = envalid.cleanEnv(
    process.env,
    { MKRF_JSONS_DUMP_FILE_PATH: envalid.str({}) },
    { strict: true, reporter: customEnvalidReporter },
  );

  return path.resolve(env.MKRF_JSONS_DUMP_FILE_PATH);
};

export const getMkrfDirPath = () => {
  return path.resolve(getRegionDirPath(), "sources", "mkrf");
};

export const getMkrfObjectFilePath = (nativeId: string): string => {
  const noramlizedId = nativeId.padStart(6, "0");

  return path.resolve(
    getMkrfDirPath(),
    "objects",
    `${noramlizedId}--info.json`,
  );
};
