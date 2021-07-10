import * as React from "react";

import {
  OsmFeature,
  OsmFeatureCollection,
  OsmRoadGeometry,
} from "../../shared/sources/osm/types";
import { GeoMapLayer } from "./shared/GeoMapLayer";
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
    ? 2
    : highwayType?.startsWith("primary")
    ? 1
    : highwayType?.startsWith("secondary")
    ? 1
    : 0.5;

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
      stroke: "#292929",
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
