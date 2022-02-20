import _ from "lodash";
import * as React from "react";
import styled from "styled-components";

import { pointsInMm } from "../shared/printing";

const Wrapper = styled.div`
  border-top: none;
  text-align: center;
  height: 0;
  position: relative;
  box-sizing: border-box;
  opacity: 0.8;
`;

const Svg = styled.svg`
  position: absolute;
  left: 0;
  bottom: 0;
`;

const Text = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  line-height: 1.4em;
  font-size: ${5 * 0.8}mm;
  text-align: center;
  white-space: nowrap;
`;

const roundMeasure = (measure: number): number => _.round(measure, 2);

export interface ZoomMarkProps extends React.HTMLAttributes<HTMLDivElement> {
  zoomInMillimetersPerKilometer: number;
}

export const ZoomMark: React.VoidFunctionComponent<ZoomMarkProps> = ({
  zoomInMillimetersPerKilometer,
  style = {},
  ...rest
}) => {
  const heightInPixels = roundMeasure(5 * pointsInMm);
  const strokeWidthInPixels = roundMeasure(0.3 * pointsInMm);
  const widthInPixels = roundMeasure(
    zoomInMillimetersPerKilometer * pointsInMm,
  );

  return (
    <Wrapper {...rest} style={{ ...style, width: widthInPixels }}>
      <Text>1 {widthInPixels < 80 ? "км" : "километр"}</Text>
      {/* Rendering wrapper border instead of svg may produce thick lines at certain browser scales */}
      <Svg width={widthInPixels} height={heightInPixels}>
        <path
          stroke="#fff"
          fill="none"
          strokeWidth={strokeWidthInPixels}
          d={`M${strokeWidthInPixels / 2},0L0,${
            heightInPixels - strokeWidthInPixels / 2
          }L${widthInPixels - strokeWidthInPixels},${
            heightInPixels - strokeWidthInPixels / 2
          }L${widthInPixels - strokeWidthInPixels},${
            -heightInPixels + strokeWidthInPixels / 2
          }`}
        />
      </Svg>
    </Wrapper>
  );
};
