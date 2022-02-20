import * as envalid from "envalid";
import _ from "lodash";
import sleep from "sleep-promise";

import { cleanEnv } from "../clean-env";

const getPkkApiDelay = _.memoize((): number => {
  const env = cleanEnv({
    PKK_API_DELAY: envalid.num({
      default: 500,
      desc: "Recommended: 500. The lower the value, the higher the risk of getting banned for a few hours.",
    }),
  });

  return env.PKK_API_DELAY;
});

export const pauseBetweenPkkApiRequestsToAvoid403 = async () => {
  await sleep(getPkkApiDelay());
};
