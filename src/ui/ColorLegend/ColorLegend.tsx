import { useRouter } from "next/router";
import * as React from "react";
import styled from "styled-components";

import { extractLegendEntries, PosterConfig } from "../../shared/poster";
import { GlobalStyle } from "../shared/GlobalStyle";
import { ColorLegendSvg } from "./ColorLegendSvg";
import {
  ColorBlindnessCondition,
  colorBlindnessConditions,
  generateColorBlindnessFilterCssProperty,
} from "./helpersForColorBlindness";

const backgroundColor = "#1e2023";
const width = 366;
const height = 70;

const Wrapper = styled.div<{ spaced?: boolean }>`
  width: ${width}px;
  ${(p) => (p.spaced ? "padding: 20px;" : "")};
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
  string,
  Record<ColorBlindnessCondition, string>
> = {
  ru: {
    protanopia: "протанопия",
    deuteranopia: "дейтеранопия",
    tritanopia: "тританопия",
    achromatopsia: "ахромазия",
  },
};

export const ColorLegend: React.VoidFunctionComponent<ColorLegendProps> = ({
  posterConfig,
}) => {
  const legendEntries = extractLegendEntries(posterConfig);
  const { locale, query } = useRouter();
  const snapshot = query.snapshot;

  return (
    <Wrapper spaced={!snapshot}>
      <GlobalStyle />
      <Figure data-testid="svgContainer">
        <ColorLegendSvg
          width={width}
          height={height}
          legendEntries={legendEntries}
        />
      </Figure>

      {(!snapshot || snapshot === "color-blindness") &&
        colorBlindnessConditions.map((condition) => (
          <ColorBlindness key={condition}>
            <ColorBlindnessTitle>
              {colorBlindnessConditionTitleLookup[locale ?? ""]?.[condition] ??
                condition}
            </ColorBlindnessTitle>
            <Figure
              style={{
                filter: generateColorBlindnessFilterCssProperty(condition),
              }}
            >
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
