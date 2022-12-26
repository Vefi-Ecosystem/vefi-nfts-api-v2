import { DataTypes, FindOptions } from "sequelize";
import { v4 } from "uuid";
import { isAddress } from "@ethersproject/address";
import { constructEntity, bindEntityToHelpers } from "../../../shared/db";

const eventEntity = constructEntity("CollectionEvent", {
  id: { type: DataTypes.UUID, primaryKey: true },
  eventType: {
    type: DataTypes.ENUM("Mint", "Ownership_Transferred", "Burn", "Transfer", "Approval_For_All"),
    validate: {
      isIn: {
        msg: "Invalid event type",
        args: [["Mint", "Ownership_Transferred", "Burn", "Transfer", "Approval_For_All"]]
      }
    }
  },
  from: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEthereumAddress(val: string) {
        if (!isAddress(val)) throw new Error(`${val} is not a valid Ethereum address`);
      }
    }
  },
  timestamp: { type: DataTypes.BIGINT, allowNull: false },
  transactionHash: { type: DataTypes.STRING, allowNull: false },
  eventData: { type: DataTypes.JSON, allowNull: false },
  collection: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEthereumAddress(val: string) {
        if (!isAddress(val)) throw new Error(`${val} is not a valid Ethereum address`);
      }
    }
  },
  tokenId: { type: DataTypes.BIGINT, allowNull: true },
  chainId: { type: DataTypes.STRING, allowNull: false }
});

export default bindEntityToHelpers(eventEntity, {
  addEventToDB: (
    eventType: "Mint" | "Ownership_Transferred" | "Burn" | "Transfer" | "Approval_For_All",
    from: string,
    timestamp: number,
    transactionHash: string,
    eventData: object,
    collection: string,
    tokenId: number | null,
    chainId: string
  ) => {
    return new Promise((resolve, reject) => {
      eventEntity
        .create({
          id: v4(),
          eventType,
          from,
          timestamp,
          transactionHash,
          eventData,
          collection,
          tokenId,
          chainId
        })
        .then(model => resolve(model.toJSON()))
        .catch(reject);
    });
  },
  getAllCollectionEvents: (collection: string, chainId: string, opts?: FindOptions) => {
    return new Promise((resolve, reject) => {
      eventEntity
        .findAll({ ...(!!opts && opts), where: { collection, chainId } })
        .then(models => resolve(models.map(model => model.toJSON())))
        .catch(reject);
    });
  },
  getAllNFTEvents: (tokenId: string, collection: string, chainId: string, opts?: FindOptions) => {
    return new Promise((resolve, reject) => {
      eventEntity
        .findAll({ ...(!!opts && opts), where: { tokenId, collection, chainId } })
        .then(models => resolve(models.map(model => model.toJSON())))
        .catch(reject);
    });
  }
});
