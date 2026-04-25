'use strict';

const serverConfig = require('./serverConfig');
const { R } = require('./errors');

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
    this.modelType = null;
    this.tableTitle = '';
    this.createDate = 'created_at';
    this.updateDate = 'updated_at';
    this.emptyPrimaryValue = '';
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

  formatModel(model) {
    return model;
  }

  _mapDoc(doc) {
    if (!doc) return null;
    const normalized = this.normalizeId(doc);
    if (!this.modelType || typeof this.modelType.CopyData !== 'function') {
      return normalized;
    }
    return this.modelType.CopyData(this.formatModel(normalized));
  }

  _mapDocs(docs) {
    return Array.isArray(docs) ? docs.map(doc => this._mapDoc(doc)) : [];
  }

  _baseFilter({ isAll = false } = {}) {
    if (isAll || !this.deleteKey) return {};
    return { [this.deleteKey]: false };
  }

  GetModelID({ model }) {
    return model ? model[this.primaryKey] : this.GetEmptyID();
  }

  SetModelID({ model, id }) {
    if (model) model[this.primaryKey] = id;
  }

  IDIsEmpty(id) {
    return !id;
  }

  GetEmptyID() {
    return this.emptyPrimaryValue;
  }

  AddOrUpdate_SetCreateCode({ model }) {
    if (this.createDate && !model[this.createDate]) {
      model[this.createDate] = new Date();
    }
  }

  AddOrUpdate_SetUpdateCode({ model }) {
    if (this.updateDate) {
      model[this.updateDate] = new Date();
    }
  }

  GetSearchFilter({ searchModel, userId, db } = {}) {
    void searchModel;
    void userId;
    void db;
    return {};
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
    if (this.createDate && !payload[this.createDate]) payload[this.createDate] = now;
    if (this.updateDate) payload[this.updateDate] = now;
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
    const payload = { ...values };
    if (this.updateDate) payload[this.updateDate] = new Date();
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
        ...(this.updateDate ? { [this.updateDate]: new Date() } : {}),
      },
    });
    return result.modifiedCount || 0;
  }

  async Get({ id, _id, filter = {}, userId, isLoadDetailed = false, isGetValue = true, isAll = false, db = null } = {}) {
    void userId;
    void isLoadDetailed;
    void isGetValue;
    void db;

    let doc = null;
    const finalFilter = { ...this._baseFilter({ isAll }), ...filter };
    if (id != null && id !== '') {
      doc = await this.findOne({ filter: { ...finalFilter, [this.primaryKey]: id } });
    } else if (_id != null && _id !== '') {
      doc = await this.findOne({ id: _id, filter: finalFilter });
    } else if (Object.keys(finalFilter).length) {
      doc = await this.findOne({ filter: finalFilter });
    }
    return this._mapDoc(doc);
  }

  async GetList({ filter = {}, ids, sort = { _id: -1 }, userId, isLoadDetailed = false, isGetValue = true, isAll = false, db = null } = {}) {
    void userId;
    void isLoadDetailed;
    void isGetValue;
    void db;

    const finalFilter = { ...this._baseFilter({ isAll }), ...filter };
    if (ids && Array.isArray(ids) && ids.length) {
      finalFilter[this.primaryKey] = { $in: ids };
    }
    const docs = await this.find({
      filter: finalFilter,
      pageIndex: 1,
      onePageCount: Math.max(1, Array.isArray(ids) && ids.length ? ids.length : 5000),
      sort,
    });
    return this._mapDocs(docs);
  }

  async Count({ filter = {}, userId, isAll = false, db = null } = {}) {
    void userId;
    void db;
    const finalFilter = { ...this._baseFilter({ isAll }), ...filter };
    return this.count({ filter: finalFilter });
  }

  async GetListForPageIndex({ filter = {}, pageIndex = 0, onePageCount = 30, sort = { _id: -1 }, userId, isLoadDetailed = false, isGetValue = true, isAll = false, db = null } = {}) {
    void userId;
    void isLoadDetailed;
    void isGetValue;
    void db;
    const docs = await this.find({
      filter: { ...this._baseFilter({ isAll }), ...filter },
      pageIndex: pageIndex + 1,
      onePageCount,
      sort,
    });
    return this._mapDocs(docs);
  }

  async AddOrUpdate({ model, isSaveDetailed = false, userId, db = null } = {}) {
    void isSaveDetailed;
    void userId;
    void db;

    if (!model) return this.GetEmptyID();
    const normalized = this.modelType && typeof this.modelType.CopyData === 'function'
      ? this.modelType.CopyData(model)
      : { ...model };
    const id = this.GetModelID({ model: normalized });

    if (this.IDIsEmpty(id)) {
      this.AddOrUpdate_SetCreateCode({ model: normalized, userId, db });
      this.AddOrUpdate_SetUpdateCode({ model: normalized, userId, db });
      const insertedId = await this.insertOne({ model: normalized });
      return this.IDIsEmpty(this.GetModelID({ model: normalized })) ? insertedId : this.GetModelID({ model: normalized });
    }

    const exist = await this.Get({ id, isAll: true });
    if (!exist) {
      this.AddOrUpdate_SetCreateCode({ model: normalized, userId, db });
      this.AddOrUpdate_SetUpdateCode({ model: normalized, userId, db });
      await this.insertOne({ model: normalized });
      return this.GetModelID({ model: normalized });
    }

    const toSave = { ...exist, ...normalized };
    if (this.createDate && exist[this.createDate] && !normalized[this.createDate]) {
      toSave[this.createDate] = exist[this.createDate];
    }
    this.AddOrUpdate_SetUpdateCode({ model: toSave, userId, db });
    await this.updateOne({
      filter: { [this.primaryKey]: id },
      values: toSave,
    });
    return this.GetModelID({ model: toSave });
  }

  async Delete({ id, ids, filter = {}, hardDelete = false, userId, db = null } = {}) {
    void userId;
    void db;

    const finalFilter = { ...filter };
    if (ids && Array.isArray(ids) && ids.length) {
      finalFilter[this.primaryKey] = { $in: ids };
    } else if (id != null && id !== '') {
      finalFilter[this.primaryKey] = id;
    }

    if (!Object.keys(finalFilter).length) {
      return R({ succeed: false, msg: '传入参数有误' });
    }

    const collection = await this._getCollection();
    let result;
    if (hardDelete || !this.deleteKey) {
      result = await collection.deleteMany(finalFilter);
      return R({ succeed: (result.deletedCount || 0) > 0, msg: (result.deletedCount || 0) > 0 ? '删除成功' : '删除失败' });
    }

    result = await collection.updateMany(
      { ...finalFilter, ...this._baseFilter() },
      { $set: { [this.deleteKey]: true, ...(this.updateDate ? { [this.updateDate]: new Date() } : {}) } },
    );
    return R({ succeed: (result.modifiedCount || 0) > 0, msg: (result.modifiedCount || 0) > 0 ? '删除成功' : '删除失败' });
  }
}

module.exports = MongoDal;
