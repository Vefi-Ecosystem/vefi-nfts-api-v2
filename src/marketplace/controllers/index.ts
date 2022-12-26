import type { Request as ExpressRequestType, Response as ExpressResponseType } from "express";
import { assign, pick, subtract } from "lodash";
import { OfferItemDAO, AuctionItemDAO } from "../db/entities";

export default assign(
  {},
  {
    fetchAllOffersForNFT: async (req: ExpressRequestType, res: ExpressResponseType) => {
      try {
        const { query, params } = pick(req, ["query", "params"]);
        const totalNumberOfOffers = await OfferItemDAO.countOrderItems({
          where: { tokenId: parseInt(params.tokenId), chainId: params.chainId, collection: params.collection }
        });
        const paginatedOffers = await OfferItemDAO.getAllOrderItems({
          where: { tokenId: parseInt(params.tokenId), chainId: params.chainId, collection: params.collection },
          limit: 30,
          offset: query.page ? subtract(parseInt(query.page as string), 1) * 30 : 0
        });
        const result = {
          items: paginatedOffers,
          itemsCount: totalNumberOfOffers
        };
        return res.status(200).json({ result });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    },
    fetchAllAuctions: async (req: ExpressRequestType, res: ExpressResponseType) => {
      try {
        const { query } = pick(req, ["query"]);
        const opts = !query.chain || query.chain === "all" ? undefined : { where: { chainId: query.chain } };
        const totalNumberOfAuctions = await AuctionItemDAO.countAuctionItems(opts);
        const paginatedAuctions = await AuctionItemDAO.getAllAuctionItems({
          ...(!!opts && opts),
          limit: 30,
          offset: query.page ? subtract(parseInt(query.page as string), 1) * 30 : 0
        });
        const result = {
          items: paginatedAuctions,
          itemsCount: totalNumberOfAuctions
        };
        return res.status(200).json({ result });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    },
    fetchAllAuctionsInCollection: async (req: ExpressRequestType, res: ExpressResponseType) => {
      try {
        const { query, params } = pick(req, ["params", "query"]);
        const totalNumberOfAuctions = await AuctionItemDAO.countAuctionItems({
          where: { collection: params.collection }
        });
        const paginatedAuctions = await AuctionItemDAO.getAllAuctionItems({
          where: { collection: params.collection },
          limit: 30,
          offset: query.page ? subtract(parseInt(query.page as string), 1) * 30 : 0
        });
        const result = {
          items: paginatedAuctions,
          itemsCount: totalNumberOfAuctions
        };
        return res.status(200).json({ result });
      } catch (error: any) {
        return res.status(500).json({ error: error.message });
      }
    }
  }
);
