import fs from "fs-extra";
import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import { getMixedPropertyVariantsFilePath } from "../shared/outputMixing";
import { getTerritoryExtent, TerritoryExtent } from "../shared/territory";
import { HistogramProps } from "../ui/Histogram";
import { useLiveTerritoryConfig } from "../ui/shared/useLiveTerritoryConfig";
import { usePosterConfig } from "../ui/shared/usePosterConfig";

const Histogram = dynamic<HistogramProps>(
  import("../ui/Histogram").then((m) => m.Histogram),
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
    return null;
  }

  return <Histogram posterConfig={posterConfig} {...props} />;
};

export const getStaticProps: GetStaticProps<HistogramPageProps> = async () => {
  return {
    props: {
      territoryExtent: await getTerritoryExtent(),
      buildingCollection: await fs.readJson(getMixedPropertyVariantsFilePath()),
    },
  };
};

export default HistogramPage;
