'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class sys_deptModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('sys_dept', {
      // 部门id
      dept_id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'dept_id', defaultValue: 0, allowNull: false },
      // 父部门id
      parent_id: { type: sequelize.INTEGER, field: 'parent_id', defaultValue: 0, allowNull: false },
      // 祖级列表
      ancestors: { type: sequelize.STRING,  field: 'ancestors', defaultValue: '', allowNull: false },
      // 部门名称
      dept_name: { type: sequelize.STRING,  field: 'dept_name', defaultValue: '', allowNull: false },
      // 显示顺序
      order_num: { type: sequelize.INTEGER, field: 'order_num', defaultValue: 0, allowNull: false },
      // 负责人
      leader: { type: sequelize.STRING,  field: 'leader', defaultValue: '', allowNull: false },
      // 联系电话
      phone: { type: sequelize.STRING,  field: 'phone', defaultValue: '', allowNull: false },
      // 邮箱
      email: { type: sequelize.STRING,  field: 'email', defaultValue: '', allowNull: false },
      // 部门状态（0正常 1停用）
      status: { type: sequelize.STRING,  field: 'status', defaultValue: '', allowNull: false },
      // 是否不显示
      isNotShow: { type: sequelize.BOOLEAN, field: 'isNotShow', defaultValue: false, allowNull: false },
      // 删除标志（0代表存在 2代表删除）
      del_flag: { type: sequelize.STRING,  field: 'del_flag', defaultValue: '', allowNull: false },
      // 创建者
      create_by: { type: sequelize.STRING,  field: 'create_by', defaultValue: '', allowNull: false },
      // 创建时间
      create_time: { type: sequelize.DATE, field: 'create_time', defaultValue: MIN_DATE, allowNull: false },
      // 更新者
      update_by: { type: sequelize.STRING,  field: 'update_by', defaultValue: '', allowNull: false },
      // 更新时间
      update_time: { type: sequelize.DATE, field: 'update_time', defaultValue: MIN_DATE, allowNull: false },
    }, { timestamps: false, freezeTableName: true, deletedAt: true, });
    /**********手工插入代码 */
    /**********结束 */
  }
  CopyData(d) {
    d = d || {};
    return {
      dept_id: d.dept_id ? parseInt(d.dept_id) : 0,
      parent_id: d.parent_id ? parseInt(d.parent_id) : 0,
      ancestors: d.ancestors || '',
      dept_name: d.dept_name || '',
      order_num: d.order_num ? parseInt(d.order_num) : 0,
      leader: d.leader || '',
      phone: d.phone || '',
      email: d.email || '',
      status: d.status || '',
      isNotShow: d.hasOwnProperty('isNotShow') ? parseBool(d.isNotShow) : false,
      del_flag: d.del_flag || '',
      create_by: d.create_by || '',
      create_time: formatDate(d.create_time, 'YYYY-MM-DD HH:mm:ss'),
      update_by: d.update_by || '',
      update_time: formatDate(d.update_time, 'YYYY-MM-DD HH:mm:ss'),

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
      deptId: e.dept_id,
      parentId: e.parent_id,
      ancestors: e.ancestors,
      deptName: e.dept_name,
      orderNum: e.order_num,
      leader: e.leader,
      phone: e.phone,
      email: e.email,
      status: e.status,
      delFlag: e.del_flag,
      parentName: null,
      children: [],
    };
  }
}
module.exports = new sys_deptModel();