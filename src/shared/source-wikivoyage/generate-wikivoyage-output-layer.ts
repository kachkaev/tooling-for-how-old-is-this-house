import * as turf from "@turf/turf";
import fs from "fs-extra";
import wtf from "wtf_wikipedia";

import { deepClean } from "../deep-clean";
import { extractJsonFromPrependedHtmlComment } from "../helpers-for-html";
import { serializeTime } from "../helpers-for-json";
import { normalizeSpacing } from "../language";
import { processFiles } from "../process-files";
import {
  GenerateOutputLayer,
  OutputLayerFeature,
  OutputLayerProperties,
} from "../stage-output-layers";
import { getTerritoryExtent } from "../territory";
import {
  getWikivoyagePageFileSuffix,
  getWikivoyagePagesDir,
} from "./helpers-for-paths";
import { WikivoyagePageMetadata } from "./types";

interface MonumentTemplate {
  template: "monument";
  type?: string; // "history" | "architecture" | "monument"
  name?: string;
  status?: string; // can be "destroyed"

  knid?: string;
  "knid-new"?: string;

  // location
  precise?: string; // "yes" / "no"
  lat?: string;
  long?: string;

  address?: string;
  author?: string; // architect
  commonscat: string; // resource category on Wikimedia commons;
  description?: string;
  district?: string; // city name
  image?: string; // image name on Wikimedia commons
  link?: string;
  municipality: string;
  munid?: string; // municipality id
  protection?: string; // protection category: Ф = федеральная (federal), Р = региональная (regional), М = местная (local), В = выявленный объект (?)
  region?: string; // ISO_3166-2 (lower case)
  style?: string;
  wiki?: string; // Page name on Russian Wikipedia
  wdid?: string; // Wikidata id
  year?: string;
}

interface UnknownTemplate {
  template?: never; // Simulates string but not "monument" until type subtraction is supported by TS
}

type WikitextTemplate = MonumentTemplate | UnknownTemplate;

const extractGeometry = (
  templateJson: MonumentTemplate,
): turf.Point | undefined => {
  if (templateJson.precise?.toLowerCase() !== "yes") {
    return;
  }

  const lon = Number.parseFloat(templateJson.long ?? "");
  const lat = Number.parseFloat(templateJson.lat ?? "");

  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    return;
  }

  return turf.point([lon, lat]).geometry;
};

const extractAddress = (
  templateJson: MonumentTemplate,
): Partial<OutputLayerProperties> => {
  if (!templateJson.municipality || !templateJson.address) {
    return {};
  }

  return {
    address: `${templateJson.municipality},${templateJson.address}`,
  };
};

const extractArchitect = (
  templateJson: MonumentTemplate,
): Partial<OutputLayerProperties> => {
  const author = normalizeSpacing(templateJson.author ?? "");
  if (!author) {
    return {};
  }

  return {
    architect: author
      .replace(/арх(|.|итекторы?) /, "")
      .replace(/(\p{L})\.\s?(\p{L})(\. | )/gu, "$1. $2. "),
  };
};

const extractCompletionTime = (
  templateJson: MonumentTemplate,
): Partial<OutputLayerProperties> => {
  const completionTime = templateJson.year;
  if (!completionTime) {
    return {};
  }

  return {
    completionTime,
  };
};

const extractId = (
  templateJson: MonumentTemplate,
): Partial<OutputLayerProperties> => {
  const id = templateJson["knid-new"] ?? templateJson.knid;

  return id ? { id } : {};
};

const extractName = (
  templateJson: MonumentTemplate,
): Partial<OutputLayerProperties> => {
  const name = normalizeSpacing(templateJson.name ?? "");
  if (!name) {
    return {};
  }

  return { name };
};

const extractPhoto = (
  templateJson: MonumentTemplate,
): Partial<OutputLayerProperties> => {
  const photoUrlSlug = templateJson.image;
  if (!photoUrlSlug) {
    return {};
  }

  return {
    // https://stackoverflow.com/a/46441957/1818285
    photoUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
      photoUrlSlug,
    )}?width=1000`,
    photoAuthorName: "Wikimedia Commons",
    photoAuthorUrl: "https://commons.wikimedia.org",
  };
};

const extractStyle = (
  templateJson: MonumentTemplate,
): Partial<OutputLayerProperties> => {
  const style = normalizeSpacing(templateJson.style ?? "");
  if (!style) {
    return {};
  }

  return {
    style: style.toLowerCase(),
  };
};

const extractUrl = (
  templateJson: MonumentTemplate,
): Partial<OutputLayerProperties> => {
  if (!templateJson.link) {
    return {};
  }

  return {
    url: templateJson.link,
  };
};

const extractWikidataUrl = (
  templateJson: MonumentTemplate,
): Partial<OutputLayerProperties> => {
  const wikidataId = templateJson.wdid;
  if (!wikidataId) {
    return {};
  }

  return {
    wikidataUrl: `http://www.wikidata.org/entity/${encodeURIComponent(
      wikidataId,
    )}`,
  };
};

const extractWikipediaUrl = (
  templateJson: MonumentTemplate,
): Partial<OutputLayerProperties> => {
  const wikipediaUrlSlug = templateJson.wiki;
  if (!wikipediaUrlSlug) {
    return {};
  }

  return {
    wikipediaUrl: `https://ru.wikipedia.org/wiki/${encodeURIComponent(
      wikipediaUrlSlug,
    )}`,
  };
};

export const generateWikivoyageOutputLayer: GenerateOutputLayer = async ({
  output,
}) => {
  const territoryExtent = await getTerritoryExtent();

  const features: OutputLayerFeature[] = [];
  await processFiles({
    output,
    fileSearchDirPath: getWikivoyagePagesDir(),
    fileSearchPattern: `**/*${getWikivoyagePageFileSuffix()}`,
    statusReportFrequency: 1,
    filesNicknameToLog: "downloaded wikivoyage pages",
    processFile: async (filePath) => {
      const rawWikitext = await fs.readFile(filePath, "utf8");
      const metadata =
        extractJsonFromPrependedHtmlComment<WikivoyagePageMetadata>(
          rawWikitext,
        );
      const parsedDoc = wtf(rawWikitext);
      const knownAt = serializeTime(metadata.latest.timestamp);

      for (const template of parsedDoc.templates()) {
        const templateJson = template.json() as WikitextTemplate;
        if (
          templateJson.template !== "monument" ||
          templateJson.type !== "architecture" ||
          templateJson.status === "destroyed"
        ) {
          continue;
        }
        const geometry = extractGeometry(templateJson);
        if (geometry && !turf.booleanContains(territoryExtent, geometry)) {
          continue;
        }

        const properties: OutputLayerProperties = {
          knownAt,
          ...extractAddress(templateJson),
          ...extractArchitect(templateJson),
          ...extractCompletionTime(templateJson),
          ...extractId(templateJson),
          ...extractName(templateJson),
          ...extractPhoto(templateJson),
          ...extractStyle(templateJson),
          ...extractUrl(templateJson),
          ...extractWikidataUrl(templateJson),
          ...extractWikipediaUrl(templateJson),
        };

        features.push({
          type: "Feature",
          geometry,
          properties: deepClean(properties),
        });
      }
    },
  });

  return {
    type: "FeatureCollection",
    layerRole: "patch",
    features,
  };
};
