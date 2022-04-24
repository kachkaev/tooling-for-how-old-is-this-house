import rewind from "@mapbox/geojson-rewind";
import * as turf from "@turf/turf";
import { geoMercator } from "d3-geo";
import * as React from "react";
import { useMeasure } from "react-use";
import styled from "styled-components";

import { pointsInMm } from "../../shared/printing";
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

export interface GeoMapProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
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

  const projectionConfig: ProjectionConfig = React.useMemo(() => {
    const projection = geoMercator().fitSize(
      [
        zoomInMillimetersPerKilometer * pointsInMm,
        zoomInMillimetersPerKilometer * pointsInMm,
      ],
      rewind(turf.buffer(turf.point(centerLonLat), 0.5), true),
    );

    return {
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
      scale: projection.scale(),
    };
  }, [
    centerLonLat,
    height,
    offsetXInMillimeters,
    offsetYInMillimeters,
    width,
    zoomInMillimetersPerKilometer,
  ]);

  return (
    <Wrapper {...rest} ref={ref}>
      {width && height ? (
        <StyledSvg width={width} height={height}>
          {children({ width, height, projectionConfig })}
        </StyledSvg>
      ) : undefined}
    </Wrapper>
  );
};
