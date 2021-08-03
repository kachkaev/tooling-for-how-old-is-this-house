import * as React from "react";
import styled from "styled-components";

import { extractLegendEntries, PosterConfig } from "../../shared/poster";
import { GlobalStyle } from "../shared/GlobalStyle";
import { ColorLegendSvg } from "./ColorLegendSvg";
import {
  ColorBlindnessCondition,
  colorBlindnessConditions,
  generateColorBlindnessCss,
} from "./helpersForColorBlindness";

const backgroundColor = "#1e2023";
const width = 366;
const height = 70;

const Wrapper = styled.div`
  width: ${width}px;
  padding: 20px;
`;

const Figure = styled.div`
  /* box-shadow: 5px 5px 10px #ddd; */
  overflow: hidden;
  background: ${backgroundColor};
  position: relative;
  width: ${width}px;
  height: ${height}px;
`;

const ColorBlindness = styled.div`
  display: block;

  margin-top: 40px;
  & + & {
    margin-top: 15px;
  }
`;

const ColorBlindnessTitle = styled.div`
  opacity: 0.5;
  padding-bottom: 5px;
  font-size: 1.2em;
`;

export interface ColorLegendProps {
  posterConfig: PosterConfig;
}

const colorBlindnessConditionTitleLookup: Record<
  ColorBlindnessCondition,
  string
> = {
  protanopia: "протанопия",
  deuteranopia: "дейтеранопия",
  tritanopia: "тританопия",
  achromatopsia: "ахромазия",
};

export const ColorLegend: React.VoidFunctionComponent<ColorLegendProps> = ({
  posterConfig,
}) => {
  const legendEntries = extractLegendEntries(posterConfig);

  return (
    <Wrapper>
      <GlobalStyle />
      <Figure data-testid="svgContainer">
        <ColorLegendSvg
          width={width}
          height={height}
          legendEntries={legendEntries}
        />
      </Figure>

      {colorBlindnessConditions.map((condition) => (
        <ColorBlindness key={condition}>
          <ColorBlindnessTitle>
            {colorBlindnessConditionTitleLookup[condition]}
          </ColorBlindnessTitle>
          <Figure style={generateColorBlindnessCss(condition)}>
            <ColorLegendSvg
              width={width}
              height={height}
              legendEntries={legendEntries}
            />
          </Figure>
        </ColorBlindness>
      ))}
    </Wrapper>
  );
};
