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
import { FigureWithHouseAgesProps } from "../ui/FigureWithHouseAges";

const FigureWithHouseAges = dynamic<FigureWithHouseAgesProps>(
  import("../ui/FigureWithHouseAges").then((m) => m.FigureWithHouseAges),
  { ssr: false },
);

type MainPageProps = FigureWithHouseAgesProps;

const MainPage: NextPage<MainPageProps> = (props) => {
  return <FigureWithHouseAges {...props} />;
};

export const getStaticProps: GetStaticProps<MainPageProps> = async () => {
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

export default MainPage;
