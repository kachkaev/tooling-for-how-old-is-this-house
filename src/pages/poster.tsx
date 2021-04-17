import fs from "fs-extra";
import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import { getMixedPropertyVariantsFileName } from "../shared/output";
import {
  getFetchedOsmRoadsFilePath,
  getFetchedOsmWaterObjectsFilePath,
} from "../shared/sources/osm";
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

export const getStaticProps: GetStaticProps<PosterPageProps> = async () => {
  return {
    props: {
      buildingCollection: await fs.readJson(getMixedPropertyVariantsFileName()),
      waterObjectCollection: await fs.readJson(
        getFetchedOsmWaterObjectsFilePath(),
      ),
      roadCollection: await fs.readJson(getFetchedOsmRoadsFilePath()),
      territoryExtent: await getTerritoryExtent(),
    },
  };
};

export default PosterPage;
