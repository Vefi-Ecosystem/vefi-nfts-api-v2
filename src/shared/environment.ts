import { config } from "dotenv";

config();

export const DB_URI = process.env.DB_URI as string;
export const NODE_ENV = process.env.NODE_ENV as string;
