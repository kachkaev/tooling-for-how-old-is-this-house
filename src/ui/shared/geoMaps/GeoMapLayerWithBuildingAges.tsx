import * as React from "react";

import {
  MixedPropertyVariantsFeature,
  MixedPropertyVariantsFeatureCollection,
} from "../../../shared/output";
import { mapBuildingCompletionYearToColor } from "../helpersForYears";
import { GeoMapLayer } from "./GeoMapLayer";
import { FitExtent } from "./types";

export interface GeoMapLayerWithBuildingAgesProps {
  width: number;
  height: number;
  data: MixedPropertyVariantsFeatureCollection;
  fitExtent: FitExtent;
  sample?: number;
  bufferInMeters?: number;
}

export const GeoMapLayerWithBuildingAges: React.VoidFunctionComponent<GeoMapLayerWithBuildingAgesProps> = ({
  width,
  height,
  fitExtent,
  data,
  sample,
}) => {
  const featureProps = React.useCallback<
    (feature: MixedPropertyVariantsFeature) => React.SVGProps<SVGPathElement>
  >(
    (feature) => ({
      fill: mapBuildingCompletionYearToColor(feature.properties.completionYear),
      stroke: "#0e0f12",
      strokeOpacity: 0.3,
      strokeWidth: 0.2,
    }),
    [],
  );

  const sampledFeatures = React.useMemo(
    () => (sample ? data.features.slice(0, sample) : data.features),
    [sample, data.features],
  );

  return (
    <GeoMapLayer<MixedPropertyVariantsFeature>
      width={width}
      height={height}
      fitExtent={fitExtent}
      featureProps={featureProps}
      features={sampledFeatures}
    />
  );
};
