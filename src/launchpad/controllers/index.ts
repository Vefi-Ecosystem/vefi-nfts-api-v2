import type { Request as ExpressRequestType, Response as ExpressResponseType } from "express";
import { assign, pick, subtract } from "lodash";
import { LaunchpadDAO } from "../db/entities";

export default assign(
  {},
  {
    fetchAllLaunchItems: async (req: ExpressRequestType, res: ExpressResponseType) => {
      try {
        const { query } = pick(req, ["query"]);
        const totalNumberOfLaunchItems =
          !query.chain || query.chain === "all"
            ? await LaunchpadDAO.countAllLaunchItems()
            : await LaunchpadDAO.countAllLaunchItems({ where: { chainId: query.chain } });
        const paginizedLaunchItems =
          !query.chain || query.chain === "all"
            ? await LaunchpadDAO.getAllLaunchItems({
                limit: 30,
                offset: query.page ? subtract(parseInt(query.page as string), 1) * 30 : 0
              })
            : await LaunchpadDAO.getAllLaunchItems({
                where: { chainId: query.chain },
                limit: 30,
                offset: query.page ? subtract(parseInt(query.page as string), 1) * 30 : 0
              });
        const result = {
          itemsCount: totalNumberOfLaunchItems,
          items: paginizedLaunchItems
        };
        return res.status(200).json({ result });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    },
    fetchSingleLaunchItem: async (req: ExpressRequestType, res: ExpressResponseType) => {
      
    }
  }
);
