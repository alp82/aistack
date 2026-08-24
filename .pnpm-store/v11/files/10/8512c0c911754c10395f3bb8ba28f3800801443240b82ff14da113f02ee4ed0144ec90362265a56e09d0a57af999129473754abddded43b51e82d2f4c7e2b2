import { type DriverFactory } from "./utils/index.mjs";
import { type Collection, type MongoClientOptions } from "mongodb";
export interface MongoDbOptions {
	/**
	* The MongoDB connection string.
	*/
	connectionString: string;
	/**
	* Optional configuration settings for the MongoClient instance.
	*/
	clientOptions?: MongoClientOptions;
	/**
	* The name of the database to use.
	* @default "unstorage"
	*/
	databaseName?: string;
	/**
	* The name of the collection to use.
	* @default "unstorage"
	*/
	collectionName?: string;
}
declare const driver: DriverFactory<MongoDbOptions, Collection>;
export default driver;
