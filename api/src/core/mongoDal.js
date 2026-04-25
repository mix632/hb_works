'use strict';

const serverConfig = require('./serverConfig');

let _mongodb = null;
let _mongoClient = null;
let _mongoDb = null;
let _mongoConnectPromise = null;

class MongoDal {
  constructor({ collectionName, primaryKey = '_id', deleteKey = 'deleted' } = {}) {
    this.collectionName = collectionName || '';
    this.primaryKey = primaryKey;
    this.deleteKey = deleteKey;
    this.myConfig = serverConfig;
  }

  static _getMongoLib() {
    if (!_mongodb) {
      _mongodb = require('mongodb');
    }
    return _mongodb;
  }

  static _getMongoOptions(mongodbConfig) {
    const options = {
      maxPoolSize: mongodbConfig.maxPoolSize || 10,
      minPoolSize: mongodbConfig.minPoolSize || 1,
      serverSelectionTimeoutMS: mongodbConfig.serverSelectionTimeoutMS || 5000,
    };
    if (mongodbConfig.authSource) {
      options.authSource = mongodbConfig.authSource;
    }
    return options;
  }

  static async getMongoClient() {
    const mongodbConfig = serverConfig.mongodbConfig || { isUse: false };
    if (!mongodbConfig.isUse) return null;
    if (_mongoClient) return _mongoClient;
    if (_mongoConnectPromise) return _mongoConnectPromise;

    const { MongoClient } = MongoDal._getMongoLib();
    const client = new MongoClient(mongodbConfig.uri, MongoDal._getMongoOptions(mongodbConfig));
    _mongoConnectPromise = client.connect().then((connectedClient) => {
      _mongoClient = connectedClient;
      _mongoDb = connectedClient.db(mongodbConfig.dbName);
      _mongoConnectPromise = null;
      return connectedClient;
    }).catch((err) => {
      _mongoConnectPromise = null;
      throw err;
    });

    return _mongoConnectPromise;
  }

  static async getMongoDb() {
    const mongodbConfig = serverConfig.mongodbConfig || { isUse: false };
    if (!mongodbConfig.isUse) return null;
    if (_mongoDb) return _mongoDb;
    await MongoDal.getMongoClient();
    return _mongoDb;
  }

  static async closeMongo() {
    if (_mongoConnectPromise) {
      try {
        await _mongoConnectPromise;
      } catch (_) {
        return;
      }
    }
    if (_mongoClient) {
      await _mongoClient.close();
      _mongoClient = null;
      _mongoDb = null;
    }
  }

  async _getDb() {
    const db = await MongoDal.getMongoDb();
    if (!db) throw new Error('MongoDB is not enabled');
    return db;
  }

  async _getCollection() {
    if (!this.collectionName) throw new Error('collectionName is required');
    const db = await this._getDb();
    return db.collection(this.collectionName);
  }

  toObjectId(id) {
    const { ObjectId } = MongoDal._getMongoLib();
    if (!id) return null;
    if (id instanceof ObjectId) return id;
    if (!ObjectId.isValid(String(id))) return null;
    return new ObjectId(String(id));
  }

  normalizeId(doc) {
    const { ObjectId } = MongoDal._getMongoLib();
    if (!doc) return doc;
    if (doc._id instanceof ObjectId) {
      return { ...doc, _id: doc._id.toString() };
    }
    return doc;
  }

  normalizeList(docs) {
    return Array.isArray(docs) ? docs.map(doc => this.normalizeId(doc)) : [];
  }

  async findOne({ id, filter = {}, options = {} } = {}) {
    const collection = await this._getCollection();
    const finalFilter = { ...filter };
    if (id != null && id !== '') {
      const objectId = this.toObjectId(id);
      if (!objectId) return null;
      finalFilter[this.primaryKey] = objectId;
    }
    const doc = await collection.findOne(finalFilter, options);
    return this.normalizeId(doc);
  }

  async find({ filter = {}, pageIndex = 1, onePageCount = 20, sort = { _id: -1 }, options = {} } = {}) {
    const collection = await this._getCollection();
    const skip = Math.max(0, (Math.max(1, pageIndex) - 1) * Math.max(1, onePageCount));
    const limit = Math.max(1, onePageCount);
    const docs = await collection.find(filter, options).sort(sort).skip(skip).limit(limit).toArray();
    return this.normalizeList(docs);
  }

  async count({ filter = {} } = {}) {
    const collection = await this._getCollection();
    return collection.countDocuments(filter);
  }

  async insertOne({ model = {} } = {}) {
    const collection = await this._getCollection();
    const now = new Date();
    const payload = { ...model };
    if (!payload.created_at) payload.created_at = now;
    payload.updated_at = now;
    if (this.deleteKey && payload[this.deleteKey] == null) payload[this.deleteKey] = false;
    const result = await collection.insertOne(payload);
    return result.insertedId ? result.insertedId.toString() : '';
  }

  async updateOne({ id, values = {}, filter = {} } = {}) {
    const collection = await this._getCollection();
    const finalFilter = { ...filter };
    if (id != null && id !== '') {
      const objectId = this.toObjectId(id);
      if (!objectId) return 0;
      finalFilter[this.primaryKey] = objectId;
    }
    if (!Object.keys(finalFilter).length) {
      throw new Error('updateOne requires id or filter');
    }
    const payload = { ...values, updated_at: new Date() };
    delete payload._id;
    const result = await collection.updateOne(finalFilter, { $set: payload });
    return result.modifiedCount || 0;
  }

  async deleteOne({ id, filter = {}, hardDelete = false } = {}) {
    const collection = await this._getCollection();
    const finalFilter = { ...filter };
    if (id != null && id !== '') {
      const objectId = this.toObjectId(id);
      if (!objectId) return 0;
      finalFilter[this.primaryKey] = objectId;
    }
    if (!Object.keys(finalFilter).length) {
      throw new Error('deleteOne requires id or filter');
    }
    if (hardDelete || !this.deleteKey) {
      const result = await collection.deleteOne(finalFilter);
      return result.deletedCount || 0;
    }
    const result = await collection.updateOne(finalFilter, {
      $set: {
        [this.deleteKey]: true,
        updated_at: new Date(),
      },
    });
    return result.modifiedCount || 0;
  }
}

module.exports = MongoDal;
