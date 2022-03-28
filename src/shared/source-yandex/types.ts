export interface YandexGeocoderSuccessfulApiData {
  response?: {
    GeoObjectCollection?: {
      featureMember?: Array<{
        GeoObject: {
          metaDataProperty?: {
            GeocoderMetaData?: {
              precision: string;
            };
          };
          Point?: {
            pos?: string;
          };
        };
      }>;
    };
  };
}

export interface YandexGeocoderCacheEntry {
  normalizedAddress: string;
  fetchedAt: string;
  data: YandexGeocoderSuccessfulApiData;
}
