SELECT ?item ?image ?coordinate_location ?itemLabel ?article ?architectLabel  ?architectural_styleLabel WHERE {
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ru". }
  SERVICE wikibase:box {
    ?item wdt:P625 ?location.
    bd:serviceParam wikibase:cornerSouthWest "Point(36.725816 55.105208)"^^geo:wktLiteral;
      wikibase:cornerNorthEast "Point(38.016710 56.033810)"^^geo:wktLiteral.
  }
  OPTIONAL { ?item wdt:P84 ?architect. }
  OPTIONAL { ?item wdt:P149 ?architectural_style. }
  OPTIONAL { ?item wdt:P18 ?image. }
  OPTIONAL { ?item wdt:P625 ?coordinate_location. }
  OPTIONAL {
    ?article schema:about ?item;
      schema:inLanguage "ru".
  }
}
