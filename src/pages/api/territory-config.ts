import { NextApiRequest, NextApiResponse } from "next";

import { getTerritoryConfig } from "../../shared/territory";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).json(await getTerritoryConfig());
};
