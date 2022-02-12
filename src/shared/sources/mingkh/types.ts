import { Point2dCoordinates } from "../../helpers-for-geometry";

export interface HouseListResponse {
  current: number;
  rowCount: number;
  rows: Array<{
    rownumber: string;
    address: string;
    square: string;
    year: string;
    floors: string;
    url: string;
    managerstartdate: string;
  }>;
}

export interface HouseListFile {
  fetchedAt: string;
  response: HouseListResponse;
}

export interface HouseInfo {
  address?: string;
  cadastralId?: string;
  centerPoint?: Point2dCoordinates;
  id: number;
  numberOfFloors?: number;
  numberOfLivingQuarters?: number;
  year?: number;
}

export interface HouseInfoFile {
  fetchedAt: string;
  parsedAt: string;
  data: HouseInfo;
}
