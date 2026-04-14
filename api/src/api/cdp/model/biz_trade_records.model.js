'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class biz_trade_recordsModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('biz_trade_records', {
      // id
      id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'id', defaultValue: 0, allowNull: false },
      // 类型
      type: { type: sequelize.INTEGER, field: 'type', defaultValue: 0, allowNull: false },
      // 日期
      date: { type: sequelize.DATE, field: 'date', defaultValue: MIN_DATE, allowNull: false },
      // 名称
      title: { type: sequelize.STRING,  field: 'title', defaultValue: '', allowNull: false },
      // 创建时间
      created_at: { type: sequelize.DATE, field: 'created_at', defaultValue: MIN_DATE, allowNull: false },
      // 更新时间
      updated_at: { type: sequelize.DATE, field: 'updated_at', defaultValue: MIN_DATE, allowNull: false },
      // 删除标记
      deleted: { type: sequelize.BOOLEAN, field: 'deleted', defaultValue: false, allowNull: false },
    }, { timestamps: false, freezeTableName: true, deletedAt: true, });
    /**********手工插入代码 */
    /**********结束 */
  }
  CopyData(d) {
    d = d || {};
    return {
      id: d.id ? parseInt(d.id) : 0,
      type: d.type ? parseInt(d.type) : 0,
      date: formatDate(d.date, 'YYYY-MM-DD HH:mm:ss'),
      title: d.title || '',
      created_at: formatDate(d.created_at, 'YYYY-MM-DD HH:mm:ss'),
      updated_at: formatDate(d.updated_at, 'YYYY-MM-DD HH:mm:ss'),
      deleted: d.hasOwnProperty('deleted') ? parseBool(d.deleted) : false,

      /**********手工插入代码 */
      /**********结束 */
    };
  }
}
module.exports = new biz_trade_recordsModel();