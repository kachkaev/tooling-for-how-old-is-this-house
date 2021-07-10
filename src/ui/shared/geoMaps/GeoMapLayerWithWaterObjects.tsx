import * as React from "react";

import {
  OsmFeature,
  OsmFeatureCollection,
  OsmWaterObjectGeometry,
} from "../../../shared/sources/osm/types";
import { GeoMapLayer } from "./GeoMapLayer";
import { ProjectionConfig } from "./types";

export interface GeoMapLayerWithWaterObjectsProps {
  width: number;
  height: number;
  data: OsmFeatureCollection<OsmWaterObjectGeometry>;
  projectionConfig: ProjectionConfig;
}

// const waterColor = "#1F2737";
// const waterColor = "#181f2d";
const waterColor = "#151C28";
// const waterColor = "#131921";
// const waterColor = "#203339";

export const GeoMapLayerWithWaterObjects: React.VoidFunctionComponent<GeoMapLayerWithWaterObjectsProps> = ({
  width,
  height,
  projectionConfig,
  data,
}) => {
  const allAreaFeatures = React.useMemo(
    () =>
      data.features.filter(
        (feature) =>
          feature.geometry.type === "Polygon" ||
          feature.geometry.type === "MultiPolygon",
      ),
    [data],
  );

  const wetlandAreaFeatures = React.useMemo(
    () =>
      allAreaFeatures.filter(
        (feature) => feature.properties.natural === "wetland",
      ),
    [allAreaFeatures],
  );

  const normalAreaFeatures = React.useMemo(
    () =>
      allAreaFeatures.filter(
        (feature) => feature.properties.natural !== "wetland",
      ),
    [allAreaFeatures],
  );

  const areaProps = React.useCallback<() => React.SVGProps<SVGPathElement>>(
    () => ({
      fill: waterColor,
      strokeWidth: 1,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }),
    [],
  );

  const lineFeatures = React.useMemo(
    () =>
      data.features.filter(
        (feature) =>
          feature.geometry.type === "LineString" ||
          feature.geometry.type === "MultiLineString",
      ),
    [data],
  );

  const lineProps = React.useCallback<
    (
      feature: OsmFeature<OsmWaterObjectGeometry>,
    ) => React.SVGProps<SVGPathElement>
  >(
    (feature) => ({
      fill: "none",
      stroke: waterColor,
      strokeWidth: feature.properties.waterway === "stream" ? 0.5 : 1,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }),
    [],
  );

  return (
    <>
      <GeoMapLayer
        width={width}
        height={height}
        projectionConfig={projectionConfig}
        featureProps={areaProps}
        features={normalAreaFeatures}
      />
      <g opacity={0.5}>
        <GeoMapLayer
          width={width}
          height={height}
          projectionConfig={projectionConfig}
          featureProps={areaProps}
          features={wetlandAreaFeatures}
        />
      </g>
      <GeoMapLayer
        width={width}
        height={height}
        projectionConfig={projectionConfig}
        featureProps={lineProps}
        features={lineFeatures}
      />
    </>
  );
};
