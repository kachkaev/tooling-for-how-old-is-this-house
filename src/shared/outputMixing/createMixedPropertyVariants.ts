import _ from "lodash";
import sortKeys from "sort-keys";

import { deriveCompletionYearFromCompletionDates } from "../completionDates";
import { deepClean } from "../deepClean";
import { matchDataToOmitSelectors } from "./helpersForDataToOmit";
import {
  DataToOmitSelector,
  FilterPropertyVariant,
  MixedPropertyVariants,
  PropertyVariant,
} from "./types";

export const createMixedPropertyVariants = ({
  dataToOmitSelectors,
  geometryId,
  geometrySource,
  propertyVariants,
}: {
  dataToOmitSelectors: DataToOmitSelector[];
  geometryId: string;
  geometrySource: string;
  propertyVariants: PropertyVariant[];
}): MixedPropertyVariants => {
  const result: MixedPropertyVariants = {
    geometryId,
    geometrySource,
  };

  const filterPropertyVariant: FilterPropertyVariant = (
    propertyVariant,
    propertyName,
  ) =>
    !matchDataToOmitSelectors(
      dataToOmitSelectors,
      propertyVariant.source,
      propertyVariant.id,
      propertyName,
    );

  // TODO: order variants by priority
  const preFilteredPropertyVariants = _.orderBy(
    propertyVariants.filter((propertyVariant) =>
      filterPropertyVariant(propertyVariant),
    ),
    (propertyVariant) => propertyVariant.source,
  );

  // Pick address
  for (const propertyVariant of preFilteredPropertyVariants) {
    if (propertyVariant.address) {
      result.address = propertyVariant.address;
      result.addressSource = propertyVariant.source;
      break;
    }
  }

  // Pick completion dates
  for (const propertyVariant of preFilteredPropertyVariants) {
    if (propertyVariant.completionDates) {
      const derivedCompletionYear = deriveCompletionYearFromCompletionDates(
        propertyVariant.completionDates,
      );
      if (derivedCompletionYear) {
        result.completionDates = propertyVariant.completionDates;
        result.completionDatesSource = propertyVariant.source;
        result.derivedCompletionYear = derivedCompletionYear;
        break;
      }
    }
  }

  // Pick floor count
  for (const propertyVariant of preFilteredPropertyVariants) {
    if (propertyVariant.floorCountAboveGround) {
      result.floorCountAboveGround = propertyVariant.floorCountAboveGround;
      result.floorCountBelowGround = propertyVariant.floorCountBelowGround;
      result.floorCountSource = propertyVariant.source;
      break;
    }
  }

  // Pick name
  for (const propertyVariant of preFilteredPropertyVariants) {
    if (propertyVariant.name) {
      result.name = propertyVariant.name;
      result.nameSource = propertyVariant.source;
      break;
    }
  }

  // Pick photo
  for (const propertyVariant of preFilteredPropertyVariants) {
    if (propertyVariant.photoUrl) {
      result.photoAuthorName = propertyVariant.photoAuthorName;
      result.photoAuthorUrl = propertyVariant.photoAuthorUrl;
      result.photoUrl = propertyVariant.photoUrl;
      result.photoSource = propertyVariant.source;
      break;
    }
  }

  // Pick url
  for (const propertyVariant of preFilteredPropertyVariants) {
    if (propertyVariant.url) {
      result.url = propertyVariant.url;
      result.urlSource = propertyVariant.source;
      break;
    }
  }

  // Pick wikipedia url
  for (const propertyVariant of preFilteredPropertyVariants) {
    if (propertyVariant.wikipediaUrl) {
      result.wikipediaUrl = propertyVariant.wikipediaUrl;
      result.wikipediaUrlSource = propertyVariant.source;
      break;
    }
  }

  return deepClean(sortKeys(result));
};
