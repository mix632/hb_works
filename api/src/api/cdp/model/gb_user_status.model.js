'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, MIN_DATE_STR, formatDate, parseBool } = require('../../../core/baseModel');

class GbUserStatusModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('gb_user_status', {
      id:         { type: sequelize.BIGINT, primaryKey: true, autoIncrement: true, field: 'id' },
      title:      { type: sequelize.STRING, field: 'title', defaultValue: '' },
      sort_index: { type: sequelize.INTEGER, field: 'sort_index', defaultValue: 0 },
      created_at: { type: sequelize.DATE, field: 'created_at', defaultValue: MIN_DATE },
      updated_at: { type: sequelize.DATE, field: 'updated_at', defaultValue: MIN_DATE },
      deleted:    { type: sequelize.BOOLEAN, field: 'deleted', defaultValue: false },
    }, { timestamps: false, freezeTableName: true });
  }

  CopyData(d) {
    d = d || {};
    return {
      id:         d.id ? parseInt(d.id) : 0,
      title:      d.title || '',
      sort_index: d.sort_index ? parseInt(d.sort_index) : 0,
      created_at: formatDate(d.created_at),
      updated_at: formatDate(d.updated_at),
      deleted:    d.hasOwnProperty('deleted') ? parseBool(d.deleted) : false,
    };
  }
}

module.exports = new GbUserStatusModel();
