'use strict';

const sequelize = require('sequelize');
const config = require('../../../core/serverConfig');
const { BaseModel, MIN_DATE, formatDate, parseBool } = require('../../../core/baseModel');

class system_fileModel extends BaseModel {
  constructor() {
    super();
    this.model = config.sequelize.define('system_file', {
      // id
      id: { type: sequelize.INTEGER, primaryKey: true, autoIncrement: true, field: 'id', defaultValue: 0, allowNull: false },
      // TableID
      TableID: { type: sequelize.INTEGER, field: 'TableID', defaultValue: 0, allowNull: false },
      // TargetID
      TargetID: { type: sequelize.STRING,  field: 'TargetID', defaultValue: '', allowNull: false },
      // FileName
      FileName: { type: sequelize.STRING,  field: 'FileName', defaultValue: '', allowNull: false },
      // OriMd5
      OriMd5: { type: sequelize.STRING,  field: 'OriMd5', defaultValue: '', allowNull: false },
      // FileMd5
      FileMd5: { type: sequelize.STRING,  field: 'FileMd5', defaultValue: '', allowNull: false },
      // ThumbnailMd5
      ThumbnailMd5: { type: sequelize.STRING,  field: 'ThumbnailMd5', defaultValue: '', allowNull: false },
      // IsImage
      IsImage: { type: sequelize.BOOLEAN, field: 'IsImage', defaultValue: false, allowNull: false },
      // FileSize
      FileSize: { type: sequelize.INTEGER, field: 'FileSize', defaultValue: 0, allowNull: false },
      // Data
      Data: { type: sequelize.STRING,  field: 'Data', defaultValue: '', allowNull: false },
      // SavePath
      SavePath: { type: sequelize.STRING,  field: 'SavePath', defaultValue: '', allowNull: false },
      // SortIndex
      SortIndex: { type: sequelize.INTEGER, field: 'SortIndex', defaultValue: 0, allowNull: false },
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
      TableID: d.TableID ? parseInt(d.TableID) : 0,
      TargetID: d.TargetID || '',
      FileName: d.FileName || '',
      OriMd5: d.OriMd5 || '',
      FileMd5: d.FileMd5 || '',
      ThumbnailMd5: d.ThumbnailMd5 || '',
      IsImage: d.hasOwnProperty('IsImage') ? parseBool(d.IsImage) : false,
      FileSize: d.FileSize ? parseInt(d.FileSize) : 0,
      Data: d.Data || '',
      SavePath: d.SavePath || '',
      SortIndex: d.SortIndex ? parseInt(d.SortIndex) : 0,
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
module.exports = new system_fileModel();