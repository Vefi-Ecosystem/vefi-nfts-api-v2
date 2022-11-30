import type { Request as ExpressRequestType, Response as ExpressResponseType } from "express";
import { assign, pick, subtract } from "lodash";
import { CollectionDAO, NFTsDAO } from "../db/entities";

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
    },
    fetchAllNFTsInCollection: async (req: ExpressRequestType, res: ExpressResponseType) => {
      try {
        const { params, query } = pick(req, ["params", "query"]);
        const totalNumberOfNFTs = await NFTsDAO.countAllNFTs({
          where: { chainId: params.chainId, collection: params.collection }
        });
        const paginizedNFTs = await NFTsDAO.getAllNFTs({
          where: { chainId: params.chainId, collection: params.collection },
          limit: 30,
          offset: query.page ? subtract(parseInt(query.page as string), 1) * 30 : 0
        });
        const result = {
          itemsCount: totalNumberOfNFTs,
          items: paginizedNFTs
        };
        return res.status(200).json({ result });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    },
    fetchRandomNFTsInCollection: async (req: ExpressRequestType, res: ExpressResponseType) => {
      try {
        const { query, params } = pick(req, ["params", "query"]);
        const result = await NFTsDAO.getAllNFTs({
          where: { chainId: params.chainId, collection: params.collection },
          limit: parseInt((query.limit as string) || "4"),
          order: NFTsDAO.ORM.random()
        });
        return res.status(200).json({ result });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    },
    fetchSingleNFT: async (req: ExpressRequestType, res: ExpressResponseType) => {
      try {
        const { params } = pick(req, ["params"]);
        const result = await NFTsDAO.getSingleNFT({
          tokenId: parseInt(params.tokenId),
          chainId: params.chainId,
          collection: params.collection
        });
        return res.status(200).json({ result });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  }
);
