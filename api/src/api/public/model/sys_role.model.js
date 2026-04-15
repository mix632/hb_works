'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class sys_roleModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('sys_role', {
      // 角色ID
      role_id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'role_id', defaultValue: 0, allowNull: false },
      // 角色名称
      role_name: { type: sequelize.STRING,  field: 'role_name', defaultValue: '', allowNull: false },
      // 角色权限字符串
      role_key: { type: sequelize.STRING,  field: 'role_key', defaultValue: '', allowNull: false },
      // 显示顺序
      role_sort: { type: sequelize.INTEGER, field: 'role_sort', defaultValue: 0, allowNull: false },
      // 数据范围
      data_scope: { type: sequelize.STRING,  field: 'data_scope', defaultValue: '', allowNull: false },
      // 菜单树选择项是否关联显示
      menu_check_strictly: { type: sequelize.BOOLEAN, field: 'menu_check_strictly', defaultValue: false, allowNull: false },
      // 部门树选择项是否关联显示
      dept_check_strictly: { type: sequelize.BOOLEAN, field: 'dept_check_strictly', defaultValue: false, allowNull: false },
      // 角色状态
      status: { type: sequelize.STRING,  field: 'status', defaultValue: '', allowNull: false },
      // 删除标志
      del_flag: { type: sequelize.STRING,  field: 'del_flag', defaultValue: '', allowNull: false },
      // 创建者
      create_by: { type: sequelize.STRING,  field: 'create_by', defaultValue: '', allowNull: false },
      // 创建时间
      create_time: { type: sequelize.DATE, field: 'create_time', defaultValue: MIN_DATE, allowNull: false },
      // 更新者
      update_by: { type: sequelize.STRING,  field: 'update_by', defaultValue: '', allowNull: false },
      // 更新时间
      update_time: { type: sequelize.DATE, field: 'update_time', defaultValue: MIN_DATE, allowNull: false },
      // 备注
      remark: { type: sequelize.STRING,  field: 'remark', defaultValue: '', allowNull: false },
    }, { timestamps: false, freezeTableName: true, deletedAt: true, });
    /**********手工插入代码 */
    /**********结束 */
  }
  CopyData(d) {
    d = d || {};
    return {
      role_id: d.role_id ? parseInt(d.role_id) : 0,
      role_name: d.role_name || '',
      role_key: d.role_key || '',
      role_sort: d.role_sort ? parseInt(d.role_sort) : 0,
      data_scope: d.data_scope || '',
      menu_check_strictly: d.hasOwnProperty('menu_check_strictly') ? parseBool(d.menu_check_strictly) : false,
      dept_check_strictly: d.hasOwnProperty('dept_check_strictly') ? parseBool(d.dept_check_strictly) : false,
      status: d.status || '',
      del_flag: d.del_flag || '',
      create_by: d.create_by || '',
      create_time: formatDate(d.create_time, 'YYYY-MM-DD HH:mm:ss'),
      update_by: d.update_by || '',
      update_time: formatDate(d.update_time, 'YYYY-MM-DD HH:mm:ss'),
      remark: d.remark || '',

      /**********手工插入代码 */
      /**********结束 */
    };
  }
  data(e) {
    return {
      createBy: e.create_by,
      createTime: e.create_time,
      updateBy: e.update_by,
      updateTime: e.update_time,
      remark: e.remark,
      status: e.status,
      dataScope: e.data_scope,
      deptCheckStrictly: e.dept_check_strictly,
      menuCheckStrictly: e.menu_check_strictly,      
      roleId: e.role_id,
      roleKey: e.role_key,
      roleName: e.role_name,
      roleSort: e.role_sort,
      delFlag: e.del_flag,
    };
  }
}
module.exports = new sys_roleModel();