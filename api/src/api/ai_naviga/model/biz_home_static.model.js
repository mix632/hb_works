'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class biz_home_staticModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('biz_home_static', {
      // id
      id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'id', defaultValue: 0, allowNull: false },
      // 页面类型
      type: { type: sequelize.STRING,  field: 'type', defaultValue: '', allowNull: false },
      // 平台
      platform: { type: sequelize.STRING,  field: 'platform', defaultValue: '', allowNull: false },
      // 最新版
      is_new: { type: sequelize.BOOLEAN, field: 'is_new', defaultValue: false, allowNull: false },
      // 内容
      data: { type: sequelize.JSON, field: 'data', defaultValue: false, allowNull: false },
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
      type: d.type || '',
      platform: d.platform || '',
      is_new: d.hasOwnProperty('is_new') ? parseBool(d.is_new) : false,
      data: d.data || '',
      created_at: formatDate(d.created_at, 'YYYY-MM-DD HH:mm:ss'),
      updated_at: formatDate(d.updated_at, 'YYYY-MM-DD HH:mm:ss'),
      deleted: d.hasOwnProperty('deleted') ? parseBool(d.deleted) : false,

      /**********手工插入代码 */
      /**********结束 */
    };
  }
}
module.exports = new biz_home_staticModel();