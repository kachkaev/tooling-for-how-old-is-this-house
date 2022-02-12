import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import { getTerritoryExtent, TerritoryExtent } from "../shared/territory";
import { ColorLegendProps } from "../ui/color-legend";
import { useLiveTerritoryConfig } from "../ui/shared/use-live-territory-config";
import { usePosterConfig } from "../ui/shared/use-poster-config";

const ColorLegend = dynamic<ColorLegendProps>(
  import("../ui/color-legend").then((module) => module.ColorLegend),
  { ssr: false },
);

type LegendPageProps = Omit<ColorLegendProps, "posterConfig"> & {
  territoryExtent: TerritoryExtent;
};

const LegendPage: NextPage<LegendPageProps> = ({ territoryExtent }) => {
  const territoryConfig = useLiveTerritoryConfig();
  const posterConfig = usePosterConfig(territoryConfig, territoryExtent);

  if (!posterConfig) {
    return <></>;
  }

  return <ColorLegend posterConfig={posterConfig} />;
};

export const getStaticProps: GetStaticProps<LegendPageProps> = async () => {
  return {
    props: {
      territoryExtent: await getTerritoryExtent(),
    },
  };
};

export default LegendPage;
