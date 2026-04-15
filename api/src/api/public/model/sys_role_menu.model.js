'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class sys_role_menuModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('sys_role_menu', {
      // 角色id
      role_id: { type: sequelize.INTEGER, primaryKey: true, field: 'role_id', defaultValue: 0, allowNull: false },
      // 菜单id
      menu_id: { type: sequelize.INTEGER, primaryKey: true, field: 'menu_id', defaultValue: 0, allowNull: false },
    }, { timestamps: false, freezeTableName: true, deletedAt: true, });
    /**********手工插入代码 */
    /**********结束 */
  }
  CopyData(d) {
    d = d || {};
    return {
      role_id: d.role_id ? parseInt(d.role_id) : 0,
      menu_id: d.menu_id ? parseInt(d.menu_id) : 0,

      /**********手工插入代码 */
      /**********结束 */
    };
  }
}
module.exports = new sys_role_menuModel();