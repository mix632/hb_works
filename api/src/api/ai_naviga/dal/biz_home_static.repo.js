'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/biz_home_static.model');
const factory = require('../factory');

/**
 * biz_home_static — 核心表
 */
class BizHomeStaticRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'biz_home_static';
    this.defalutOrder = 'biz_home_static.id desc';
    this.tableTitle = '发布后静态内容';
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
      select biz_home_static.*
      from biz_home_static biz_home_static
      where biz_home_static.id > 0 {0} {1}
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
    if (m.is_new) {
      let strWhere = `biz_home_static.is_new = :is_new and biz_home_static.id != :id and biz_home_static.type = :type and biz_home_static.platform = :platform`;
      let strParams = {
        is_new: 1,
        id: m.id,
        type: m.type,
        platform: m.platform,
      };
      var item = await this.Get({ strWhere, strParams, db });
      if (item) {
        item.is_new = false;
        item.id = await super.AddOrUpdate({ model: item, db });
      }
    }
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
      w.w('biz_home_static.type', 'like', searchModel.Keyword, 'or');
      w.w('biz_home_static.platform', 'like', searchModel.Keyword, 'or');
    }
    if (searchModel.id) w.eq('biz_home_static.id', searchModel.id);
    if (searchModel.ids) w.in('biz_home_static.id', searchModel.ids);
    return w.build();
  }
}

module.exports = new BizHomeStaticRepo();