'use strict';

const { BaseModel, formatDate, parseBool } = require('../../../core/baseModel');

class ClickModel extends BaseModel {
  CopyData(d) {
    d = d || {};
    const docId = d._id != null && d._id !== '' ? String(d._id) : (d.id != null && d.id !== '' ? String(d.id) : '');
    return {
      _id: docId,
      id: docId,
      fingerprint: d.fingerprint ? String(d.fingerprint) : '',
      home_id: d.home_id != null && d.home_id !== '' ? parseInt(d.home_id, 10) || 0 : 0,
      time: d.time ? formatDate(d.time, 'YYYY-MM-DD HH:mm:ss') : '',
      platform: d.platform ? String(d.platform) : '',
      event_type: d.event_type ? String(d.event_type) : '',
      channel: d.channel ? String(d.channel) : '',
      deleted: d.hasOwnProperty('deleted') ? parseBool(d.deleted) : false,
    };
  }
}

module.exports = new ClickModel();
