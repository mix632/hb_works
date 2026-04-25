'use strict';

const { ObjectId } = require('mongodb');
const serverConfig = require('./serverConfig');

class MongoDal {
  constructor({ collectionName, primaryKey = '_id', deleteKey = 'deleted' } = {}) {
    this.collectionName = collectionName || '';
    this.primaryKey = primaryKey;
    this.deleteKey = deleteKey;
    this.myConfig = serverConfig;
  }

  async _getDb() {
    const db = await this.myConfig.getMongoDb();
    if (!db) throw new Error('MongoDB is not enabled');
    return db;
  }

  async _getCollection() {
    if (!this.collectionName) throw new Error('collectionName is required');
    const db = await this._getDb();
    return db.collection(this.collectionName);
  }

  toObjectId(id) {
    if (!id) return null;
    if (id instanceof ObjectId) return id;
    if (!ObjectId.isValid(String(id))) return null;
    return new ObjectId(String(id));
  }

  normalizeId(doc) {
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
