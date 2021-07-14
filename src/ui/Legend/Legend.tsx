import * as React from "react";
import styled from "styled-components";

import { extractLegendEntries, PosterConfig } from "../../shared/poster";
import { GlobalStyle } from "../shared/GlobalStyle";
import { PtSansDigit } from "./PtSansDigit";

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
  margin-top: 20px;
  margin-left: 20px;
`;

// https://github.com/hail2u/color-blindness-emulation

// https://github.com/btholt/postcss-colorblind

// https://dev.to/ndesmic/exploring-color-math-through-color-blindness-2m2h
// + https://github.com/ndesmic/cvd-sim
const ColorBlindnessGroup = styled.div``;

const ColorBlindness = styled.div<{ mode: string }>`
  display: inline-block;
  filter: url(/colorblind-filters.svg#${(p) => p.mode});
`;
const ColorBlindnessTitle = styled.div`
  opacity: 0.5;
  padding-left: 20px;
  margin-top: 20px;
  margin-bottom: -15px;
  text-align: center;
`;

const colorBlindnessGroups = [
  ["protanopia", "protanopia-g"],
  ["deuteranopia", "deuteranopia-g"],
  ["tritanopia", "tritanopia-g"],
  ["achromatopsia"],
];

export interface LegendProps {
  posterConfig: PosterConfig;
}

export const Legend: React.VoidFunctionComponent<LegendProps> = ({
  posterConfig,
}) => {
  const legendEntries = extractLegendEntries(posterConfig);

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

  const figure = (
    <Figure>
      <svg width={width} height={height}>
        <g transform={`translate(${paddingLeft},${paddingTop})`}>
          {legendEntries.map(({ completionYear, color }, index) => {
            const blockIsLast = index === legendEntries.length - 1;
            const currentBlockWidthRatio =
              index === 0
                ? firstBlockWidthRatio
                : blockIsLast
                ? lastBlockWidthRatio
                : 1;

            const currentBlockWidth =
              Math.ceil(blockWidth * currentBlockWidthRatio) +
              (blockIsLast ? 0 : 1);

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
                      height={blockHeight + tickHeight}
                      width={tickWidth}
                      fill={color}
                    />
                    {`${completionYear}`.split("").map((digit, digitIndex) => (
                      <PtSansDigit
                        key={digitIndex}
                        digit={digit}
                        fill="#656565"
                        transform={`translate(${5 * (digitIndex - 2)}, ${
                          blockHeight + tickHeight + labelOffsetTop
                        }) scale(1.1)`}
                      />
                    ))}
                  </>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
    </Figure>
  );

  return (
    <>
      <GlobalStyle />
      {figure}

      {colorBlindnessGroups.map((colorBlindnessModes, groupIndex) => (
        <ColorBlindnessGroup key={groupIndex}>
          {colorBlindnessModes.map((colorBlindnessMode) => (
            <ColorBlindness key={colorBlindnessMode} mode={colorBlindnessMode}>
              <ColorBlindnessTitle>{colorBlindnessMode}</ColorBlindnessTitle>
              {figure}
            </ColorBlindness>
          ))}
        </ColorBlindnessGroup>
      ))}
    </>
  );
};
