'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class sys_flow_configModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('sys_flow_config', {
      // id
      id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'id', defaultValue: 0, allowNull: false },
      // 名称
      name: { type: sequelize.STRING,  field: 'name', defaultValue: '', allowNull: false },
      // 数据
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
      name: d.name || '',
      data: d.data || null,
      created_at: formatDate(d.created_at, 'YYYY-MM-DD HH:mm:ss'),
      updated_at: formatDate(d.updated_at, 'YYYY-MM-DD HH:mm:ss'),
      deleted: d.hasOwnProperty('deleted') ? parseBool(d.deleted) : false,

      /**********手工插入代码 */
      /**********结束 */
    };
  }
}
module.exports = new sys_flow_configModel();