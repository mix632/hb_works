'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class sys_postModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('sys_post', {
      // 岗位ID
      post_id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'post_id', defaultValue: 0, allowNull: false },
      // 岗位编码
      post_code: { type: sequelize.STRING,  field: 'post_code', defaultValue: '', allowNull: false },
      // 岗位名称
      post_name: { type: sequelize.STRING,  field: 'post_name', defaultValue: '', allowNull: false },
      // 显示顺序
      post_sort: { type: sequelize.INTEGER, field: 'post_sort', defaultValue: 0, allowNull: false },
      // 状态（0正常 1停用）
      status: { type: sequelize.STRING,  field: 'status', defaultValue: '', allowNull: false },
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
      post_id: d.post_id ? parseInt(d.post_id) : 0,
      post_code: d.post_code || '',
      post_name: d.post_name || '',
      post_sort: d.post_sort ? parseInt(d.post_sort) : 0,
      status: d.status || '',
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
      postCode: e.post_code,
      postId: e.post_id,
      postName: e.post_name,
      postSort: e.post_sort,
      remark: e.remark,
      status: e.status,
    };
  }
}
module.exports = new sys_postModel();