'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class system_file_typeModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('system_file_type', {
      // id
      id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'id', defaultValue: 0, allowNull: false },
      // 显示名
      Title: { type: sequelize.STRING,  field: 'Title', defaultValue: '', allowNull: false },
      // 名称
      Name: { type: sequelize.STRING,  field: 'Name', defaultValue: '', allowNull: false },
      // 删除标记
      Deleted: { type: sequelize.BOOLEAN, field: 'Deleted', defaultValue: false, allowNull: false },
      // 创建时间
      CreateDate: { type: sequelize.DATE, field: 'CreateDate', defaultValue: MIN_DATE, allowNull: false },
      // 创建人
      CreateUserId: { type: sequelize.INTEGER, field: 'CreateUserId', defaultValue: 0, allowNull: false },
      // 更新时间
      UpdateDate: { type: sequelize.DATE, field: 'UpdateDate', defaultValue: MIN_DATE, allowNull: false },
      // 更新人
      UpdateUserId: { type: sequelize.INTEGER, field: 'UpdateUserId', defaultValue: 0, allowNull: false },
      // 删除时间
      DeletedDate: { type: sequelize.DATE, field: 'DeletedDate', defaultValue: MIN_DATE, allowNull: false },
      // 删除人
      DeletedUserId: { type: sequelize.INTEGER, field: 'DeletedUserId', defaultValue: 0, allowNull: false },
      // CompanyId
      CompanyId: { type: sequelize.INTEGER, field: 'CompanyId', defaultValue: 0, allowNull: false },
    }, { timestamps: false, freezeTableName: true, deletedAt: true, });
    /**********手工插入代码 */
    /**********结束 */
  }
  CopyData(d) {
    d = d || {};
    return {
      id: d.id ? parseInt(d.id) : 0,
      Title: d.Title || '',
      Name: d.Name || '',
      Deleted: d.hasOwnProperty('Deleted') ? parseBool(d.Deleted) : false,
      CreateDate: formatDate(d.CreateDate, 'YYYY-MM-DD HH:mm:ss'),
      CreateUserId: d.CreateUserId ? parseInt(d.CreateUserId) : 0,
      UpdateDate: formatDate(d.UpdateDate, 'YYYY-MM-DD HH:mm:ss'),
      UpdateUserId: d.UpdateUserId ? parseInt(d.UpdateUserId) : 0,
      DeletedDate: formatDate(d.DeletedDate, 'YYYY-MM-DD HH:mm:ss'),
      DeletedUserId: d.DeletedUserId ? parseInt(d.DeletedUserId) : 0,
      CompanyId: d.CompanyId ? parseInt(d.CompanyId) : 0,

      /**********手工插入代码 */
      /**********结束 */
    };
  }
}
module.exports = new system_file_typeModel();