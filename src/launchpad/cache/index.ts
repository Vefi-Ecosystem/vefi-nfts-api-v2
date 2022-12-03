import { cacheItem, itemExists, getItem } from "../../shared/cache";

const cacheKeyPrefix = "redis::cache";

export async function propagateLastBlockNumberForLaunchpad(
  launchpad: string,
  chainId: string,
  blockNumber: string
): Promise<void> {
  try {
    const key = cacheKeyPrefix.concat(`::launchpad::${launchpad}::${chainId}`);
    await cacheItem(key, blockNumber);
  } catch (error: any) {
    return Promise.reject(error);
  }
}

export async function getLastBlockNumberForLaunchpad(launchpad: string, chainId: string): Promise<number> {
  try {
    const key = cacheKeyPrefix.concat(`::launchpad::${launchpad}::${chainId}`);
    const exists = await itemExists(key);
    const lastBlock = exists ? parseInt((await getItem(key)) as string) : 0;
    return Promise.resolve(lastBlock);
  } catch (error: any) {
    return Promise.reject(error);
  }
}
