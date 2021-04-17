import * as turf from "@turf/turf";
import { Mercator } from "@visx/geo";
import _ from "lodash";
import * as React from "react";

import { FitExtent } from "./types";

type BaseFeature = turf.Feature<
  turf.Polygon | turf.MultiPolygon | turf.LineString | turf.MultiLineString
>;

export interface GeoMapLayerProps<Feature extends BaseFeature = BaseFeature>
  extends React.SVGAttributes<SVGGElement> {
  width: number;
  height: number;
  fitExtent: FitExtent;
  features: Feature[];
  featureProps: (feature: Feature) => React.SVGProps<SVGPathElement>;
}

type GeoMapLayerType = <Feature extends BaseFeature>(
  props: GeoMapLayerProps<Feature>,
) => React.ReactElement;

const GeoMapLayer: GeoMapLayerType = ({
  width,
  height,
  fitExtent,
  features,
  featureProps,
  ...rest
}) => {
  // https://stackoverflow.com/a/63357336/1818285
  const chunkedFeatures = _.chunk(features, 1000);

  return (
    <g {...rest}>
      {chunkedFeatures.map((featuresInChunk, chunkIndex) => (
        <Mercator data={featuresInChunk} fitExtent={fitExtent} key={chunkIndex}>
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
