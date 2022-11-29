import { ary, forEach } from "lodash";
import { Interface } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { hexValue } from "@ethersproject/bytes";
import { id as hashId } from "@ethersproject/hash";
import { JsonRpcProvider } from "@ethersproject/providers";
import { abi as actionAbi } from "vefi-nfts-v2/artifacts/contracts/Actions.sol/Actions.json";
import { CollectionDAO } from "../../db/entities";
import logger from "../../../shared/log";
import chains from "../../../shared/supportedChains.json";
import { NODE_ENV } from "../../../shared/environment";
import actions from "../../assets/actions.json";
import { getLastBlockNumberForActions, propagateLastBlockNumberForActions } from "../../cache";
import { watchCollection } from "./collectionHandlers";

const chain = (NODE_ENV !== "production" ? chains["testnet"] : chains["mainnet"]) as any;
const actionsInterface = new Interface(actionAbi);

// Event hash
const collectionDeployedHash = hashId("CollectionDeployed(address,string,string,address,uint256,string)");

const handleCollectionDeployedEvent = ary(
  (chainId: string, actions: string) => async (log: any) => {
    try {
      const { args } = actionsInterface.parseLog(log);
      const [address, , , owner, mintStartTime] = args;

      const collectionObj = await CollectionDAO.addCollectionToDB(
        chainId,
        address,
        owner,
        parseInt(BigNumber.from(mintStartTime).toHexString())
      );
      logger("New collection deployed: %s", collectionObj.address);
      watchCollection(chainId, collectionObj.address);
      await propagateLastBlockNumberForActions(actions, chainId, log.blockNumber);
    } catch (error: any) {
      logger(error.message);
    }
  },
  2
);

export const watchActions = ary((chainId: string) => {
  const chainIdInt = parseInt(chainId);
  const url = chain[chainIdInt as unknown as keyof typeof chain]?.rpcUrl;
  const address = actions[chainIdInt as unknown as keyof typeof actions];

  if (!!url && !!address) {
    const provider = new JsonRpcProvider(url, chainIdInt);
    provider.on(
      { address, topics: [collectionDeployedHash] },
      handleCollectionDeployedEvent(hexValue(chainIdInt), address)
    );
    logger("Now watching actions: %s", address);
  }
}, 1);

export const propagatePastActionsEvents = ary((chainId: string) => {
  (async () => {
    try {
      const chainIdInt = parseInt(chainId);
      const url = chain[chainIdInt as unknown as keyof typeof chain]?.rpcUrl;
      const address = actions[chainIdInt as unknown as keyof typeof actions];

      if (!!url && !!address) {
        const provider = new JsonRpcProvider(url, chainIdInt);
        const latestBlock = await provider.getBlockNumber();
        let lastActionBlock = await getLastBlockNumberForActions(address, hexValue(chainIdInt));

        if (lastActionBlock === 0) {
          lastActionBlock = latestBlock;
          await propagateLastBlockNumberForActions(address, hexValue(chainIdInt), hexValue(latestBlock));
        }

        const logs = await provider.getLogs({
          fromBlock: hexValue(lastActionBlock + 1),
          toBlock: hexValue(latestBlock),
          topics: [collectionDeployedHash],
          address
        });

        forEach(logs, log => {
          (async () => {
            await handleCollectionDeployedEvent(hexValue(chainIdInt), address)(log);
          })();
        });
      }
    } catch (error: any) {
      logger(error.message);
    }
  })();
}, 1);
