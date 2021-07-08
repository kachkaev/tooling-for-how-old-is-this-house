import fs from "fs-extra";
import _ from "lodash";
import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";
import { useInterval } from "react-use";

import { getMixedPropertyVariantsFilePath } from "../shared/outputMixing";
import { extractPosterConfig } from "../shared/poster";
import { readFetchedOsmFeatureCollection } from "../shared/sources/osm/readFetchedOsmFeatureCollection";
import {
  getTerritoryConfig,
  getTerritoryExtent,
  TerritoryConfig,
} from "../shared/territory";
import { PosterProps } from "../ui/Poster";

const Poster = dynamic<PosterProps>(
  import("../ui/Poster").then((m) => m.Poster),
  { ssr: false },
);

type PosterPageProps = Omit<PosterProps, "posterConfig"> & {
  territoryConfig: TerritoryConfig;
};

const PosterPage: NextPage<PosterPageProps> = ({
  territoryConfig,
  territoryExtent,
  ...rest
}) => {
  const [latestTerritoryConfig, updateTerritoryConfig] = React.useState(
    territoryConfig,
  );

  const posterConfig = React.useMemo(
    () => extractPosterConfig(latestTerritoryConfig, territoryExtent),
    [latestTerritoryConfig, territoryExtent],
  );

  useInterval(async () => {
    const justFetchedTerritoryConfig = await (
      await fetch("/api/territory-config")
    ).json();

    if (!_.isEqual(latestTerritoryConfig, justFetchedTerritoryConfig)) {
      updateTerritoryConfig(justFetchedTerritoryConfig);
    }
  }, 1000);

  return (
    <Poster
      territoryExtent={territoryExtent}
      posterConfig={posterConfig}
      {...rest}
    />
  );
};

// https://github.com/vercel/next.js/discussions/11209
const removeUndefinedForNextJsSerializing = <T,>(props: T): T =>
  Object.fromEntries(
    Object.entries(props).filter(([, value]) => value !== undefined),
  ) as T;

export const getStaticProps: GetStaticProps<PosterPageProps> = async () => {
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

export default PosterPage;
