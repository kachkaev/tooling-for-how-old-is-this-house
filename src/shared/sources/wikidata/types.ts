export interface RecordInWikidataApiResponse {
  architectLabel?: {
    "xml:lang": string;
    type: "literal";
    value: string;
  };

  architecturalStyleLabel?: {
    "xml:lang": string;
    type: "literal";
    value: string;
  };

  article?: {
    type: "uri";
    value: string;
  };

  coordinateLocation: {
    datatype: "http://www.opengis.net/ont/geosparql#wktLiteral";
    type: "literal";
    value: `Point(${number} ${number})`;
  };

  image?: {
    type: "uri";
    value: string;
  };

  item?: {
    type: "uri";
    value: string;
  };

  itemLabel?: {
    "xml:lang": string;
    type: "literal";
    value: string;
  };
}

export interface WikidataApiResponse {
  head: {
    vars: string[];
  };
  results: {
    bindings: RecordInWikidataApiResponse[];
  };
}

export interface WikidataRecordsFileContent {
  fetchedAt: string;
  records: RecordInWikidataApiResponse[];
}
