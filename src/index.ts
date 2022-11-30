import express, { Router } from "express";
import morgan from "morgan";
import { listenForCollectionIntrinsicEvents, collectionsRouter, syncAllCollectionEntitiesInDB } from "./collections";
import log from "./shared/log";
import { initConnection as initRedisConnection } from "./shared/cache";

const router = Router();

router.use("/collections", collectionsRouter);

const app = express();
const port = parseInt(process.env.PORT || "55019");

app.use(express.json());
app.use(morgan("combined"));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  next();
});
app.use("/api", router);

app.listen(port, () => {
  initRedisConnection();

  syncAllCollectionEntitiesInDB();
  listenForCollectionIntrinsicEvents();

  log("App is now running on port %d", port);
});
