import * as React from "react";

import { TerritoryExtent } from "../../../shared/territory";
import { pointsInMm } from "../printing";
import { GeoMapLayer } from "./GeoMapLayer";
import { FitExtent } from "./types";

export interface GeoMapLayerWithTerritoryExtentProps {
  width: number;
  height: number;
  data: TerritoryExtent;
  fitExtent: FitExtent;
}

export const GeoMapLayerWithTerritoryExtent: React.VoidFunctionComponent<GeoMapLayerWithTerritoryExtentProps> = ({
  width,
  height,
  fitExtent,
  data,
}) => {
  const featureProps = React.useCallback<() => React.SVGProps<SVGPathElement>>(
    () => ({
      stroke: "#fff",
      fill: "none",
      strokeWidth: 1 * pointsInMm,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }),
    [],
  );

  const dataToDraw: TerritoryExtent = {
    ...data,
    geometry: {
      ...data.geometry,
      coordinates: [[...data.geometry.coordinates[0]].reverse()],
    },
  };

  return (
    <GeoMapLayer
      width={width}
      height={height}
      fitExtent={fitExtent}
      featureProps={featureProps}
      opacity={0.1}
      features={[dataToDraw]}
    />
  );
};
