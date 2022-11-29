import type { Request as ExpressRequestType, Response as ExpressResponseType } from "express";
import { assign, pick, subtract } from "lodash";
import { CollectionDAO } from "../db/entities";

export default assign(
  {},
  {
    fetchAllCollections: async (req: ExpressRequestType, res: ExpressResponseType) => {
      try {
        const { query } = pick(req, ["query"]);
        const totalNumberOfCollections =
          !query.chain || query.chain === "all"
            ? await CollectionDAO.countAllCollections()
            : await CollectionDAO.countAllCollections({ where: { chainId: query.chain } });
        const paginizedCollections =
          !query.chain || query.chain === "all"
            ? await CollectionDAO.getAllCollections({
                limit: 30,
                offset: query.page ? subtract(parseInt(query.page as string), 1) * 30 : 0
              })
            : await CollectionDAO.getAllCollections({
                where: { chainId: query.chain },
                limit: 30,
                offset: query.page ? subtract(parseInt(query.page as string), 1) * 30 : 0
              });
        const result = {
          itemsCount: totalNumberOfCollections,
          items: paginizedCollections
        };
        return res.status(200).json({ result });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    },
    fetchSingleCollection: async (req: ExpressRequestType, res: ExpressResponseType) => {
      try {
        const { params } = pick(req, ["params"]);
        const result = await CollectionDAO.getSingleCollection({
          where: { chainId: params.chainId, address: params.address }
        });
        return res.status(200).json({ result });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  }
);
