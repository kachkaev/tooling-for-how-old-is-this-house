import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import { getTerritoryExtent, TerritoryExtent } from "../shared/territory";
import { LegendProps } from "../ui/Legend";
import { useLiveTerritoryConfig } from "../ui/shared/useLiveTerritoryConfig";
import { usePosterConfig } from "../ui/shared/usePosterConfig";

const Legend = dynamic<LegendProps>(
  import("../ui/Legend").then((m) => m.Legend),
  { ssr: false },
);

type LegendPageProps = Omit<LegendProps, "posterConfig"> & {
  territoryExtent: TerritoryExtent;
};

const LegendPage: NextPage<LegendPageProps> = ({ territoryExtent }) => {
  const territoryConfig = useLiveTerritoryConfig();
  const posterConfig = usePosterConfig(territoryConfig, territoryExtent);

  if (!posterConfig) {
    return null;
  }

  return <Legend posterConfig={posterConfig} />;
};

export const getStaticProps: GetStaticProps<LegendPageProps> = async () => {
  return {
    props: {
      territoryExtent: await getTerritoryExtent(),
    },
  };
};

export default LegendPage;
