'use strict';

const { BaseModel, formatDate, parseBool } = require('../../../core/baseModel');

class MbTestModel extends BaseModel {
  CopyData(d) {
    d = d || {};
    const docId = d._id != null && d._id !== '' ? String(d._id) : (d.id != null && d.id !== '' ? String(d.id) : '');
    return {
      _id: docId,
      id: docId,
      title: d.title ? String(d.title) : '',
      age: d.age != null && d.age !== '' ? parseInt(d.age, 10) || 0 : 0,
      create_at: d.create_at ? formatDate(d.create_at, 'YYYY-MM-DD HH:mm:ss') : '',
      deleted: d.hasOwnProperty('deleted') ? parseBool(d.deleted) : false,
    };
  }
}

module.exports = new MbTestModel();
