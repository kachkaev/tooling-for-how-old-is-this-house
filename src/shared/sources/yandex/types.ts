export interface YandexGeocoderSuccessfulApiData {
  response: {
    GeoObjectCollection: {
      featureMember: [
        {
          GeoObject: {
            Point: {
              pos: string;
            };
          };
        },
      ];
    };
  };
}

export interface YandexGeocoderCacheEntry {
  normalizedAddress: string;
  fetchedAt: string;
  data: YandexGeocoderSuccessfulApiData;
}
