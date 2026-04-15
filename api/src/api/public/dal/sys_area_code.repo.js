'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/sys_area_code.model');

/**
 * sys_area_code — 核心表
 */
class SysAreaCodeRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'sys_area_code';
    this.defalutOrder = 'sys_area_code.code desc';
    this.tableTitle = '行政区县表';
    this.primaryKey = 'code';
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
      select sys_area_code.*
      from sys_area_code sys_area_code
      where sys_area_code.code > 0 {0} {1}
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
    m.code = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.code) {
      return m.code;
    }

    return m.code;
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
      w.w('sys_area_code.name', searchModel.Keyword, 'like', 'or');
      w.w('sys_area_code.pinyin', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.code) w.eq('sys_area_code.code', searchModel.code);
    if (searchModel.ids) w.in('sys_area_code.code', searchModel.ids);
    return w.build();
  }
}

module.exports = new SysAreaCodeRepo();