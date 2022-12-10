import { ary, forEach, multiply } from "lodash";
import { Interface } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { hexValue } from "@ethersproject/bytes";
import { id as hashId } from "@ethersproject/hash";
import { JsonRpcProvider } from "@ethersproject/providers";
import { abi as launchpadAbi } from "vefi-nfts-v2/artifacts/contracts/Launchpad.sol/Launchpad.json";
import { LaunchpadDAO } from "../../db/entities";
import logger from "../../../shared/log";
import chains from "../../../shared/supportedChains.json";
import { NODE_ENV } from "../../../shared/environment";
import launchpad from "../../assets/launchpad.json";
import { propagateLastBlockNumberForLaunchpad, getLastBlockNumberForLaunchpad } from "../../cache";

const chain = (NODE_ENV !== "production" ? chains["testnet"] : chains["mainnet"]) as any;
const launchpadInterface = new Interface(launchpadAbi);

// Event hash
const launchItemCreatedHash = hashId("LaunchItemCreated(bytes32,address,string[],uint256,uint256,uint256)");

const handleLaunchItemCreatedEvent = ary((chainId: string, launchpad: string) => async (log: any) => {
  try {
    const { args } = launchpadInterface.parseLog(log);
    const [launchId, collection, , startTime, endTime, price] = args;
    const launchItem = await LaunchpadDAO.addLaunchItemToDB(
      chainId,
      launchId,
      collection,
      multiply(parseInt(BigNumber.from(startTime).toHexString()), 1000),
      multiply(parseInt(BigNumber.from(endTime).toHexString()), 1000),
      parseInt(BigNumber.from(price).toHexString())
    );
    logger("New launch item created: %s", JSON.stringify(launchItem));
    await propagateLastBlockNumberForLaunchpad(launchpad, chainId, log.blockNumber);
  } catch (error: any) {
    logger(error.message);
  }
});

export const watchLaunchpad = ary((chainId: string) => {
  const chainIdInt = parseInt(chainId);
  const url = chain[chainIdInt as unknown as keyof typeof chain]?.rpcUrl;
  const address = launchpad[chainIdInt as unknown as keyof typeof launchpad];

  if (!!url && !!address) {
    const provider = new JsonRpcProvider(url, chainIdInt);
    provider.on(
      { address, topics: [launchItemCreatedHash] },
      handleLaunchItemCreatedEvent(hexValue(chainIdInt), address)
    );
    logger("Now watching launchpad: %s", address);
  }
});

export const propagatePastLaunchpadEvents = ary((chainId: string) => {
  async () => {
    try {
      const chainIdInt = parseInt(chainId);
      const url = chain[chainIdInt as unknown as keyof typeof chain]?.rpcUrl;
      const address = launchpad[chainIdInt as unknown as keyof typeof launchpad];

      if (!!url && !!address) {
        const provider = new JsonRpcProvider(url, chainIdInt);
        const latestBlock = await provider.getBlockNumber();
        let lastLaunchpadBlock = await getLastBlockNumberForLaunchpad(address, hexValue(chainIdInt));

        if (lastLaunchpadBlock === 0) {
          lastLaunchpadBlock = latestBlock - 1;
          await propagateLastBlockNumberForLaunchpad(address, hexValue(chainIdInt), hexValue(latestBlock));
        }

        const logs = await provider.getLogs({
          fromBlock: hexValue(lastLaunchpadBlock),
          toBlock: hexValue(latestBlock),
          topics: [launchItemCreatedHash],
          address
        });

        forEach(logs, log => {
          (async () => {
            await handleLaunchItemCreatedEvent(hexValue(chainIdInt), address)(log);
          })();
        });
      }
    } catch (error: any) {
      logger(error.message);
    }
  };
}, 1);
