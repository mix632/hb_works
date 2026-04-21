'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/biz_home.model');

/**
 * biz_home — 核心表
 */
class BizHomeRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'biz_home';
    this.defalutOrder = 'biz_home.sort_index asc';
    this.tableTitle = '页面配置';
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
      select biz_home.*
      from biz_home biz_home
      where biz_home.id > 0 {0} {1}
      order by {2}
    `.replace(/\n\s+/g, ' ').trim();
  }

  async Load({ datas, userId, isLoadDetailed = false, isGetValue = true, db = null }) {
    if (!datas || !datas.length) return;
    if (!isLoadDetailed) return;

    const ids = datas.map(e => this.GetModelID({ model: e }));
    if (ids.length) {
      const files = await this.getRepo('public.system_fileRepo').GetFilesForName({
        fileType: 'biz_home',
        TargetIDs: ids,
        userId,
        db,
      });
      for (const i of datas) {
        i.files = files.filter((e) => e.TargetID == i.id);
      }
    }
  }

  async AddOrUpdate({ model: m, isSaveDetailed = false, userId, db = null }) {
    m.image = (m.files && m.files.length) ? JSON.stringify(m.files.map(e => e.FileMd5)) : '[]';
    m.id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.id) {
      return m.id;
    }

    if (m.files?.length) {
      for (const i of m.files) {
        i.TargetID = m.id;
      }
    }
    await this.getRepo('public.system_fileRepo').AddOrUpdateMulti({
      files: m.files,
      name: 'biz_home',
      tableId: m.id,
      userId,
      db,
    });
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
      w.w('biz_home.title', searchModel.Keyword, 'like', 'or');
      w.w('biz_home.descript', searchModel.Keyword, 'like', 'or');
      w.w('biz_home.url', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.id) w.eq('biz_home.id', searchModel.id);
    if (searchModel.ids) w.in('biz_home.id', searchModel.ids);
    if (searchModel.type) w.eq('biz_home.type', searchModel.type);
    return w.build();
  }
}

module.exports = new BizHomeRepo();