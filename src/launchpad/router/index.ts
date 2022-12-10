import { Router } from "express";
import controllers from "../controllers";

const router = Router();

router.get("/all", controllers.fetchAllLaunchItems);
router.get("/:chainId/:launchId", controllers.fetchSingleLaunchItem);
router.get("/items/byStatus/:status", controllers.fetchItemsByStatus);

export default router;
