import { createClient } from "redis";

const client = createClient();

export const initConnection = () => client.connect();

export const closeConnection = () => client.disconnect();

export const cacheItem = (key: string, item: any, expiresIn = 0) => {
  return new Promise<string | null>((resolve, reject) => {
    client
      .set(key, typeof item === "string" ? item : JSON.stringify(item))
      .then(val => {
        if (expiresIn > 0) {
          client
            .expire(key, expiresIn * 60)
            .then(() => {
              resolve(val);
            })
            .catch(reject);
        } else {
          resolve(val);
        }
      })
      .catch(reject);
  });
};

export const getItem = (key: string) => {
  return new Promise<string | null>((resolve, reject) => {
    client.get(key).then(resolve).catch(reject);
  });
};

export const itemExists = (key: string) => {
  return new Promise<boolean>((resolve, reject) => {
    client
      .exists(key)
      .then(val => resolve(val === 1))
      .catch(reject);
  });
};
