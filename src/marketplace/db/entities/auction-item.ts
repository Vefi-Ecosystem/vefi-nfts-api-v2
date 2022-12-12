import { CountOptions, DataTypes, FindOptions, UpdateOptions } from "sequelize";
import { v4 } from "uuid";
import { isAddress } from "@ethersproject/address";
import { constructEntity, bindEntityToHelpers } from "../../../shared/db";

const auctionItemEntity = constructEntity("AuctionItem", {
  id: { type: DataTypes.UUID, primaryKey: true },
  auctionId: { type: DataTypes.STRING, allowNull: false },
  creator: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEthereumAddress(val: string) {
        if (!isAddress(val)) throw new Error(`${val} is not a valid Ethereum address`);
      }
    }
  },
  collection: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEthereumAddress(val: string) {
        if (!isAddress(val)) throw new Error(`${val} is not a valid Ethereum address`);
      }
    }
  },
  tokenId: { type: DataTypes.BIGINT, allowNull: false },
  endsIn: { type: DataTypes.BIGINT, allowNull: false },
  chainId: { type: DataTypes.STRING, allowNull: false },
  status: {
    type: DataTypes.ENUM("ONGOING", "CANCELLED", "FINALIZED"),
    defaultValue: "ONGOING",
    validate: {
      isIn: {
        msg: "Invald status",
        args: [["ONGOING", "CANCELLED", "FINALIZED"]]
      }
    }
  }
});

export default bindEntityToHelpers(auctionItemEntity, {
  addAuctionItemToDB: (
    chainId: string,
    auctionId: string,
    creator: string,
    collection: string,
    tokenId: number,
    endsIn: number
  ) => {
    return new Promise((resolve, reject) => {
      auctionItemEntity
        .create({ id: v4(), chainId, auctionId, creator, collection, tokenId, endsIn })
        .then(model => resolve(model.toJSON()))
        .catch(reject);
    });
  },
  getAllAuctionItems: (opts?: FindOptions) => {
    return new Promise((resolve, reject) => {
      auctionItemEntity
        .findAll(opts)
        .then(models => resolve(models.map(model => model.toJSON())))
        .catch(reject);
    });
  },
  getSingleAuctionItem: (opts: FindOptions) => {
    return new Promise((resolve, reject) => {
      auctionItemEntity
        .findOne(opts)
        .then(model => resolve(model?.toJSON()))
        .catch(reject);
    });
  },
  countAuctionItems: (opts?: CountOptions) => {
    return new Promise((resolve, reject) => {
      auctionItemEntity.count(opts).then(resolve).catch(reject);
    });
  },
  updateAuctionItem: (update: any, opts: UpdateOptions) => {
    return new Promise((resolve, reject) => {
      auctionItemEntity
        .update(update, { ...opts, returning: true })
        .then(resolve)
        .catch(reject);
    });
  }
});
