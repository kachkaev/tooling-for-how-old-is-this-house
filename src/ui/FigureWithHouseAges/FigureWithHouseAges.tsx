import * as React from "react";
import styled from "styled-components";

import { MixedPropertyVariantsFeatureCollection } from "../../shared/output";
import {
  OsmFeatureCollection,
  OsmRoadGeometry,
  OsmWaterObjectGeometry,
} from "../../shared/sources/osm/types";
import { TerritoryExtent } from "../../shared/territory";
import {
  GeoMap,
  GeoMapLayerWithBuildingAges,
  GeoMapLayerWithRoads,
  GeoMapLayerWithTerritoryExtent,
  GeoMapLayerWithWaterObjects,
} from "../shared/geoMaps";
import { GlobalStyle } from "../shared/GlobalStyle";
import { pointsInMm } from "../shared/printing";
import { AgeHistogram } from "./AgeHistogram";

const mapPadding = {
  top: 20 * pointsInMm,
  right: 20 * pointsInMm,
  bottom: 120 * pointsInMm,
  left: 20 * pointsInMm,
};

const Figure = styled.div`
  box-shadow: 5px 5px 10px #ddd;
  overflow: hidden;
  color: rgb(242, 246, 249);
  background: #0e0f12;
  width: 700mm;
  height: 600mm;
  position: relative;
  font-size: 5mm;
  line-height: 1.4em;
`;

const StyledGeoMap = styled(GeoMap)`
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  top: 0;
`;

const StyledAgeHistogram = styled(AgeHistogram)`
  position: absolute;
  left: 25mm;
  right: 25mm;
  bottom: 20mm;
`;

export interface FigureWithHouseAgesProps {
  buildingCollection: MixedPropertyVariantsFeatureCollection;
  roadCollection: OsmFeatureCollection<OsmRoadGeometry>;
  territoryExtent: TerritoryExtent;
  waterObjectCollection: OsmFeatureCollection<OsmWaterObjectGeometry>;
}

export const FigureWithHouseAges: React.VoidFunctionComponent<FigureWithHouseAgesProps> = ({
  buildingCollection,
  roadCollection,
  territoryExtent,
  waterObjectCollection,
}) => {
  return (
    <Figure>
      <GlobalStyle />
      <StyledGeoMap padding={mapPadding} extentToFit={territoryExtent}>
        {(layerProps) => {
          return (
            <>
              <GeoMapLayerWithWaterObjects
                {...layerProps}
                data={waterObjectCollection}
              />
              <GeoMapLayerWithRoads {...layerProps} data={roadCollection} />
              <GeoMapLayerWithTerritoryExtent
                {...layerProps}
                data={territoryExtent}
              />
              <GeoMapLayerWithBuildingAges
                {...layerProps}
                data={buildingCollection}
              />
            </>
          );
        }}
      </StyledGeoMap>
      <StyledAgeHistogram buildingCollection={buildingCollection} />
    </Figure>
  );
};
