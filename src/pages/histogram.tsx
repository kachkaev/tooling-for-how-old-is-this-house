import fs from "fs-extra";
import { GetStaticProps, NextPage } from "next";
import dynamic from "next/dynamic";
import * as React from "react";

import { getMixedPropertyVariantsFilePath } from "../shared/outputMixing";
import { HistogramProps } from "../ui/Histogram";

const Histogram = dynamic<HistogramProps>(
  import("../ui/Histogram").then((m) => m.Histogram),
  { ssr: false },
);

type HistogramPageProps = HistogramProps;

const HistogramPage: NextPage<HistogramPageProps> = (props) => {
  return <Histogram {...props} />;
};

export const getStaticProps: GetStaticProps<HistogramPageProps> = async () => {
  return {
    props: {
      buildingCollection: await fs.readJson(getMixedPropertyVariantsFilePath()),
    },
  };
};

export default HistogramPage;
