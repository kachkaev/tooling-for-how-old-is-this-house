import _ from "lodash";
import * as React from "react";
import { useInterval } from "react-use";

import { TerritoryConfig } from "../../shared/territory";

export const useLiveTerritoryConfig = (): TerritoryConfig | undefined => {
  const [result, setResult] = React.useState<TerritoryConfig | undefined>();

  useInterval(async () => {
    const fetchResult = await fetch("/api/territory-config");

    const justFetchedTerritoryConfig =
      (await fetchResult.json()) as TerritoryConfig;

    if (!_.isEqual(result, justFetchedTerritoryConfig)) {
      setResult(justFetchedTerritoryConfig);
    }
  }, 1000);

  return result;
};
