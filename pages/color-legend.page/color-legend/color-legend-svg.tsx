import * as React from "react";

import { LegendEntry } from "../../../shared/poster";
import { PtSansDigit } from "./pt-sans-digit";

const paddingTop = 13;
const referencePaddingLeft = 10;
const referencePaddingRight = 10;
const tickHeight = 5;
const tickWidth = 2;
const labelOffsetTop = 4;

const propsForStandaloneSvg = {
  xmlns: "http://www.w3.org/2000/svg",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "xmlns:xlink": "http://www.w3.org/1999/xlink",
};
export interface LegendSvgProps extends React.SVGAttributes<SVGSVGElement> {
  legendEntries: LegendEntry[];
  width: number;
  height: number;
}

export const ColorLegendSvg: React.VoidFunctionComponent<LegendSvgProps> = ({
  legendEntries,
  width,
  height,
  ...rest
}) => {
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
    <svg width={width} height={height} {...propsForStandaloneSvg} {...rest}>
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
                  {[...`${completionYear}`].map((digit, digitIndex) => (
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
              ) : undefined}
            </g>
          );
        })}
      </g>
    </svg>
  );
};
