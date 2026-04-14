'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/biz_product.model');
const { safeParse } = require('../../../core/baseModel');

class BizProductRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'biz_product';
    this.defalutOrder = 'biz_product.sort_index asc';
    this.tableTitle = '产品';
    this.primaryKey = 'id';
    this.deleteKey = '';
    this.createDate = 'created_at';
    this.updateDate = 'updated_at';
    this.sortIndex = 'sort_index';
    this.emptyPrimaryValue = 0;
    this.baseSql = `select * from biz_product biz_product where biz_product.id > 0 {0} {1} order by {2}`;
  }

  async Load({ datas, userId, isLoadDetailed = false, isGetValue = true, db = null }) {
    if (!datas || !datas.length) return;
    for (const item of datas) {
      item.image = safeParse(item.image, []);
    }
    if (!isLoadDetailed) return;
    // TODO: 加载附件（通过 file service）
  }

  async AddOrUpdate({ model: m, isSaveDetailed = false, userId, db = null }) {
    if (m.files && m.files.length) {
      m.image = JSON.stringify(m.files.map(e => e.path || e.FileMd5)[0] || '');
    }
    m.id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (this.IDIsEmpty(m.id)) return this.GetEmptyID();
    // TODO: 保存附件
    return m.id;
  }

  GetSearchSQL({ searchModel, userId }) {
    const w = this.safeWhere();
    if (searchModel.Keyword && searchModel.Keyword.trim()) {
      w.like('biz_product.title', searchModel.Keyword, 'or');
      w.like('biz_product.sub_title', searchModel.Keyword, 'or');
      w.like('biz_product.descript', searchModel.Keyword, 'or');
    }
    if (searchModel.id != null) w.eq('biz_product.id', searchModel.id);
    if (searchModel.ids) w.in('biz_product.id', searchModel.ids);
    return w.build();
  }
}

module.exports = new BizProductRepo();
