import * as turf from "@turf/turf";
import { Mercator } from "@visx/geo";
import _ from "lodash";
import * as React from "react";

import { ProjectionConfig } from "../types";

type BaseFeature = turf.Feature<
  turf.Polygon | turf.MultiPolygon | turf.LineString | turf.MultiLineString
>;

export type GenerateFeatureProps<Feature extends BaseFeature = BaseFeature> = (
  feature: Feature,
) => React.SVGProps<SVGPathElement>;

export interface GeoMapLayerProps<Feature extends BaseFeature = BaseFeature>
  extends React.SVGAttributes<SVGGElement> {
  features: Feature[];
  generateFeatureProps: GenerateFeatureProps<Feature>;
  projectionConfig: ProjectionConfig;
}

type GeoMapLayerType = <Feature extends BaseFeature>(
  props: GeoMapLayerProps<Feature>,
) => React.ReactElement;

const GeoMapLayer: GeoMapLayerType = ({
  width,
  height,
  features,
  generateFeatureProps: featureProps,

  projectionConfig,

  ...rest
}) => {
  // https://stackoverflow.com/a/63357336/1818285
  const chunkedFeatures = _.chunk(features, 1000);

  return (
    <g {...rest}>
      {chunkedFeatures.map((featuresInChunk, chunkIndex) => (
        <Mercator data={featuresInChunk} key={chunkIndex} {...projectionConfig}>
          {(data) =>
            data.features.map(({ path, feature }, index) => {
              return (
                <path key={index} d={path ?? ""} {...featureProps(feature)} />
              );
            })
          }
        </Mercator>
      ))}
    </g>
  );
};

const WrappedGeoMapLayer = React.memo(GeoMapLayer) as GeoMapLayerType;
export { WrappedGeoMapLayer as GeoMapLayer };
