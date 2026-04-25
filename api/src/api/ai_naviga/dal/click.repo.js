'use strict';

const MongoDal = require('../../../core/mongoDal');
const model = require('../model/click.model');
const { formatDate } = require('../../../core/baseModel');

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class ClickRepo extends MongoDal {
  constructor() {
    super({ collectionName: 'click', primaryKey: '_id', deleteKey: 'deleted' });
    this.modelType = model;
    this.tableTitle = '点击日志';
    this.createDate = 'time';
    this.updateDate = '';
    this.emptyPrimaryValue = '';
  }

  GetSearchFilter({ searchModel = {} } = {}) {
    const filter = {};
    if (searchModel.Keyword && String(searchModel.Keyword).trim()) {
      const key = escapeRegExp(String(searchModel.Keyword).trim());
      filter.$or = [
        { fingerprint: { $regex: key, $options: 'i' } },
        { platform: { $regex: key, $options: 'i' } },
        { event_type: { $regex: key, $options: 'i' } },
        { channel: { $regex: key, $options: 'i' } },
      ];
    }
    if (searchModel.id) {
      const objectId = this.toObjectId(searchModel.id);
      if (objectId) filter._id = objectId;
    }
    if (searchModel.ids && Array.isArray(searchModel.ids) && searchModel.ids.length) {
      const objectIds = searchModel.ids.map(e => this.toObjectId(e)).filter(Boolean);
      if (objectIds.length) filter._id = { $in: objectIds };
    }
    if (searchModel.fingerprint && String(searchModel.fingerprint).trim()) {
      filter.fingerprint = { $regex: escapeRegExp(String(searchModel.fingerprint).trim()), $options: 'i' };
    }
    if (searchModel.home_id != null && searchModel.home_id !== '') {
      filter.home_id = parseInt(searchModel.home_id, 10) || 0;
    }
    if (searchModel.platform && String(searchModel.platform).trim()) {
      filter.platform = String(searchModel.platform).trim();
    }
    if (searchModel.event_type && String(searchModel.event_type).trim()) {
      filter.event_type = String(searchModel.event_type).trim();
    }
    if (searchModel.channel && String(searchModel.channel).trim()) {
      filter.channel = String(searchModel.channel).trim();
    }
    if (searchModel.time_start || searchModel.time_end) {
      filter.time = {};
      if (searchModel.time_start) filter.time.$gte = formatDate(searchModel.time_start, 'YYYY-MM-DD HH:mm:ss');
      if (searchModel.time_end) filter.time.$lte = formatDate(searchModel.time_end, 'YYYY-MM-DD HH:mm:ss');
    }
    return filter;
  }
}

module.exports = new ClickRepo();
