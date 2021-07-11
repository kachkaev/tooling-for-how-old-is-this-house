import * as React from "react";

import {
  OsmFeature,
  OsmFeatureCollection,
  OsmRoadGeometry,
} from "../../shared/sources/osm/types";
import { GeoMapLayer } from "./shared/GeoMapLayer";
import { ProjectionConfig } from "./types";

type RoadGeometryFeature = OsmFeature<OsmRoadGeometry>;

export interface GeoMapLayerWithRoadsProps {
  width: number;
  height: number;
  data: OsmFeatureCollection<OsmRoadGeometry>;
  projectionConfig: ProjectionConfig;
  featureFilter?: (osmFeature: RoadGeometryFeature) => boolean;
  opacity?: number;
}

const mapHighwayTypeToStrokeWidth = (highwayType: string | undefined): number =>
  highwayType?.startsWith("trunk")
    ? 2
    : highwayType?.startsWith("primary")
    ? 1
    : highwayType?.startsWith("secondary")
    ? 1
    : 0.7;

export const GeoMapLayerWithRoads: React.VoidFunctionComponent<GeoMapLayerWithRoadsProps> = ({
  width,
  height,
  projectionConfig,
  data,
  featureFilter,
  opacity = 1,
}) => {
  const featureProps = React.useCallback<
    (feature: RoadGeometryFeature) => React.SVGProps<SVGPathElement>
  >(
    (feature) => ({
      fill: "none",
      stroke: "#181c1f",
      strokeWidth: mapHighwayTypeToStrokeWidth(feature.properties.highway),
      strokeLinejoin: "round",
      strokeLinecap: "round",
      opacity,
    }),
    [opacity],
  );

  const features = React.useMemo(
    () => (featureFilter ? data.features.filter(featureFilter) : data.features),
    [data.features, featureFilter],
  );

  return (
    <GeoMapLayer<RoadGeometryFeature>
      width={width}
      height={height}
      projectionConfig={projectionConfig}
      featureProps={featureProps}
      features={features}
    />
  );
};
