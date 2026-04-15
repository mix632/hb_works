'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class sys_url_queryModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('sys_url_query', {
      // id
      id: { type: sequelize.STRING,  primaryKey: true, field: 'id', defaultValue: '', allowNull: false },
      // 名称
      name: { type: sequelize.STRING,  field: 'name', defaultValue: '', allowNull: false },
      // 参数
      params: { type: sequelize.JSON, field: 'params', defaultValue: false, allowNull: false },
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
      id: d.id || '',
      name: d.name || '',
      params: d.params || null,
      created_at: formatDate(d.created_at, 'YYYY-MM-DD HH:mm:ss'),
      updated_at: formatDate(d.updated_at, 'YYYY-MM-DD HH:mm:ss'),
      deleted: d.hasOwnProperty('deleted') ? parseBool(d.deleted) : false,

      /**********手工插入代码 */
      /**********结束 */
    };
  }
}
module.exports = new sys_url_queryModel();