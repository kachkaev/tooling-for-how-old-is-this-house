import * as React from "react";

import { extractPosterConfig, PosterConfig } from "../../shared/poster";
import { TerritoryConfig, TerritoryExtent } from "../../shared/territory";

export const usePosterConfig = (
  territoryConfig: TerritoryConfig | undefined,
  territoryExtent: TerritoryExtent,
): PosterConfig | undefined =>
  React.useMemo(
    () =>
      territoryConfig
        ? extractPosterConfig(territoryConfig, territoryExtent)
        : undefined,
    [territoryConfig, territoryExtent],
  );
