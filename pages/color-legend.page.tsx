import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import { getTerritoryExtent, TerritoryExtent } from "../shared/territory";
import { ColorLegendProps } from "./color-legend.page/color-legend";
import { useLiveTerritoryConfig } from "./shared/use-live-territory-config";
import { usePosterConfig } from "./shared/use-poster-config";

const ColorLegend = dynamic<ColorLegendProps>(
  import("./color-legend.page/color-legend").then(
    (module) => module.ColorLegend,
  ),
  { ssr: false },
);

type PageProps = Omit<ColorLegendProps, "posterConfig"> & {
  territoryExtent: TerritoryExtent;
};

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  return {
    props: {
      territoryExtent: await getTerritoryExtent(),
    },
  };
};

const Page: NextPage<PageProps> = ({ territoryExtent }) => {
  const territoryConfig = useLiveTerritoryConfig();
  const posterConfig = usePosterConfig(territoryConfig, territoryExtent);

  if (!posterConfig) {
    return <></>;
  }

  return <ColorLegend posterConfig={posterConfig} />;
};

export default Page;
