import fs from "fs-extra";
import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import {
  getMixedPropertyVariantsFilePath,
  MixedPropertyVariantsFeatureCollection,
} from "../shared/stage-mixing";
import { getTerritoryExtent, TerritoryExtent } from "../shared/territory";
import { HistogramProps } from "../ui/histogram";
import { useLiveTerritoryConfig } from "../ui/shared/use-live-territory-config";
import { usePosterConfig } from "../ui/shared/use-poster-config";

const Histogram = dynamic<HistogramProps>(
  import("../ui/histogram").then((module) => module.Histogram),
  { ssr: false },
);

type HistogramPageProps = Omit<HistogramProps, "posterConfig"> & {
  territoryExtent: TerritoryExtent;
};

const HistogramPage: NextPage<HistogramPageProps> = ({
  territoryExtent,
  ...props
}) => {
  const territoryConfig = useLiveTerritoryConfig();
  const posterConfig = usePosterConfig(territoryConfig, territoryExtent);

  if (!posterConfig) {
    return <></>;
  }

  return <Histogram posterConfig={posterConfig} {...props} />;
};

export const getStaticProps: GetStaticProps<HistogramPageProps> = async () => {
  return {
    props: {
      territoryExtent: await getTerritoryExtent(),
      buildingCollection: (await fs.readJson(
        getMixedPropertyVariantsFilePath(),
      )) as MixedPropertyVariantsFeatureCollection,
    },
  };
};

export default HistogramPage;
