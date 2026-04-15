'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class biz_customer_statusModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('biz_customer_status', {
      // id
      id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'id', defaultValue: 0, allowNull: false },
      // 名称
      title: { type: sequelize.STRING,  field: 'title', defaultValue: '', allowNull: false },
      // 类型名
      name: { type: sequelize.STRING,  field: 'name', defaultValue: '', allowNull: false },
      // 可操作
      show_action: { type: sequelize.BOOLEAN, field: 'show_action', defaultValue: false, allowNull: false },
      // 下一步
      next: { type: sequelize.JSON, field: 'next', defaultValue: false, allowNull: false },
      // 角色
      roles: { type: sequelize.JSON, field: 'roles', defaultValue: false, allowNull: false },
      // 数据
      data: { type: sequelize.JSON, field: 'data', defaultValue: false, allowNull: false },
      // 排序号
      sort_index: { type: sequelize.INTEGER, field: 'sort_index', defaultValue: 0, allowNull: false },
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
      title: d.title || '',
      name: d.name || '',
      show_action: d.hasOwnProperty('show_action') ? parseBool(d.show_action) : false,
      next: d.next || null,
      roles: d.roles || null,
      data: d.data || null,
      sort_index: d.sort_index ? parseInt(d.sort_index) : 0,
      created_at: formatDate(d.created_at, 'YYYY-MM-DD HH:mm:ss'),
      updated_at: formatDate(d.updated_at, 'YYYY-MM-DD HH:mm:ss'),
      deleted: d.hasOwnProperty('deleted') ? parseBool(d.deleted) : false,

      /**********手工插入代码 */
      /**********结束 */
    };
  }
}
module.exports = new biz_customer_statusModel();