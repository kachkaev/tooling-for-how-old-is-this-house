import * as turf from "@turf/turf";
import * as React from "react";
import { useMeasure } from "react-use";
import styled from "styled-components";

import { FitExtent } from "./types";

const Wrapper = styled.div`
  position: relative;
`;

const StyledSvg = styled.svg`
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
`;

interface Padding {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

const normalizePadding = (rawPadding: number | Padding): Padding => {
  if (typeof rawPadding === "number") {
    return {
      left: rawPadding,
      right: rawPadding,
      top: rawPadding,
      bottom: rawPadding,
    };
  }

  return rawPadding;
};

export interface GeoMapProps extends React.HTMLAttributes<HTMLDivElement> {
  extentToFit: turf.Feature<turf.Polygon>;
  padding?: number | Padding;
  children: (payload: {
    width: number;
    height: number;
    fitExtent: FitExtent;
  }) => React.ReactNode;
}

export const GeoMap: React.VoidFunctionComponent<GeoMapProps> = ({
  extentToFit,
  padding: rawPadding = 0,
  children,
  ...rest
}) => {
  const [ref, { width, height }] = useMeasure<HTMLDivElement>();

  const padding = normalizePadding(rawPadding);

  const fitExtent: FitExtent = [
    [
      [padding.left, padding.top],
      [width - padding.right, height - padding.bottom],
    ],
    turf.bboxPolygon(turf.bbox(extentToFit)).geometry,
  ];

  // TODO: figure out why visx / turf are incompatible orientation-wise
  fitExtent[1].coordinates[0].reverse();

  return (
    <Wrapper {...rest} ref={ref}>
      {width && height ? (
        <StyledSvg width={width} height={height}>
          {children?.({ width, height, fitExtent })}
        </StyledSvg>
      ) : null}
    </Wrapper>
  );
};
