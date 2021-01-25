import { ProcessTile } from "../tiles";

/*
rosreestr
  lots
    by-tiles
  ccos
    by-code
    by-tiles

  rayon--58-29/
    kvartal-list--combined.json
    kvartal-list--page-000.json
    kvartal-list--page-001.json
    kvartal-list--page-002.json
  kvartal--58-29-0381302/
    oks-list--combined.json
    oks-list--page-000.json
    oks-list--page-001.json
    oks-list--page-002.json
 */

export const generateProcessTile = (
  objectType: "cco" | "lot",
): ProcessTile => async () => ({
  cacheState: Math.random() > 0.5 ? "notUsed" : "used",
  tileStatus: Math.random() > 0.2 ? "complete" : "needsSplitting",
  comment: objectType,
});
