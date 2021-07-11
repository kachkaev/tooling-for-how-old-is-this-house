import * as React from "react";

import {
  OsmFeature,
  OsmFeatureCollection,
  OsmFeatureProperties,
  OsmRoadGeometry,
} from "../../shared/sources/osm/types";
import { GeoMapLayer } from "./shared/GeoMapLayer";
import { ProjectionConfig } from "./types";

type RailwayGeometryFeature = OsmFeature<OsmRoadGeometry>;

export interface GeoMapLayerWithRailwaysProps {
  width: number;
  height: number;
  data: OsmFeatureCollection<OsmRoadGeometry>;
  projectionConfig: ProjectionConfig;
  featureFilter?: (osmFeature: RailwayGeometryFeature) => boolean;
  opacity?: number;
}

const mapRailwayPropertiesToStrokeWidth = (
  osmFeatureProperties: OsmFeatureProperties,
): number =>
  osmFeatureProperties.railway?.startsWith("rail") &&
  osmFeatureProperties.usage?.startsWith("main")
    ? 1
    : 0.5;

export const GeoMapLayerWithRailways: React.VoidFunctionComponent<GeoMapLayerWithRailwaysProps> = ({
  width,
  height,
  projectionConfig,
  data,
  featureFilter,
  opacity = 1,
}) => {
  const featureProps = React.useCallback<
    (feature: RailwayGeometryFeature) => React.SVGProps<SVGPathElement>
  >(
    (feature) => ({
      fill: "none",
      opacity,
      stroke: "#000",
      strokeWidth: mapRailwayPropertiesToStrokeWidth(feature.properties),
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }),
    [opacity],
  );

  const features = React.useMemo(
    () => (featureFilter ? data.features.filter(featureFilter) : data.features),
    [data.features, featureFilter],
  );

  return (
    <GeoMapLayer<RailwayGeometryFeature>
      width={width}
      height={height}
      projectionConfig={projectionConfig}
      featureProps={featureProps}
      features={features}
    />
  );
};
