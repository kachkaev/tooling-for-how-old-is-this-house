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
`;

export interface GeoMapProps extends React.HTMLAttributes<HTMLDivElement> {
  extentToFit: turf.Feature<turf.Polygon>;
  padding?: number;
  children: (payload: {
    width: number;
    height: number;
    fitExtent: FitExtent;
  }) => React.ReactNode;
}

export const GeoMap: React.VoidFunctionComponent<GeoMapProps> = ({
  extentToFit,
  padding = 0,
  children,
  ...rest
}) => {
  const [ref, { width, height }] = useMeasure<HTMLDivElement>();

  const mapPaddingX = padding;
  const mapPaddingY = padding;

  const fitExtent: FitExtent = [
    [
      [mapPaddingX, mapPaddingY],
      [width - mapPaddingX, height - mapPaddingY],
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
