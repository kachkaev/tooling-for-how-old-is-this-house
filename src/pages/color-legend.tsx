import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import { getTerritoryExtent, TerritoryExtent } from "../shared/territory";
import { ColorLegendProps } from "../ui/ColorLegend";
import { useLiveTerritoryConfig } from "../ui/shared/useLiveTerritoryConfig";
import { usePosterConfig } from "../ui/shared/usePosterConfig";

const ColorLegend = dynamic<ColorLegendProps>(
  import("../ui/ColorLegend").then((m) => m.ColorLegend),
  { ssr: false },
);

type LegendPageProps = Omit<ColorLegendProps, "posterConfig"> & {
  territoryExtent: TerritoryExtent;
};

const LegendPage: NextPage<LegendPageProps> = ({ territoryExtent }) => {
  const territoryConfig = useLiveTerritoryConfig();
  const posterConfig = usePosterConfig(territoryConfig, territoryExtent);

  if (!posterConfig) {
    return null;
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
