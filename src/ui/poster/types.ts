import { Mercator } from "@visx/geo";

export type ProjectionConfig = Pick<
  Parameters<typeof Mercator>[0],
  "scale" | "clipExtent" | "translate" | "center"
>;

export type MapCompletionYearToColor = (year: number | undefined) => string;
