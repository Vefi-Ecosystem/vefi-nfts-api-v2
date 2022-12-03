import { keys, forEach } from "lodash";
import chains from "../../shared/supportedChains.json";
import { NODE_ENV } from "../../shared/environment";
import logger from "../../shared/log";
import { watchLaunchpad, propagatePastLaunchpadEvents } from "./handlers/launchpadHandlers";

const chain = (NODE_ENV !== "production" ? chains["testnet"] : chains["mainnet"]) as any;

export default () => {
  try {
    const keysInChain = keys(chain);

    forEach(keysInChain, key => {
      watchLaunchpad(key);
      propagatePastLaunchpadEvents(key);
    });
  } catch (error: any) {
    logger(error.message);
  }
};
