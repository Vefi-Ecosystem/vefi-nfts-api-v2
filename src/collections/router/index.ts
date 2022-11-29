import { Router } from "express";
import controllers from "../controllers";

const router = Router();

router.get("/all", controllers.fetchAllCollections);
router.get("/:chainId/:address", controllers.fetchSingleCollection);

export default router;
