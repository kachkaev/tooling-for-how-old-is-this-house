export interface WikidataQueryItem {
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
