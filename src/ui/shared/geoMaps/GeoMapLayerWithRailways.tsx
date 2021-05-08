import * as React from "react";

import {
  OsmFeature,
  OsmFeatureCollection,
  OsmFeatureProperties,
  OsmRoadGeometry,
} from "../../../shared/sources/osm/types";
import { GeoMapLayer } from "./GeoMapLayer";
import { FitExtent } from "./types";

export interface GeoMapLayerWithRailwaysProps {
  width: number;
  height: number;
  data: OsmFeatureCollection<OsmRoadGeometry>;
  fitExtent: FitExtent;
}

type RoadGeometryFeature = OsmFeature<OsmRoadGeometry>;

const mapRailwayPropertiesToStrokeWidth = (
  osmFeatureProperties: OsmFeatureProperties,
): number =>
  osmFeatureProperties.railway?.startsWith("rail") &&
  osmFeatureProperties.usage?.startsWith("main")
    ? 1.5
    : 1;

export const GeoMapLayerWithRailways: React.VoidFunctionComponent<GeoMapLayerWithRailwaysProps> = ({
  width,
  height,
  fitExtent,
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
      fitExtent={fitExtent}
      featureProps={featureProps}
      features={data.features}
    />
  );
};
