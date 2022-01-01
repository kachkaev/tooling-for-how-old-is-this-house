import fs from "fs-extra";
import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import { generateGeographicContext } from "../shared/geographicContext/generateGeographicContext";
import {
  getMixedPropertyVariantsFilePath,
  MixedPropertyVariantsFeatureCollection,
} from "../shared/mixing";
import { getTerritoryExtent } from "../shared/territory";
import { PosterProps } from "../ui/Poster";
import { useLiveTerritoryConfig } from "../ui/shared/useLiveTerritoryConfig";
import { usePosterConfig } from "../ui/shared/usePosterConfig";

const Poster = dynamic<PosterProps>(
  import("../ui/Poster").then((module) => module.Poster),
  { ssr: false },
);

type PosterPageProps = Omit<PosterProps, "posterConfig">;

const PosterPage: NextPage<PosterPageProps> = ({
  territoryExtent,
  ...rest
}) => {
  const territoryConfig = useLiveTerritoryConfig();
  const posterConfig = usePosterConfig(territoryConfig, territoryExtent);

  if (!posterConfig) {
    return null;
  }

  return (
    <Poster
      territoryExtent={territoryExtent}
      posterConfig={posterConfig}
      {...rest}
    />
  );
};

export const getStaticProps: GetStaticProps<PosterPageProps> = async () => {
  const territoryExtent = await getTerritoryExtent();

  const buildingCollection = (await fs.readJson(
    getMixedPropertyVariantsFilePath(),
  )) as MixedPropertyVariantsFeatureCollection;

  const geographicContext = await generateGeographicContext(territoryExtent);

  return {
    props: { buildingCollection, geographicContext, territoryExtent },
  };
};

export default PosterPage;
