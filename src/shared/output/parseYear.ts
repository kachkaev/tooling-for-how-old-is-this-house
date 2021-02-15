export const extractYearFromDates = (dates: string): number | undefined => {
  const year = parseInt(dates);
  if (isFinite(year)) {
    return year;
  }

  return undefined;
};
