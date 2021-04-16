import * as React from "react";

import { TerritoryExtent } from "../../../shared/territory";
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
      fill: "none",
      stroke: "#fff",
      strokeWidth: 2,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }),
    [],
  );

  return (
    <GeoMapLayer
      width={width}
      height={height}
      fitExtent={fitExtent}
      featureProps={featureProps}
      opacity={0.25}
      features={[data]}
    />
  );
};
