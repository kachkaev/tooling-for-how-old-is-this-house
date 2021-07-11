import * as React from "react";
import styled from "styled-components";

import { MixedPropertyVariantsFeatureCollection } from "../../shared/outputMixing";
import { PosterConfig } from "../../shared/poster";
import { GlobalStyle } from "../shared/GlobalStyle";

const backgroundColor = "#1e2023";
const width = 366;
const height = 70;

const Figure = styled.div`
  box-shadow: 5px 5px 10px #ddd;
  overflow: hidden;
  background: ${backgroundColor};
  position: relative;
  width: ${width}px;
  height: ${height}px;
  display: inline-block;
`;

export interface LegendProps {
  posterConfig: PosterConfig;
  buildingCollection: MixedPropertyVariantsFeatureCollection;
}

export const Legend: React.VoidFunctionComponent<LegendProps> = (/* {
  posterConfig,
  buildingCollection,
} */) => {
  return (
    <>
      <GlobalStyle />
      <Figure>
        <svg width={width} height={height}>
          ??
        </svg>
      </Figure>
    </>
  );
};
