import * as turf from "@turf/turf";
import * as React from "react";

import { MixedPropertyVariantsFeatureCollection } from "../../../shared/output";
import { GeoMapLayer } from "./GeoMapLayer";
import { FitExtent } from "./types";

export interface GeoMapLayerWithAddressStatusesProps {
  width: number;
  height: number;
  data: MixedPropertyVariantsFeatureCollection;
  fitExtent: FitExtent;
  sample?: number;
  bufferInMeters?: number;
}

export const GeoMapLayerWithAddressStatuses: React.VoidFunctionComponent<GeoMapLayerWithAddressStatusesProps> = ({
  width,
  height,
  fitExtent,
  data,
  bufferInMeters = 0,
  sample,
}) => {
  const featureProps = React.useCallback<
    (feature: turf.Feature) => React.SVGProps<SVGPathElement>
  >(() => {
    const color = "red";

    return {
      fill: color,
      // stroke: color,
      // strokeWidth: 0.2,
      stroke: "#0003",
      strokeWidth: 0.1,
    };
  }, []);

  const features = React.useMemo(
    () =>
      data.features.map((feature) => {
        if (!bufferInMeters) {
          return feature;
        }

        try {
          return turf.buffer(feature, 2, { units: "meters", steps: 1 });
        } catch {
          // noop (unclosed geometry)
        }

        return feature;
      }),
    [data, bufferInMeters],
  );

  const sampledFeatures = React.useMemo(
    () => (sample ? features.slice(0, sample) : features),
    [sample, features],
  );

  return (
    <GeoMapLayer
      width={width}
      height={height}
      fitExtent={fitExtent}
      featureProps={featureProps}
      features={sampledFeatures}
    />
  );
};
