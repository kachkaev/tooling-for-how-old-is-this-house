export const extractYearFromDates = (
  dates: string | undefined,
): number | undefined => {
  if (typeof dates !== "string") {
    return undefined;
  }

  // TODO: use the right regexp, add tests
  const year = parseInt(dates);
  if (isFinite(year)) {
    return year;
  }

  return undefined;
};
