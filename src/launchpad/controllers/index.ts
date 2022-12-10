import type { Request as ExpressRequestType, Response as ExpressResponseType } from "express";
import { assign, pick, subtract } from "lodash";
import { Op, WhereOptions } from "sequelize";
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
      try {
        const { params } = pick(req, ["params"]);
        const result = await LaunchpadDAO.getSingleLaunchItem({
          where: { chainId: params.chainId, launchId: params.launchId }
        });
        return res.status(200).json({ result });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    },
    fetchItemsByStatus: async (req: ExpressRequestType, res: ExpressResponseType) => {
      try {
        const { params, query } = pick(req, ["params", "query"]);
        let where: WhereOptions = { chainId: query.chain === "all" || !query.chain ? undefined : query.chain };

        switch (params.status) {
          case "live": {
            where = assign(where, {
              launchStartTime: {
                [Op.lte]: Date.now()
              },
              launchEndTime: {
                [Op.gt]: Date.now()
              }
            });
            break;
          }
          case "upcoming": {
            where = assign(where, {
              launchStartTime: {
                [Op.gt]: Date.now()
              }
            });
            break;
          }
          case "ended": {
            where = assign(where, {
              launchEndTime: {
                [Op.lte]: Date.now()
              }
            });
            break;
          }
          default: {
            where = assign(where, {
              launchStartTime: {
                [Op.lte]: Date.now()
              },
              launchEndTime: {
                [Op.gt]: Date.now()
              }
            });
            break;
          }
        }

        const result = await LaunchpadDAO.getAllLaunchItems({
          where,
          limit: 30,
          offset: query.page ? subtract(parseInt(query.page as string), 1) * 30 : 0
        });

        return res.status(200).json({ result });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  }
);
