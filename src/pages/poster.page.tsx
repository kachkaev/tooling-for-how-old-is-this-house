import fs from "fs-extra";
import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import { generateGeographicContext } from "../shared/geographic-context/generate-geographic-context";
import {
  getMixedPropertyVariantsFilePath,
  MixedPropertyVariantsFeatureCollection,
} from "../shared/stage-mixing";
import { getTerritoryExtent } from "../shared/territory";
import { PosterProps } from "../ui/poster";
import { useLiveTerritoryConfig } from "../ui/shared/use-live-territory-config";
import { usePosterConfig } from "../ui/shared/use-poster-config";

const Poster = dynamic<PosterProps>(
  import("../ui/poster").then((module) => module.Poster),
  { ssr: false },
);

type PageProps = Omit<PosterProps, "posterConfig">;

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const territoryExtent = await getTerritoryExtent();

  const buildingCollection = (await fs.readJson(
    getMixedPropertyVariantsFilePath(),
  )) as MixedPropertyVariantsFeatureCollection;

  const geographicContext = await generateGeographicContext(territoryExtent);

  return {
    props: { buildingCollection, geographicContext, territoryExtent },
  };
};

const Page: NextPage<PageProps> = ({ territoryExtent, ...rest }) => {
  const territoryConfig = useLiveTerritoryConfig();
  const posterConfig = usePosterConfig(territoryConfig, territoryExtent);

  if (!posterConfig) {
    return <></>;
  }

  return (
    <Poster
      territoryExtent={territoryExtent}
      posterConfig={posterConfig}
      {...rest}
    />
  );
};

export default Page;
