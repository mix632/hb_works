'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/biz_customer_status.model');

/**
 * biz_customer_status — 核心大表
 */
class BizCustomerStatusRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'biz_customer_status';
    this.defalutOrder = 'biz_customer_status.sort_index asc';
    this.tableTitle = '客户状态';
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
      select biz_customer_status.*
      from biz_customer_status biz_customer_status
      where biz_customer_status.id > 0 {0} {1}
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
    if (!isSaveDetailed) {
      return m.id;
    }

    return m.id;
  }

  GetSearchSQL({ searchModel, userId }) {
    const w = this.safeWhere();
    if (searchModel.Keyword && searchModel.Keyword.trim()) {
      w.w('biz_customer_status.title', searchModel.Keyword, 'like', 'or');
      w.w('biz_customer_status.name', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.id != null) w.eq('biz_customer_status.id', searchModel.id);
    if (searchModel.ids) w.in('biz_customer_status.id', searchModel.ids);
    return w.build();
  }
}

module.exports = new BizCustomerStatusRepo();