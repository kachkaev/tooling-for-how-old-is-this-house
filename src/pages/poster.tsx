import fs from "fs-extra";
import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import { getMixedPropertyVariantsFileName } from "../shared/output";
import {
  getFetchedOsmRailwaysFilePath,
  getFetchedOsmRoadsFilePath,
  getFetchedOsmWaterObjectsFilePath,
} from "../shared/sources/osm";
import { OsmFeatureCollection } from "../shared/sources/osm/types";
import { getTerritoryExtent } from "../shared/territory";
import { PosterProps } from "../ui/Poster";

const Poster = dynamic<PosterProps>(
  import("../ui/Poster").then((m) => m.Poster),
  { ssr: false },
);

type PosterPageProps = PosterProps;

const PosterPage: NextPage<PosterPageProps> = (props) => {
  return <Poster {...props} />;
};

const readOptionalOsmFeatureCollection = async <T,>(
  filePath: string,
): Promise<OsmFeatureCollection<T> | undefined> => {
  try {
    return await fs.readJson(filePath);
  } catch {
    return undefined;
  }
};

export const getStaticProps: GetStaticProps<PosterPageProps> = async () => {
  return {
    props: {
      buildingCollection: await fs.readJson(getMixedPropertyVariantsFileName()),
      territoryExtent: await getTerritoryExtent(),

      railwayCollection: await readOptionalOsmFeatureCollection(
        getFetchedOsmRailwaysFilePath(),
      ),
      roadCollection: await readOptionalOsmFeatureCollection(
        getFetchedOsmRoadsFilePath(),
      ),
      waterObjectCollection: await readOptionalOsmFeatureCollection(
        getFetchedOsmWaterObjectsFilePath(),
      ),
    },
  };
};

export default PosterPage;
