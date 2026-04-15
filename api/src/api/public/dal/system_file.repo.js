'use strict';

const crypto = require('crypto');
const { Dal } = require('../../../core/dal');
const fs = require('fs-extra');
const path = require('path');
const UUID = require('uuid');
const util = require('../../../utils');
const model = require('../model/system_file.model');
const fileTypeEntity = require('../model/system_file_type.model');

/**
 * system_file — 核心表
 */
class SystemFileRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'system_file';
    this.defalutOrder = 'system_file.SortIndex asc';
    this.tableTitle = '附件';
    this.primaryKey = 'id';
    this.deleteKey = 'Deleted';
    this.createDate = 'CreateDate';
    this.createUserId = 'CreateUserId';
    this.updateDate = 'UpdateDate';
    this.updateUserId = 'UpdateUserId';
    this.deleteDate = 'DeletedDate';
    this.deleteUserId = 'DeletedUserId';
    this.sortIndex = 'SortIndex';
    this.emptyPrimaryValue = 0;
    this.baseSql = `
      select system_file.*
      from system_file system_file
      where system_file.id > 0 {0} {1}
      order by {2}
    `.replace(/\n\s+/g, ' ').trim();
  }

  async Load({ datas, userId, isLoadDetailed = false, isGetValue = true, db = null }) {
    if (!datas || !datas.length) return;
    if (!isLoadDetailed) return;

    const factory = require('../factory');
    const ids = datas.map(e => this.GetModelID({ model: e }));
    if (ids.length) {
    }
  }

  async AddOrUpdate({ model: m, isSaveDetailed = false, userId, db = null }) {
    m.id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.id) {
      return m.id;
    }

    return m.id;
  }

  AddOrUpdate_GetIDZeroSql({ model }) {
    return ``;
  }

  _isImageFileName(fileName) {
    if (!fileName || typeof fileName !== 'string') return false;
    return /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileName);
  }

  async _md5File(filePath) {
    const buf = await fs.readFile(filePath);
    return crypto.createHash('md5').update(buf).digest('hex');
  }

  GetSearchSQL({ searchModel, userId }) {
    const w = this.safeWhere();
    if (searchModel.Keyword && searchModel.Keyword.trim()) {
      w.w('system_file.TargetID', searchModel.Keyword, 'like', 'or');
      w.w('system_file.FileName', searchModel.Keyword, 'like', 'or');
      w.w('system_file.FileMd5', searchModel.Keyword, 'like', 'or');
      w.w('system_file.ThumbnailMd5', searchModel.Keyword, 'like', 'or');
      w.w('system_file.Data', searchModel.Keyword, 'like', 'or');
      w.w('system_file.SavePath', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.id) w.eq('system_file.id', searchModel.id);
    if (searchModel.ids) w.in('system_file.id', searchModel.ids);

    const built = w.build();
    let sql = built.sql;
    const params = built.params || {};

    if (searchModel.TableID != null && String(searchModel.TableID).trim() !== '') {
      const t = `system_file.TableID in (${searchModel.TableID})`;
      sql = sql ? `(${sql}) and (${t})` : t;
    }
    if (!util.stringIsEmpty(searchModel.yesIsImage) || !util.stringIsEmpty(searchModel.notIsImage)) {
      const img = parseInt(searchModel.yesIsImage, 10) ? 1 : 0;
      const notImg = parseInt(searchModel.notIsImage, 10) ? 0 : 1;
      const t = `(system_file.IsImage = ${img} or system_file.IsImage = ${notImg})`;
      sql = sql ? `(${sql}) and (${t})` : t;
    }
    return { sql, params };
  }

  /**
   * 批量保存附件（按类型名关联 system_file_type，可选删除同目标下其它文件）
   */
  async AddOrUpdateMulti({ files, name, tableId, isDeleteOther = true, userId, db }) {
    if (!files) {
      return util.BaseRetrun({ Succeed: false, Message: '文件列表未定义' });
    }
    const factory = require('../factory');
    const fileTypeService = factory.system_file_typeRepo;
    const esc = (s) => String(s || '').replace(/'/g, "''");
    let fileTypeModel = await fileTypeService.Get({ strWhere: `system_file_type.Name = '${esc(name)}'`, userId, db });
    if (!fileTypeModel) {
      fileTypeModel = fileTypeEntity.CopyData({});
      fileTypeModel.Title = name;
      fileTypeModel.Name = name;
      fileTypeModel.id = await fileTypeService.AddOrUpdate({ model: fileTypeModel, userId, db });
      if (fileTypeService.IDIsEmpty(fileTypeModel.id)) {
        return util.BaseRetrun({ Succeed: false, Message: `保存附件数据类型${name}失败` });
      }
    }
    const baseUpload = this.myConfig.upload.fullPath;
    for (const i of files) {
      i.TableID = i.TableID && !this.IDIsEmpty(i.TableID) ? i.TableID : fileTypeModel.id;
      if (this._isImageFileName(i.FileMd5) && !i.ThumbnailMd5) {
        const ext = path.extname(i.FileMd5);
        const miniFileMd5 = `${UUID.v4()}${ext}`;
        const oldImage = i.SavePath ? path.join(baseUpload, i.SavePath, i.FileMd5) : path.join(baseUpload, i.FileMd5);
        const newImage = path.join(baseUpload, miniFileMd5);
        try {
          if (await fs.pathExists(oldImage)) {
            await fs.copy(oldImage, newImage);
            i.ThumbnailMd5 = miniFileMd5;
          }
        } catch (_) { /* 缩略图可选 */ }
      }
      let filePath = '';
      if (i.SavePath) {
        filePath = path.join(baseUpload, i.SavePath, i.FileMd5);
      } else {
        filePath = path.join(baseUpload, i.FileMd5);
      }
      if (!i.OriMd5 && await fs.pathExists(filePath)) {
        try {
          i.OriMd5 = await this._md5File(filePath);
        } catch (_) { /* ignore */ }
      }
      if (!i.FileSize && await fs.pathExists(filePath)) {
        try {
          const st = await fs.stat(filePath);
          i.FileSize = st.size;
        } catch (_) { /* ignore */ }
      }
    }
    let md5s = files.map((e) => e.FileMd5);
    md5s = util.SqlStringJoin({ ids: md5s });
    if (isDeleteOther) {
      let strWhere = `system_file.TableID = ${fileTypeModel.id} and system_file.TargetID = '${esc(tableId)}'`;
      if (md5s.length > 0) {
        strWhere = util.AppendSQL({ oldSql: strWhere, appendSQL: `system_file.FileMd5 not in (${md5s})` });
      }
      await this.Delete({ strWhere, userId, db });
    }
    return this.AddOrUpdateList({ models: files, userId, db });
  }

  /**
   * 按业务类型名加载目标 ID 列表对应的附件
   */
  async GetFilesForName({ fileType, TargetIDs, userId, filePath, db }) {
    const base = filePath ? path.join(process.cwd(), filePath) : this.myConfig.upload.fullPath;
    const esc = (s) => String(s || '').replace(/'/g, "''");
    const ids = Array.isArray(TargetIDs) ? TargetIDs : String(TargetIDs || '').split(',').filter(Boolean);
    const strWhere = `system_file.TableID = (select id from system_file_type where Name = '${esc(fileType)}' and Deleted = 0) and system_file.TargetID in (${util.SqlStringJoin({ ids })})`;
    const datas = await this.GetList({ strWhere, isLoadDetailed: true, userId, db });
    for (const i of datas) {
      const fp = i.SavePath ? path.join(base, i.SavePath, i.FileMd5) : path.join(base, i.FileMd5);
      i.FileIsExist = await fs.pathExists(fp);
    }
    return datas;
  }
}

module.exports = new SystemFileRepo();
