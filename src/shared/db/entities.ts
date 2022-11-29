import { Sequelize, Model, ModelAttributes, ModelOptions, ModelStatic } from "sequelize";
import { ary, merge } from "lodash";
import { DB_URI } from "../environment";

type ModelHelperFunctions = {
  [name: string]: (...args: any[]) => Promise<any>;
};

const sequelize = new Sequelize(DB_URI, { dialect: "postgres", define: { underscored: true } });

export const constructEntity = (
  name: string,
  def: ModelAttributes<Model<any, any>, any>,
  opts?: ModelOptions<Model<any, any>>
): ModelStatic<Model<any, any>> =>
  ary(
    (name: string, def: ModelAttributes<Model<any, any>, any>, opts?: ModelOptions<Model<any, any>>) =>
      sequelize.define(name, def, opts),
    3
  )(name, def, opts);

export const bindEntityToHelpers = (entity: ModelStatic<Model<any, any>>, hlprs: ModelHelperFunctions) =>
  merge(entity, { ...hlprs }, { ORM: sequelize });
