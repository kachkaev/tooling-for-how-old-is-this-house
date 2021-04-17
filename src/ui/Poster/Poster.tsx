import { DateTime } from "luxon";
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
import { AgeHistogram } from "./AgeHistogram";

const mapPaddingInMm = {
  top: 20,
  right: 20,
  bottom: 120,
  left: 20,
};

const Figure = styled.div`
  box-shadow: 5px 5px 10px #ddd;
  overflow: hidden;
  color: rgb(242, 246, 249);
  background: #0e0f12;
  width: 700mm;
  height: 700mm;
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
  left: ${mapPaddingInMm.left}mm;
  right: ${mapPaddingInMm.right}mm;
  bottom: 20mm;
`;

const DraftNotice = styled.div`
  position: absolute;
  right: ${mapPaddingInMm.right + 10}mm;
  top: ${mapPaddingInMm.top - 10}mm;
  font-size: 75mm;
  line-height: 1.1em;
  text-align: right;
  color: #85868a;
  opacity: 0.3;
`;

const DraftNoticeDate = styled.span`
  font-size: 60mm;
`;

const DraftNotice2 = styled(DraftNotice)`
  right: auto;
  top: auto;
  left: ${mapPaddingInMm.left}mm;
  bottom: 70mm;
  font-size: 60mm;
  text-align: left;
`;

export interface PosterProps {
  buildingCollection: MixedPropertyVariantsFeatureCollection;
  roadCollection: OsmFeatureCollection<OsmRoadGeometry>;
  territoryExtent: TerritoryExtent;
  waterObjectCollection: OsmFeatureCollection<OsmWaterObjectGeometry>;
}

export const Poster: React.VoidFunctionComponent<PosterProps> = ({
  buildingCollection,
  roadCollection,
  territoryExtent,
  waterObjectCollection,
}) => {
  return (
    <Figure>
      <GlobalStyle />
      <StyledGeoMap paddingInMm={mapPaddingInMm} extentToFit={territoryExtent}>
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
      <DraftNotice>
        черновик
        <br />
        <DraftNoticeDate>
          {DateTime.now().toFormat("yyyy-MM-dd")}
        </DraftNoticeDate>
      </DraftNotice>
      <DraftNotice2>
        не для
        <br />
        распространения
      </DraftNotice2>
    </Figure>
  );
};
