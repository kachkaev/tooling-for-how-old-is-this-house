import fs from "fs-extra";
import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import {
  getMixedPropertyVariantsFilePath,
  MixedPropertyVariantsFeatureCollection,
} from "../shared/stage-mixing";
import { getTerritoryExtent, TerritoryExtent } from "../shared/territory";
import { HistogramProps } from "./historgram.page/histogram";
import { useLiveTerritoryConfig } from "./shared/use-live-territory-config";
import { usePosterConfig } from "./shared/use-poster-config";

const Histogram = dynamic<HistogramProps>(
  import("./historgram.page/histogram").then((module) => module.Histogram),
  { ssr: false },
);

type PageProps = Omit<HistogramProps, "posterConfig"> & {
  territoryExtent: TerritoryExtent;
};

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  return {
    props: {
      territoryExtent: await getTerritoryExtent(),
      buildingCollection: (await fs.readJson(
        getMixedPropertyVariantsFilePath(),
      )) as MixedPropertyVariantsFeatureCollection,
    },
  };
};

const Page: NextPage<PageProps> = ({ territoryExtent, ...props }) => {
  const territoryConfig = useLiveTerritoryConfig();
  const posterConfig = usePosterConfig(territoryConfig, territoryExtent);

  if (!posterConfig) {
    return <></>;
  }

  return <Histogram posterConfig={posterConfig} {...props} />;
};

export default Page;
