'use strict';

const { BaseModel, formatDate, parseBool } = require('../../../core/baseModel');

class MbTestModel extends BaseModel {
  CopyData(d) {
    d = d || {};
    return {
      id: d.id ? String(d.id) : '',
      title: d.title ? String(d.title) : '',
      age: d.age != null && d.age !== '' ? parseInt(d.age, 10) || 0 : 0,
      create_at: d.create_at ? formatDate(d.create_at, 'YYYY-MM-DD HH:mm:ss') : '',
      deleted: d.hasOwnProperty('deleted') ? parseBool(d.deleted) : false,
    };
  }
}

module.exports = new MbTestModel();
