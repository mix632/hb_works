'use strict';

const MongoDal = require('../../../core/mongoDal');
const model = require('../model/mb_test.model');

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class MbTestRepo extends MongoDal {
  constructor() {
    super({ collectionName: 'mb_test', primaryKey: '_id', deleteKey: 'deleted' });
    this.modelType = model;
    this.tableTitle = 'Mongo 测试';
  }

  IDIsEmpty(id) {
    return !id;
  }

  GetEmptyID() {
    return '';
  }

  _formatDoc(doc) {
    if (!doc) return null;
    return this.modelType.CopyData(doc);
  }

  _formatDocs(docs) {
    return Array.isArray(docs) ? docs.map(doc => this._formatDoc(doc)) : [];
  }

  GetSearchFilter({ searchModel = {} } = {}) {
    const filter = { deleted: false };
    if (searchModel.Keyword && String(searchModel.Keyword).trim()) {
      filter.title = { $regex: escapeRegExp(String(searchModel.Keyword).trim()), $options: 'i' };
    }
    if (searchModel.id) {
      filter.id = String(searchModel.id);
    }
    if (searchModel.ids && Array.isArray(searchModel.ids) && searchModel.ids.length) {
      filter.id = { $in: searchModel.ids.map(e => String(e)) };
    }
    if (searchModel.title && String(searchModel.title).trim()) {
      filter.title = { $regex: escapeRegExp(String(searchModel.title).trim()), $options: 'i' };
    }
    if (searchModel.age != null && searchModel.age !== '') {
      filter.age = parseInt(searchModel.age, 10) || 0;
    }
    return filter;
  }

  async Get({ id, _id }) {
    const filter = { deleted: false };
    let doc = null;
    if (id) {
      doc = await this.findOne({ filter: { ...filter, id: String(id) } });
    } else if (_id) {
      doc = await this.findOne({ id: _id, filter });
    }
    return this._formatDoc(doc);
  }

  async GetListForPageIndex({ filter = {}, pageIndex = 0, onePageCount = 30, sort = { create_at: -1, _id: -1 } } = {}) {
    const docs = await this.find({
      filter,
      pageIndex: pageIndex + 1,
      onePageCount,
      sort,
    });
    return this._formatDocs(docs);
  }

  async Count({ filter = {} } = {}) {
    return this.count({ filter });
  }

  async AddOrUpdate({ model: m }) {
    const normalized = this.modelType.CopyData(m);
    const exist = normalized.id ? await this.findOne({ filter: { id: normalized.id } }) : null;

    if (!exist) {
      normalized.deleted = false;
      return this.insertOne({ model: normalized }).then(() => normalized.id);
    }

    const values = {
      title: normalized.title,
      age: normalized.age,
      create_at: exist.create_at || normalized.create_at,
      deleted: exist.deleted === true ? true : normalized.deleted,
    };
    await this.updateOne({ filter: { id: normalized.id }, values });
    return normalized.id;
  }

  async Delete({ id, ids }) {
    const deleteIds = ids && Array.isArray(ids) ? ids.filter(Boolean).map(e => String(e)) : (id ? [String(id)] : []);
    if (!deleteIds.length) return { succeed: false, msg: '传入参数有误' };

    const collection = await this._getCollection();
    const result = await collection.updateMany(
      { id: { $in: deleteIds }, deleted: false },
      { $set: { deleted: true } },
    );
    const succeed = (result.modifiedCount || 0) > 0;
    return { succeed, msg: succeed ? '删除成功' : '删除失败' };
  }
}

module.exports = new MbTestRepo();
