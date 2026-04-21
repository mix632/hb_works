'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/biz_platform.model');
const factory = require('../factory');

/**
 * biz_platform — 核心表
 */
class BizPlatformRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'biz_platform';
    this.defalutOrder = 'biz_platform.sort_index asc';
    this.tableTitle = '支持平台';
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
      select biz_platform.*
      from biz_platform biz_platform
      where biz_platform.id > 0 {0} {1}
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
      w.w('biz_platform.title', searchModel.Keyword, 'like', 'or');
      w.w('biz_platform.name', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.id) w.eq('biz_platform.id', searchModel.id);
    if (searchModel.ids) w.in('biz_platform.id', searchModel.ids);
    return w.build();
  }
}

module.exports = new BizPlatformRepo();