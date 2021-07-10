import * as React from "react";

import {
  OsmFeature,
  OsmFeatureCollection,
  OsmRoadGeometry,
} from "../../../shared/sources/osm/types";
import { GeoMapLayer } from "./GeoMapLayer";
import { ProjectionConfig } from "./types";

export interface GeoMapLayerWithRoadsProps {
  width: number;
  height: number;
  data: OsmFeatureCollection<OsmRoadGeometry>;
  projectionConfig: ProjectionConfig;
}

type RoadGeometryFeature = OsmFeature<OsmRoadGeometry>;

const mapHighwayTypeToStrokeWidth = (highwayType: string | undefined): number =>
  highwayType?.startsWith("trunk")
    ? 3
    : highwayType?.startsWith("primary")
    ? 1.5
    : highwayType?.startsWith("secondary")
    ? 1.5
    : 1;

export const GeoMapLayerWithRoads: React.VoidFunctionComponent<GeoMapLayerWithRoadsProps> = ({
  width,
  height,
  projectionConfig,
  data,
}) => {
  const featureProps = React.useCallback<
    (feature: RoadGeometryFeature) => React.SVGProps<SVGPathElement>
  >(
    (feature) => ({
      fill: "none",
      stroke: "#1a1e22",
      strokeWidth: mapHighwayTypeToStrokeWidth(feature.properties.highway),
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }),
    [],
  );

  return (
    <GeoMapLayer<RoadGeometryFeature>
      width={width}
      height={height}
      projectionConfig={projectionConfig}
      featureProps={featureProps}
      features={data.features}
    />
  );
};
