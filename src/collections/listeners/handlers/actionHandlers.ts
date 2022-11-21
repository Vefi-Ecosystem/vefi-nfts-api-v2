import { ary } from "lodash";
import { Interface } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { id as hashId } from "@ethersproject/hash";
import { JsonRpcProvider } from "@ethersproject/providers";
import { abi as actionAbi } from "vefi-nfts-v2/artifacts/contracts/Actions.sol/Actions.json";
import { CollectionDAO } from "../../db/entities";
import logger from "../../../shared/log";
import chains from "../../../shared/supportedChains.json";
import { NODE_ENV } from "../../../shared/environment";
import actions from "../../assets/actions.json";

const chain = (NODE_ENV !== "production" ? chains["testnet"] : chains["mainnet"]) as any;
const actionsInterface = new Interface(actionAbi);

// Event hash
const collectionDeployedHash = hashId("CollectionDeployed(address,string,string,address,uint256,string)");

const handleCollectionDeployedEvent = ary(
  (chainId: string) => async (log: any) => {
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
    } catch (error: any) {
      logger(error.message);
    }
  },
  1
);

export const watchActions = ary((chainId: string) => {
  const chainIdInt = parseInt(chainId);
  const url = chain[chainIdInt as unknown as keyof typeof chain].rpcUrl;
  const address = actions[chainIdInt as unknown as keyof typeof actions];
  const provider = new JsonRpcProvider(url, chainIdInt);

  provider.on({ address, topics: [collectionDeployedHash] }, handleCollectionDeployedEvent(chainId));
});
