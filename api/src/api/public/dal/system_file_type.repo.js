'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/system_file_type.model');

/**
 * system_file_type — 核心表
 */
class SystemFileTypeRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'system_file_type';
    this.defalutOrder = 'system_file_type.id desc';
    this.tableTitle = '附件类型';
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
      select system_file_type.*
      from system_file_type system_file_type
      where system_file_type.id > 0 {0} {1}
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
      w.w('system_file_type.Title', searchModel.Keyword, 'like', 'or');
      w.w('system_file_type.Name', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.id) w.eq('system_file_type.id', searchModel.id);
    if (searchModel.ids) w.in('system_file_type.id', searchModel.ids);
    return w.build();
  }
}

module.exports = new SystemFileTypeRepo();