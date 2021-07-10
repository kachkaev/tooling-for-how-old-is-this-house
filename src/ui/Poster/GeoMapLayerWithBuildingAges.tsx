import * as React from "react";

import {
  MixedPropertyVariantsFeature,
  MixedPropertyVariantsFeatureCollection,
} from "../../shared/outputMixing";
import { GeoMapLayer } from "./shared/GeoMapLayer";
import { MapCompletionYearToColor, ProjectionConfig } from "./types";

export interface GeoMapLayerWithBuildingAgesProps {
  width: number;
  height: number;
  data: MixedPropertyVariantsFeatureCollection;
  sample?: number;
  bufferInMeters?: number;
  projectionConfig: ProjectionConfig;
  mapCompletionYearToColor: MapCompletionYearToColor;
}

export const GeoMapLayerWithBuildingAges: React.VoidFunctionComponent<GeoMapLayerWithBuildingAgesProps> = ({
  width,
  height,
  data,
  sample,
  projectionConfig,
  mapCompletionYearToColor,
}) => {
  const featureProps = React.useCallback<
    (feature: MixedPropertyVariantsFeature) => React.SVGProps<SVGPathElement>
  >(
    (feature) => ({
      fill: mapCompletionYearToColor(feature.properties.derivedCompletionYear),
      stroke: "#0e0f12",
      strokeOpacity: 0.3,
      strokeWidth: 0.2,
    }),
    [mapCompletionYearToColor],
  );

  const sampledFeatures = React.useMemo(
    () => (sample ? data.features.slice(0, sample) : data.features),
    [sample, data.features],
  );

  return (
    <GeoMapLayer<MixedPropertyVariantsFeature>
      width={width}
      height={height}
      featureProps={featureProps}
      features={sampledFeatures}
      projectionConfig={projectionConfig}
    />
  );
};
