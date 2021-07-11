import fs from "fs-extra";
import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import { getMixedPropertyVariantsFilePath } from "../shared/outputMixing";
import { readFetchedOsmFeatureCollection } from "../shared/sources/osm/readFetchedOsmFeatureCollection";
import {
  getTerritoryConfig,
  getTerritoryExtent,
  TerritoryExtent,
} from "../shared/territory";
import { LegendProps } from "../ui/Legend";
import { useLiveTerritoryConfig } from "../ui/shared/useLiveTerritoryConfig";
import { usePosterConfig } from "../ui/shared/usePosterConfig";

const Legend = dynamic<LegendProps>(
  import("../ui/Legend").then((m) => m.Legend),
  { ssr: false },
);

type LegendPageProps = Omit<LegendProps, "posterConfig"> & {
  territoryExtent: TerritoryExtent;
};

const LegendPage: NextPage<LegendPageProps> = ({
  territoryExtent,
  ...rest
}) => {
  const territoryConfig = useLiveTerritoryConfig();
  const posterConfig = usePosterConfig(territoryConfig, territoryExtent);

  if (!posterConfig) {
    return null;
  }

  return <Legend posterConfig={posterConfig} {...rest} />;
};

// https://github.com/vercel/next.js/discussions/11209
const removeUndefinedForNextJsSerializing = <T,>(props: T): T =>
  Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as T;

export const getStaticProps: GetStaticProps<LegendPageProps> = async () => {
  return {
    props: removeUndefinedForNextJsSerializing({
      territoryConfig: await getTerritoryConfig(),
      buildingCollection: await fs.readJson(getMixedPropertyVariantsFilePath()),
      territoryExtent: await getTerritoryExtent(),

      railwayCollection: await readFetchedOsmFeatureCollection("railways"),
      roadCollection: await readFetchedOsmFeatureCollection("roads"),
      waterObjectCollection: await readFetchedOsmFeatureCollection(
        "water-objects",
      ),
    }),
  };
};

export default LegendPage;
