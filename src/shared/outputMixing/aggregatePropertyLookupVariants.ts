import _ from "lodash";

import { deriveCompletionYearFromCompletionDates } from "../completionDates";
import {
  FilterPropertyVariantLookup,
  PropertyVariantLookup,
  PropertyVariantLookupAggregate,
} from "./types";

export const aggregatePropertyVariantLookups = (
  propertyVariantLookups: PropertyVariantLookup[],
  filterPropertyVariantLookup: FilterPropertyVariantLookup,
): PropertyVariantLookupAggregate => {
  const result: PropertyVariantLookupAggregate = {};

  // TODO: order variants by priority
  const preFilteredPropertyVariantLookups = _.orderBy(
    propertyVariantLookups.filter((propertyVariantLookup) =>
      filterPropertyVariantLookup(propertyVariantLookup),
    ),
    (propertyVariantLookup) => propertyVariantLookup.source,
  );

  // Pick address
  for (const propertyVariantLookup of preFilteredPropertyVariantLookups) {
    if (propertyVariantLookup.address) {
      result.address = propertyVariantLookup.address;
      result.addressSource = propertyVariantLookup.source;
      break;
    }
  }

  // Pick completion dates
  for (const propertyVariantLookup of preFilteredPropertyVariantLookups) {
    if (propertyVariantLookup.completionDates) {
      const derivedCompletionYear = deriveCompletionYearFromCompletionDates(
        propertyVariantLookup.completionDates,
      );
      if (derivedCompletionYear) {
        result.completionDates = propertyVariantLookup.completionDates;
        result.completionDatesSource = propertyVariantLookup.source;
        result.derivedCompletionYear = derivedCompletionYear;
        break;
      }
    }
  }

  // Pick floor count
  for (const propertyVariantLookup of preFilteredPropertyVariantLookups) {
    if (propertyVariantLookup.floorCountAboveGround) {
      result.floorCountAboveGround =
        propertyVariantLookup.floorCountAboveGround;
      result.floorCountBelowGround =
        propertyVariantLookup.floorCountBelowGround;
      result.floorCountSource = propertyVariantLookup.source;
      break;
    }
  }

  // Pick name
  for (const propertyVariantLookup of preFilteredPropertyVariantLookups) {
    if (propertyVariantLookup.name) {
      result.name = propertyVariantLookup.name;
      result.nameSource = propertyVariantLookup.source;
      break;
    }
  }

  // Pick photo
  for (const propertyVariantLookup of preFilteredPropertyVariantLookups) {
    if (propertyVariantLookup.photoUrl) {
      result.photoAuthorName = propertyVariantLookup.photoAuthorName;
      result.photoAuthorUrl = propertyVariantLookup.photoAuthorUrl;
      result.photoUrl = propertyVariantLookup.photoUrl;
      result.photoSource = propertyVariantLookup.source;
      break;
    }
  }

  // Pick url
  for (const propertyVariantLookup of preFilteredPropertyVariantLookups) {
    if (propertyVariantLookup.url) {
      result.url = propertyVariantLookup.url;
      result.urlSource = propertyVariantLookup.source;
      break;
    }
  }

  // Pick wikipedia url
  for (const propertyVariantLookup of preFilteredPropertyVariantLookups) {
    if (propertyVariantLookup.wikipediaUrl) {
      result.wikipediaUrl = propertyVariantLookup.wikipediaUrl;
      result.wikipediaUrlSource = propertyVariantLookup.source;
      break;
    }
  }

  return result;
};
