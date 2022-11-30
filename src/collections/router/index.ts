import { Router } from "express";
import controllers from "../controllers";

const router = Router();

router.get("/all", controllers.fetchAllCollections);
router.get("/:chainId/:address", controllers.fetchSingleCollection);
router.get("/:chainId/:collection/nfts", controllers.fetchAllNFTsInCollection);
router.get("/:chainId/:collection/nfts/random", controllers.fetchRandomNFTsInCollection);
router.get("/:chainId/:collection/nft/:tokenId", controllers.fetchSingleNFT);
router.get("/:chainId/:collection/events", controllers.fetchAllCollectionEvents);

export default router;
