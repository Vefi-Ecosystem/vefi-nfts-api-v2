import { ary, forEach, multiply } from "lodash";
import { Interface } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { hexValue } from "@ethersproject/bytes";
import { AddressZero } from "@ethersproject/constants";
import { id as hashId } from "@ethersproject/hash";
import { JsonRpcProvider } from "@ethersproject/providers";
import { abi as collectionAbi } from "vefi-nfts-v2/artifacts/contracts/Collection.sol/Collection.json";
import { EventsDAO, CollectionDAO, NFTsDAO } from "../../db/entities";
import logger from "../../../shared/log";
import chains from "../../../shared/supportedChains.json";
import { NODE_ENV } from "../../../shared/environment";
import { getLastBlockNumberForCollection, propagateLastBlockNumberForCollection } from "../../cache";

const chain = (NODE_ENV !== "production" ? chains["testnet"] : chains["mainnet"]) as any;
const collectionInteface = new Interface(collectionAbi);

// Events hash
const transferEventHash = hashId("Transfer(address,address,uint256)");
const ownershipTransferredHash = hashId("OwnershipTransferred(address,address)");
const approvalForAllHash = hashId("ApprovalForAll(address,address,bool)");

const handleTransferEvent = ary(
  (chainId: string, collection: string) => async (log: any) => {
    try {
      const { args } = collectionInteface.parseLog(log);
      const [from, to, tokenId] = args;

      const chainIdInt = parseInt(chainId);
      const url = chain[chainIdInt as unknown as keyof typeof chain].rpcUrl;
      const provider = new JsonRpcProvider(url, chainIdInt);
      const tokenURICall = await provider.call({
        to: collection,
        data: collectionInteface.encodeFunctionData("tokenURI", [BigNumber.from(tokenId).toHexString()])
      });
      const txReceipt = await provider.getTransactionReceipt(log.transactionHash);
      const block = await provider.getBlock(txReceipt.blockHash);

      if (from === AddressZero) {
        logger("New token minted on %s", collection);
        const nft = await NFTsDAO.addTokenToDB(
          parseInt(BigNumber.from(tokenId).toHexString()),
          collection,
          collectionInteface.decodeFunctionResult("tokenURI", tokenURICall)[0],
          to,
          chainId
        );
        const event = await EventsDAO.addEventToDB(
          "Mint",
          txReceipt.from,
          multiply(block.timestamp, 1000),
          log.transactionHash,
          { from, to, tokenId: parseInt(BigNumber.from(tokenId).toHexString()) },
          collection,
          parseInt(BigNumber.from(tokenId).toHexString()),
          chainId
        );

        logger("New NFT added to DB: %s", JSON.stringify(nft));
        logger("New event added to DB: %s", JSON.stringify(event));
      } else if (to === AddressZero) {
        logger("Token with ID %d burnt on %s", parseInt(BigNumber.from(tokenId).toHexString()), collection);
        await NFTsDAO.removeNFTFromDB(collection, parseInt(BigNumber.from(tokenId).toHexString()), chainId);
        const event = await EventsDAO.addEventToDB(
          "Burn",
          txReceipt.from,
          multiply(block.timestamp, 1000),
          log.transactionHash,
          { from, to, tokenId: parseInt(BigNumber.from(tokenId).toHexString()) },
          collection,
          parseInt(BigNumber.from(tokenId).toHexString()),
          chainId
        );
        logger("New event added to DB: %s", JSON.stringify(event));
      } else {
        logger("New token transfer on %s", collection);
        await NFTsDAO.reflectOwnershipTransferInDB(
          collection,
          parseInt(BigNumber.from(tokenId).toHexString()),
          to,
          chainId
        );
        const event = await EventsDAO.addEventToDB(
          "Transfer",
          txReceipt.from,
          multiply(block.timestamp, 1000),
          log.transactionHash,
          { from, to, tokenId: parseInt(BigNumber.from(tokenId).toHexString()) },
          collection,
          parseInt(BigNumber.from(tokenId).toHexString()),
          chainId
        );
        logger("New event added to DB: %s", JSON.stringify(event));
      }

      await propagateLastBlockNumberForCollection(collection, chainId, log.blockNumber);
    } catch (error: any) {
      logger(error.message);
    }
  },
  2
);

const handleOwnershipTransferEvent = ary(
  (chainId: string, collection: string) => async (log: any) => {
    try {
      const { args } = collectionInteface.parseLog(log);
      const [previousOwner, newOwner] = args;
      const chainIdInt = parseInt(chainId);
      const url = chain[chainIdInt as unknown as keyof typeof chain].rpcUrl;
      const provider = new JsonRpcProvider(url, chainIdInt);
      const txReceipt = await provider.getTransactionReceipt(log.transactionHash);
      const block = await provider.getBlock(txReceipt.blockHash);

      await CollectionDAO.reflectOwnershipTransferInDB(collection, newOwner, chainId);

      const event = await EventsDAO.addEventToDB(
        "Ownership_Transferred",
        txReceipt.from,
        multiply(block.timestamp, 1000),
        log.transactionHash,
        { previousOwner, newOwner },
        collection,
        null,
        chainId
      );

      logger("New owner for collection: %d", collection);
      logger("New event added to DB: %s", JSON.stringify(event));

      await propagateLastBlockNumberForCollection(collection, chainId, log.blockNumber);
    } catch (error: any) {
      logger(error.message);
    }
  },
  2
);

const handleApprovalForAllEvent = ary(
  (chainId: string, collection: string) => async (log: any) => {
    try {
      const { args } = collectionInteface.parseLog(log);
      const [owner, operator, approved] = args;
      const chainIdInt = parseInt(chainId);
      const url = chain[chainIdInt as unknown as keyof typeof chain].rpcUrl;
      const provider = new JsonRpcProvider(url, chainIdInt);
      const txReceipt = await provider.getTransactionReceipt(log.transactionHash);
      const block = await provider.getBlock(txReceipt.blockHash);

      const event = await EventsDAO.addEventToDB(
        "Approval_For_All",
        txReceipt.from,
        multiply(block.timestamp, 1000),
        log.transactionHash,
        { owner, operator, approved },
        collection,
        null,
        chainId
      );

      logger("New event added to DB: %s", JSON.stringify(event));

      await propagateLastBlockNumberForCollection(collection, chainId, log.blockNumber);
    } catch (error: any) {
      logger(error.message);
    }
  },
  2
);

export const watchCollection = ary((chainId: string, address: string) => {
  const chainIdInt = parseInt(chainId);
  const url = chain[chainIdInt as unknown as keyof typeof chain]?.rpcUrl;
  if (!!url) {
    const provider = new JsonRpcProvider(url, chainIdInt);

    provider.on({ address, topics: [transferEventHash] }, handleTransferEvent(hexValue(chainIdInt), address));
    provider.on(
      { address, topics: [ownershipTransferredHash] },
      handleOwnershipTransferEvent(hexValue(chainIdInt), address)
    );
    provider.on({ address, topics: [approvalForAllHash] }, handleApprovalForAllEvent(hexValue(chainIdInt), address));
    logger("Now watching collection: %s", address);
  }
}, 2);

export const propagatePastCollectionEvents = ary((chainId: string) => {
  (async () => {
    try {
      const chainIdInt = parseInt(chainId);
      const url = chain[chainIdInt as unknown as keyof typeof chain].rpcUrl;

      if (!!url) {
        const provider = new JsonRpcProvider(url, chainIdInt);
        const latestBlock = await provider.getBlockNumber();

        const allCollections: Array<any> = await CollectionDAO.getAllCollections({
          where: { chainId: hexValue(chainIdInt) }
        });

        forEach(allCollections, val => {
          (async () => {
            let lastCollectionBlock = await getLastBlockNumberForCollection(val.address, hexValue(chainIdInt));

            if (lastCollectionBlock === 0) {
              lastCollectionBlock = latestBlock - 1;
              await propagateLastBlockNumberForCollection(val.address, hexValue(chainIdInt), hexValue(latestBlock));
            }

            const logs = await provider.getLogs({
              fromBlock: hexValue(lastCollectionBlock),
              toBlock: hexValue(latestBlock),
              address: val.address
            });

            forEach(logs, log => {
              (async () => {
                const { name } = collectionInteface.parseLog(log);

                switch (name) {
                  case "Transfer":
                    await handleTransferEvent(hexValue(chainIdInt), val.address)(log);
                    break;
                  case "OwnershipTransferred":
                    await handleOwnershipTransferEvent(hexValue(chainIdInt), val.address)(log);
                    break;
                  case "ApprovalForAll":
                    await handleApprovalForAllEvent(hexValue(chainIdInt), val.address)(log);
                    break;
                  default:
                    break;
                }
              })();
            });
          })();
          watchCollection(chainId, val.address);
        });
      }
    } catch (error: any) {
      logger(error.message);
    }
  })();
}, 1);
