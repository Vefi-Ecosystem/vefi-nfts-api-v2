import { forEach } from "lodash";
import * as entities from "./entities";
import log from "../../shared/log";

export default () => {
  forEach(entities, model => {
    model.sync().then(m => {
      log("Syncing table %s from model %s", model.tableName, model.name);
    });
  });
};
