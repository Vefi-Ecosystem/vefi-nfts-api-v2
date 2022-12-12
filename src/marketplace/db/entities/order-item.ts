import { CountOptions, DataTypes, FindOptions, UpdateOptions } from "sequelize";
import { v4 } from "uuid";
import { isAddress } from "@ethersproject/address";
import { constructEntity, bindEntityToHelpers } from "../../../shared/db";

const orderItemEntity = constructEntity("OrderItem", {
  id: { type: DataTypes.UUID, primaryKey: true },
  offerId: { type: DataTypes.STRING, allowNull: false },
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

export default bindEntityToHelpers(orderItemEntity, {
  addOrderItemToDB: (
    chainId: string,
    offerId: string,
    creator: string,
    collection: string,
    tokenId: number,
    endsIn: number
  ) => {
    return new Promise((resolve, reject) => {
      orderItemEntity
        .create({ id: v4(), chainId, offerId, creator, collection, tokenId, endsIn })
        .then(model => resolve(model.toJSON()))
        .catch(reject);
    });
  },
  getAllOrderItems: (opts?: FindOptions) => {
    return new Promise((resolve, reject) => {
      orderItemEntity
        .findAll(opts)
        .then(models => resolve(models.map(model => model.toJSON())))
        .catch(reject);
    });
  },
  getSingleOrderItem: (opts: FindOptions) => {
    return new Promise((resolve, reject) => {
      orderItemEntity
        .findOne(opts)
        .then(model => resolve(model?.toJSON()))
        .catch(reject);
    });
  },
  countOrderItems: (opts?: CountOptions) => {
    return new Promise((resolve, reject) => {
      orderItemEntity.count(opts).then(resolve).catch(reject);
    });
  },
  updateOrderItem: (update: any, opts: UpdateOptions) => {
    return new Promise((resolve, reject) => {
      orderItemEntity
        .update(update, { ...opts, returning: true })
        .then(resolve)
        .catch(reject);
    });
  }
});
