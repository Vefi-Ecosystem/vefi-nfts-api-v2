import { CountOptions, DataTypes, FindOptions } from "sequelize";
import { v4 } from "uuid";
import { isAddress } from "@ethersproject/address";
import { constructEntity, bindEntityToHelpers } from "../../../shared/db";

const nftEntity = constructEntity("NFT", {
  id: { type: DataTypes.UUID, primaryKey: true },
  tokenId: { type: DataTypes.BIGINT, allowNull: false },
  collection: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEthereumAddress(val: string) {
        if (!isAddress(val)) throw new Error(`${val} is not a valid Ethereum address`);
      }
    }
  },
  tokenURI: { type: DataTypes.STRING, allowNull: false },
  owner: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEthereumAddress(val: string) {
        if (!isAddress(val)) throw new Error(`${val} is not a valid Ethereum address`);
      }
    }
  },
  chainId: { type: DataTypes.STRING, allowNull: false }
});

export default bindEntityToHelpers(nftEntity, {
  addTokenToDB: (tokenId: number, collection: string, tokenURI: string, owner: string, chainId: string) => {
    return new Promise((resolve, reject) => {
      nftEntity
        .create({ id: v4(), tokenId, collection, tokenURI, owner, chainId })
        .then(model => resolve(model.toJSON()))
        .catch(reject);
    });
  },
  getAllNFTs: (opts?: FindOptions) => {
    return new Promise((resolve, reject) => {
      nftEntity
        .findAll(opts)
        .then(models => resolve(models.map(model => model.toJSON())))
        .catch(reject);
    });
  },
  getSingleNFT: (opts: FindOptions) => {
    return new Promise((resolve, reject) => {
      nftEntity
        .findOne(opts)
        .then(model => resolve(model?.toJSON()))
        .catch(reject);
    });
  },
  reflectOwnershipTransferInDB: (collection: string, tokenId: number, newOwner: string, chainId: string) => {
    return new Promise((resolve, reject) => {
      nftEntity
        .update({ owner: newOwner }, { where: { collection, tokenId, chainId } })
        .then(([affected]) => resolve(affected))
        .catch(reject);
    });
  },
  removeNFTFromDB: (collection: string, tokenId: number, chainId: string) => {
    return new Promise((resolve, reject) => {
      nftEntity.destroy({ where: { collection, tokenId, chainId } }).then(resolve).catch(reject);
    });
  },
  countAllNFTs: (opts?: CountOptions) => {
    return new Promise((resolve, reject) => {
      nftEntity.count(opts).then(resolve).catch(reject);
    });
  }
});
