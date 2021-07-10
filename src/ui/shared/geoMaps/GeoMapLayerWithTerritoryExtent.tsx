import * as React from "react";

import { TerritoryExtent } from "../../../shared/territory";
import { pointsInMm } from "../printing";
import { GeoMapLayer } from "./GeoMapLayer";
import { ProjectionConfig } from "./types";

export interface GeoMapLayerWithTerritoryExtentProps {
  width: number;
  height: number;
  data: TerritoryExtent;
  projectionConfig: ProjectionConfig;
}

export const GeoMapLayerWithTerritoryExtent: React.VoidFunctionComponent<GeoMapLayerWithTerritoryExtentProps> = ({
  width,
  height,
  projectionConfig,
  data,
}) => {
  const featureProps = React.useCallback<() => React.SVGProps<SVGPathElement>>(
    () => ({
      stroke: "#fff",
      fill: "none",
      strokeWidth: 0.3 * pointsInMm,
      strokeLinejoin: "bevel",
      strokeLinecap: "square",
    }),
    [],
  );

  const dataToDraw: TerritoryExtent = {
    ...data,
    geometry: {
      ...data.geometry,
      coordinates: [[...data.geometry.coordinates[0]!].reverse()],
    },
  };

  return (
    <GeoMapLayer
      width={width}
      height={height}
      projectionConfig={projectionConfig}
      featureProps={featureProps}
      opacity={0.3}
      features={[dataToDraw]}
    />
  );
};
