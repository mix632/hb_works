'use strict';

const MongoDal = require('../../../core/mongoDal');
const model = require('../model/mb_test.model');

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class MbTestRepo extends MongoDal {
  constructor() {
    super({ collectionName: 'mb_test', primaryKey: 'id', deleteKey: '' });
    this.modelType = model;
    this.tableTitle = 'Mongo 测试';
    this.createDate = 'create_at';
    this.updateDate = '';
    this.emptyPrimaryValue = '';
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
}

module.exports = new MbTestRepo();
