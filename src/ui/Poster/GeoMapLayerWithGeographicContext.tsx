import * as React from "react";

import {
  GeographicContextFeature,
  GeographicContextFeatureCollection,
  geographicContextStyling,
  GeographicContextWayProperties,
} from "../../shared/geographicContext";
import { GenerateFeatureProps, GeoMapLayer } from "./shared/GeoMapLayer";
import { ProjectionConfig } from "./types";

export interface GeoMapLayerWithGeographicContextProps {
  width: number;
  height: number;
  data: GeographicContextFeatureCollection;
  projectionConfig: ProjectionConfig;
}

const extractWayStroke = ({
  category,
}: GeographicContextWayProperties): string => {
  switch (category) {
    case "roadway":
      return geographicContextStyling.roadColor;
    case "railway":
      return geographicContextStyling.railColor;
    case "waterway":
      return geographicContextStyling.waterColor;
  }
};

const extractWayStrokeWidth = ({
  relativeSize,
}: GeographicContextWayProperties): number => 1 * relativeSize;

export const GeoMapLayerWithGeographicContext: React.VoidFunctionComponent<GeoMapLayerWithGeographicContextProps> = ({
  width,
  height,
  projectionConfig,
  data,
}) => {
  const generateFeatureProps = React.useCallback<
    GenerateFeatureProps<GeographicContextFeature>
  >(({ properties }) => {
    switch (properties.category) {
      case "geographicContextExtent":
        return {
          fill: geographicContextStyling.backgroundColor,
        };

      case "wetland":
        return {
          fill: geographicContextStyling.waterColor,
          opacity: 0.5,
        };

      case "water":
        return {
          fill: geographicContextStyling.waterColor,
          stroke: "none",
        };
    }

    return {
      stroke: extractWayStroke(properties),
      fill: "none",
      strokeWidth: extractWayStrokeWidth(properties),
      strokeLinejoin: "round",
      strokeLinecap: "round",
    };
  }, []);

  return (
    <>
      <GeoMapLayer
        width={width}
        height={height}
        projectionConfig={projectionConfig}
        generateFeatureProps={generateFeatureProps}
        features={data.features}
      />
    </>
  );
};
