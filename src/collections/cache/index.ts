import { cacheItem, itemExists, getItem } from "../../shared/cache";

const cacheKeyPrefix = "redis::cache";

export async function propagateLastBlockNumberForCollection(
  collection: string,
  chainId: string,
  blockNumber: string
): Promise<void> {
  try {
    const key = cacheKeyPrefix.concat(`::collections::${collection}::${chainId}`);
    await cacheItem(key, blockNumber);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberForCollection(collection: string, chainId: string): Promise<number> {
  try {
    const key = cacheKeyPrefix.concat(`::collections::${collection}::${chainId}`);
    const exists = await itemExists(key);
    const lastBlock = exists ? parseInt((await getItem(key)) as string) : 0;
    return Promise.resolve(lastBlock);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function propagateLastBlockNumberForActions(
  actions: string,
  chainId: string,
  blockNumber: string
): Promise<void> {
  try {
    const key = cacheKeyPrefix.concat(`::actions::${actions}::${chainId}`);
    await cacheItem(key, blockNumber);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberForActions(actions: string, chainId: string): Promise<number> {
  try {
    const key = cacheKeyPrefix.concat(`::actions::${actions}::${chainId}`);
    const exists = await itemExists(key);
    const lastBlock = exists ? parseInt((await getItem(key)) as string) : 0;
    return Promise.resolve(lastBlock);
  } catch (error: any) {
    return Promise.reject(error);
  }
}
