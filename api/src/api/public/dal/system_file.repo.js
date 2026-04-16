'use strict';

const crypto = require('crypto');
const { Dal } = require('../../../core/dal');
const fs = require('fs-extra');
const path = require('path');
const UUID = require('uuid');
const util = require('../../../utils');
const model = require('../model/system_file.model');
const fileTypeEntity = require('../model/system_file_type.model');
const factory = require('../factory');

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
    this.deleteDate = '';
    this.deleteUserId = '';
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
  /**
   * 如果在保存数据时，id=0时，可以通过实体的其他值，组成sql，查询唯一性数据库实体
   * @param {object} model 数据实体
   */
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
    if (searchModel.TableID != null && String(searchModel.TableID).trim() !== '') {
      const raw = String(searchModel.TableID).trim();
      const tids = raw.split(/[,，]/).map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n));
      if (tids.length) w.in('system_file.TableID', tids);
    }

    if (!util.stringIsEmpty(searchModel.yesIsImage) || !util.stringIsEmpty(searchModel.notIsImage)) {
      const img = parseInt(searchModel.yesIsImage, 10) ? 1 : 0;
      const notImg = parseInt(searchModel.notIsImage, 10) ? 0 : 1;
      w.sqlParams({
        sql: '(system_file.IsImage = :_img or system_file.IsImage = :_notImg)',
        params: { _img: img, _notImg: notImg },
      });
    }

    return w.build();
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
    let fileTypeModel = await fileTypeService.Get({
      strWhere: 'system_file_type.Name = :_ftName',
      strParams: { _ftName: name },
      userId,
      db,
    });
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
    const excludeMd5 = files.map((e) => e.FileMd5).filter(Boolean);
    if (isDeleteOther) {
      let strWhere = 'system_file.TableID = :_tid and system_file.TargetID = :_tgt';
      const strParams = { _tid: fileTypeModel.id, _tgt: String(tableId ?? '') };
      if (excludeMd5.length > 0) {
        strWhere = util.AppendSQL({
          oldSql: strWhere,
          appendSQL: 'system_file.FileMd5 not in (:_excludeMd5)',
        });
        strParams._excludeMd5 = excludeMd5;
      }
      await this.Delete({ strWhere, strParams, userId, db });
    }
    return this.AddOrUpdateList({ models: files, userId, db });
  }

  /**
   * 按业务类型名加载目标 ID 列表对应的附件
   */
  async GetFilesForName({ fileType, TargetIDs, userId, filePath, db }) {
    const base = filePath ? path.join(process.cwd(), filePath) : this.myConfig.upload.fullPath;
    const ids = Array.isArray(TargetIDs) ? TargetIDs : String(TargetIDs || '').split(',').filter(Boolean);
    const strWhere = 'system_file.TableID = (select id from system_file_type where Name = :_ftName and Deleted = 0) and system_file.TargetID in (:_tids)';
    const strParams = { _ftName: fileType, _tids: ids };
    const datas = await this.GetList({ strWhere, strParams, isLoadDetailed: true, userId, db });
    for (const i of datas) {
      const fp = i.SavePath ? path.join(base, i.SavePath, i.FileMd5) : path.join(base, i.FileMd5);
      i.FileIsExist = await fs.pathExists(fp);
    }
    return datas;
  }
}

module.exports = new SystemFileRepo();
