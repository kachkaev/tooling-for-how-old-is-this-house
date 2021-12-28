import * as turf from "@turf/turf";
import _ from "lodash";
import * as React from "react";

import {
  MixedPropertyVariantsFeature,
  MixedPropertyVariantsFeatureCollection,
} from "../../shared/mixing";
import { GeoMapLayer } from "./shared/GeoMapLayer";
import { MapCompletionYearToColor, ProjectionConfig } from "./types";

/**
 * 1.2345 → 54321
 */
const extractNumberDigitsInReverse = (fractionalNumber: number): number => {
  const digits = `${fractionalNumber}`
    .split("")
    .filter((char) => char >= "0" && char <= "9");
  const result = parseInt(digits.reverse().join(""));

  return isFinite(result) ? result : 0;
};

export interface GeoMapLayerWithBuildingCompletionYearsProps {
  width: number;
  height: number;
  data: MixedPropertyVariantsFeatureCollection;
  sampleSize?: number;
  bufferInMeters?: number;
  projectionConfig: ProjectionConfig;
  mapCompletionYearToColor: MapCompletionYearToColor;
}

export const GeoMapLayerWithBuildingCompletionYears: React.VoidFunctionComponent<
  GeoMapLayerWithBuildingCompletionYearsProps
> = ({
  width,
  height,
  data,
  sampleSize,
  projectionConfig,
  mapCompletionYearToColor,
}) => {
  const featureProps = React.useCallback<
    (feature: MixedPropertyVariantsFeature) => React.SVGProps<SVGPathElement>
  >(
    (feature) => ({
      fill: mapCompletionYearToColor(
        feature.properties.derivedCompletionYear ?? undefined,
      ),
      stroke: "#0e0f12",
      paintOrder: "stroke",
      strokeOpacity: 0.3,
      strokeWidth: 0.2,
    }),
    [mapCompletionYearToColor],
  );

  const sampledBuildings = React.useMemo(
    () =>
      typeof sampleSize === "number" && isFinite(sampleSize)
        ? _.orderBy(data.features, (feature) => {
            const [lon = 0, lat = 0] =
              turf.pointOnFeature(feature).geometry.coordinates ?? [];
            const pseudoRandomIndex =
              extractNumberDigitsInReverse(lon) +
              extractNumberDigitsInReverse(lat);

            return pseudoRandomIndex;
          }).slice(0, sampleSize)
        : data.features,
    [data, sampleSize],
  );

  const sampledAndOrderedBuildings = React.useMemo(
    () => _.orderBy(sampledBuildings, (building) => turf.area(building)),
    [sampledBuildings],
  );

  return (
    <GeoMapLayer<MixedPropertyVariantsFeature>
      width={width}
      height={height}
      generateFeatureProps={featureProps}
      features={sampledAndOrderedBuildings}
      projectionConfig={projectionConfig}
    />
  );
};
