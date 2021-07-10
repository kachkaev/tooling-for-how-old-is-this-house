import * as React from "react";

import {
  OsmFeature,
  OsmFeatureCollection,
  OsmFeatureProperties,
  OsmRoadGeometry,
} from "../../../shared/sources/osm/types";
import { GeoMapLayer } from "./GeoMapLayer";
import { ProjectionConfig } from "./types";

export interface GeoMapLayerWithRailwaysProps {
  width: number;
  height: number;
  data: OsmFeatureCollection<OsmRoadGeometry>;
  projectionConfig: ProjectionConfig;
}

type RoadGeometryFeature = OsmFeature<OsmRoadGeometry>;

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
}) => {
  const featureProps = React.useCallback<
    (feature: RoadGeometryFeature) => React.SVGProps<SVGPathElement>
  >(
    (feature) => ({
      fill: "none",
      stroke: "#000",
      strokeWidth: mapRailwayPropertiesToStrokeWidth(feature.properties),
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
