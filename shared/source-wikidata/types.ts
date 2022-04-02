export interface WikidataQueryItem {
  architectLabel?: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "xml:lang": string;
    type: "literal";
    value: string;
  };

  architecturalStyleLabel?: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
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

  dateModified: {
    datatype: "http://www.w3.org/2001/XMLSchema#dateTime";
    type: "literal";
    value: string;
  };

  image?: {
    type: "uri";
    value: string;
  };

  item: {
    type: "uri";
    value: string;
  };

  itemLabel?: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
    bindings: WikidataQueryItem[];
  };
}

export interface ProcessedQueryResult {
  fetchedAt: string;
  items: WikidataQueryItem[];
}
