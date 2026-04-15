'use strict';

const { Dal } = require('../../../core/dal');
const model = require('../model/sys_post.model');

/**
 * sys_post — 核心表
 */
class SysPostRepo extends Dal {
  constructor() {
    super();
    this.modelType = model;
    this.tableName = 'sys_post';
    this.defalutOrder = 'sys_post.post_sort asc';
    this.tableTitle = '岗位';
    this.primaryKey = 'post_id';
    this.deleteKey = '';
    this.createDate = 'create_time';
    this.createUserId = 'create_by';
    this.updateDate = 'update_time';
    this.updateUserId = 'update_by';
    this.deleteDate = '';
    this.deleteUserId = '';
    this.sortIndex = 'post_sort';
    this.emptyPrimaryValue = 0;
    this.baseSql = `
      select sys_post.*
      from sys_post sys_post
      where sys_post.post_id > 0 {0} {1}
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
    m.post_id = await super.AddOrUpdate({ model: m, isSaveDetailed, userId, db });
    if (!isSaveDetailed || !m.post_id) {
      return m.post_id;
    }

    return m.post_id;
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
      w.w('sys_post.post_code', searchModel.Keyword, 'like', 'or');
      w.w('sys_post.post_name', searchModel.Keyword, 'like', 'or');
      w.w('sys_post.status', searchModel.Keyword, 'like', 'or');
      w.w('sys_post.create_by', searchModel.Keyword, 'like', 'or');
      w.w('sys_post.update_by', searchModel.Keyword, 'like', 'or');
      w.w('sys_post.remark', searchModel.Keyword, 'like', 'or');
    }
    if (searchModel.post_id) w.eq('sys_post.post_id', searchModel.post_id);
    if (searchModel.ids) w.in('sys_post.post_id', searchModel.ids);
    return w.build();
  }
}

module.exports = new SysPostRepo();