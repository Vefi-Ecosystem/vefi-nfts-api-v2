import { DataTypes, FindOptions } from "sequelize";
import { v4 } from "uuid";
import { isAddress } from "@ethersproject/address";
import { constructEntity, bindEntityToHelpers } from "../../../shared/db";

const collectionEntity = constructEntity("Collection", {
  id: { type: DataTypes.UUID, primaryKey: true },
  chainId: { type: DataTypes.STRING, allowNull: false },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEthereumAddress(val: string) {
        if (!isAddress(val)) throw new Error(`${val} is not a valid Ethereum address`);
      }
    }
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEthereumAddress(val: string) {
        if (!isAddress(val)) throw new Error(`${val} is not a valid Ethereum address`);
      }
    }
  },
  mintStartTime: { type: DataTypes.BIGINT, allowNull: false }
});

export default bindEntityToHelpers(collectionEntity, {
  addCollectionToDB: (chainId: string, address: string, owner: string, mintStartTime: number) => {
    return new Promise((resolve, reject) => {
      collectionEntity
        .create({ id: v4(), chainId, address, owner, mintStartTime })
        .then(entity => resolve(entity.toJSON()))
        .catch(reject);
    });
  },
  reflectOwnershipTransferInDB: (address: string, newOwner: string, chainId: string) => {
    return new Promise((resolve, reject) => {
      collectionEntity
        .update({ owner: newOwner }, { where: { address, chainId } })
        .then(([affected]) => resolve(affected))
        .catch(reject);
    });
  },
  getAllCollections: (opts?: FindOptions) => {
    return new Promise((resolve, reject) => {
      collectionEntity
        .findAll(opts)
        .then(models => resolve(models.map(model => model.toJSON())))
        .catch(reject);
    });
  },
  getSingleCollection: (opts: FindOptions) => {
    return new Promise((resolve, reject) => {
      collectionEntity
        .findOne(opts)
        .then(model => resolve(model?.toJSON()))
        .catch(reject);
    });
  }
});
