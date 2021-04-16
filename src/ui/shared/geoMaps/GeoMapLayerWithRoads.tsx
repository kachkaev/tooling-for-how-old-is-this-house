import * as React from "react";

import {
  OsmFeatureCollection,
  OsmRoadGeometry,
} from "../../../shared/sources/osm/types";
import { GeoMapLayer } from "./GeoMapLayer";
import { FitExtent } from "./types";

export interface GeoMapLayerWithRoadsProps {
  width: number;
  height: number;
  data: OsmFeatureCollection<OsmRoadGeometry>;
  fitExtent: FitExtent;
}

export const GeoMapLayerWithRoads: React.VoidFunctionComponent<GeoMapLayerWithRoadsProps> = ({
  width,
  height,
  fitExtent,
  data,
}) => {
  const featureProps = React.useCallback<() => React.SVGProps<SVGPathElement>>(
    () => ({
      fill: "none",
      stroke: "#151619",
      strokeWidth: 1,
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
      features={data.features}
    />
  );
};
