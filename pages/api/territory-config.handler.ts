import { NextApiHandler } from "next";

import { getTerritoryConfig } from "../../shared/territory";

const handler: NextApiHandler = async (req, res) => {
  res.status(200).json(await getTerritoryConfig());
};

export default handler;
