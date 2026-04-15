'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class sys_user_postModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('sys_user_post', {
      // 用户id
      user_id: { type: sequelize.INTEGER, primaryKey: true, field: 'user_id', defaultValue: 0, allowNull: false },
      // 职位id
      post_id: { type: sequelize.INTEGER, primaryKey: true, field: 'post_id', defaultValue: 0, allowNull: false },
    }, { timestamps: false, freezeTableName: true, deletedAt: true, });
    /**********手工插入代码 */
    /**********结束 */
  }
  CopyData(d) {
    d = d || {};
    return {
      user_id: d.user_id ? parseInt(d.user_id) : 0,
      post_id: d.post_id ? parseInt(d.post_id) : 0,

      /**********手工插入代码 */
      /**********结束 */
    };
  }
}
module.exports = new sys_user_postModel();