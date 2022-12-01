import { CountOptions, DataTypes, FindOptions } from "sequelize";
import { v4 } from "uuid";
import { isAddress } from "@ethersproject/address";
import { constructEntity, bindEntityToHelpers } from "../../../shared/db";

const launchItemEntity = constructEntity("LaunchItem", {
  id: { type: DataTypes.UUID, primaryKey: true },
  launchId: { type: DataTypes.STRING, allowNull: false },
  collection: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEthereumAddress(val: string) {
        if (!isAddress(val)) throw new Error(`${val} is not a valid Ethereum address`);
      }
    }
  },
  launchStartTime: { type: DataTypes.BIGINT, allowNull: false },
  launchEndTime: { type: DataTypes.BIGINT, allowNull: false },
  pricePerItem: { type: DataTypes.BIGINT, allowNull: false },
  chainId: { type: DataTypes.STRING, allowNull: false }
});

export default bindEntityToHelpers(launchItemEntity, {
  addLaunchItemToDB: (
    chainId: string,
    launchId: string,
    collection: string,
    launchStartTime: number,
    launchEndTime: number,
    pricePerItem: number
  ) => {
    return new Promise((resolve, reject) => {
      launchItemEntity
        .create({ id: v4(), chainId, launchId, collection, launchStartTime, launchEndTime, pricePerItem })
        .then(model => resolve(model.toJSON()))
        .catch(reject);
    });
  },
  getSingleLaunchItem: (opts: FindOptions) => {
    return new Promise((resolve, reject) => {
      launchItemEntity
        .findOne(opts)
        .then(model => resolve(model?.toJSON()))
        .catch(reject);
    });
  }
});
