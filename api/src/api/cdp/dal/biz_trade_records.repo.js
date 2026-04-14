'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/biz_trade_records.model');

/**
 * biz_trade_records — 核心大表
 */
class BizTradeRecordsRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'biz_trade_records';
    this.defalutOrder = 'biz_trade_records.id desc';
    this.tableTitle = '跑马灯数据';
    this.primaryKey = 'id';
    this.deleteKey = 'deleted';
    this.createDate = 'created_at';
    this.createUserId = '';
    this.updateDate = 'updated_at';
    this.updateUserId = '';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = '';
    this.emptyPrimaryValue = 0;
    this.baseSql = `
      select biz_trade_records.*,
      from biz_trade_records biz_trade_records
      where biz_trade_records.id > 0 {0} {1}
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
      w.w('biz_trade_records.title', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.id != null) w.eq('biz_trade_records.id', searchModel.id);
    if (searchModel.ids) w.in('biz_trade_records.id', searchModel.ids);
    return w.build();
  }
}

module.exports = new BizTradeRecordsRepo();