'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/biz_home_type.model');
const factory = require('../factory');

/**
 * biz_home_type — 核心表
 */
class BizHomeTypeRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'biz_home_type';
    this.defalutOrder = 'biz_home_type.sort_index asc';
    this.tableTitle = '页面类型';
    this.primaryKey = 'id';
    this.deleteKey = 'deleted';
    this.createDate = 'created_at';
    this.createUserId = '';
    this.updateDate = 'updated_at';
    this.updateUserId = '';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = 'sort_index';
    this.emptyPrimaryValue = 0;
    this.baseSql = `
      select biz_home_type.*
      from biz_home_type biz_home_type
      where biz_home_type.id > 0 {0} {1}
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

  GetSearchSQL({ searchModel, userId }) {
    const w = this.safeWhere();
    if (searchModel.Keyword && searchModel.Keyword.trim()) {
      w.w('biz_home_type.title', 'like', searchModel.Keyword, 'or');
      w.w('biz_home_type.name', 'like', searchModel.Keyword, 'or');
    }
    if (searchModel.id) w.eq('biz_home_type.id', searchModel.id);
    if (searchModel.ids) w.in('biz_home_type.id', searchModel.ids);
    return w.build();
  }
}

module.exports = new BizHomeTypeRepo();