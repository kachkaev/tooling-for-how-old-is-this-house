export const deriveCompletionYearFromCompletionDates = (
  completionDates: string | undefined,
): number | undefined => {
  if (!completionDates) {
    return undefined;
  }

  const result = parseInt(completionDates);

  return isFinite(result) ? result : undefined;
};

export const stringifyCompletionYear = (completionYear: number | undefined) => {
  return completionYear ? `${completionYear}` : undefined;
};
