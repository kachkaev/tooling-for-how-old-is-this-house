import * as React from "react";
import styled from "styled-components";

import { MixedPropertyVariantsFeatureCollection } from "../../shared/outputMixing";
import { PosterConfig } from "../../shared/poster";
import { GlobalStyle } from "../shared/GlobalStyle";

const backgroundColor = "#1e2023";
const width = 366;
const height = 70;

const paddingTop = 13;
const referencePaddingLeft = 10;
const referencePaddingRight = 10;
const tickHeight = 5;
const tickWidth = 2;
const labelOffsetTop = 4;

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

export const Legend: React.VoidFunctionComponent<LegendProps> = ({
  posterConfig,
}) => {
  const colorByCompletionYear = posterConfig.colorByCompletionYear;

  const legendEntries: Array<{
    completionYear: number;
    color: string;
  }> = Object.entries(colorByCompletionYear).map(
    ([rawCompletionYear, color]) => ({
      completionYear: parseInt(rawCompletionYear),
      color,
    }),
  );

  const firstBlockWidthRatio =
    (legendEntries[0]?.completionYear ?? 0) > 0 ? 1 : 0.5;
  const lastBlockWidthRatio = 0.5;

  const allBlocksReferenceWidth =
    width - referencePaddingLeft - referencePaddingRight;
  const allBocksRelativeWidth =
    legendEntries.length - 2 + firstBlockWidthRatio + lastBlockWidthRatio;
  const blockWidth = Math.floor(
    allBlocksReferenceWidth / allBocksRelativeWidth,
  );

  const blockHeight = blockWidth;
  const paddingLeft =
    referencePaddingLeft +
    Math.round(
      (allBlocksReferenceWidth - blockWidth * allBocksRelativeWidth) / 2,
    );

  return (
    <>
      <GlobalStyle />
      <Figure>
        <svg width={width} height={height}>
          <g transform={`translate(${paddingLeft},${paddingTop})`}>
            {legendEntries.map(({ completionYear, color }, index) => {
              const currentBlockWidthRatio =
                index === 0
                  ? firstBlockWidthRatio
                  : index === legendEntries.length - 1
                  ? lastBlockWidthRatio
                  : 1;

              const currentBlockWidth = Math.ceil(
                blockWidth * currentBlockWidthRatio,
              );

              return (
                <g
                  key={completionYear}
                  transform={`translate(${
                    index === 0
                      ? 0
                      : (index - 1 + firstBlockWidthRatio) * blockWidth
                  },0)`}
                >
                  <rect
                    height={blockHeight}
                    width={currentBlockWidth}
                    fill={color}
                  />
                  {completionYear > 0 ? (
                    <>
                      <rect
                        y={blockHeight}
                        height={tickHeight}
                        width={tickWidth}
                        fill={color}
                      />
                      <text
                        fill="#656565"
                        y={blockHeight + tickHeight + labelOffsetTop}
                        dominantBaseline="hanging"
                        textAnchor="middle"
                      >
                        {completionYear}
                      </text>
                    </>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>
      </Figure>
    </>
  );
};
