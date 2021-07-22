import fs from "fs-extra";

import { deepClean } from "../../deepClean";
import { normalizeSpacing } from "../../normalizeSpacing";
import {
  GenerateOutputLayer,
  OutputLayerFeature,
  OutputLayerProperties,
} from "../../outputLayers";
import { extractGeometry } from "./extractGeometry";
import { getWikidataProcessedQueryResultFilePath } from "./helpersForPaths";
import { ProcessedQueryResult, WikidataQueryItem } from "./types";

const extractArchitect = (
  item: WikidataQueryItem,
): Partial<OutputLayerProperties> => {
  const architect = normalizeSpacing(item.architectLabel?.value ?? "");
  if (!architect) {
    return {};
  }

  return { architect };
};

const extractId = (item: WikidataQueryItem): Partial<OutputLayerProperties> => {
  const [, idMatch] = item.item?.value.match(/\/entity\/(.*)$/) ?? [];
  if (!idMatch) {
    throw new Error(`Unable to extract item id from ${item.item?.value}`);
  }

  return { id: idMatch };
};

const extractKnownAt = (
  item: WikidataQueryItem,
): Pick<OutputLayerProperties, "knownAt"> => {
  return {
    knownAt: item.dateModified.value,
  };
};

const extractName = (
  item: WikidataQueryItem,
): Partial<OutputLayerProperties> => {
  const name = normalizeSpacing(item.itemLabel?.value ?? "");
  if (!name) {
    return {};
  }

  return { name };
};

const extractPhoto = (
  item: WikidataQueryItem,
): Partial<OutputLayerProperties> => {
  const photoUrl = item.image?.value;
  if (!photoUrl) {
    return {};
  }

  if (!photoUrl.includes("//commons.wikimedia.org")) {
    throw new Error(`Unexpected value for phot url: ${photoUrl}`);
  }

  return {
    photoUrl: `${photoUrl.replace(/^http:/, "https:")}?width=1000`,
    photoAuthorName: "Wikimedia Commons",
    photoAuthorUrl: "https://commons.wikimedia.org",
  };
};

const extractStyle = (
  item: WikidataQueryItem,
): Partial<OutputLayerProperties> => {
  const style = normalizeSpacing(item.architecturalStyleLabel?.value ?? "");
  if (!style) {
    return {};
  }

  return {
    style: style.toLowerCase(),
  };
};

const extractWikipediaUrl = (
  item: WikidataQueryItem,
): Partial<OutputLayerProperties> => {
  const wikipediaUrl = item.article?.value;
  if (!wikipediaUrl) {
    return {};
  }

  return { wikipediaUrl };
};

const extractWikidataUrl = (
  item: WikidataQueryItem,
): Partial<OutputLayerProperties> => {
  return { wikidataUrl: item.item.value };
};

export const generateWikidataOutputLayer: GenerateOutputLayer = async () => {
  const fetchedItemsFileContent = (await fs.readJson(
    getWikidataProcessedQueryResultFilePath(),
  )) as ProcessedQueryResult;

  const features: OutputLayerFeature[] = [];

  fetchedItemsFileContent.items.forEach((item) => {
    const geometry = extractGeometry(item);

    const properties: OutputLayerProperties = {
      ...extractArchitect(item),
      ...extractId(item),
      ...extractKnownAt(item),
      ...extractName(item),
      ...extractPhoto(item),
      ...extractStyle(item),
      ...extractWikidataUrl(item),
      ...extractWikipediaUrl(item),
    };

    features.push({
      type: "Feature",
      geometry,
      properties: deepClean(properties),
    });
  });

  return {
    type: "FeatureCollection",
    layerRole: "patch",
    features,
  };
};
