import _ from "lodash";
import * as React from "react";
import { useInterval } from "react-use";

import { TerritoryConfig } from "../../shared/territory";

export const useLiveTerritoryConfig = (): TerritoryConfig | undefined => {
  const [result, setResult] = React.useState(undefined);

  useInterval(async () => {
    const justFetchedTerritoryConfig = await (
      await fetch("/api/territory-config")
    ).json();

    if (!_.isEqual(result, justFetchedTerritoryConfig)) {
      setResult(justFetchedTerritoryConfig);
    }
  }, 1000);

  return result;
};
