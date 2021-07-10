import * as React from "react";
import { useMeasure } from "react-use";
import styled from "styled-components";

import { pointsInMm } from "../printing";
import { ProjectionConfig } from "./types";

const clipExtentDistanceInPixels = 30;

const Wrapper = styled.div`
  position: relative;
`;

const StyledSvg = styled.svg`
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
`;

export interface GeoMapProps extends React.HTMLAttributes<HTMLDivElement> {
  centerLonLat: [number, number];
  zoomInMillimetersPerKilometer: number;
  offsetXInMillimeters: number;
  offsetYInMillimeters: number;
  children: (payload: {
    width: number;
    height: number;
    projectionConfig: ProjectionConfig;
  }) => React.ReactNode;
}

export const GeoMap: React.VoidFunctionComponent<GeoMapProps> = ({
  children,
  centerLonLat,
  offsetXInMillimeters,
  offsetYInMillimeters,
  zoomInMillimetersPerKilometer,
  ...rest
}) => {
  const [ref, { width, height }] = useMeasure<HTMLDivElement>();

  const projectionConfig: ProjectionConfig = React.useMemo(
    () => ({
      center: centerLonLat,
      clipExtent: [
        [-clipExtentDistanceInPixels, -clipExtentDistanceInPixels],
        [
          width + clipExtentDistanceInPixels,
          height + clipExtentDistanceInPixels,
        ],
      ],
      translate: [
        offsetXInMillimeters + width / 2,
        offsetYInMillimeters + height / 2,
      ],
      scale:
        (zoomInMillimetersPerKilometer * 1000 * pointsInMm) /
        Math.cos((centerLonLat[1] / 180) * Math.PI),
    }),
    [
      centerLonLat,
      height,
      offsetXInMillimeters,
      offsetYInMillimeters,
      width,
      zoomInMillimetersPerKilometer,
    ],
  );

  return (
    <Wrapper {...rest} ref={ref}>
      {width && height ? (
        <StyledSvg width={width} height={height}>
          {children?.({ width, height, projectionConfig })}
        </StyledSvg>
      ) : null}
    </Wrapper>
  );
};
