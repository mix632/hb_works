'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/system_file.model');

/**
 * system_file — 核心表
 */
class SystemFileRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'system_file';
    this.defalutOrder = 'system_file.id desc';
    this.tableTitle = '附件';
    this.primaryKey = 'id';
    this.deleteKey = '';
    this.createDate = '';
    this.createUserId = '';
    this.updateDate = '';
    this.updateUserId = '';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = '';
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
  /**
   * 如果在保存数据时，id=0时，可以通过实体的其他值，组成sql，查询唯一性数据库实体
   * @param {object} model 数据实体
   */
  AddOrUpdate_GetIDZeroSql({ model }) {
    return ``;
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
    return w.build();
  }
}

module.exports = new SystemFileRepo();