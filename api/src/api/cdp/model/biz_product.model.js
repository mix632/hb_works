'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class BizProductModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('biz_product', {
      id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'id' },
      title: { type: sequelize.STRING, field: 'title', defaultValue: '' },
      sub_title: { type: sequelize.STRING, field: 'sub_title', defaultValue: '' },
      is_use: { type: sequelize.BOOLEAN, field: 'is_use', defaultValue: false },
      commission_rate: { type: sequelize.DOUBLE, field: 'commission_rate', defaultValue: 0 },
      descript: { type: sequelize.STRING, field: 'descript', defaultValue: '' },
      html: { type: sequelize.STRING, field: 'html', defaultValue: '' },
      customer_submit_data: { type: sequelize.JSON, field: 'customer_submit_data', defaultValue: null },
      image: { type: sequelize.STRING, field: 'image', defaultValue: '' },
      sort_index: { type: sequelize.INTEGER, field: 'sort_index', defaultValue: 0 },
      created_at: { type: sequelize.DATE, field: 'created_at', defaultValue: MIN_DATE },
      updated_at: { type: sequelize.DATE, field: 'updated_at', defaultValue: MIN_DATE },
      deleted: { type: sequelize.BOOLEAN, field: 'deleted', defaultValue: false },
    }, { timestamps: false, freezeTableName: true });
  }

  CopyData(d) {
    d = d || {};
    return {
      id: d.id ? parseInt(d.id) : 0,
      title: d.title || '',
      sub_title: d.sub_title || '',
      is_use: d.hasOwnProperty('is_use') ? parseBool(d.is_use) : false,
      commission_rate: d.commission_rate ? parseFloat(d.commission_rate) : 0,
      descript: d.descript || '',
      html: d.html || '',
      customer_submit_data: d.customer_submit_data || null,
      image: d.image || '',
      sort_index: d.sort_index ? parseInt(d.sort_index) : 0,
      created_at: formatDate(d.created_at),
      updated_at: formatDate(d.updated_at),
      deleted: d.hasOwnProperty('deleted') ? parseBool(d.deleted) : false,
      // 扩展字段
      files: d.files || [],
    };
  }
}

module.exports = new BizProductModel();
