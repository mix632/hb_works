'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class sys_role_deptModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('sys_role_dept', {
      // 角色id
      role_id: { type: sequelize.INTEGER, primaryKey: true, field: 'role_id', defaultValue: 0, allowNull: false },
      // 部门id
      dept_id: { type: sequelize.INTEGER, primaryKey: true, field: 'dept_id', defaultValue: 0, allowNull: false },
    }, { timestamps: false, freezeTableName: true, deletedAt: true, });
    /**********手工插入代码 */
    /**********结束 */
  }
  CopyData(d) {
    d = d || {};
    return {
      role_id: d.role_id ? parseInt(d.role_id) : 0,
      dept_id: d.dept_id ? parseInt(d.dept_id) : 0,

      /**********手工插入代码 */
      /**********结束 */
    };
  }
}
module.exports = new sys_role_deptModel();